import { useState } from 'react';
import { membersAPI, financeAPI } from '../services/api';
import { 
  Download, 
  FileSpreadsheet, 
  FileText,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const DownloadReport = () => {
  const [category, setCategory] = useState('member');
  const [reportType, setReportType] = useState('all_time');
  const [format, setFormat] = useState('excel');
  const [loading, setLoading] = useState(false);

  const reportTypes = {
    member: [
      { value: 'all_time', label: 'All Time' },
      { value: 'active', label: 'Active Members' },
      { value: 'expired', label: 'Expired Members' },
      { value: 'this_month', label: 'This Month Joined' },
      { value: 'birthday_this_month', label: 'Birthday This Month' },
    ],
    bills: [
      { value: 'all_time', label: 'All Time' },
      { value: 'this_month', label: 'This Month' },
      { value: 'last_month', label: 'Last Month' },
      { value: 'pending', label: 'Pending Payments' },
    ]
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      let data = [];
      
      if (category === 'member') {
        const params = {};
        if (reportType === 'active') params.status = 'active';
        else if (reportType === 'expired') params.status = 'expired';
        
        const response = await membersAPI.getAll(params);
        data = response.data.members || [];
      } else {
        const response = await financeAPI.getPayments({});
        data = response.data.payments || [];
      }

      // Generate CSV
      if (data.length === 0) {
        toast.error('No data to export');
        setLoading(false);
        return;
      }

      const headers = Object.keys(data[0]).filter(k => !k.includes('id') || k === 'id');
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return str.includes(',') ? `"${str}"` : str;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${category}_report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Report downloaded successfully!');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Download className="w-7 h-7 text-gym-accent" />
          Download Member Report
        </h1>
        <p className="text-gray-400">Export reports in Excel/CSV format</p>
      </div>

      {/* Notes */}
      <div className="gym-card">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-white mb-2">Notes</h3>
            <ol className="text-gray-400 space-y-1 list-decimal list-inside text-sm">
              <li>Select the type of report you want to download.</li>
              <li>Click the download button.</li>
              <li>Check the download folder for the Excel file.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Report Category */}
      <div className="gym-card">
        <h3 className="text-white font-semibold mb-4">Report Category</h3>
        <div className="flex gap-3">
          <button
            onClick={() => { setCategory('member'); setReportType('all_time'); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
              category === 'member'
                ? 'border-gym-accent text-gym-accent bg-gym-accent/10'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mx-auto mb-1" />
            Member Report
          </button>
          <button
            onClick={() => { setCategory('bills'); setReportType('all_time'); }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all border ${
              category === 'bills'
                ? 'border-gym-accent text-gym-accent bg-gym-accent/10'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
          >
            <FileText className="w-5 h-5 mx-auto mb-1" />
            Member Bills
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-400 mb-2">Type Of Report</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input-field"
          >
            {reportTypes[category].map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Download */}
      <div className="gym-card">
        <p className="text-gray-400 text-sm mb-4">
          {category === 'member' ? 'Member' : 'Bills'} Report · {reportTypes[category].find(t => t.value === reportType)?.label} · CSV
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Report
              </>
            )}
          </button>
          <div className="flex items-center gap-1 px-4 py-3 bg-gray-700 rounded-lg text-gray-300 text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            CSV
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadReport;
