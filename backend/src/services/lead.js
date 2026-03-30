const db = require('../db');
const whatsappService = require('./whatsapp');
const config = require('../config');
const XLSX = require('xlsx');

class LeadService {
  // Create a new lead with auto-assignment
  async createLead(leadData, createdBy = null) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Find the next available sales staff using round-robin
      const staffResult = await client.query(`
        SELECT id FROM users 
        WHERE role = 'sales' AND is_active = true 
        ORDER BY 
          (SELECT COUNT(*) FROM leads WHERE assigned_to = users.id AND created_at::date = CURRENT_DATE) ASC,
          RANDOM()
        LIMIT 1
      `);

      const assignedTo = staffResult.rows[0]?.id || null;
      const slaStartTime = new Date();

      // Insert lead
      const leadResult = await client.query(`
        INSERT INTO leads (
          name, phone, email, gender, age, address, 
          source_id, branch_id, assigned_to, status,
          whatsapp_replied, sla_start_time, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'new', false, $10, $11)
        RETURNING *
      `, [
        leadData.name,
        leadData.phone,
        leadData.email,
        leadData.gender,
        leadData.age,
        leadData.address,
        leadData.source_id,
        leadData.branch_id,
        assignedTo,
        slaStartTime,
        leadData.notes
      ]);

      const lead = leadResult.rows[0];

      // Add timeline entry
      await client.query(`
        INSERT INTO lead_timeline (lead_id, activity_type, description, performed_by)
        VALUES ($1, 'created', 'Lead created', $2)
      `, [lead.id, createdBy]);

      // Auto-send WhatsApp message
      const templates = whatsappService.getTemplates();
      const message = templates.leadAutoReply(lead.name);
      await whatsappService.sendMessage(lead.phone, message, lead.id, null, client);

      // Update lead as whatsapp_replied
      await client.query(
        'UPDATE leads SET whatsapp_replied = true WHERE id = $1',
        [lead.id]
      );

      await client.query('COMMIT');

      // Start SLA timer (non-blocking)
      this.startSLATimer(lead.id, lead.assigned_to);

      return { success: true, lead };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create lead error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Start SLA timer - checks every minute if SLA is breached
  startSLATimer(leadId, assignedTo) {
    const checkInterval = setInterval(async () => {
      try {
        const result = await db.query(`
          SELECT * FROM leads WHERE id = $1 AND sla_breached = false
        `, [leadId]);

        if (result.rows.length === 0) {
          clearInterval(checkInterval);
          return;
        }

        const lead = result.rows[0];
        const slaStartTime = new Date(lead.sla_start_time);
        const now = new Date();
        const minutesPassed = (now - slaStartTime) / (1000 * 60);

        if (minutesPassed >= config.leadResponseSLA) {
          // SLA Breached - Mark as breached
          await db.query(
            'UPDATE leads SET sla_breached = true WHERE id = $1',
            [leadId]
          );

          // Add timeline entry
          await db.query(`
            INSERT INTO lead_timeline (lead_id, activity_type, description)
            VALUES ($1, 'sla_breached', '10-minute SLA breached - no response')
          `, [leadId]);

          // Send alert to manager and owner
          const templates = whatsappService.getTemplates();
          
          // Get assigned staff name
          const staffResult = await db.query(
            'SELECT full_name, phone FROM users WHERE id = $1',
            [assignedTo]
          );
          
          const staff = staffResult.rows[0];
          const alertMessage = templates.slaBreachAlert(
            lead.name,
            lead.phone,
            lead.source_id || 'Unknown',
            staff?.full_name || 'Unassigned'
          );

          // Get managers and owners
          const managersResult = await db.query(`
            SELECT phone FROM users WHERE role IN ('owner', 'manager') AND is_active = true
          `);

          // Send alerts
          for (const manager of managersResult.rows) {
            if (manager.phone) {
              await whatsappService.sendMessage(manager.phone, alertMessage);
            }
          }

          // Also notify the assigned staff
          if (staff?.phone) {
            await whatsappService.sendMessage(staff.phone, alertMessage);
          }

          console.log(`⚠️ SLA BREACHED for lead ${leadId}`);
        }
      } catch (error) {
        console.error('SLA timer error:', error);
      }
    }, 60000); // Check every minute

    // Clean up after 15 minutes
    setTimeout(() => clearInterval(checkInterval), 900000);
  }

