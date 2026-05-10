import { useState, useEffect } from 'react';
import { membersAPI } from '../services/api';
import { Trash2, RotateCcw, Search, Phone } from 'lucide-react';
import toast from 'react-hot-toast';

const DeletedMembers = () => {
  const [deletedMembers, setDeletedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDeletedMembers();
  }, []);

  const fetchDeletedMembers = async () => {
    try {
      const response = await membersAPI.getAll({ include_inactive: true });
      setDeletedMembers(response.data.members || []);
    } catch (error) {
      toast.error('Failed to fetch deleted members');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id) => {
    try {
      await membersAPI.update(id, { status: 'active', is_active: true });
      toast.success('Member restored successfully');
      fetchDeletedMembers();
    } catch (error) {
      toast.error('Failed to restore member');
    }
  };

  const filteredMembers = deletedMembers.filter(m =>
    m.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.phone?.includes(search)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Trash2 className="w-7 h-7 text-red-400" />
          Deleted Members
        </h1>
        <p className="text-gray-400">View and restore deleted members</p>
      </div>

      {/* Search */}
      <div className="gym-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted members by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Members List */}
      <div className="gym-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-16">
            <Trash2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Deleted Members Found</h3>
            <p className="text-gray-400">Deleted members will appear here when members are deleted</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-lg">
                    {member.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{member.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <Phone className="w-3 h-3" />
                        {member.phone}
                      </span>
                      {member.email && (
                        <span className="text-gray-500 text-sm">{member.email}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(member.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeletedMembers;
