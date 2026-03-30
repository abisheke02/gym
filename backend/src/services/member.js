const db = require('../db');
const whatsappService = require('./whatsapp');

class MemberService {
  // Create a new member
  async createMember(memberData, userId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 6);
      const randStr = Math.floor(1000 + Math.random() * 9000);
      const membershipId = memberData.membership_id || `MEM-${dateStr}-${randStr}`;

      // Insert member
      const result = await client.query(`
        INSERT INTO members (
          name, phone, email, gender, age, address,
          branch_id, plan_id, joining_date, plan_start_date, plan_end_date, membership_id,
          pt_trainer_id, pt_joining_date, pt_end_date, pt_sessions_total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `, [
        memberData.name,
        memberData.phone,
        memberData.email,
        memberData.gender,
        memberData.age,
        memberData.address,
        memberData.branch_id,
        memberData.plan_id,
        memberData.joining_date,
        memberData.plan_start_date,
        memberData.plan_end_date,
        membershipId,
        memberData.pt_trainer_id || null,
        memberData.pt_joining_date || null,
        memberData.pt_end_date || null,
        memberData.pt_sessions_total || 0
      ]);

      const member = result.rows[0];

      // Get plan details
      const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [memberData.plan_id]);
      const plan = planResult.rows[0];

      // Schedule renewal reminders
      await this.scheduleRenewalReminders(member.id, member.plan_end_date, client);

      // Send welcome message
      const templates = whatsappService.getTemplates();
      
      const endDate = member.plan_end_date instanceof Date 
        ? member.plan_end_date.toISOString().split('T')[0]
        : new Date(member.plan_end_date).toISOString().split('T')[0];

      const message = templates.trialToJoin(
        member.name,
        plan.name,
        plan.price,
        endDate
      );
      
      await whatsappService.sendMessage(member.phone, message, null, member.id, client);

      // Record Payment if amount is provided
      if (memberData.amount && parseFloat(memberData.amount) > 0) {
        await client.query(`
          INSERT INTO payments (member_id, amount, payment_mode, notes, recorded_by, branch_id)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          member.id,
          memberData.amount,
          memberData.payment_mode || 'cash',
          'Initial Admission Fee',
          userId,
          member.branch_id
        ]);
      }

      await client.query('COMMIT');

      return { success: true, member };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Create member error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Schedule renewal reminders
  async scheduleRenewalReminders(memberId, planEndDate, client = null) {
    const queryInterface = client || db;
    const endDate = new Date(planEndDate);
    
    const reminders = [
      { type: '7_days', date: new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000) },
      { type: '3_days', date: new Date(endDate.getTime() - 3 * 24 * 60 * 60 * 1000) },
      { type: 'expiry', date: endDate },
      { type: 'post_expiry', date: new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000) }
    ];

    for (const reminder of reminders) {
      if (reminder.date > new Date()) {
        await queryInterface.query(`
          INSERT INTO renewal_reminders (member_id, reminder_type, scheduled_date)
          VALUES ($1, $2, $3)
        `, [memberId, reminder.type, reminder.date]);
      }
    }
  }

  // Check-in member
  async checkIn(memberId) {
    try {
      const result = await db.query(`
        UPDATE members 
        SET last_check_in = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `, [memberId]);

      return result.rows[0];
    } catch (error) {
      console.error('Check-in error:', error);
      throw error;
    }
  }

  // Get member by ID
  async getMemberById(memberId) {
    try {
      const result = await db.query(`
        SELECT m.*, 
          b.name as branch_name,
          p.name as plan_name,
          p.duration_months,
          p.price as plan_price,
          t.name as trainer_name,
          t.specialization as trainer_specialization
        FROM members m
        LEFT JOIN branches b ON m.branch_id = b.id
        LEFT JOIN plans p ON m.plan_id = p.id
        LEFT JOIN trainers t ON m.pt_trainer_id = t.id
        WHERE m.id = $1
      `, [memberId]);

      if (result.rows.length === 0) {
        return null;
      }

      const member = result.rows[0];

      // Get payment history
      const paymentsResult = await db.query(`
        SELECT * FROM payments 
        WHERE member_id = $1 
        ORDER BY created_at DESC
      `, [memberId]);

      // Get chat history
      const chatHistory = await whatsappService.getChatHistory(null, memberId);

      return {
        ...member,
        payments: paymentsResult.rows,
        chatHistory
      };
    } catch (error) {
      console.error('Get member error:', error);
      throw error;
    }
  }

  // Get members with filters
  async getMembers(filters = {}) {
    try {
      let query = `
        SELECT m.*, 
          b.name as branch_name,
          p.name as plan_name,
          p.duration_months,
          p.price as plan_price
        FROM members m
        LEFT JOIN branches b ON m.branch_id = b.id
        LEFT JOIN plans p ON m.plan_id = p.id
        WHERE m.is_active = true
      `;
      
      const params = [];
      let paramIndex = 1;

      if (filters.status) {
        query += ` AND m.status = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters.branch_id) {
        query += ` AND m.branch_id = $${paramIndex++}`;
        params.push(filters.branch_id);
      }

      if (filters.plan_id) {
        query += ` AND m.plan_id = $${paramIndex++}`;
        params.push(filters.plan_id);
      }

      if (filters.search) {
        query += ` AND (m.name ILIKE $${paramIndex} OR m.phone ILIKE $${paramIndex} OR m.email ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY m.created_at DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex++}`;
        params.push(filters.limit);
      }

      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Get members error:', error);
      throw error;
    }
  }

  // Get inactive members (no check-in for 5 days)
  async getInactiveMembers() {
    try {
      const result = await db.query(`
        SELECT m.*, 
          b.name as branch_name,
          p.name as plan_name
        FROM members m
        LEFT JOIN branches b ON m.branch_id = b.id
        LEFT JOIN plans p ON m.plan_id = p.id
        WHERE m.status = 'active' 
          AND m.last_check_in < NOW() - INTERVAL '5 days'
        ORDER BY m.last_check_in ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Get inactive members error:', error);
      throw error;
    }
  }

  // Get expiring members (within 7 days)
  async getExpiringMembers(days = 7) {
    try {
      const result = await db.query(`
        SELECT m.*, 
          b.name as branch_name,
          p.name as plan_name,
          p.price
        FROM members m
        LEFT JOIN branches b ON m.branch_id = b.id
        LEFT JOIN plans p ON m.plan_id = p.id
        WHERE m.status = 'active'
          AND m.plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${days} days'
        ORDER BY m.plan_end_date ASC
      `);
      return result.rows;
    } catch (error) {
      console.error('Get expiring members error:', error);
      throw error;
    }
  }

  // Renew member
  async renewMember(memberId, planId, paymentData, userId) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Get current member
      const memberResult = await client.query('SELECT * FROM members WHERE id = $1', [memberId]);
      const member = memberResult.rows[0];

      // Get new plan
      const planResult = await client.query('SELECT * FROM plans WHERE id = $1', [planId]);
      const plan = planResult.rows[0];

      // Calculate new dates
      const planStartDate = new Date(member.plan_end_date);
      const planEndDate = new Date(planStartDate.getTime() + plan.duration_months * 30 * 24 * 60 * 60 * 1000);

      // Update member
      const updateResult = await client.query(`
        UPDATE members 
        SET plan_id = $1, 
            plan_start_date = $2, 
            plan_end_date = $3,
            status = 'active',
            updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [planId, planStartDate, planEndDate, memberId]);

      // Record payment
      await client.query(`
        INSERT INTO payments (member_id, amount, payment_mode, transaction_id, discount_amount, notes, recorded_by, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        memberId,
        paymentData.amount,
        paymentData.payment_mode,
        paymentData.transaction_id,
        paymentData.discount_amount || 0,
        paymentData.notes || 'Renewal',
        userId,
        member.branch_id
      ]);

      // Schedule new renewal reminders
      await this.scheduleRenewalReminders(memberId, planEndDate, client);

      // Send renewal confirmation
      const templates = whatsappService.getTemplates();
      const message = templates.trialToJoin(
        member.name,
        plan.name,
        paymentData.amount,
        planEndDate.toISOString().split('T')[0]
      );
      
      await whatsappService.sendMessage(member.phone, message, null, memberId);

      await client.query('COMMIT');

      return { success: true, member: updateResult.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Renew member error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Update member
  async updateMember(memberId, updateData) {
    try {
      const fields = [];
      const values = [];
      let paramIndex = 1;

      for (const [key, value] of Object.entries(updateData)) {
        if (['name', 'phone', 'email', 'gender', 'age', 'address', 'branch_id', 'plan_id', 'plan_start_date', 'plan_end_date', 'status', 'membership_id', 'pt_trainer_id', 'pt_joining_date', 'pt_end_date', 'pt_sessions_total', 'pt_sessions_completed'].includes(key)) {
          fields.push(`${key} = $${paramIndex++}`);
          values.push(value);
        }
      }

      if (fields.length === 0) {
        throw new Error('No valid fields to update');
      }

      fields.push(`updated_at = NOW()`);
      values.push(memberId);

      const result = await db.query(`
        UPDATE members 
        SET ${fields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `, values);

      return result.rows[0];
    } catch (error) {
      console.error('Update member error:', error);
      throw error;
    }
  }

  // Get member statistics
  async getMemberStats(branchId = null) {
    try {
      let branchFilter = '';
      const params = [];
      let paramIndex = 1;

      if (branchId) {
        branchFilter = `WHERE branch_id = $${paramIndex++}`;
        params.push(branchId);
      }

      const totalResult = await db.query(`
        SELECT COUNT(*) as total FROM members m ${branchFilter}
      `, params);

      const activeResult = await db.query(`
        SELECT COUNT(*) as active FROM members m WHERE status = 'active' ${branchId ? `AND branch_id = $1` : ''}
      `, branchId ? [branchId] : []);

      const expiredResult = await db.query(`
        SELECT COUNT(*) as expired FROM members m WHERE status = 'expired' ${branchId ? `AND branch_id = $1` : ''}
      `, branchId ? [branchId] : []);

      const expiringResult = await db.query(`
        SELECT COUNT(*) as expiring FROM members m 
        WHERE status = 'active' 
          AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          ${branchId ? `AND branch_id = $1` : ''}
      `, branchId ? [branchId] : []);

      return {
        total: parseInt(totalResult.rows[0].total),
        active: parseInt(activeResult.rows[0].active),
        expired: parseInt(expiredResult.rows[0].expired),
        expiring: parseInt(expiringResult.rows[0].expiring)
      };
    } catch (error) {
      console.error('Get member stats error:', error);
      throw error;
    }
  }
}

module.exports = new MemberService();

