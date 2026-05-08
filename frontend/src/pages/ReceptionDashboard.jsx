import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { financeAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

import { 
  Users, 
  UserPlus, 
  AlertTriangle,
  Calendar,
  ArrowRight,
  Clock
} from 'lucide-react';
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

const ReceptionDashboard = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [weeklyLeads, setWeeklyLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, weeklyRes] = await Promise.all([
        financeAPI.getReceptionistSummary(user?.branch_id),
        financeAPI.getWeeklyLeads(user?.branch_id),
      ]);
      setSummary(summaryRes.data);
      setWeeklyLeads(weeklyRes.data.weekly || []);
    } catch (error) {
      console.error('Failed to fetch receptionist dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Members',
      value: summary?.activeMembers || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'New Leads Today',
      value: summary?.todayLeads || 0,
      icon: UserPlus,
      color: 'bg-purple-500'
    },
    {
      title: 'Follow-ups Due',
      value: summary?.followUpsDue || 0,
      icon: Clock,
      color: 'bg-indigo-500'
    },
    {
      title: 'SLA Breached',
      value: summary?.slaBreached || 0,
      icon: AlertTriangle,
      color: summary?.slaBreached > 0 ? 'bg-orange-500' : 'bg-gray-500'
    }
  ];


  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reception Desk</h1>
          <p className="text-gray-400">Gym Operations Overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="gym-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Operational Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expiring Members */}
        <div className="gym-card border-l-4 border-orange-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Members Expiring Soon</h3>
              <p className="text-sm text-gray-400">Next 7 days</p>
            </div>
            <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-lg font-bold">
              {summary?.expiringMembers || 0}
            </span>
          </div>
          <Link 
            to="/members?filter=expiring" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
          >
            Manage Renewals
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* SLA Alerts */}
        <div className="gym-card border-l-4 border-red-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Urgent Lead Response</h3>
              <p className="text-sm text-gray-400">SLA breached</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-lg font-bold ${
              summary?.slaBreached > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-400'
            }`}>
              {summary?.slaBreached || 0}
            </span>
          </div>
          <Link 
            to="/leads?filter=sla" 
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-500 transition-colors"
          >
            View Urgent Leads
            <AlertTriangle className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Leads Chart */}
      <div className="gym-card">
        <h3 className="text-lg font-semibold text-white mb-4">Weekly Lead Flow</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklyLeads}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#fff' }}
            />
            <Line type="monotone" dataKey="leads" stroke="#f97316" strokeWidth={3} dot={{ fill: '#f97316', r: 6 }} activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
