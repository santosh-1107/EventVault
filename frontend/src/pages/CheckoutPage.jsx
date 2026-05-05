import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/common';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'upi', label: 'UPI', icon: '📱', desc: 'Pay using any UPI app' },
  { id: 'card', label: 'Credit/Debit Card', icon: '💳', desc: 'Visa, Mastercard, RuPay' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦', desc: 'All major banks' },
  { id: 'wallet', label: 'Wallet', icon: '👜', desc: 'Paytm, PhonePe & more' },
];

export default function CheckoutPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [event, setEvent] = useState(location.state?.event || null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(!booking);
  const [processing, setProcessing] = useState(false);

  const [payMethod, setPayMethod] = useState('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  useEffect(() => {
    api.get(`/bookings/${bookingId}`)
      .then((res) => {
        setBookingDetails(res.data);
        if (!event) setEvent(res.data);
      })
      .catch((err) => {
        toast.error('Booking not found');
        navigate('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handlePayment = async (e) => {
    e.preventDefault();

    // Basic validation
    if (payMethod === 'upi' && !upiId.match(/^[\w.-]+@[\w.-]+$/)) {
      toast.error('Enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    if (payMethod === 'card') {
      if (cardNum.replace(/\s/g, '').length < 16) return toast.error('Enter valid card number');
      if (!cardExpiry) return toast.error('Enter expiry date');
      if (!cardCvv || cardCvv.length < 3) return toast.error('Enter valid CVV');
    }

    setProcessing(true);
    try {
      const payload = {
        booking_id: parseInt(bookingId),
        payment_method: payMethod,
        ...(payMethod === 'upi' && { upi_id: upiId }),
        ...(payMethod === 'card' && { card_last4: cardNum.slice(-4) }),
      };

      const res = await api.post('/payments', payload);
      const paymentData = res.data;

      toast.success('Payment successful! 🎉');
      navigate(`/booking-confirmation/${bookingId}`, {
        state: { payment: paymentData, bookingDetails },
      });
    } catch (err) {
      toast.error(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Spinner size="lg" className="text-brand-500" />
    </div>
  );

  const details = bookingDetails || booking;
  const totalAmount = details?.total_amount || 0;

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl">Complete Payment</h1>
          <p className="text-gray-500 text-sm mt-1">Booking #{details?.booking_ref}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Payment form */}
          <div className="md:col-span-2">
            <form onSubmit={handlePayment} className="space-y-4">
              {/* Payment method selector */}
              <div className="card p-5">
                <h2 className="font-display font-semibold mb-4">Payment Method</h2>
                <div className="grid grid-cols-2 gap-3">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPayMethod(method.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        payMethod === method.id
                          ? 'border-brand-500 bg-brand-500/10'
                          : 'border-white/10 hover:border-white/20 bg-dark-600'
                      }`}
                    >
                      <div className="text-xl mb-1">{method.icon}</div>
                      <div className="text-sm font-medium">{method.label}</div>
                      <div className="text-xs text-gray-500">{method.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* UPI form */}
              {payMethod === 'upi' && (
                <div className="card p-5 animate-fade-in">
                  <h3 className="font-semibold mb-4">UPI Details</h3>
                  <div>
                    <label className="label">UPI ID</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="yourname@upi"
                      className="input-field"
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1.5">Enter your UPI ID to complete payment</p>
                  </div>
                  <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-xs text-blue-400">
                      🔔 A payment request will be sent to your UPI app. This is a demo — no real payment will be processed.
                    </p>
                  </div>
                </div>
              )}

              {/* Card form */}
              {payMethod === 'card' && (
                <div className="card p-5 animate-fade-in">
                  <h3 className="font-semibold mb-4">Card Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="label">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Name on card"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Card Number</label>
                      <input
                        type="text"
                        value={cardNum}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          setCardNum(v.replace(/(\d{4})/g, '$1 ').trim());
                        }}
                        placeholder="1234 5678 9012 3456"
                        className="input-field font-mono"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setCardExpiry(v.length >= 3 ? v.slice(0,2) + '/' + v.slice(2) : v);
                          }}
                          placeholder="MM/YY"
                          className="input-field font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">CVV</label>
                        <input
                          type="password"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.slice(0, 4))}
                          placeholder="•••"
                          className="input-field font-mono"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Net banking / Wallet placeholders */}
              {(payMethod === 'netbanking' || payMethod === 'wallet') && (
                <div className="card p-5 animate-fade-in">
                  <div className="text-center py-6">
                    <div className="text-4xl mb-3">{PAYMENT_METHODS.find(m=>m.id===payMethod)?.icon}</div>
                    <p className="text-gray-400 text-sm">
                      In a real integration, you would be redirected to your {payMethod === 'netbanking' ? 'bank' : 'wallet'} portal.
                    </p>
                    <p className="text-xs text-gray-600 mt-2">This is a demo payment system.</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2"
              >
                {processing ? (
                  <><Spinner size="sm" /> Processing payment...</>
                ) : (
                  <>🔒 Pay ₹{Number(totalAmount).toLocaleString()}</>
                )}
              </button>

              <p className="text-xs text-gray-600 text-center">
                🛡️ Your payment information is encrypted and secure
              </p>
            </form>
          </div>

          {/* Order summary */}
          <div className="card p-5 h-fit sticky top-24">
            <h3 className="font-display font-semibold mb-4">Order Details</h3>
            
            {details && (
              <>
                <p className="font-medium text-sm mb-1">
                  {details.event_title || event?.title}
                </p>
                {(details.start_datetime || event?.start_datetime) && (
                  <p className="text-xs text-gray-500 mb-4">
                    {format(new Date(details.start_datetime || event.start_datetime), 'EEE, d MMM · h:mm a')}
                  </p>
                )}

                {/* Seats */}
                {details.seats?.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {details.seats.map((seat, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-gray-400">{seat.section_name} · {seat.seat_label}</span>
                        <span>₹{Number(seat.price).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-white/5 pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="gradient-text text-lg">₹{Number(totalAmount).toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
