import { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { leadsAPI } from '../services/api';
import toast from 'react-hot-toast';

const BulkUploadModal = ({ isOpen, onClose, onUploadSuccess, branches }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (['csv', 'xlsx', 'xls'].includes(ext)) {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast.error('Please select a CSV or Excel file');
        e.target.value = null;
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (selectedBranch) formData.append('branch_id', selectedBranch);

    setUploading(true);
    try {
      const response = await leadsAPI.bulkUpload(formData);
      setResults(response.data.results);
      toast.success('Bulk upload completed');
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload leads');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Phone', 'Email', 'Gender', 'Age', 'Address', 'Source', 'Notes'];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + 
      "John Doe,9876543210,john@example.com,male,25,Chennai,Meta Ads,Interested in weight loss";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "leads_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Upload className="w-5 h-5 text-gym-accent" />
            Bulk Upload Leads
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!results ? (
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Assign to Branch (Optional)</label>
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="input-field"
                >
                  <option value="">Auto-detected / Manual</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div 
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-colors
                  ${file ? 'border-gym-accent bg-gym-accent/5' : 'border-gray-700 hover:border-gray-600'}
                `}
              >
                <input 
                  type="file" 
                  id="lead-file" 
                  className="hidden" 
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
                <label htmlFor="lead-file" className="cursor-pointer block">
                  <div className="bg-gray-700 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className={`w-6 h-6 ${file ? 'text-gym-accent' : 'text-gray-400'}`} />
                  </div>
                  {file ? (
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-sm text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-white font-medium">Click to select file</p>
                      <p className="text-sm text-gray-400 mt-1">Supports .csv and .xlsx files</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                type="submit" 
                disabled={!file || uploading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed py-3 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Leads
                  </>
                )}
              </button>
              
              <button 
                type="button"
                onClick={downloadTemplate}
                className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-gym-accent transition-colors py-2"
              >
                <Download className="w-4 h-4" />
                Download Template CSV
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                <p className="text-sm text-green-400">Successfully Imported</p>
                <p className="text-3xl font-bold text-green-500">{results.success}</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                <p className="text-sm text-red-400">Failed Records</p>
                <p className="text-3xl font-bold text-red-500">{results.failed}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-300">Errors encountered:</p>
                <div className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                  {results.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                  {results.errors.length > 10 && (
                    <p className="text-xs text-gray-500 italic text-center">...and {results.errors.length - 10} more errors</p>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={onClose}
              className="btn-primary w-full py-3"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkUploadModal;
