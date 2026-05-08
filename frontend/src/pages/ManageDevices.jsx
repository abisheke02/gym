import { useState } from 'react';
import { ChevronLeft, Smartphone, Info, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
};

const getLoginTime = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.iat ? new Date(payload.iat * 1000) : null;
  } catch {
    return null;
  }
};

const ManageDevices = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [deviceInfo] = useState(getDeviceInfo);
  const [loginTime] = useState(getLoginTime);

  const handleLogout = () => {
    if (!confirm('Log out from this device?')) return;
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const signInDate = loginTime
    ? loginTime.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const signInTime = loginTime
    ? loginTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#005c5b] text-white -mx-4 -mt-4 p-5 sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none">Manage Devices</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-1">Active Sessions</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-2 space-y-4 mt-2">
        {/* Current Session Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-4 flex-1">
              {/* User info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#005c5b]/10 dark:bg-[#005c5b]/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#005c5b]" />
                </div>
                <div>
                  <p className="font-black text-gray-900 dark:text-white text-sm">{user?.full_name || user?.name || 'Unknown'}</p>
                  <p className="text-xs text-gray-400 font-bold">{user?.email}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Device</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {deviceInfo.browser} on {deviceInfo.os}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Signed In</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {signInDate} at {signInTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Role</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 capitalize">{user?.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-3 py-1 rounded-full shrink-0">
              Current
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full py-3 border-2 border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
          >
            Log Out
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 font-bold px-4">
          Only the current active session is shown. Multi-device session tracking requires server-side session management.
        </p>
      </div>
    </div>
  );
};

export default ManageDevices;
