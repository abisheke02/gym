// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Users, DollarSign, TrendingUp, Filter } from 'lucide-react';
import axios from 'axios';

const App = () => {
  const [stats, setStats] = useState({ totalLeads: 0, activeMembers: 0, totalRevenue: 0 });
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    // Fetch stats and leads from backend
    // axios.get('/api/dashboard/stats').then(res => setStats(res.data.summary));
    // axios.get('/api/leads').then(res => setLeads(res.data));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CRM Dashboard</h1>
          <p className="text-gray-400">Welcome back, Admin</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition">
          + Add New Lead
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard icon={<TrendingUp />} title="Total Leads" value={stats.totalLeads} color="blue" />
        <StatCard icon={<Users />} title="Active Members" value={stats.activeMembers} color="green" />
        <StatCard icon={<DollarSign />} title="Total Revenue" value={`₹${stats.totalRevenue}`} color="purple" />
      </div>

      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Recent Leads</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-gray-700 rounded-lg"><Filter size={20} /></button>
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="pb-3">Name</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-4">{lead.name}</td>
                <td className="py-4">{lead.phone}</td>
                <td className="py-4"><StatusBadge status={lead.status} /></td>
                <td className="py-4">{new Date(lead.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
    <div className={`p-3 bg-${color}-500/20 text-${color}-400 rounded-lg w-fit mb-4`}>
      {icon}
    </div>
    <p className="text-gray-400 text-sm">{title}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full uppercase font-bold">
    {status}
  </span>
);

export default App;
