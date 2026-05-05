import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format, isPast } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge } from '../components/common';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80';

export default function EventDetailPage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/events/${id}`)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Spinner size="lg" className="text-brand-500" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen flex items-center justify-center pt-16 text-center px-4">
      <div>
        <div className="text-5xl mb-4">😢</div>
        <h2 className="font-display font-bold text-2xl mb-2">Event Not Found</h2>
        <p className="text-gray-500 mb-6">{error || 'This event may have been removed'}</p>
        <Link to="/events" className="btn-primary">Browse Events</Link>
      </div>
    </div>
  );

  const isPastEvent = isPast(new Date(event.start_datetime));
  const categories = event.categories ? event.categories.split(',') : [];
  const isSoldOut = event.available_seats === 0;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book tickets');
      navigate(`/login?redirect=/events/${id}/seats`);
      return;
    }
    navigate(`/events/${id}/seats`);
  };

  return (
    <div className="min-h-screen pt-16">
      {/* Hero banner */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <img
          src={event.banner_url || event.poster_url || PLACEHOLDER}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/60 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span key={cat} className="badge bg-brand-500/80 text-white text-xs">{cat}</span>
            ))}
          </div>
          <h1 className="font-display font-bold text-3xl md:text-5xl">{event.title}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Info */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                {
                  icon: '📅',
                  label: 'Date & Time',
                  value: format(new Date(event.start_datetime), 'EEE, d MMM yyyy'),
                  sub: format(new Date(event.start_datetime), 'h:mm a'),
                },
                {
                  icon: '📍',
                  label: 'Venue',
                  value: event.venue_name,
                  sub: event.city ? `${event.city}, ${event.state}` : '',
                },
                {
                  icon: '🎫',
                  label: 'Availability',
                  value: isSoldOut ? 'Sold Out' : `${event.available_seats} seats`,
                  sub: `of ${event.total_seats} total`,
                },
              ].map((item) => (
                <div key={item.label} className="card p-4">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                  <p className="font-medium text-sm">{item.value}</p>
                  {item.sub && <p className="text-xs text-gray-500">{item.sub}</p>}
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="font-display font-semibold text-xl mb-4">About This Event</h2>
              <p className="text-gray-400 leading-relaxed whitespace-pre-line">
                {event.description || 'No description available.'}
              </p>
            </div>

            {/* Venue Details */}
            {event.address && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-xl mb-4">Venue Details</h2>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-medium">{event.venue_name}</p>
                    <p className="text-gray-500 text-sm mt-1">{event.address}</p>
                    {event.city && (
                      <p className="text-gray-500 text-sm">{event.city}, {event.state}, {event.country}</p>
                    )}
                    {event.capacity && (
                      <p className="text-xs text-gray-600 mt-2">Capacity: {event.capacity.toLocaleString()} people</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Organizer */}
            {event.organizer_name && (
              <div className="card p-6">
                <h2 className="font-display font-semibold text-xl mb-4">Organizer</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold">
                    {event.organizer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{event.organizer_name}</p>
                    <p className="text-xs text-gray-500">{event.organizer_email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Booking card */}
          <div className="space-y-4">
            <div className="card p-6 sticky top-24">
              <div className="mb-4 pb-4 border-b border-white/5">
                <p className="text-sm text-gray-500 mb-1">Starting from</p>
                <p className="font-display font-bold text-3xl gradient-text">
                  {event.min_price ? `₹${Number(event.min_price).toLocaleString()}` : 'Free'}
                </p>
                {event.max_price && event.max_price !== event.min_price && (
                  <p className="text-sm text-gray-500">up to ₹{Number(event.max_price).toLocaleString()}</p>
                )}
              </div>

              {/* Availability bar */}
              {event.total_seats > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>{event.available_seats} available</span>
                    <span>{event.total_seats} total</span>
                  </div>
                  <div className="w-full bg-dark-600 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        isSoldOut ? 'bg-red-500' : event.available_seats < 20 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.max(5, (event.available_seats / event.total_seats) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {isPastEvent ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  This event has ended
                </div>
              ) : isSoldOut ? (
                <button disabled className="btn-primary w-full opacity-50 cursor-not-allowed">
                  Sold Out
                </button>
              ) : (
                <button onClick={handleBookNow} className="btn-primary w-full text-base py-4">
                  Book Tickets
                </button>
              )}

              <p className="text-xs text-gray-600 text-center mt-3">
                No extra charges • Instant booking confirmation
              </p>
            </div>

            {/* Share */}
            <div className="card p-4 flex items-center justify-between">
              <span className="text-sm text-gray-400">Share this event</span>
              <div className="flex gap-2">
                {['Twitter', 'WhatsApp'].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href);
                      const text = encodeURIComponent(`Check out "${event.title}" on EventVault!`);
                      const links = {
                        Twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
                        WhatsApp: `https://wa.me/?text=${text}%20${url}`,
                      };
                      window.open(links[platform], '_blank');
                    }}
                    className="btn-ghost text-xs py-1.5 px-3"
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
