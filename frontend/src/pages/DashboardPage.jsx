import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, EmptyState } from '../components/common';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchBookings();
  }, [isAuthenticated]);

  const fetchBookings = async () => {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data || []);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Cancel this booking? This action cannot be undone.')) return;
    setCancelling(bookingId);
    try {
      await api.delete(`/bookings/${bookingId}`);
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(null);
    }
  };

  const filtered = bookings.filter((b) => {
    if (activeTab === 'upcoming') return b.status === 'confirmed' && new Date(b.start_datetime) > new Date();
    if (activeTab === 'cancelled') return b.status === 'cancelled';
    return true;
  });

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    spent: bookings
      .filter((b) => b.status === 'confirmed')
      .reduce((s, b) => s + Number(b.total_amount), 0),
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold font-display text-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Bookings', value: stats.total, icon: '🎫' },
            { label: 'Confirmed', value: stats.confirmed, icon: '✅' },
            { label: 'Total Spent', value: `₹${stats.spent.toLocaleString()}`, icon: '💰' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card p-5 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="font-display font-bold text-2xl mb-1">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-700 border border-white/5 rounded-xl p-1 mb-6 w-fit">
          {[['all', 'All Bookings'], ['upcoming', 'Upcoming'], ['cancelled', 'Cancelled']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setActiveTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === val ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" className="text-brand-500" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🎟️"
            title="No bookings yet"
            description="Book your first event and it'll appear here"
            action={<Link to="/events" className="btn-primary">Browse Events</Link>}
          />
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <BookingCard
                key={booking.booking_id}
                booking={booking}
                onCancel={handleCancel}
                cancelling={cancelling === booking.booking_id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingCard({ booking, onCancel, cancelling }) {
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed';
  const isFuture = new Date(booking.start_datetime) > new Date();

  return (
    <div className="card p-5 hover:border-white/15 transition-all">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Event image placeholder */}
        <div className="w-full sm:w-24 h-20 rounded-xl overflow-hidden shrink-0 bg-dark-600">
          {booking.poster_url ? (
            <img src={booking.poster_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl">🎭</div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-display font-semibold text-base leading-tight line-clamp-1">
                {booking.event_title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {booking.start_datetime
                  ? format(new Date(booking.start_datetime), 'EEE, d MMM yyyy · h:mm a')
                  : 'Date TBD'}
              </p>
              <p className="text-xs text-gray-500">
                {booking.venue_name}{booking.city ? `, ${booking.city}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={booking.status} />
              {booking.payment_status && (
                <StatusBadge status={booking.payment_status} />
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
              <span>🎫 {booking.seat_count} seat{booking.seat_count !== 1 ? 's' : ''} {booking.seats && `(${booking.seats})`}</span>
              <span className="font-semibold text-white">₹{Number(booking.total_amount).toLocaleString()}</span>
              <span className="font-mono text-xs text-gray-600">Ref: {booking.booking_ref}</span>
              {booking.booking_time && <span className="text-xs text-gray-500">Booked on: {format(new Date(booking.booking_time), 'MMM d, h:mm a')}</span>}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              {booking.status === 'confirmed' && (
                <button
                  onClick={() => {
                    const content = `TICKET REFERENCE: ${booking.booking_ref}\nEVENT: ${booking.event_title}\nSEATS: ${booking.seats}\nAMOUNT: ₹${booking.total_amount}\nSTATUS: ${booking.status}\nBOOKED AT: ${new Date(booking.booking_time).toLocaleString()}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Ticket_${booking.booking_ref}.txt`;
                    a.click();
                  }}
                  className="btn-ghost text-xs py-1.5 px-3 border border-white/10"
                >
                  Download Ticket
                </button>
              )}
              <Link
                to={`/booking-confirmation/${booking.booking_id}`}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                View Details
              </Link>
              {booking.status === 'pending' && (
                <Link
                  to={`/checkout/${booking.booking_id}`}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Pay Now
                </Link>
              )}
              {canCancel && isFuture && (
                <button
                  onClick={() => onCancel(booking.booking_id)}
                  disabled={cancelling}
                  className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                  {cancelling ? <Spinner size="sm" /> : 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
