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

// --- GLOBAL ERROR BOUNDARY ---
import React from 'react'; // Ensure React is imported for Component

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6 text-center">
          <div>
            <h1 className="text-3xl font-bold text-red-700 mb-4">Application Crashed</h1>
            <p className="text-gray-700 mb-6 max-w-lg mx-auto">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
    <GlobalErrorBoundary>
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
    </GlobalErrorBoundary>
  );
}

export default App;

