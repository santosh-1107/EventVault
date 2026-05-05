import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import EventCard from '../components/events/EventCard';
import { Skeleton } from '../components/common';

const HERO_STATS = [
  { label: 'Events', value: '500+' },
  { label: 'Cities', value: '50+' },
  { label: 'Happy Fans', value: '1M+' },
];

const CATEGORY_ICONS = {
  Music: '🎵', Sports: '⚽', Theatre: '🎭', Comedy: '😂',
  Tech: '💻', Food: '🍕', Art: '🎨', Dance: '💃', Default: '🎟️',
};

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/events?limit=8&upcoming=true'),
      api.get('/events/categories'),
    ])
      .then(([evRes, catRes]) => {
        setEvents(evRes.data?.events || []);
        setCategories(catRes.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/events?search=${encodeURIComponent(search)}`);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-gradient">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-glow-radial opacity-40" />
          
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-24 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-400 mb-8 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            Live events happening near you
          </div>

          <h1 className="font-display font-extrabold text-5xl md:text-7xl leading-tight mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Experience the<br />
            <span className="gradient-text">Extraordinary</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Book tickets for concerts, sports, theatre, and more. 
            Thousands of events, one seamless platform.
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative max-w-xl mx-auto animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex gap-2 bg-dark-700/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-card">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events, artists, venues..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
              />
              <button type="submit" className="btn-primary text-sm py-2.5 px-6 shrink-0">
                Search
              </button>
            </div>
          </form>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {HERO_STATS.map(({ label, value }) => (
              <div key={label} className="text-center">
                <div className="font-display font-bold text-2xl gradient-text">{value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-2xl">Browse by Category</h2>
            <Link to="/events" className="text-sm text-brand-400 hover:text-brand-300 transition-colors">
              View all →
            </Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {categories.map((cat) => (
              <Link
                key={cat.category_id}
                to={`/events?category=${cat.slug}`}
                className="flex items-center gap-2 px-5 py-3 bg-dark-700 hover:bg-dark-600 border border-white/10 hover:border-white/20 rounded-2xl text-sm font-medium transition-all hover:-translate-y-0.5"
              >
                <span>{CATEGORY_ICONS[cat.name] || CATEGORY_ICONS.Default}</span>
                <span>{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Events */}
      <section className="pb-20 max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display font-bold text-2xl md:text-3xl">Upcoming Events</h2>
            <p className="text-gray-500 text-sm mt-1">Handpicked experiences for you</p>
          </div>
          <Link to="/events" className="btn-secondary text-sm py-2.5 px-5">
            View All
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <Skeleton className="h-48 rounded-none" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 text-gray-600">
            <div className="text-5xl mb-4">🎪</div>
            <p>No upcoming events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {events.map((event, i) => (
              <EventCard key={event.event_id} event={event} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="py-16 max-w-7xl mx-auto px-4">
        <div className="relative card overflow-hidden p-10 md:p-16 text-center bg-gradient-to-br from-brand-900/40 via-dark-700 to-dark-700">
          <div className="absolute inset-0 bg-glow-radial opacity-30" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Organizing an Event?</h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Create and manage events, set pricing, track bookings, and grow your audience.
            </p>
            <Link to="/register?role=organizer" className="btn-primary inline-flex">
              Start for Free →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
