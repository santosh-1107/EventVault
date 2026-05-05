import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import SeatMap from '../components/booking/SeatMap';
import BookingSummary from '../components/booking/BookingSummary';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

export default function SeatSelectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/events/${id}/seats`);
      return;
    }

    Promise.all([
      api.get(`/events/${id}`),
      api.get(`/events/${id}/seats`),
    ])
      .then(([evRes, seatsRes]) => {
        setEvent(evRes.data);
        setSections(seatsRes.data || []);
      })
      .catch((err) => {
        toast.error(err.message || 'Failed to load event');
        navigate(`/events/${id}`);
      })
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  // Flat list of all seat details for quick lookup
  const allSeatDetails = useMemo(() => {
    return sections.flatMap((s) => s.seats || []);
  }, [sections]);

  const handleSeatToggle = (seat) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.seat_id)) {
        return prev.filter((id) => id !== seat.seat_id);
      }
      return [...prev, seat.seat_id];
    });
  };

  const handleConfirmBooking = async () => {
    if (!selectedSeatIds.length) {
      toast.error('Please select at least one seat');
      return;
    }

    setBooking(true);
    try {
      const res = await api.post('/bookings', {
        event_id: parseInt(id),
        seat_ids: selectedSeatIds,
      });

      const bookingData = res.data;
      toast.success('Booking confirmed successfully!');
      
      // Real-time seat update: Immediately refetch seats to reflect new 'booked' status
      const seatsRes = await api.get(`/events/${id}/seats`);
      setSections(seatsRes.data || []);
      setSelectedSeatIds([]);

      // Redirect to confirmation screen
      navigate(`/booking-confirmation/${bookingData.booking_id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Spinner size="lg" className="text-brand-500" />
      </div>
    );
  }

  if (!event || sections.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 text-center px-4">
        <div>
          <div className="text-5xl mb-4">🎭</div>
          <h2 className="font-display font-bold text-2xl mb-2">No Seats Available</h2>
          <p className="text-gray-500 mb-6">Seat information hasn't been set up for this event yet</p>
          <button onClick={() => navigate(`/events/${id}`)} className="btn-secondary">
            ← Back to Event
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-dark-900">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 mb-3"
          >
            ← Back to event
          </button>
          <h1 className="font-display font-bold text-2xl md:text-3xl">{event.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {format(new Date(event.start_datetime), 'EEE, d MMM yyyy · h:mm a')} · {event.venue_name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-semibold text-lg">Select Your Seats</h2>
                {selectedSeatIds.length > 0 && (
                  <button
                    onClick={() => setSelectedSeatIds([])}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>
              <SeatMap
                sections={sections}
                selectedSeats={selectedSeatIds}
                onSeatToggle={handleSeatToggle}
              />
            </div>
          </div>

          {/* Summary */}
          <div>
            <BookingSummary
              event={event}
              selectedSeats={selectedSeatIds}
              seatDetails={allSeatDetails}
              onConfirm={handleConfirmBooking}
              loading={booking}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
