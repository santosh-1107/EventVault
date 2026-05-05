const pool = require('../db/pool');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class PaymentService {
  async processPayment(bookingId, userId, { payment_method, card_last4, upi_id }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // Verify booking belongs to user and is pending
      const [bookings] = await conn.query(
        `SELECT b.*, e.title, e.start_datetime, v.name AS venue_name
         FROM booking b
         JOIN event e ON b.event_id = e.event_id
         JOIN venue v ON e.venue_id = v.venue_id
         WHERE b.booking_id = ? AND b.user_id = ? FOR UPDATE`,
        [bookingId, userId]
      );

      if (!bookings.length) {
        await conn.rollback();
        const err = new Error('Booking not found');
        err.statusCode = 404;
        throw err;
      }

      const booking = bookings[0];
      if (booking.status !== 'pending') {
        await conn.rollback();
        const err = new Error(`Booking is already ${booking.status}`);
        err.statusCode = 400;
        throw err;
      }

      // Check if payment already exists
      const [existing] = await conn.query(
        "SELECT payment_id FROM payment WHERE booking_id = ? AND status = 'success'",
        [bookingId]
      );
      if (existing.length) {
        await conn.rollback();
        const err = new Error('Payment already completed');
        err.statusCode = 400;
        throw err;
      }

      // Simulate payment processing (in production, integrate with Razorpay/Stripe)
      const txnId = `TXN-${uuidv4().toUpperCase().slice(0, 12)}`;
      const paymentSuccess = true; // Simulated

      if (!paymentSuccess) {
        await conn.query(
          `INSERT INTO payment (booking_id, txn_id, amount, currency, payment_method,
           status, failure_reason, created_at)
           VALUES (?, ?, ?, ?, ?, 'failed', 'Payment declined', NOW())`,
          [bookingId, txnId, booking.total_amount, booking.currency, payment_method]
        );
        await conn.commit();
        const err = new Error('Payment failed');
        err.statusCode = 402;
        throw err;
      }

      // Generate QR code data
      const qrData = JSON.stringify({
        booking_ref: booking.booking_ref,
        event: booking.title,
        date: booking.start_datetime,
        venue: booking.venue_name,
        amount: booking.total_amount,
        txn_id: txnId,
      });

      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#000', light: '#fff' },
      });

      // Insert payment record
      const [payResult] = await conn.query(
        `INSERT INTO payment (booking_id, txn_id, amount, currency, payment_method,
         card_last4, upi_id, status, qr_code_url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'success', ?, NOW())`,
        [bookingId, txnId, booking.total_amount, booking.currency,
         payment_method, card_last4 || null, upi_id || null, qrCodeUrl]
      );

      // Update booking status to confirmed
      await conn.query(
        `UPDATE booking SET status = 'confirmed', updated_at = NOW() WHERE booking_id = ?`,
        [bookingId]
      );

      await conn.query(
        `INSERT INTO booking_status (booking_id, status, changed_at, notes)
         VALUES (?, 'confirmed', NOW(), 'Payment successful')`,
        [bookingId]
      );

      await conn.commit();

      return {
        payment_id: payResult.insertId,
        txn_id: txnId,
        amount: booking.total_amount,
        currency: booking.currency,
        status: 'success',
        qr_code_url: qrCodeUrl,
        booking_ref: booking.booking_ref,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getPaymentByBooking(bookingId, userId) {
    const [rows] = await pool.query(
      `SELECT p.*, b.booking_ref, b.user_id
       FROM payment p
       JOIN booking b ON p.booking_id = b.booking_id
       WHERE p.booking_id = ?`,
      [bookingId]
    );

    if (!rows.length) {
      const err = new Error('Payment not found');
      err.statusCode = 404;
      throw err;
    }

    if (rows[0].user_id !== userId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    return rows[0];
  }
}

module.exports = new PaymentService();
