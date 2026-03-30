import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/admin-login', { password });
      
      // Store admin status
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('isAdmin', 'true');
      
      toast.success('Admin access granted!');
      navigate('/admin-panel');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gym-accent/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="bg-gym-accent p-3 rounded-xl shadow-lg shadow-gym-accent/30">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tighter text-gym-accent">
            IRONMAN FITNESS
          </span>
              <p className="text-xs text-gray-400 font-medium">IRONMAN FITNESS Authorization</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Management Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12 group-focus-within:border-gym-accent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold text-lg active:scale-95 transition-transform"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Unlock Access'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-400">
              Management Password (Demo):
            </p>
            <p className="text-sm font-bold text-gym-accent mt-1">
              abiadmin
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 italic">
            Secure connection established. Unauthorized access is recorded.
          </p>
        </div>

        <p className="text-center text-gray-600 text-sm mt-6">
          © 2024 IRONMAN FITNESS Gym CRM. Management Interface.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