  // Update lead status
  async updateLeadStatus(leadId, status, userId) {
    try {
      const result = await db.query(`
        UPDATE leads 
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [status, leadId]);

      // Add timeline entry
      await db.query(`
        INSERT INTO lead_timeline (lead_id, activity_type, description, performed_by)
        VALUES ($1, 'status_changed', $2, $3)
      `, [leadId, `Status changed to ${status}`, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Update lead status error:', error);
      throw error;
    }
  }

  // Schedule follow-up
  async scheduleFollowUp(leadId, followUpSchedule, notes, userId) {
    try {
      const result = await db.query(`
        UPDATE leads 
        SET follow_up_schedule = $1, notes = COALESCE(notes, ''), updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [followUpSchedule, leadId]);

      // Add timeline entry
      await db.query(`
        INSERT INTO lead_timeline (lead_id, activity_type, description, performed_by)
        VALUES ($1, 'followup_scheduled', $2, $3)
      `, [leadId, `Follow-up scheduled for ${followUpSchedule}`, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('Schedule follow-up error:', error);
      throw error;
    }
  }

  // Assign lead to staff
  async assignLead(leadId, assignedTo, userId) {
    try {
      const result = await db.query(`
        UPDATE leads 
        SET assigned_to = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [assignedTo, leadId]);

      // Add timeline entry
      const userResult = await db.query(
        'SELECT full_name FROM users WHERE id = $1',
        [assignedTo]
      );

      await db.query(`
        INSERT INTO lead_timeline (lead_id, activity_type, description, performed_by)
        VALUES ($1, 'assigned', $2, $3)
      `, [leadId, `Assigned to ${userResult.rows[0]?.full_name || 'Unknown'}`, userId]);

      // Notify the assigned staff
      const staffResult = await db.query(
        'SELECT phone FROM users WHERE id = $1',
        [assignedTo]
      );

      if (staffResult.rows[0]?.phone) {
        const leadResult = await db.query(
          'SELECT name, phone FROM leads WHERE id = $1',
          [leadId]
        );
        
        const lead = leadResult.rows[0];
        await whatsappService.sendMessage(
          staffResult.rows[0].phone,
          `📢 New Lead Assigned!\n\nName: ${lead.name}\nPhone: ${lead.phone}\n\nPlease contact within 10 minutes!`,
          leadId
        );
      }

      return result.rows[0];
    } catch (error) {
      console.error('Assign lead error:', error);
      throw error;
    }
  }

  // Get lead with timeline
  async getLeadById(leadId) {
    try {
      const leadResult = await db.query(`
        SELECT l.*, 
          ls.name as source_name,
          b.name as branch_name,
          u.full_name as assigned_to_name
        FROM leads l
        LEFT JOIN lead_sources ls ON l.source_id = ls.id
        LEFT JOIN branches b ON l.branch_id = b.id
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE l.id = $1
      `, [leadId]);

      const timelineResult = await db.query(`
        SELECT lt.*, u.full_name as performed_by_name
        FROM lead_timeline lt
        LEFT JOIN users u ON lt.performed_by = u.id
        WHERE lt.lead_id = $1
        ORDER BY lt.created_at DESC
      `, [leadId]);

      const chatHistory = await whatsappService.getChatHistory(leadId, null);

      return {
        ...leadResult.rows[0],
        timeline: timelineResult.rows,
        chatHistory
      };
    } catch (error) {
      console.error('Get lead error:', error);
      throw error;
    }
  }

  // Get leads with filters
  async getLeads(filters = {}) {
    try {
      let query = `
        SELECT l.*, 
          ls.name as source_name,
          b.name as branch_name,
          u.full_name as assigned_to_name
        FROM leads l
        LEFT JOIN lead_sources ls ON l.source_id = ls.id
        LEFT JOIN branches b ON l.branch_id = b.id
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramIndex = 1;

      if (filters.status) {
        query += ` AND l.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.branch_id) {
        query += ` AND l.branch_id = $${paramIndex++}`;
        params.push(filters.branch_id);
      }

      if (filters.assigned_to) {
        query += ` AND l.assigned_to = $${paramIndex++}`;
        params.push(filters.assigned_to);
      }

      if (filters.source_id) {
        query += ` AND l.source_id = $${paramIndex++}`;
        params.push(filters.source_id);
      }

      if (filters.sla_breached !== undefined) {
        query += ` AND l.sla_breached = $${paramIndex++}`;
        params.push(filters.sla_breached);
      }

      query += ` ORDER BY l.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Get leads error:', error);
      throw error;
    }
  }

  // Get leads with follow-ups due today
  async getFollowUpsDue() {
    try {
      const result = await db.query(`
        SELECT l.*, 
          ls.name as source_name,
          b.name as branch_name,
          u.full_name as assigned_to_name
        FROM leads l
        LEFT JOIN lead_sources ls ON l.source_id = ls.id
        LEFT JOIN branches b ON l.branch_id = b.id
        LEFT JOIN users u ON l.assigned_to = u.id
        WHERE l.follow_up_schedule <= NOW() + INTERVAL '1 hour'
          AND l.status NOT IN ('joined', 'lost')
        ORDER BY l.follow_up_schedule ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Get follow-ups due error:', error);
      throw error;
    }
  }

  // Convert lead to member
  async convertToMember(leadId, memberData, userId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get lead data
      const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [leadId]);
      const lead = leadResult.rows[0];

      if (!lead) {
        throw new Error('Lead not found');
      }

      // Get user's branch if not provided
      let finalBranchId = memberData.branch_id || lead.branch_id;
      if (!finalBranchId) {
        const userResult = await client.query('SELECT branch_id FROM users WHERE id = $1', [userId]);
        finalBranchId = userResult.rows[0]?.branch_id;
      }

      // Use provided membership_id or auto-generate
      let membershipId = memberData.membership_id;
      if (!membershipId) {
        const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 6);
        const randStr = Math.floor(1000 + Math.random() * 9000);
        membershipId = `MEM-${dateStr}-${randStr}`;
      }

      // Create member
      const memberResult = await client.query(`
        INSERT INTO members (
          name, phone, email, gender, age, address,
          branch_id, plan_id, joining_date, plan_start_date, plan_end_date, membership_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        lead.name,
        lead.phone,
        lead.email,
        lead.gender,
        lead.age,
        lead.address,
        finalBranchId,
        memberData.plan_id,
        memberData.joining_date || new Date(),
        memberData.plan_start_date || new Date(),
        memberData.plan_end_date,
        membershipId
      ]);

      const member = memberResult.rows[0];

      // Record initial payment if amount is provided
      if (memberData.amount !== undefined && memberData.amount !== null) {
        await client.query(`
          INSERT INTO payments (member_id, amount, payment_mode, notes, recorded_by, branch_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          member.id,
          memberData.amount,
          memberData.payment_mode || 'cash',
          'Initial Plan Payment (Lead Conversion)',
          userId,
          finalBranchId
        ]);
      }

      // Update lead status
      await client.query(`
        UPDATE leads SET status = 'joined', updated_at = NOW() WHERE id = $1
      `, [leadId]);

      // Add timeline entry
      await client.query(`
        INSERT INTO lead_timeline (lead_id, activity_type, description, performed_by)
        VALUES ($1, 'converted', 'Lead converted to member', $2)
      `, [leadId, userId]);

      // Send welcome message
      console.log('Fetching plan for welcome message, plan_id:', memberData.plan_id);
      const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [memberData.plan_id]);
      const plan = planResult.rows[0];
      
      if (!plan) {
        throw new Error(`Plan not found: ${memberData.plan_id}`);
      }

      console.log('Generating welcome message for member:', member.id);
      const templates = whatsappService.getTemplates();
      
      // Safe date formatting
      const endDate = member.plan_end_date instanceof Date 
        ? member.plan_end_date.toISOString().split('T')[0]
        : new Date(member.plan_end_date).toISOString().split('T')[0];

      const message = templates.trialToJoin(
        member.name,
        plan.name,
        plan.price,
        endDate
      );
      
      console.log('Sending welcome WhatsApp, client present:', !!client);
      await whatsappService.sendMessage(member.phone, message, null, member.id, client);

      await client.query('COMMIT');

      return { success: true, member };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Convert to member error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Bulk upload leads
  async bulkUploadLeads(file, createdBy = null, branchId = null) {
    try {
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      const results = {
        total: data.length,
        success: 0,
        failed: 0,
        errors: []
      };

      // Get lead sources for matching
      const sourcesResult = await db.query('SELECT id, name FROM lead_sources');
      const sources = sourcesResult.rows;
      const manualSource = sources.find(s => s.name.toLowerCase() === 'manual entry')?.id;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        try {
          // Mapping and normalization
          const leadData = {
            name: row.Name || row.name || row['Full Name'],
            phone: row.Phone || row.phone || row['Phone Number'] || row.Mobile,
            email: row.Email || row.email,
            gender: (row.Gender || row.gender || '').toLowerCase(),
            age: parseInt(row.Age || row.age),
            address: row.Address || row.address,
            notes: row.Notes || row.notes || row.Remark,
            branch_id: branchId || row.BranchId || row.branch_id,
          };

          if (!leadData.name || !leadData.phone) {
            throw new Error(`Row ${i + 1}: Name and Phone are required`);
          }

          // Format phone (remove non-digits, check 10 digits)
          leadData.phone = String(leadData.phone).replace(/\D/g, '');
          if (leadData.phone.length > 10) {
            leadData.phone = leadData.phone.slice(-10);
          }

          if (leadData.phone.length !== 10) {
            throw new Error(`Row ${i + 1}: Invalid phone number (${leadData.phone})`);
          }

          // Match Source
          const sourceName = row.Source || row.source;
          if (sourceName) {
            const matchedSource = sources.find(s => s.name.toLowerCase() === sourceName.toLowerCase());
            leadData.source_id = matchedSource ? matchedSource.id : manualSource;
          } else {
            leadData.source_id = manualSource;
          }

          // Check if lead already exists
          const existing = await db.query('SELECT id FROM leads WHERE phone = $1', [leadData.phone]);
          if (existing.rows.length > 0) {
            throw new Error(`Row ${i + 1}: Lead with phone ${leadData.phone} already exists`);
          }

          await this.createLead(leadData, createdBy);
          results.success++;
        } catch (err) {
          results.failed++;
          results.errors.push(err.message);
          console.error(`Bulk upload error at row ${i + 1}:`, err.message);
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk upload leads service error:', error);
      throw error;
    }
  }
}

module.exports = new LeadService();

