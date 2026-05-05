import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const BoltIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

export default function Navbar() {
  const { user, logout, isAuthenticated, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-dark-900/95 backdrop-blur-xl border-b border-white/5 shadow-xl' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-glow group-hover:shadow-glow-lg transition-all">
              <BoltIcon />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Event<span className="gradient-text">Vault</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className="btn-ghost text-sm">Home</Link>
            <Link to="/events" className="btn-ghost text-sm">Browse</Link>
            {isOrganizer && (
              <Link to="/organizer" className="btn-ghost text-sm">Organizer</Link>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-semibold text-xs">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{user?.name?.split(' ')[0]}</span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10">
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-ghost text-sm">Login</Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-4">Sign Up</Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-5 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-dark-800/98 backdrop-blur-xl border-t border-white/5 animate-fade-in">
          <div className="px-4 py-4 space-y-2">
            <Link to="/" className="block py-2.5 px-4 rounded-xl hover:bg-white/5 text-sm">Home</Link>
            <Link to="/events" className="block py-2.5 px-4 rounded-xl hover:bg-white/5 text-sm">Browse Events</Link>
            {isOrganizer && (
              <Link to="/organizer" className="block py-2.5 px-4 rounded-xl hover:bg-white/5 text-sm">Organizer Panel</Link>
            )}
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block py-2.5 px-4 rounded-xl hover:bg-white/5 text-sm">My Bookings</Link>
                <button onClick={handleLogout} className="w-full text-left py-2.5 px-4 rounded-xl hover:bg-red-500/10 text-sm text-red-400">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2.5 px-4 rounded-xl hover:bg-white/5 text-sm">Login</Link>
                <Link to="/register" className="block btn-primary text-center text-sm mt-2">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
