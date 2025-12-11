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

function App() {
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

