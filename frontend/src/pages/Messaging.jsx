import { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  ShoppingCart, 
  Bell,
  CreditCard,
  X,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Messaging = () => {
  const [credits, setCredits] = useState(3);
  const [smsRate] = useState(0.24);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [messageHistory] = useState([
    { id: 1, to: 'All Members', message: 'Happy New Year! Special 20% discount on all plans.', sent_at: '2026-01-01', count: 45 },
    { id: 2, to: 'Expiring Members', message: 'Your membership expires soon. Renew now!', sent_at: '2026-03-15', count: 12 },
  ]);

  const [bulkMessage, setBulkMessage] = useState({
    target: 'all_members',
    message: ''
  });

  const handleSendBulk = () => {
    if (!bulkMessage.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    toast.success('Bulk message sent successfully!');
    setShowBulkModal(false);
    setBulkMessage({ target: 'all_members', message: '' });
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-gym-accent" />
          Messaging Center
        </h1>
        <p className="text-gray-400">Send SMS & WhatsApp messages to members</p>
      </div>

      {/* Credits Card */}
      <div className="gym-card text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-full bg-gym-accent/20 mb-3">
          <Zap className="w-8 h-8 text-gym-accent" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          Available Message Credits: ₹{credits}
        </h2>
        <p className="text-gray-400 text-sm">
          Rates — SMS: ₹{smsRate}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => setShowHistoryModal(true)}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gym-accent hover:bg-gym-accent/90 rounded-xl text-white font-medium transition-colors"
        >
          <Clock className="w-5 h-5" />
          View Message History
        </button>

        <button
          onClick={() => setShowBulkModal(true)}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gym-accent hover:bg-gym-accent/90 rounded-xl text-white font-medium transition-colors"
        >
          <Send className="w-5 h-5" />
          Send Bulk Messages
        </button>

        <button
          onClick={() => toast.info('Purchase credits via admin settings')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gym-accent hover:bg-gym-accent/90 rounded-xl text-white font-medium transition-colors"
        >
          <ShoppingCart className="w-5 h-5" />
          Purchase Message Credits
        </button>

        <button
          onClick={() => toast.info('Reminder settings coming soon')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-gym-accent hover:bg-gym-accent/90 rounded-xl text-white font-medium transition-colors"
        >
          <Bell className="w-5 h-5" />
          Message Reminder Settings
        </button>
      </div>

      {/* Bulk Message Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Send Bulk Message</h2>
              <button onClick={() => setShowBulkModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Send To</label>
                <select
                  value={bulkMessage.target}
                  onChange={(e) => setBulkMessage({ ...bulkMessage, target: e.target.value })}
                  className="input-field"
                >
                  <option value="all_members">All Members</option>
                  <option value="active_members">Active Members</option>
                  <option value="expired_members">Expired Members</option>
                  <option value="expiring_soon">Expiring Soon (7 days)</option>
                  <option value="birthday_today">Birthday Today</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Message</label>
                <textarea
                  value={bulkMessage.message}
                  onChange={(e) => setBulkMessage({ ...bulkMessage, message: e.target.value })}
                  className="input-field"
                  rows="4"
                  placeholder="Type your message here..."
                  maxLength={160}
                ></textarea>
                <p className="text-gray-500 text-xs mt-1 text-right">
                  {bulkMessage.message.length}/160 characters
                </p>
              </div>

              <div className="bg-gray-900 rounded-lg p-3">
                <p className="text-gray-400 text-sm">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Estimated cost: ₹{(smsRate * 50).toFixed(2)} (approx. 50 recipients)
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulk}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Message History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {messageHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messageHistory.map(msg => (
                  <div key={msg.id} className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gym-accent font-medium text-sm">{msg.to}</span>
                      <span className="text-gray-500 text-xs">{msg.sent_at}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{msg.message}</p>
                    <p className="text-gray-500 text-xs mt-2">Sent to {msg.count} recipients</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
