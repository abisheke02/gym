import { useState } from 'react';
import { 
  ChevronLeft, 
  Monitor, 
  Smartphone, 
  Tablet, 
  LogOut,
  Info 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ManageDevices = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use current date for sign-in as per screenshot style
  const signInDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).replace(/\//g, '-');

  // Hardcoded device info to match screenshot
  const devices = [
    {
      id: 1,
      model: 'iPhone 14',
      brand: 'Apple',
      signInDate: signInDate,
      isCurrent: true
    }
  ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out from this device?')) {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen">
      {/* Header (Screenshot 1 style) */}
      <div className="bg-[#004d4d] text-white -mx-4 -mt-4 p-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="p-1 hover:bg-white/10 rounded-lg">
              <ChevronLeft className="w-6 h-6" />
           </button>
           <h1 className="text-xl font-bold">Manage Devices</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-2 mt-4">
          {devices.map(device => (
            <div key={device.id} className="bg-white rounded-xl p-5 shadow-lg border border-gray-100 flex items-start justify-between">
              <div className="space-y-3">
                 <h3 className="text-xl font-black text-gray-900">
                    {user?.name} | {user?.email}
                 </h3>
                 <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <p className="text-lg font-medium text-gray-700">{device.model} | {device.brand}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-gray-400" />
                    <p className="text-lg font-bold text-gray-600">Sign in Date: {device.signInDate}</p>
                 </div>
              </div>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 border-2 border-[#005c5b] text-[#005c5b] rounded-xl font-black text-sm uppercase tracking-tight hover:bg-[#005c5b] hover:text-white transition-all transform active:scale-95 shadow-md"
              >
                LOG OUT
              </button>
            </div>
          ))}
        </div>
    </div>
  );
};

export default ManageDevices;
