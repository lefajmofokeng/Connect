import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/employer/Login";
import Admin from "./pages/admin/Admin";
import Join from "./pages/employer/Join";
import Register from "./pages/employer/Register";
import Verify from "./pages/employer/Verify";
import Dashboard from "./pages/employer/Dashboard";
import PostJob from "./pages/employer/PostJob";
import Applications from "./pages/employer/Applications";
import Profile from "./pages/employer/Profile";
import Home from "./pages/public/Home";
import Jobs from "./pages/public/Jobs";
import JobDetail from "./pages/public/JobDetail";
import Apply from "./pages/public/Apply";
import CompanyPage from "./pages/public/CompanyPage";
import Terms from "./pages/public/Terms";
import Privacy from "./pages/public/Privacy";
import NotFound from "./pages/public/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import JobSeekerRegister from "./pages/jobseeker/Register";
import JobSeekerLogin from "./pages/jobseeker/Login";
import JobSeekerDashboard from "./pages/jobseeker/Dashboard";
import Analytics from "./pages/employer/Analytics";
import Billing   from "./pages/employer/Billing";
import Notifications from "./pages/employer/Notifications";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: "#fff", padding: 40 }}>Loading...</div>;
  if (!user) return <Navigate to="/employer/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ color: "#fff", padding: 40 }}>Loading...</div>;
  if (!user || user.email !== "lefamjack@gmail.com") return <Navigate to="/admin/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/apply/:id" element={<Apply />} />
        <Route path="/company/:slug" element={<CompanyPage />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        {/* Employer auth */}
        <Route path="/employer/login" element={<Login />} />
        <Route path="/employer/join" element={<Join />} />
        <Route path="/employer/register" element={<Register />} />

        {/* Employer portal — protected */}
        <Route path="/employer/verify" element={<ProtectedRoute><Verify /></ProtectedRoute>} />
        <Route path="/employer/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/employer/post-job" element={<ProtectedRoute><PostJob /></ProtectedRoute>} />
        <Route path="/employer/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
        <Route path="/employer/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/employer/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/employer/billing"   element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/employer/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

        {/* Job Seeker */}
        <Route path="/jobseeker/register" element={<JobSeekerRegister />} />
        <Route path="/jobseeker/login" element={<JobSeekerLogin />} />
        <Route path="/jobseeker/dashboard" element={<JobSeekerDashboard />} />

        {/* 404 — must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}