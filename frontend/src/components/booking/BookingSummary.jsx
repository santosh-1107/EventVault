import { format } from 'date-fns';
import { Spinner } from '../common';

export default function BookingSummary({ event, selectedSeats, seatDetails, onConfirm, loading }) {
  const totalAmount = selectedSeats.reduce((sum, seatId) => {
    const seat = seatDetails.find((s) => s.seat_id === seatId);
    return sum + (seat ? Number(seat.price) : 0);
  }, 0);

  const convenienceFee = Math.round(totalAmount * 0.02);
  const grandTotal = totalAmount + convenienceFee;

  const groupedBySection = selectedSeats.reduce((acc, seatId) => {
    const seat = seatDetails.find((s) => s.seat_id === seatId);
    if (!seat) return acc;
    const key = seat.section_name;
    if (!acc[key]) acc[key] = { seats: [], price: seat.price, section: key };
    acc[key].seats.push(seat.seat_label);
    return acc;
  }, {});

  return (
    <div className="card p-5 sticky top-24">
      <h3 className="font-display font-semibold text-lg mb-4">Order Summary</h3>

      {/* Event info */}
      {event && (
        <div className="mb-4 pb-4 border-b border-white/5">
          <p className="font-medium text-sm line-clamp-2 mb-1">{event.title}</p>
          <p className="text-xs text-gray-500">{format(new Date(event.start_datetime), 'EEE, d MMM yyyy · h:mm a')}</p>
          <p className="text-xs text-gray-500">{event.venue_name}</p>
        </div>
      )}

      {/* Selected seats */}
      <div className="space-y-3 mb-4">
        {selectedSeats.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">No seats selected</p>
        ) : (
          Object.values(groupedBySection).map(({ section, seats, price }) => (
            <div key={section} className="flex justify-between items-start text-sm">
              <div>
                <p className="font-medium text-gray-300">{section}</p>
                <p className="text-xs text-gray-500 font-mono">{seats.join(', ')}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{(Number(price) * seats.length).toLocaleString()}</p>
                <p className="text-xs text-gray-500">{seats.length} × ₹{Number(price).toLocaleString()}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSeats.length > 0 && (
        <>
          <div className="border-t border-white/5 pt-4 space-y-2 mb-4">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Subtotal ({selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''})</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Convenience fee (2%)</span>
              <span>₹{convenienceFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-white/5">
              <span>Total</span>
              <span className="gradient-text">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={() => onConfirm(grandTotal)}
            disabled={loading || selectedSeats.length === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Spinner size="sm" /> Processing...</>
            ) : (
              <>Confirm Booking</>
            )}
          </button>

          <p className="text-xs text-gray-600 text-center mt-3">
            🔒 Secured booking with instant confirmation
          </p>
        </>
      )}
    </div>
  );
}
