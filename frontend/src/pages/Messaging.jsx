import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Clock,
  Bell,
  X,
  RefreshCw,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { messagingAPI } from '../services/api';
import toast from 'react-hot-toast';

const TARGET_OPTIONS = [
  { value: 'all_members',     label: 'All Members' },
  { value: 'active_members',  label: 'Active Members' },
  { value: 'expired_members', label: 'Expired Members' },
  { value: 'expiring_soon',   label: 'Expiring Soon (7 days)' },
  { value: 'birthday_today',  label: 'Birthday Today' },
];

const Messaging = () => {
  const [showBulkModal, setShowBulkModal]     = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory]                 = useState([]);
  const [historyLoading, setHistoryLoading]   = useState(false);
  const [sending, setSending]                 = useState(false);
  const [result, setResult]                   = useState(null);

  const [bulkMessage, setBulkMessage] = useState({ target: 'all_members', message: '' });

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await messagingAPI.getHistory({ limit: 100 });
      setHistory(res.data.history || []);
    } catch {
      toast.error('Failed to load message history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
    fetchHistory();
  };

  const handleSendBulk = async () => {
    if (!bulkMessage.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await messagingAPI.sendBulk(bulkMessage);
      const { sent, failed, total } = res.data;
      setResult({ sent, failed, total });
      toast.success(`Sent to ${sent} of ${total} recipients`);
      setShowBulkModal(false);
      setBulkMessage({ target: 'all_members', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send messages');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-[#005c5b]" />
          Messaging Center
        </h1>
        <p className="text-sm text-gray-400 font-bold mt-1">Send WhatsApp messages to members</p>
      </div>

      {/* WhatsApp Status Banner */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
          WhatsApp integration requires WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to be set in your .env file.
          Messages will fail silently until configured.
        </p>
      </div>

      {/* Last Send Result */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Last Send Result</p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-black text-green-500">{result.sent}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sent</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-rose-500">{result.failed}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Failed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-700 dark:text-white">{result.total}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={handleOpenHistory}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm"
        >
          <Clock className="w-5 h-5 text-[#005c5b]" />
          View Message History
        </button>

        <button
          onClick={() => setShowBulkModal(true)}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#005c5b] hover:bg-[#004746] rounded-2xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#005c5b]/30"
        >
          <Send className="w-5 h-5" />
          Send Bulk WhatsApp
        </button>

        <button
          onClick={() => toast.info('Auto-reminder settings are managed by the scheduler service')}
          className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-white font-black text-xs uppercase tracking-widest transition-all shadow-sm"
        >
          <Bell className="w-5 h-5 text-[#005c5b]" />
          Auto-Reminder Settings
        </button>
      </div>

      {/* Bulk Message Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Send Bulk Message
              </h2>
              <button onClick={() => setShowBulkModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Send To</label>
                <select
                  value={bulkMessage.target}
                  onChange={(e) => setBulkMessage({ ...bulkMessage, target: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                >
                  {TARGET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Message</label>
                <textarea
                  value={bulkMessage.message}
                  onChange={(e) => setBulkMessage({ ...bulkMessage, message: e.target.value })}
                  rows={4}
                  maxLength={1000}
                  placeholder="Type your WhatsApp message..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white resize-none"
                />
                <p className="text-[10px] text-gray-400 font-bold text-right mt-1">
                  {bulkMessage.message.length}/1000
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendBulk}
                  disabled={sending}
                  className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Message History</h2>
              <button onClick={() => setShowHistoryModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No messages sent yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((msg) => (
                    <div key={msg.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-[#005c5b]" />
                          <span className="text-xs font-black text-[#005c5b] dark:text-[#01a2a1]">
                            {msg.member_name || msg.phone}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            msg.status === 'sent'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {msg.status}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold">
                            {new Date(msg.created_at).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-2">
                        {msg.message_text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messaging;
