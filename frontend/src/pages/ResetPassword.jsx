import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirm) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    try {
      await authAPI.resetPassword({ token, password });
      setDone(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired reset link');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">Invalid reset link — no token found.</p>
          <button onClick={() => navigate('/login')} className="text-[#01a2a1] font-black text-sm uppercase tracking-widest">
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl p-8 shadow-2xl">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">Password Updated</h2>
              <p className="text-sm text-gray-400 font-bold">Your password has been reset successfully.</p>
              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-2xl font-black text-xs uppercase tracking-widest mt-4"
              >
                Go to Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#005c5b]/20 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-[#01a2a1]" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white uppercase tracking-tight">Reset Password</h1>
                  <p className="text-xs text-gray-400 font-bold">Enter your new password</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 pr-12 bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-[2.4rem] text-gray-400 hover:text-white"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-[#005c5b] hover:bg-[#004746] text-white rounded-2xl font-black text-sm uppercase tracking-widest mt-2 disabled:opacity-60 transition-all active:scale-[0.98]"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
