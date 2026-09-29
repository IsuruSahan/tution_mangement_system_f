import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import our main navigation component
import Sidebar from './components/Sidebar';

// Auth
import { setupAxiosInterceptor } from './auth/authService';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminProtectedRoute from './auth/AdminProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

// Import our page components
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import PaymentsPage from './pages/PaymentsPage';
import AttendancePage from './pages/AttendancePage';
import FinanceReportPage from './pages/FinanceReportPage';
import SettingsPage from './pages/SettingsPage';
import ScanCheckInPage from './pages/ScanCheckInPage';
import { ToastProvider } from './components/ui/ToastProvider';

// Wraps the existing teacher-facing pages: requires a teacher login and shows the sidebar.
function TeacherApp({ children }) {
  return (
    <ProtectedRoute>
      <div className="tc-app-shell">
        <Sidebar />
        <main className="tc-main">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}

function App() {
  // Wire up the global 401 handler once, on app start.
  useEffect(() => {
    setupAxiosInterceptor();
  }, []);

  return (
    <ToastProvider>
    <BrowserRouter>
      <Routes>
        {/* --- Public login pages (no nav bar) --- */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* --- Super-admin dashboard: manage all teacher accounts --- */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminDashboardPage />
            </AdminProtectedRoute>
          }
        />

        {/* --- Teacher-facing app: every route below requires a teacher login --- */}
        <Route path="/" element={<TeacherApp><DashboardPage /></TeacherApp>} />
        <Route path="/students" element={<TeacherApp><StudentsPage /></TeacherApp>} />
        <Route path="/payments" element={<TeacherApp><PaymentsPage /></TeacherApp>} />
        <Route path="/attendance" element={<TeacherApp><AttendancePage /></TeacherApp>} />
        <Route path="/finance-report" element={<TeacherApp><FinanceReportPage /></TeacherApp>} />
        <Route path="/settings" element={<TeacherApp><SettingsPage /></TeacherApp>} />
        <Route path="/scan" element={<TeacherApp><ScanCheckInPage /></TeacherApp>} />

        {/* You can add a 404 "Not Found" page later */}
      </Routes>
    </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
