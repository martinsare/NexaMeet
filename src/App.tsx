import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Landing from "@/pages/Landing";
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
import Pricing from "@/pages/Pricing";
import NotFound from "@/pages/NotFound";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/join" element={<GuestJoin />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <ScheduleMeeting />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <MeetingHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="/meeting/:id" element={<MeetingRoom />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
