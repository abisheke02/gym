import { useState, useEffect } from 'react';
import { trainersAPI, branchesAPI } from '../services/api';
import { 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  MapPin, 
  Phone, 
  Mail, 
  Zap, 
  DollarSign,
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Trainers = () => {
  const { user } = useAuth();
  const [trainers, setTrainers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    specialization: '',
    salary: '',
    branch_id: user?.branch_id || '',
    is_active: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trainersRes, branchesRes] = await Promise.all([
        trainersAPI.getAll({ branch_id: user?.role !== 'owner' ? user?.branch_id : '' }),
        branchesAPI.getAll()
      ]);
      setTrainers(trainersRes.data.trainers);
      setBranches(branchesRes.data.branches);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrainer) {
        await trainersAPI.update(editingTrainer.id, formData);
        toast.success('Trainer updated successfully');
      } else {
        await trainersAPI.create(formData);
        toast.success('Trainer added successfully');
      }
      setShowModal(false);
      setEditingTrainer(null);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (trainer) => {
    setEditingTrainer(trainer);
    setFormData({
      name: trainer.name,
      phone: trainer.phone || '',
      email: trainer.email || '',
      specialization: trainer.specialization || '',
      salary: trainer.salary || '',
      branch_id: trainer.branch_id || '',
      is_active: trainer.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this trainer?')) {
      try {
        await trainersAPI.delete(id);
        toast.success('Trainer removed');
        fetchData();
      } catch (error) {
        toast.error('Failed to remove trainer');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      specialization: '',
      salary: '',
      branch_id: user?.branch_id || '',
      is_active: true
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-2">
            Personal Trainers
          </h1>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Manage and assign trainers to gym members.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setEditingTrainer(null); setShowModal(true); }}
          className="flex items-center justify-center gap-3 px-6 py-4 bg-[#005c5b] text-white rounded-2xl font-black uppercase tracking-widest text-[12px] hover:bg-[#004d41] transition-all shadow-xl shadow-[#005c5b]/20 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Add New Trainer
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-gray-800 rounded-3xl animate-pulse shadow-sm border border-gray-100 dark:border-gray-800" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainers.map((trainer) => (
            <div key={trainer.id} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 hover:border-[#005c5b]/30 transition-all group relative overflow-hidden">
               {/* Accent decoration */}
               <div className="absolute top-0 right-0 w-24 h-24 bg-[#005c5b]/5 -mr-8 -mt-8 rounded-full group-hover:bg-[#005c5b]/10 transition-colors" />
               
               <div className="flex items-start justify-between mb-6 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center text-[#005c5b]">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-gray-900 dark:text-white truncate max-w-[150px]">{trainer.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-black uppercase tracking-widest">
                          {trainer.current_clients || 0} Clients
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(trainer)} className="p-2 text-gray-400 hover:text-[#005c5b] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(trainer.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
               </div>

               <div className="space-y-4 relative">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-bold">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="truncate">{trainer.specialization || 'General Training'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-bold">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="truncate">{trainer.branch_name || 'Main Branch'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-bold">
                    <Phone className="w-4 h-4 text-blue-500" />
                    <span>{trainer.phone || 'No Phone'}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monthly Salary</span>
                     <span className="text-lg font-black text-gray-900 dark:text-white">₹{parseFloat(trainer.salary).toLocaleString()}</span>
                  </div>
               </div>
            </div>
          ))}
          {trainers.length === 0 && (
            <div className="col-span-full py-20 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center text-center px-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                <Users className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Trainers Found</h3>
              <p className="text-gray-400 dark:text-gray-500 max-w-xs font-bold uppercase text-[10px] tracking-widest">Start by adding your first personal trainer to the gym staff.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowModal(false)} />
          <div className="bg-white dark:bg-gray-900 rounded-[40px] w-full max-w-lg relative z-[110] shadow-2xl overflow-hidden animate-zoomIn">
            <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
               <div>
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1">
                   {editingTrainer ? 'Edit Trainer' : 'Add Trainer'}
                 </h2>
                 <p className="text-[10px] font-black text-[#005c5b] uppercase tracking-widest">Staff Information</p>
               </div>
               <button onClick={() => setShowModal(false)} className="p-3 bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 rounded-2xl transition-all shadow-sm">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
               <div className="grid grid-cols-1 gap-6">
                 <div>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-[#005c5b]/10 focus:border-[#005c5b] dark:text-white outline-none transition-all font-bold"
                      placeholder="e.g. John Doe"
                    />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-[#005c5b]/10 focus:border-[#005c5b] dark:text-white outline-none transition-all font-bold"
                        placeholder="Number"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Salary (₹)</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({...formData, salary: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-[#005c5b]/10 focus:border-[#005c5b] dark:text-white outline-none transition-all font-bold"
                        placeholder="Amount"
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Specialization</label>
                    <input
                      type="text"
                      value={formData.specialization}
                      onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                      className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-[#005c5b]/10 focus:border-[#005c5b] dark:text-white outline-none transition-all font-bold"
                      placeholder="e.g. Bodybuilding, Yoga"
                    />
                 </div>

                 {user?.role === 'owner' && (
                   <div>
                      <label className="block text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Branch</label>
                      <select
                        value={formData.branch_id}
                        onChange={(e) => setFormData({...formData, branch_id: e.target.value})}
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-[#005c5b]/10 focus:border-[#005c5b] dark:text-white outline-none transition-all font-extrabold appearance-none"
                      >
                        <option value="">Select Branch</option>
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                   </div>
                 )}
               </div>

               <div className="pt-4">
                 <button 
                   type="submit"
                   className="w-full py-5 bg-[#005c5b] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-[13px] hover:bg-[#004d41] transition-all shadow-xl shadow-[#005c5b]/30 flex items-center justify-center gap-3"
                 >
                   {editingTrainer ? 'Save Changes' : 'Confirm Registration'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trainers;
