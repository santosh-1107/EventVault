import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge, EmptyState, Modal } from '../components/common';
import toast from 'react-hot-toast';

const TABS = ['events', 'create', 'bookings'];

export default function OrganizerPage() {
  const { user, isAuthenticated, isOrganizer } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventBookings, setEventBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isOrganizer) { navigate('/'); toast.error('Organizer access required'); return; }
    loadData();
  }, [isAuthenticated, isOrganizer]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [evRes, venRes, catRes] = await Promise.all([
        api.get('/events/organizer/my-events'),
        api.get('/events/venues'),
        api.get('/events/categories'),
      ]);
      setEvents(evRes.data || []);
      setVenues(venRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEventBookings = async (eventId) => {
    setBookingsLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/bookings`);
      setEventBookings(res.data || []);
    } catch (err) {
      toast.error('Failed to load bookings');
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
    setTab('bookings');
    loadEventBookings(event.event_id);
  };

  const totalRevenue = events.reduce((s, e) => s + Number(e.total_revenue || 0), 0);
  const totalBookings = events.reduce((s, e) => s + Number(e.booking_count || 0), 0);

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-bold text-3xl">Organizer Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Manage your events and track performance</p>
          </div>
          <button
            onClick={() => setTab('create')}
            className="btn-primary flex items-center gap-2"
          >
            + Create Event
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Events', value: events.length, icon: '🎪' },
            { label: 'Total Bookings', value: totalBookings, icon: '🎫' },
            { label: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: '💰' },
            { label: 'Active Events', value: events.filter(e => e.status === 'published').length, icon: '✅' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="card p-4 text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="font-display font-bold text-xl">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-dark-700 border border-white/5 rounded-xl p-1 mb-6 w-fit">
          {[['events', 'My Events'], ['create', 'Create Event'], ['bookings', 'Bookings']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === val ? 'bg-brand-500 text-white shadow-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'events' && (
          <EventsList
            events={events}
            loading={loading}
            onSelect={handleSelectEvent}
            onRefresh={loadData}
          />
        )}
        {tab === 'create' && (
          <CreateEventForm
            venues={venues}
            categories={categories}
            onSuccess={() => { setTab('events'); loadData(); }}
          />
        )}
        {tab === 'bookings' && (
          <BookingsList
            events={events}
            selectedEvent={selectedEvent}
            bookings={eventBookings}
            loading={bookingsLoading}
            onSelectEvent={(e) => { setSelectedEvent(e); loadEventBookings(e.event_id); }}
          />
        )}
      </div>
    </div>
  );
}

function EventsList({ events, loading, onSelect, onRefresh }) {
  const [updating, setUpdating] = useState(null);

  const handleStatusChange = async (event, status) => {
    setUpdating(event.event_id);
    try {
      await api.put(`/events/${event.event_id}`, { status });
      toast.success(`Event ${status}`);
      onRefresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" className="text-brand-500" /></div>;

  if (!events.length) return (
    <EmptyState
      icon="🎪"
      title="No events yet"
      description="Create your first event to get started"
    />
  );

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.event_id} className="card p-5 hover:border-white/15 transition-all">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display font-semibold">{event.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {event.start_datetime ? format(new Date(event.start_datetime), 'EEE, d MMM yyyy') : 'TBD'}
                    {' · '}{event.venue_name}{event.city ? `, ${event.city}` : ''}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </div>

              <div className="flex flex-wrap gap-6 mt-3 text-sm">
                <span className="text-gray-400">🎫 {event.booking_count || 0} bookings</span>
                <span className="text-gray-400">💰 ₹{Number(event.total_revenue || 0).toLocaleString()}</span>
                <span className="text-gray-400">🪑 {event.available_seats}/{event.total_seats} available</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => onSelect(event)}
                className="btn-ghost text-xs py-1.5 px-3"
              >
                View Bookings
              </button>
              {event.status === 'draft' && (
                <button
                  onClick={() => handleStatusChange(event, 'published')}
                  disabled={updating === event.event_id}
                  className="btn-primary text-xs py-1.5 px-3"
                >
                  Publish
                </button>
              )}
              {event.status === 'published' && (
                <button
                  onClick={() => handleStatusChange(event, 'cancelled')}
                  disabled={updating === event.event_id}
                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  Cancel Event
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CreateEventForm({ venues, categories, onSuccess }) {
  const [form, setForm] = useState({
    title: '', description: '', start_datetime: '', end_datetime: '',
    venue_id: '', total_seats: '', poster_url: '', category_ids: [],
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const toggleCategory = (id) => {
    set('category_ids',
      form.category_ids.includes(id)
        ? form.category_ids.filter((c) => c !== id)
        : [...form.category_ids, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.start_datetime || !form.venue_id || !form.total_seats) {
      return toast.error('Please fill all required fields');
    }
    setSubmitting(true);
    try {
      await api.post('/events', {
        ...form,
        venue_id: parseInt(form.venue_id),
        total_seats: parseInt(form.total_seats),
      });
      toast.success('Event created successfully!');
      onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-6 max-w-2xl">
      <h2 className="font-display font-semibold text-xl mb-6">Create New Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Event Title *</label>
          <input value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Enter event title" className="input-field" required />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
            placeholder="Describe your event..." rows={4} className="input-field resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Date & Time *</label>
            <input type="datetime-local" value={form.start_datetime}
              onChange={(e) => set('start_datetime', e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="label">End Date & Time *</label>
            <input type="datetime-local" value={form.end_datetime}
              onChange={(e) => set('end_datetime', e.target.value)} className="input-field" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Venue *</label>
            <select value={form.venue_id} onChange={(e) => set('venue_id', e.target.value)}
              className="input-field" required>
              <option value="">Select venue</option>
              {venues.map((v) => (
                <option key={v.venue_id} value={v.venue_id}>
                  {v.name} – {v.city}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Total Seats *</label>
            <input type="number" value={form.total_seats} min={1}
              onChange={(e) => set('total_seats', e.target.value)} placeholder="e.g. 500"
              className="input-field" required />
          </div>
        </div>

        <div>
          <label className="label">Poster URL</label>
          <input value={form.poster_url} onChange={(e) => set('poster_url', e.target.value)}
            placeholder="https://..." className="input-field" />
        </div>

        {categories.length > 0 && (
          <div>
            <label className="label">Categories</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {categories.map((cat) => (
                <button key={cat.category_id} type="button"
                  onClick={() => toggleCategory(cat.category_id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    form.category_ids.includes(cat.category_id)
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-400'
                      : 'bg-dark-600 border-white/10 text-gray-400 hover:border-white/20'
                  }`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <button type="submit" disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2">
            {submitting ? <><Spinner size="sm" /> Creating...</> : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}

function BookingsList({ events, selectedEvent, bookings, loading, onSelectEvent }) {
  return (
    <div className="space-y-6">
      <div className="card p-4">
        <label className="label">Select Event</label>
        <select
          value={selectedEvent?.event_id || ''}
          onChange={(e) => {
            const ev = events.find((ev) => ev.event_id === parseInt(e.target.value));
            if (ev) onSelectEvent(ev);
          }}
          className="input-field"
        >
          <option value="">Choose an event to view bookings</option>
          {events.map((ev) => (
            <option key={ev.event_id} value={ev.event_id}>{ev.title}</option>
          ))}
        </select>
      </div>

      {selectedEvent && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">{selectedEvent.title} — Bookings</h3>
            <span className="text-sm text-gray-500">{bookings.length} total</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="lg" className="text-brand-500" /></div>
          ) : bookings.length === 0 ? (
            <EmptyState icon="🎫" title="No bookings yet" description="Bookings will appear here once customers start purchasing" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Reference', 'Customer', 'Seats', 'Amount', 'Payment', 'Status', 'Date'].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map((b) => (
                    <tr key={b.booking_id} className="hover:bg-white/2 transition-colors">
                      <td className="py-3 px-3 font-mono text-xs text-brand-400">{b.booking_ref}</td>
                      <td className="py-3 px-3">
                        <div className="font-medium">{b.customer_name}</div>
                        <div className="text-xs text-gray-500">{b.customer_email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-300">{b.seat_count} {b.seat_count === 1 ? 'seat' : 'seats'}</div>
                        {b.seats && <div className="text-xs text-gray-500 mt-0.5 max-w-[120px] truncate" title={b.seats}>{b.seats}</div>}
                      </td>
                      <td className="py-3 px-3 font-semibold">₹{Number(b.total_amount).toLocaleString()}</td>
                      <td className="py-3 px-3">
                        <StatusBadge status={b.payment_status || 'pending'} />
                      </td>
                      <td className="py-3 px-3"><StatusBadge status={b.status} /></td>
                      <td className="py-3 px-3 text-xs text-gray-500">
                        {format(new Date(b.created_at), 'd MMM, h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
