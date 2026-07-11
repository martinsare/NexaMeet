import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { ScrollToTop } from "@/components/ScrollToTop";
import Landing from "@/pages/Landing";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Docs from "@/pages/Docs";
import About from "@/pages/About";
import Careers from "@/pages/Careers";
import Blog from "@/pages/Blog";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import GuestJoin from "@/pages/GuestJoin";
import Dashboard from "@/pages/Dashboard";
import ScheduleMeeting from "@/pages/ScheduleMeeting";
import MeetingHistory from "@/pages/MeetingHistory";
import MeetingRoom from "@/pages/MeetingRoom";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Marketing */}
      <Route path="/"        element={<Landing />} />
      <Route path="/features" element={<Features />} />
      <Route path="/pricing"  element={<Pricing />} />
      <Route path="/docs"     element={<Docs />} />
      <Route path="/terms"    element={<Terms />} />
      <Route path="/privacy"  element={<Privacy />} />
      <Route path="/about"    element={<About />} />
      <Route path="/careers"  element={<Careers />} />
      <Route path="/blog"     element={<Blog />} />

      {/* Auth */}
      <Route path="/login"            element={<Login />} />
      <Route path="/signup"           element={<Signup />} />
      <Route path="/forgot-password"  element={<ForgotPassword />} />
      <Route path="/join"             element={<GuestJoin />} />

      {/* App (protected) */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/schedule"  element={<ProtectedRoute><ScheduleMeeting /></ProtectedRoute>} />
      <Route path="/history"   element={<ProtectedRoute><MeetingHistory /></ProtectedRoute>} />
      <Route path="/search"    element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/settings"  element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/meeting/:id" element={<MeetingRoom />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}
