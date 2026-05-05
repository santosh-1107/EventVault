import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-dark-900/50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <span className="font-display font-bold text-lg">Event<span className="gradient-text">Vault</span></span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Your gateway to unforgettable experiences. Book tickets for concerts, sports, theater, and more.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-300">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/events" className="hover:text-white transition-colors">All Events</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">My Bookings</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4 text-gray-300">Account</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link to="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Register</Link></li>
              <li><Link to="/organizer" className="hover:text-white transition-colors">For Organizers</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} EventVault. Built with ❤️ for live experiences.</p>
          <p className="text-gray-700 text-xs font-mono">v1.0.0</p>
        </div>
      </div>
    </footer>
  );
}
