import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { Spinner } from '../components/common';

export default function BookingConfirmationPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.bookingDetails || null);
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    if (!booking) {
      api.get(`/bookings/${bookingId}`)
        .then((res) => {
          setBooking(res.data);
          setPayment(res.data.payment);
        })
        .catch(() => navigate('/dashboard'))
        .finally(() => setLoading(false));
    }
  }, [bookingId]);

  const handlePrint = () => window.print();

  const handleDownload = () => {
    const content = `
EventVault — Booking Confirmation
==================================
Booking Ref: ${booking?.booking_ref}
Event: ${booking?.event_title}
Date: ${booking?.start_datetime ? format(new Date(booking.start_datetime), 'EEE, d MMM yyyy · h:mm a') : 'N/A'}
Venue: ${booking?.venue_name}${booking?.city ? `, ${booking.city}` : ''}

Seats:
${booking?.seats?.map(s => `  - ${s.section_name} · ${s.seat_label} (₹${Number(s.price).toLocaleString()})`).join('\n') || ''}

Total Paid: ₹${Number(booking?.total_amount).toLocaleString()}
Payment ID: ${payment?.txn_id || 'N/A'}
Status: CONFIRMED

Thank you for booking with EventVault!
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${booking?.booking_ref}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Spinner size="lg" className="text-brand-500" />
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center text-4xl mx-auto mb-4 animate-bounce-once">
            ✅
          </div>
          <h1 className="font-display font-bold text-3xl mb-2">Booking Confirmed!</h1>
          <p className="text-gray-400">Your tickets are ready. Have a great experience!</p>
        </div>

        {/* Ticket card */}
        <div className="card overflow-hidden print:shadow-none">
          {/* Ticket top */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-brand-200 text-xs uppercase tracking-widest mb-1">Booking Reference</p>
                <p className="font-mono font-bold text-2xl">{booking?.booking_ref}</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium">
                  CONFIRMED
                </span>
              </div>
            </div>
          </div>

          {/* Ticket perforation */}
          <div className="relative flex items-center mx-4">
            <div className="w-5 h-5 rounded-full bg-dark-900 -ml-9 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-white/10" />
            <div className="w-5 h-5 rounded-full bg-dark-900 -mr-9 shrink-0" />
          </div>

          {/* Ticket body */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-display font-bold text-xl mb-4">{booking?.event_title}</h2>

                <div className="space-y-3">
                  {[
                    {
                      icon: '📅',
                      label: 'Date & Time',
                      value: booking?.start_datetime
                        ? format(new Date(booking.start_datetime), 'EEE, d MMM yyyy')
                        : 'N/A',
                      sub: booking?.start_datetime
                        ? format(new Date(booking.start_datetime), 'h:mm a')
                        : '',
                    },
                    {
                      icon: '📍',
                      label: 'Venue',
                      value: booking?.venue_name,
                      sub: booking?.city,
                    },
                    {
                      icon: '💰',
                      label: 'Amount Paid',
                      value: `₹${Number(booking?.total_amount || 0).toLocaleString()}`,
                      sub: payment?.payment_method?.toUpperCase(),
                    },
                  ].map((item) => (
                    <div key={item.label} className="flex gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div>
                        <p className="text-xs text-gray-500">{item.label}</p>
                        <p className="text-sm font-medium">{item.value}</p>
                        {item.sub && <p className="text-xs text-gray-500">{item.sub}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seats */}
                {booking?.seats?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-gray-500 mb-2">Seats</p>
                    <div className="flex flex-wrap gap-2">
                      {booking.seats.map((seat, i) => (
                        <span key={i} className="badge bg-brand-500/15 text-brand-400 border border-brand-500/20">
                          {seat.section_name} · {seat.seat_label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center">
                {payment?.qr_code_url ? (
                  <>
                    <div className="bg-white p-3 rounded-xl">
                      <img src={payment.qr_code_url} alt="Booking QR" className="w-32 h-32" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Show this at entry
                    </p>
                  </>
                ) : (
                  <div className="bg-dark-600 p-6 rounded-xl text-center">
                    <div className="text-4xl mb-2">🎫</div>
                    <p className="text-xs text-gray-500">Ticket ID</p>
                    <p className="font-mono text-xs">{payment?.txn_id || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button onClick={handleDownload} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            📥 Download Ticket
          </button>
          <button onClick={handlePrint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            🖨️ Print
          </button>
          <Link to="/dashboard" className="btn-primary flex-1 text-center">
            My Bookings
          </Link>
        </div>
      </div>
    </div>
  );
}
