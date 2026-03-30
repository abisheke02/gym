const cron = require('node-cron');
const db = require('../db');
const whatsappService = require('./whatsapp');

class SchedulerService {
  constructor() {
    this.jobs = [];
  }

  // Initialize all scheduled jobs
  init() {
    console.log('📅 Initializing scheduled jobs...');
    
    // Run every minute - Check renewal reminders
    this.jobs.push(
      cron.schedule('* * * * *', () => {
        this.processRenewalReminders();
      })
    );

    // Run every hour - Check inactive members
    this.jobs.push(
      cron.schedule('0 * * * *', () => {
        this.checkInactiveMembers();
      })
    );

    // Run every minute - Check follow-ups due
    this.jobs.push(
      cron.schedule('* * * * *', () => {
        this.processFollowUps();
      })
    );

    // Run daily at 8 AM - Send daily summary
    this.jobs.push(
      cron.schedule('0 8 * * *', () => {
        this.sendDailySummary();
      })
    );

    // Run daily at midnight - Update expired memberships
    this.jobs.push(
      cron.schedule('0 0 * * *', () => {
        this.updateExpiredMemberships();
      })
    );

    console.log('✅ Scheduled jobs initialized');
  }

  // Process renewal reminders
  async processRenewalReminders() {
    try {
      const reminders = await db.query(`
        SELECT rr.*, m.name, m.phone, m.plan_end_date,
          p.price as plan_price, p.name as plan_name
        FROM renewal_reminders rr
        JOIN members m ON rr.member_id = m.id
        JOIN plans p ON m.plan_id = p.id
        WHERE rr.sent_status = 'pending'
          AND rr.scheduled_date <= NOW()
          AND m.status = 'active'
      `);

      for (const reminder of reminders.rows) {
        const templates = whatsappService.getTemplates();
        let message;

        switch (reminder.reminder_type) {
          case '7_days':
            message = templates.renewal7Days(
              reminder.name,
              reminder.plan_end_date.toISOString().split('T')[0],
              Math.round(reminder.plan_price / 12),
              Math.round(reminder.plan_price / 4),
              reminder.plan_price
            );
            break;
          case '3_days':
            message = templates.renewal3Days(reminder.name);
            break;
          case 'expiry':
            message = templates.renewalOnExpiry(reminder.name);
            break;
          case 'post_expiry':
            message = templates.renewalPostExpiry(reminder.name);
            break;
        }

        if (message) {
          const result = await whatsappService.sendMessage(reminder.phone, message, null, reminder.member_id);
          
          // Update reminder status
          await db.query(`
            UPDATE renewal_reminders 
            SET sent_status = $1, sent_at = NOW()
            WHERE id = $2
          `, [result.success ? 'sent' : 'failed', reminder.id]);
        }
      }
    } catch (error) {
      console.error('Error processing renewal reminders:', error);
    }
  }

  // Check inactive members (no check-in for 5 days)
  async checkInactiveMembers() {
    try {
      const inactiveMembers = await db.query(`
        SELECT m.id, m.name, m.phone, m.last_check_in
        FROM members m
        WHERE m.status = 'active'
          AND m.last_check_in < NOW() - INTERVAL '5 days'
          AND NOT EXISTS (
            SELECT 1 FROM whatsapp_messages wm 
            WHERE wm.member_id = m.id 
              AND wm.created_at > NOW() - INTERVAL '5 days'
              AND wm.direction = 'outbound'
              AND wm.message_text LIKE '%We Miss You%'
          )
      `);

      const templates = whatsappService.getTemplates();

      for (const member of inactiveMembers.rows) {
        const message = templates.inactiveReactivation(member.name);
        await whatsappService.sendMessage(member.phone, message, null, member.id);
        console.log(`📢 Sent reactivation message to inactive member: ${member.name}`);
      }
    } catch (error) {
      console.error('Error checking inactive members:', error);
    }
  }

