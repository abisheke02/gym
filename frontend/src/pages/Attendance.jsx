import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  CheckCircle,
  ShieldCheck,
  Clock,
  LogIn,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, membersAPI } from '../services/api';
import toast from 'react-hot-toast';

const Attendance = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [stats, setStats] = useState({ today: 0, this_week: 0, this_month: 0 });
  const [records, setRecords] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const branchId = user?.role === 'owner' ? undefined : user?.branch_id;

  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { date: selectedDate };
      if (branchId) params.branch_id = branchId;

      const statsParams = branchId ? { branch_id: branchId } : {};

      const [attendanceRes, statsRes, membersRes] = await Promise.all([
        attendanceAPI.getList(params),
        attendanceAPI.getStats(statsParams),
        membersAPI.getAll({ limit: 200, ...(branchId ? { branch_id: branchId } : {}) }),
      ]);

      setRecords(attendanceRes.data.attendance || []);
      setStats(statsRes.data);
      setMembers(membersRes.data.members || []);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, branchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const handleCheckIn = async (memberId) => {
    setActionLoading(memberId);
    try {
      await attendanceAPI.checkIn({ member_id: memberId, branch_id: branchId || null });
      toast.success('Checked in successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (memberId) => {
    setActionLoading(memberId);
    try {
      await attendanceAPI.checkOut({ member_id: memberId });
      toast.success('Checked out successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-out failed');
    } finally {
      setActionLoading(null);
    }
  };

  const checkedInIds = new Set(
    records.filter((r) => r.check_in && !r.check_out).map((r) => r.member_id)
  );
  const checkedOutIds = new Set(
    records.filter((r) => r.check_in && r.check_out).map((r) => r.member_id)
  );

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.phone?.includes(search);

    if (filter === 'present') return matchesSearch && checkedInIds.has(m.id);
    if (filter === 'absent') return matchesSearch && !checkedInIds.has(m.id) && !checkedOutIds.has(m.id);
    if (filter === 'active') return matchesSearch && m.status === 'active';
    if (filter === 'expired') return matchesSearch && m.status === 'expired';
    return matchesSearch;
  });

  const presentCount = checkedInIds.size + checkedOutIds.size;
  const absentCount = members.length - presentCount;

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen pb-24 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#005c5b] text-white -mx-4 -mt-4 p-5 sticky top-0 z-[60] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none">
                Record Attendance
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">
                Daily Log System
              </p>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex border-b border-white/10 px-4 -mx-4 gap-8">
          <button className="pb-3 border-b-4 border-white font-black text-[11px] tracking-[0.2em] uppercase">
            Attendance
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="pb-3 text-white/40 font-black text-[11px] tracking-[0.2em] uppercase hover:text-white transition-all"
          >
            Analytics
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 sticky top-[138px] z-50 border-y border-gray-50 dark:border-gray-800 shadow-sm">
        <button
          onClick={() => handleDateChange(-1)}
          className="p-3 text-[#005c5b] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mb-1">
            Select Date
          </p>
          <h3 className="text-[#005c5b] dark:text-[#01a2a1] font-black text-xl tracking-tighter">
            {formattedDate}
            {isToday && (
              <span className="ml-2 text-[10px] bg-[#005c5b]/10 text-[#005c5b] px-2 py-0.5 rounded-full uppercase font-black">
                Today
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={() => handleDateChange(1)}
          className="p-3 text-[#005c5b] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="px-4 max-w-4xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today', value: stats.today, color: 'text-[#005c5b]' },
            { label: 'This Week', value: stats.this_week, color: 'text-blue-500' },
            { label: 'This Month', value: stats.this_month, color: 'text-purple-500' },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center"
            >
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Present/Absent Summary */}
        <div className="gym-card bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-24 h-24 text-[#005c5b]" />
          </div>

          <div className="flex items-center justify-around mb-8 relative z-10">
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">
                Total
              </p>
              <p className="text-3xl font-black text-gray-900 dark:text-white">
                {members.length}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-[#005c5b] tracking-widest mb-1">
                Present
              </p>
              <p className="text-3xl font-black text-[#005c5b] dark:text-[#01a2a1]">
                {presentCount}
              </p>
            </div>
            <div className="w-px h-10 bg-gray-100 dark:bg-gray-700" />
            <div className="text-center">
              <p className="text-[10px] uppercase font-black text-rose-500 tracking-widest mb-1">
                Absent
              </p>
              <p className="text-3xl font-black text-rose-500">{absentCount}</p>
            </div>
          </div>

          <div className="flex bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-1.5 gap-2 relative z-10 flex-wrap">
            {[
              { id: 'all', label: 'All', count: members.length },
              { id: 'present', label: 'Present', count: presentCount },
              { id: 'absent', label: 'Absent', count: absentCount },
              { id: 'active', label: 'Active', count: members.filter((m) => m.status === 'active').length },
              { id: 'expired', label: 'Expired', count: members.filter((m) => m.status === 'expired').length },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all min-w-[60px] ${
                  filter === btn.id
                    ? 'bg-[#005c5b] text-white shadow-lg'
                    : 'text-gray-500'
                }`}
              >
                {btn.label} ({btn.count})
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#005c5b] transition-colors" />
          <input
            type="text"
            placeholder="Search member name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-4 py-4 bg-white dark:bg-gray-800 border-none rounded-[2rem] shadow-xl font-bold dark:text-white outline-none ring-2 ring-transparent focus:ring-[#005c5b] transition-all"
          />
        </div>

        {/* Member List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#005c5b]" />
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-16 flex flex-col items-center justify-center text-center">
            <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-6" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">
              No Records Found
            </h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
              {search ? 'Try a different search' : `No members for ${formattedDate}`}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const isCheckedIn = checkedInIds.has(member.id);
              const isCheckedOut = checkedOutIds.has(member.id);
              const record = records.find((r) => r.member_id === member.id);
              const isActioning = actionLoading === member.id;

              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm flex items-center gap-4"
                >
                  {/* Status dot */}
                  <div
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      isCheckedIn
                        ? 'bg-green-500'
                        : isCheckedOut
                        ? 'bg-blue-400'
                        : 'bg-gray-200 dark:bg-gray-600'
                    }`}
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-gray-400 font-bold">{member.phone}</p>
                    {record && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        In:{' '}
                        {new Date(record.check_in).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {record.check_out && (
                          <>
                            {' '}· Out:{' '}
                            {new Date(record.check_out).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      member.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                  >
                    {member.status}
                  </span>

                  {/* Action button — only for today */}
                  {isToday && (
                    <button
                      onClick={() =>
                        isCheckedIn ? handleCheckOut(member.id) : handleCheckIn(member.id)
                      }
                      disabled={isActioning || isCheckedOut}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                        isCheckedOut
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                          : isCheckedIn
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'bg-[#005c5b] hover:bg-[#004746] text-white'
                      }`}
                    >
                      {isActioning ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : isCheckedOut ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Done
                        </>
                      ) : isCheckedIn ? (
                        <>
                          <LogOut className="w-3 h-3" /> Out
                        </>
                      ) : (
                        <>
                          <LogIn className="w-3 h-3" /> In
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
