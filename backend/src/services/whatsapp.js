const axios = require('axios');
const config = require('../config');
const db = require('../db');

class WhatsAppService {
  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = config.whatsapp.phoneNumberId;
    this.accessToken = config.whatsapp.accessToken;
  }

  // Send WhatsApp message via Meta Cloud API
  async sendMessage(phoneNumber, messageText, leadId = null, memberId = null, client = null) {
    const queryInterface = client || db;
    console.log('WhatsApp sendMessage:', { leadId, memberId, hasClient: !!client });
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: { body: messageText }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Save message to database
      if (leadId || memberId) {
        await queryInterface.query(
          `INSERT INTO whatsapp_messages (lead_id, member_id, direction, message_text, message_id, status)
           VALUES ($1, $2, 'outbound', $3, $4, 'sent')`,
          [leadId, memberId, messageText, response.data.messages[0].id]
        );
      }

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp send error:', error.response?.data || error.message);
      
      // Log failed message
      if (leadId || memberId) {
        await queryInterface.query(
          `INSERT INTO whatsapp_messages (lead_id, member_id, direction, message_text, status)
           VALUES ($1, $2, 'outbound', $3, 'failed')`,
          [leadId, memberId, messageText]
        );
      }
      
      return { success: false, error: error.message };
    }
  }

  // Send template message
  async sendTemplateMessage(phoneNumber, templateName, parameters = {}, leadId = null) {
    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en_US' },
          components: parameters
        }
      };

      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return { success: true, messageId: response.data.messages[0].id };
    } catch (error) {
      console.error('WhatsApp template send error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // Get message templates
  getTemplates() {
    return {
      leadAutoReply: (name) => `Namaste ${name}! 🙏

Thank you for your interest in IRONMAN FITNESS! We're thrilled to have you reach out.

🏋️ We're a budget-friendly gym with the best equipment in Chennai. 
Our plans start at just ₹999/month!

📍 Visit any of our 7 branches:
- Gerugambakkam, Kundrathur, Pozhichalur, and more...

Would you like to:
1. Book a FREE trial session?
2. Visit our gym today?
3. Know more about our plans?

Reply with 1, 2, or 3 and our team will assist you within 10 minutes!

- Team IRONMAN FITNESS 💪`,

      slaBreachAlert: (leadName, phone, source, staffName) => `🚨 URGENT: Lead Response Required

Lead: ${leadName}
Phone: ${phone}
Source: ${source}
Assigned to: ${staffName}

⏰ 10-minute SLA BREACHED!
Lead has not been contacted yet.

Please respond immediately to avoid losing this lead!

- IRONMAN FITNESS CRM Alert`,

      followUp2Hours: (name) => `Hi ${name}! Just checking in - did you get a chance to visit our gym? 

Our team is ready to show you around! Let us know your preferred time. 😊

- Team IRONMAN FITNESS`,

      followUpNextDayMorning: (name) => `Good Morning ${name}! ☀️

Hope you're having a great day! 

Still interested in starting your fitness journey with us? 
Book your FREE trial today - limited slots available!

Reply YES to connect with our team.

- Team IRONMAN FITNESS`,

      followUpNextDayEvening: (name) => `Hi ${name}! 🌟

Don't let your fitness goals wait! 

Join IRONMAN FITNESS Gym today and get:
✅ Free personal training session
✅ Modern equipment
✅ Expert trainers

Book your visit now!

- Team IRONMAN FITNESS`,

      visitBookingConfirmation: (name, branch, date, time) => `🎉 Your Visit Confirmed!

Name: ${name}
Branch: ${branch}
Date: ${date}
Time: ${time}

Our team will be waiting for you! 

What to bring: Comfortable clothes, water bottle, ID proof.

See you soon! 💪

- Team IRONMAN FITNESS`,

      trialToJoin: (name, planName, amount, endDate) => `🎊 WELCOME TO IRONMAN FITNESS FAMILY! 🎊

Namaste ${name}!

Thank you for joining us! Here's your membership details:

📋 Plan: ${planName}
💰 Amount Paid: ₹${amount}
📅 Valid Until: ${endDate}

Your fitness journey starts NOW! Let's crush those goals! 💪

- Team IRONMAN FITNESS`,

      renewal7Days: (name, expiryDate, monthly, quarterly, annual) => `Hi ${name}! ⏰

Your IRONMAN FITNESS membership expires in 7 days (${expiryDate}).

Renew now to continue your fitness journey without interruption!

💰 Renewal Plans:
- Monthly: ₹${monthly}
- Quarterly: ₹${quarterly}
- Annual: ₹${annual} (Best Value!)

Reply RENEW to book your slot!

- Team IRONMAN FITNESS`,

      renewal3Days: (name) => `{🔥} FINAL REMINDER {🔥}

Hi ${name}!

Only 3 days left on your IRONMAN FITNESS membership!

Don't lose your progress - renew today and get:
✅ Continuity in your workout
✅ Exclusive renewal discounts
✅ No waiting period

Reply NOW to renew!

- Team IRONMAN FITNESS`,

      renewalOnExpiry: (name) => `Hi ${name},

Your IRONMAN FITNESS membership has expired today. 

We'd love to have you back! 
Renew within 7 days to avail special comeback offers!

Reply COMEBACK for exclusive deals!

- Team IRONMAN FITNESS`,

      renewalPostExpiry: (name) => `We Miss You ${name}! 😢

It's been 3 days since your last workout. 

Your body (and fitness goals) miss you! 

Special offer for you:
🎁 20% OFF on any plan this week!

Come back stronger! 💪

- Team IRONMAN FITNESS`,

      inactiveReactivation: (name) => `😢 We Miss You, ${name}!

It's been 5 days since your last check-in at IRONMAN FITNESS.

Every workout counts! Don't break your streak now!

🔥 Book your next session and get:
- Free personal training consultation
- Customized workout plan

Are you coming back? Let us know! 😊

- Team IRONMAN FITNESS`
    };
  }

  // Get chat history for a lead or member
  async getChatHistory(leadId = null, memberId = null) {
    try {
      const query = leadId 
        ? 'SELECT * FROM whatsapp_messages WHERE lead_id = $1 ORDER BY created_at DESC'
        : 'SELECT * FROM whatsapp_messages WHERE member_id = $1 ORDER BY created_at DESC';
      
      const param = leadId || memberId;
      const result = await db.query(query, [param]);
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  }
}

module.exports = new WhatsAppService();

