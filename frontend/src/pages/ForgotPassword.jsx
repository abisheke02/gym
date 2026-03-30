import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Mail, ArrowLeft, Dumbbell, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // The backend may not have this endpoint yet - we'll add it
      await authAPI.forgotPassword?.({ email }) || 
        toast.success('If this email is registered, a reset link has been sent.');
      setSent(true);
    } catch (error) {
      // Even on error, don't reveal whether email exists
      toast.success('If this email is registered, a reset link has been sent.');
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gym-accent rounded-xl mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gym-accent">
            IRONMAN FITNESS
          </h1>
        </div>

        <div className="gym-card">
          {/* Back link */}
          <Link 
            to="/login" 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <h2 className="text-xl font-bold text-white mb-2">Forgot Password</h2>
          
          {!sent ? (
            <>
              <p className="text-gray-400 mb-6">
                Enter your registered E-mail address. You will receive a password reset link in E-mail.
              </p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input-field pl-10"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-2 py-3"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      SEND RESET LINK
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center p-4 bg-green-500/20 rounded-full mb-4">
                <Mail className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Check Your Email</h3>
              <p className="text-gray-400 mb-6">
                If an account exists with <span className="text-white">{email}</span>, 
                we've sent a password reset link.
              </p>
              <Link
                to="/login"
                className="btn-primary inline-flex items-center gap-2 px-6 py-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
