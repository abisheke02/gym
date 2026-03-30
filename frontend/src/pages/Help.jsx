import { useState } from 'react';
import { 
  Video, 
  MessageCircle, 
  Phone, 
  Mail, 
  ExternalLink, 
  HelpCircle,
  BookOpen,
  Star
} from 'lucide-react';

const Help = () => {
  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Help & Support</h1>
        <p className="text-gray-400">Get assistance with IRONMAN FITNESS CRM</p>
      </div>

      {/* Video Tutorial */}
      <div className="gym-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Video className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Video Tutorial</h3>
            <p className="text-gray-400 mb-4">
              Watch our tutorial to learn how to use the IRONMAN FITNESS CRM app.
            </p>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
            >
              <Video className="w-5 h-5" />
              Watch Tutorial
            </a>
          </div>
        </div>
      </div>

      {/* User Guide */}
      <div className="gym-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">User Guide</h3>
            <p className="text-gray-400 mb-4">
              Read our comprehensive user guide to understand all features.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">How to add leads?</p>
                  <p className="text-gray-500 text-xs">Go to Leads → Click "Add Lead" → Fill the form</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">How to convert a lead to member?</p>
                  <p className="text-gray-500 text-xs">Open Lead Detail → Click "Convert to Member"</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">How to record a payment?</p>
                  <p className="text-gray-500 text-xs">Go to Finance → Click "Record Payment"</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">How to manage expenses?</p>
                  <p className="text-gray-500 text-xs">Go to Finance → Expenses tab → Add/filter expenses</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Support */}
      <div className="gym-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-xl">
            <MessageCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Chat Support</h3>
            <p className="text-gray-400 mb-4">
              Connect with our support team via chat.
            </p>
            <a
              href="https://wa.me/919876543210"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border border-green-500 text-green-400 hover:bg-green-500/10 rounded-lg font-medium transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              WhatsApp Chat
            </a>
          </div>
        </div>
      </div>

      {/* Contact Us */}
      <div className="gym-card">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gym-accent/20 rounded-xl">
            <Phone className="w-6 h-6 text-gym-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Contact Us</h3>
            <p className="text-gray-400 mb-2">
              For immediate assistance, call us at:{' '}
              <a href="tel:+919876543210" className="text-white font-medium">+91 98765 43210</a>
            </p>
            <p className="text-gray-400 mb-4">
              Or email us at:{' '}
              <a href="mailto:support@ironmanfitness.com" className="text-white font-medium">support@ironmanfitness.com</a>
            </p>
            <a
              href="mailto:support@ironmanfitness.com"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gym-accent hover:bg-gym-accent/90 rounded-lg text-white font-medium transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email Us
              <Star className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
