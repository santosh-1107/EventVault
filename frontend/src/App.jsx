import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import SeatSelectionPage from './pages/SeatSelectionPage';
import CheckoutPage from './pages/CheckoutPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import OrganizerPage from './pages/OrganizerPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${location.pathname}`} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Layout({ children }) {
  const location = useLocation();
  const noFooterRoutes = ['/login', '/register'];
  const showFooter = !noFooterRoutes.some(r => location.pathname.startsWith(r));

  return (
    <>
      <Navbar />
      <main className="page-enter">{children}</main>
      {showFooter && <Footer />}
    </>
  );
}

function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/events/:id/seats" element={
          <ProtectedRoute><SeatSelectionPage /></ProtectedRoute>
        } />
        <Route path="/checkout/:bookingId" element={
          <ProtectedRoute><CheckoutPage /></ProtectedRoute>
        } />
        <Route path="/booking-confirmation/:bookingId" element={
          <ProtectedRoute><BookingConfirmationPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/organizer" element={
          <ProtectedRoute roles={['organizer', 'admin']}><OrganizerPage /></ProtectedRoute>
        } />

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center text-center px-4 pt-16">
            <div>
              <div className="font-display font-bold text-8xl gradient-text mb-4">404</div>
              <h2 className="font-display font-bold text-2xl mb-2">Page Not Found</h2>
              <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
              <a href="/" className="btn-primary inline-flex">Go Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a27',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1a1a27' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1a1a27' } },
            duration: 3000,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
