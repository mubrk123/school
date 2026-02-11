import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { AdmissionPage } from "./pages/AdmissionPage";
import { AttendancePage } from "./pages/AttendancePage";
import { FeesPage } from "./pages/FeesPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { TeachersPage } from "./pages/TeachersPage";

const ProtectedRoute = ({ children, requirePrincipal = false }) => {
  const { isAuthenticated, loading, isPrincipal } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePrincipal && !isPrincipal) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="spinner" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />

      {/* Protected Routes */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/students" 
        element={
          <ProtectedRoute requirePrincipal>
            <StudentsPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/students/new" 
        element={
          <ProtectedRoute requirePrincipal>
            <AdmissionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/students/:id" 
        element={
          <ProtectedRoute>
            <StudentDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/fees" 
        element={
          <ProtectedRoute requirePrincipal>
            <FeesPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/attendance" 
        element={
          <ProtectedRoute>
            <AttendancePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/notifications" 
        element={
          <ProtectedRoute requirePrincipal>
            <NotificationsPage />
          </ProtectedRoute>
        } 
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
