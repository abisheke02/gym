import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Branches from './pages/Branches';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminPanel from './pages/AdminPanel';
import ReceptionDashboard from './pages/ReceptionDashboard';
import AdminLogin from './pages/AdminLogin';
import Help from './pages/Help';
import DeletedMembers from './pages/DeletedMembers';
import ForgotPassword from './pages/ForgotPassword';
import ManageExpense from './pages/ManageExpense';
import ManageEnquiry from './pages/ManageEnquiry';
import DownloadReport from './pages/DownloadReport';
import ManagePlans from './pages/ManagePlans';
import Messaging from './pages/Messaging';
import AdmissionReport from './pages/AdmissionReport';
import Attendance from './pages/Attendance';
import ManageDevices from './pages/ManageDevices';
import Gym from './pages/Gym';
import Trainers from './pages/Trainers';


const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !hasRole(...roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AdminProtectedRoute = ({ children }) => {
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          user?.role === 'receptionist' ? <ReceptionDashboard /> : <Dashboard />
        } />
        
        <Route path="leads" element={<Leads />} />
        <Route path="leads/:id" element={<LeadDetail />} />
        
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        
        <Route path="branches" element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <Branches />
          </ProtectedRoute>
        } />
        
        <Route path="finance" element={
          <ProtectedRoute roles={['owner', 'manager', 'accountant']}>
            <Finance />
          </ProtectedRoute>
        } />
        
        <Route path="reports" element={
          <ProtectedRoute roles={['owner', 'manager']}>
            <Reports />
          </ProtectedRoute>
        } />
        
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route path="deleted-members" element={<DeletedMembers />} />
        <Route path="manage-expense" element={<ManageExpense />} />
        <Route path="manage-enquiry" element={<ManageEnquiry />} />
        <Route path="download-report" element={<DownloadReport />} />
        <Route path="plans" element={<ManagePlans />} />
        <Route path="messaging" element={<Messaging />} />
        <Route path="admission-report" element={<AdmissionReport />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="manage-devices" element={<ManageDevices />} />
        <Route path="gym" element={<Gym />} />
        <Route path="trainers" element={<Trainers />} />
      </Route>

      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin-panel" element={
        <AdminProtectedRoute>
          <AdminPanel />
        </AdminProtectedRoute>
      } />
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