  // Process follow-ups due
  async processFollowUps() {
    try {
      const followUps = await db.query(`
        SELECT l.*, u.full_name as assigned_to_name, u.phone as assigned_to_phone
        FROM leads l
        JOIN users u ON l.assigned_to = u.id
        WHERE l.follow_up_schedule <= NOW()
          AND l.status NOT IN ('joined', 'lost')
          AND NOT EXISTS (
            SELECT 1 FROM lead_timeline lt
            WHERE lt.lead_id = l.id
              AND lt.activity_type = 'followup_completed'
              AND lt.created_at > NOW() - INTERVAL '1 hour'
          )
      `);

      for (const lead of followUps.rows) {
        const templates = whatsappService.getTemplates();
        const hoursSinceScheduled = (new Date() - new Date(lead.follow_up_schedule)) / (1000 * 60 * 60);

        let message;
        if (hoursSinceScheduled < 2) {
          message = templates.followUp2Hours(lead.name);
        } else if (hoursSinceScheduled < 24) {
          const hour = new Date().getHours();
          if (hour < 12) {
            message = templates.followUpNextDayMorning(lead.name);
          } else {
            message = templates.followUpNextDayEvening(lead.name);
          }
        }

        if (message) {
          await whatsappService.sendMessage(lead.phone, message, lead.id);
          
          // Add timeline entry
          await db.query(`
            INSERT INTO lead_timeline (lead_id, activity_type, description)
            VALUES ($1, 'followup_completed', 'Automated follow-up sent')
          `, [lead.id]);
        }

        // Send notification to sales staff
        if (lead.assigned_to_phone) {
          await whatsappService.sendMessage(
            lead.assigned_to_phone,
            `🔔 Follow-up due for lead: ${lead.name} (${lead.phone})\nStatus: ${lead.status}`,
            lead.id
          );
        }
      }
    } catch (error) {
      console.error('Error processing follow-ups:', error);
    }
  }

  // Send daily summary to owners/managers
  async sendDailySummary() {
    try {
      // Get today's stats
      const stats = await db.query(`
        SELECT 
          (SELECT COUNT(*) FROM leads WHERE created_at::date = CURRENT_DATE) as new_leads,
          (SELECT COUNT(*) FROM leads WHERE status = 'joined' AND updated_at::date = CURRENT_DATE) as joined_today,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at::date = CURRENT_DATE) as today_revenue,
          (SELECT COUNT(*) FROM members WHERE status = 'active') as active_members,
          (SELECT COUNT(*) FROM leads WHERE sla_breached = true AND status NOT IN ('joined', 'lost')) as sla_breached
      `);

      const s = stats.rows[0];
      const message = `📊 *IRONMAN FITNESS Daily Summary*

📅 Date: ${new Date().toLocaleDateString()}

🆕 New Leads: ${s.new_leads}
✅ Joined Today: ${s.joined_today}
💰 Today's Revenue: ₹${s.today_revenue}
👥 Active Members: ${s.active_members}
⚠️ SLA Breached: ${s.sla_breached}

Have a great day! 💪`;

      // Get all owners and managers
      const users = await db.query(`
        SELECT phone FROM users WHERE role IN ('owner', 'manager') AND is_active = true AND phone IS NOT NULL
      `);

      for (const user of users.rows) {
        await whatsappService.sendMessage(user.phone, message);
      }

      console.log('📊 Daily summary sent');
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }

  // Update expired memberships
  async updateExpiredMemberships() {
    try {
      // Update expired members
      const result = await db.query(`
        UPDATE members
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'active' AND plan_end_date < CURRENT_DATE
        RETURNING id, name, phone
      `);

      for (const member of result.rows) {
        // Add timeline entry
        await db.query(`
          INSERT INTO lead_timeline (lead_id, activity_type, description)
          SELECT id, 'expired', 'Membership expired' FROM leads WHERE phone = $1
        `, [member.phone]);

        console.log(`⚠️ Membership expired for: ${member.name}`);
      }

      if (result.rows.length > 0) {
        console.log(`✅ Updated ${result.rows.length} expired memberships`);
      }
    } catch (error) {
      console.error('Error updating expired memberships:', error);
    }
  }

  // Stop all jobs
  stop() {
    this.jobs.forEach(job => job.stop());
    this.jobs = [];
    console.log('⏹️ All scheduled jobs stopped');
  }
}

module.exports = new SchedulerService();

