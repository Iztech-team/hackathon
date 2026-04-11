import { useLayoutEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Disable browser scroll restoration once at module load so it doesn't fight us.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Resets scroll to top whenever the route changes — synchronously before paint
// to avoid flashing the new page at the previous scroll position.
function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    const prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = prev;
  }, [pathname]);
  return null;
}
import { AuthProvider } from './context/AuthContext';
import { TeamProvider } from './context/TeamContext';
import { JudgeProvider } from './context/JudgeContext';
import { Navigation, Header } from './components/layout/Navigation';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import {
  HomeTransition,
  LeaderboardTransition,
  LoginTransition,
  TeamProfileTransition,
  ScanTransition,
  ProfileTransition,
  AdminTransition,
  ManageTransition,
  ExportTransition,
} from './components/layout/PageTransition';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import TeamProfile from './pages/TeamProfile';
import TeamDetail from './pages/TeamDetail';
import JudgeScan from './pages/JudgeScan';
import JudgeProfile from './pages/JudgeProfile';
import AdminDashboard from './pages/AdminDashboard';
import ManageJudges from './pages/ManageJudges';
import ManageVolunteers from './pages/ManageVolunteers';
import VolunteerCheckIn from './pages/VolunteerCheckIn';
import ExportData from './pages/ExportData';

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<HomeTransition><Home /></HomeTransition>} />
        <Route path="/leaderboard" element={<LeaderboardTransition><Leaderboard /></LeaderboardTransition>} />
        <Route path="/teams/:teamId" element={<LeaderboardTransition><TeamDetail /></LeaderboardTransition>} />
        <Route path="/login" element={<LoginTransition><Login /></LoginTransition>} />
        <Route path="/register" element={<Navigate to="/login?tab=register" replace />} />

        {/* Participant routes */}
        <Route
          path="/team"
          element={
            <ProtectedRoute allowedRoles={['participant']}>
              <TeamProfileTransition><TeamProfile /></TeamProfileTransition>
            </ProtectedRoute>
          }
        />

        {/* Judge routes */}
        <Route
          path="/scan"
          element={
            <ProtectedRoute allowedRoles={['judge']}>
              <ScanTransition><JudgeScan /></ScanTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/judge/profile"
          element={
            <ProtectedRoute allowedRoles={['judge']}>
              <ProfileTransition><JudgeProfile /></ProfileTransition>
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminTransition><AdminDashboard /></AdminTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/judges"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTransition><ManageJudges /></ManageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/volunteers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ManageTransition><ManageVolunteers /></ManageTransition>
            </ProtectedRoute>
          }
        />

        {/* Volunteer routes */}
        <Route
          path="/volunteer"
          element={
            <ProtectedRoute allowedRoles={['volunteer']}>
              <AdminTransition><VolunteerCheckIn /></AdminTransition>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/export"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ExportTransition><ExportData /></ExportTransition>
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <AuthProvider>
      <TeamProvider>
        <JudgeProvider>
          <Router>
            <ScrollToTop />
            <div className="min-h-screen relative z-10">
              <Header />
              <Navigation />
              <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 pb-24 min-h-[calc(100vh-80px)] bg-transparent">
                <AnimatedRoutes />
              </main>
            </div>
          </Router>
        </JudgeProvider>
      </TeamProvider>
    </AuthProvider>
  );
}

export default App;
