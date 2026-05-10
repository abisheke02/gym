import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Eye, EyeOff, ShieldCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [mode, setMode] = useState('staff'); // 'staff' | 'owner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const isOwnerMode = mode === 'owner';

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-gym-accent/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gym-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-gym-accent p-2.5 rounded-xl shadow-lg shadow-gym-accent/30">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-black tracking-tighter text-gym-accent">IRONMAN FITNESS</span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gym Management</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-800 rounded-2xl p-1 mb-5 border border-gray-700">
          <button
            onClick={() => { setMode('staff'); setEmail(''); setPassword(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              !isOwnerMode
                ? 'bg-[#005c5b] text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Branch Staff
          </button>
          <button
            onClick={() => { setMode('owner'); setEmail(''); setPassword(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isOwnerMode
                ? 'bg-amber-500 text-white shadow-lg'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Owner / Admin
          </button>
        </div>

        <div className={`bg-gray-800/90 backdrop-blur-sm border rounded-2xl p-7 shadow-2xl transition-colors ${
          isOwnerMode ? 'border-amber-500/40' : 'border-gray-700'
        }`}>
          {/* Mode label */}
          <div className="mb-5">
            {isOwnerMode ? (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Owner Access</p>
                  <p className="text-[10px] text-gray-400">Full access — all branches, all data, all reports</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-[#005c5b]/10 rounded-xl border border-[#005c5b]/20">
                <Users className="w-4 h-4 text-[#01a2a1] shrink-0" />
                <div>
                  <p className="text-xs font-black text-[#01a2a1] uppercase tracking-widest">Branch Staff</p>
                  <p className="text-[10px] text-gray-400">Access limited to your assigned branch</p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder={isOwnerMode ? 'owner@yourgym.com' : 'staff@yourgym.com'}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-gym-accent hover:text-gym-accent/80 font-bold">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-field pr-10 ${isOwnerMode ? 'focus:border-amber-500' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 flex items-center justify-center gap-2 mt-2 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
                isOwnerMode
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                  : 'bg-[#005c5b] hover:bg-[#004746] shadow-lg shadow-[#005c5b]/20'
              }`}
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : `Sign In as ${isOwnerMode ? 'Owner' : 'Staff'}`}
            </button>
          </form>
        </div>

        {/* Bottom admin link */}
        <div className="mt-4 text-center">
          <Link
            to="/admin-login"
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors font-bold uppercase tracking-widest"
          >
            Super Admin Panel →
          </Link>
        </div>

        <p className="text-center text-gray-700 text-xs mt-3">
          © {new Date().getFullYear()} IRONMAN FITNESS. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;
