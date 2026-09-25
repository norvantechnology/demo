import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import { AppShell } from './layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/customers/CustomersPage';
import EmployeesPage from './pages/employees/EmployeesPage';
import JobOrdersListPage from './pages/jobOrders/JobOrdersListPage';
import JobOrderFormPage from './pages/jobOrders/JobOrderFormPage';
import JobOrderDetailPage from './pages/jobOrders/JobOrderDetailPage';
import JobOrderPrintPage from './pages/jobOrders/JobOrderPrintPage';
import InvoicesPage from './pages/invoices/InvoicesPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeavesPage from './pages/leaves/LeavesPage';
import PayrollPage from './pages/payroll/PayrollPage';
import PayrollDetailPage from './pages/payroll/PayrollDetailPage';
import SettingsPage from './pages/settings/SettingsPage';

function Protected({ children }) {
  const { user, booting } = useAuth();
  if (booting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />

      <Route
        path="/job-orders/:id/print"
        element={
          <Protected>
            <JobOrderPrintPage />
          </Protected>
        }
      />

      <Route
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="job-orders" element={<JobOrdersListPage />} />
        <Route path="job-orders/new" element={<JobOrderFormPage />} />
        <Route path="job-orders/:id" element={<JobOrderDetailPage />} />
        <Route path="job-orders/:id/edit" element={<JobOrderFormPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="leaves" element={<LeavesPage />} />
        <Route path="payroll" element={<PayrollPage />} />
        <Route path="payroll/:id" element={<PayrollDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
