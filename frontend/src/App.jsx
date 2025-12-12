import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import AuthContext from './context/AuthContext';
import LoginPage from './pages/LoginPage';
// Placeholder for Dashboard (will create next)
import DashboardPage from './pages/DashboardPage';
import NewBookingPage from './pages/NewBookingPage';
import TodayBookingsPage from './pages/TodayBookingsPage';
import BookingsPage from './pages/BookingsPage';
import ExpensePage from './pages/ExpensePage';
import FinancePage from './pages/FinancePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import ProtectedLayout from './components/layout/ProtectedLayout';

import { useEffect } from 'react'; // Ensure React import is updated if needed, though usually automatic in new Vite. 
// However, the file already imports useContext, so we need to add useEffect to the first line import.

function App() {
  // Prevent Zooming on Mobile
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 1) {
        e.preventDefault(); // Prevent pinch zoom
      }
    };

    let lastTouchEnd = 0;
    const handleTouchEnd = (e) => {
      const now = (new Date()).getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault(); // Prevent double-tap zoom
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/bookings/new" element={<NewBookingPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/expenses" element={<ExpensePage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;

