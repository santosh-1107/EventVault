const pool = require('../db/pool');
const { v4: uuidv4 } = require('uuid');

class BookingService {
  async createBooking(userId, eventId, seatIds) {
    if (!seatIds || !seatIds.length) {
      const err = new Error('No seats selected');
      err.statusCode = 400;
      throw err;
    }
    if (seatIds.length > 10) {
      const err = new Error('Cannot book more than 10 seats at once');
      err.statusCode = 400;
      throw err;
    }

    const conn = await pool.getConnection();
    try {
      // =========================================================================
      // DBMS CONCEPT: TRANSACTIONS (ACID Properties - Atomicity, Consistency)
      // =========================================================================
      // Start a transaction to ensure that the booking, seats, and payment 
      // are all inserted successfully. If any step fails, we rollback everything.
      await conn.beginTransaction();

      // =========================================================================
      // DBMS CONCEPT: CONCURRENCY CONTROL (Isolation)
      // =========================================================================
      // SELECT ... FOR UPDATE applies a row-level lock on the selected event_seats.
      // If two users try to book the same seat at the exact same time, the second 
      // transaction will wait until this one commits or rolls back, preventing 
      // race conditions and double-booking.
      const placeholders = seatIds.map(() => '?').join(',');
      const [eventSeats] = await conn.query(
        `SELECT es.event_seat_id, es.seat_id, es.price, es.currency, es.status,
                s.seat_label, s.row_label, s.col_number,
                vs.name AS section_name, vs.section_id
         FROM event_seat es
         JOIN seat s ON es.seat_id = s.seat_id
         JOIN venue_section vs ON s.section_id = vs.section_id
         WHERE es.event_id = ? AND es.seat_id IN (${placeholders})
         FOR UPDATE`,
        [eventId, ...seatIds]
      );

      if (eventSeats.length !== seatIds.length) {
        await conn.rollback();
        const err = new Error('One or more seats not found for this event');
        err.statusCode = 400;
        throw err;
      }

      // Verify that none of the seats are already booked
      const unavailable = eventSeats.filter((s) => s.status !== 'available');
      if (unavailable.length) {
        await conn.rollback();
        const err = new Error('Seat already booked. Please select different seats.');
        err.statusCode = 409;
        throw err;
      }

      // =========================================================================
      // DBMS CONCEPT: DATA CONSISTENCY CHECK
      // =========================================================================
      // A unique constraint (UNIQUE KEY uq_event_seat_id) was added to booking_seat
      // to strictly enforce data consistency so no duplicate event_seat_id can exist.
      // We can also double-check here manually:
      const eventSeatIds = eventSeats.map(es => es.event_seat_id);
      const [existingBookings] = await conn.query(
        `SELECT event_seat_id FROM booking_seat 
         WHERE event_seat_id IN (${eventSeatIds.map(() => '?').join(',')})
         FOR UPDATE`,
         eventSeatIds
      );

      if (existingBookings.length > 0) {
        await conn.rollback();
        const err = new Error('Seat already booked. Please select different seats.');
        err.statusCode = 409;
        throw err;
      }

      const totalAmount = eventSeats.reduce((sum, s) => sum + parseFloat(s.price), 0);
      const bookingRef = `TKT-${uuidv4().toUpperCase().slice(0, 8)}`;

      // 1. Insert into booking
      const [bookingResult] = await conn.query(
        `INSERT INTO booking
         (user_id, event_id, booking_ref, total_amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'confirmed', NOW())`,
        [userId, eventId, bookingRef, totalAmount, eventSeats[0].currency]
      );
      const bookingId = bookingResult.insertId;

      // 2. Insert into booking_seat (Relational Mapping & Foreign Keys applied here)
      const bsValues = eventSeats.map((s) => [
        bookingId, s.seat_id, s.event_seat_id, s.price, new Date()
      ]);
      await conn.query(
        'INSERT INTO booking_seat (booking_id, seat_id, event_seat_id, price, created_at) VALUES ?',
        [bsValues]
      );

      // 3. Mark event_seat as booked
      await conn.query(
        `UPDATE event_seat SET status = 'booked', updated_at = NOW()
         WHERE event_id = ? AND seat_id IN (${placeholders})`,
        [eventId, ...seatIds]
      );

      // 4. Update available_seats count on the main event table
      await conn.query(
        `UPDATE event SET available_seats = available_seats - ? WHERE event_id = ?`,
        [seatIds.length, eventId]
      );

      // 5. Insert initial booking_status log
      await conn.query(
        `INSERT INTO booking_status (booking_id, status, changed_at, notes)
         VALUES (?, 'confirmed', NOW(), 'Booking created and confirmed automatically')`,
        [bookingId]
      );

      // 6. Insert Mock Payment to demonstrate cross-table insertions in the transaction
      const txnId = `TXN-${uuidv4().toUpperCase().slice(0, 10)}`;
      await conn.query(
        `INSERT INTO payment (booking_id, txn_id, amount, currency, payment_method, status, created_at)
         VALUES (?, ?, ?, ?, 'card', 'success', NOW())`,
        [bookingId, txnId, totalAmount, eventSeats[0].currency]
      );

      // =========================================================================
      // DBMS CONCEPT: COMMIT
      // =========================================================================
      // Everything succeeded! We commit all operations permanently to the DB.
      await conn.commit();

      return {
        booking_id: bookingId,
        booking_ref: bookingRef,
        total_amount: totalAmount,
        currency: eventSeats[0].currency,
        seats: eventSeats,
        status: 'confirmed',
      };
    } catch (err) {
      // =========================================================================
      // DBMS CONCEPT: ROLLBACK
      // =========================================================================
      // If a seat was already booked, or any error occurred, discard everything.
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async getBookingById(bookingId, userId) {
    const [bookings] = await pool.query(
      `SELECT b.*, e.title AS event_title, e.start_datetime, e.end_datetime,
              e.poster_url, v.name AS venue_name, v.address, v.city,
              u.name AS customer_name, u.email AS customer_email
       FROM booking b
       JOIN event e ON b.event_id = e.event_id
       JOIN venue v ON e.venue_id = v.venue_id
       JOIN user u ON b.user_id = u.user_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    if (!bookings.length) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      throw err;
    }

    const booking = bookings[0];
    if (userId && booking.user_id !== userId) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    const [seats] = await pool.query(
      `SELECT bs.price, s.seat_label, s.row_label, s.col_number,
              vs.name AS section_name, vs.section_type
       FROM booking_seat bs
       JOIN seat s ON bs.seat_id = s.seat_id
       JOIN venue_section vs ON s.section_id = vs.section_id
       WHERE bs.booking_id = ?`,
      [bookingId]
    );

    const [payment] = await pool.query(
      'SELECT * FROM payment WHERE booking_id = ? ORDER BY created_at DESC LIMIT 1',
      [bookingId]
    );

    const [statusHistory] = await pool.query(
      'SELECT * FROM booking_status WHERE booking_id = ? ORDER BY changed_at ASC',
      [bookingId]
    );

    return { ...booking, seats, payment: payment[0] || null, statusHistory };
  }

  async getUserBookings(userId) {
    // =========================================================================
    // DBMS CONCEPT: JOINS
    // =========================================================================
    // Join multiple tables to create a comprehensive view of the booking logs.
    const [bookings] = await pool.query(
      `SELECT b.booking_id, b.booking_ref, b.status, b.total_amount, b.currency, b.created_at AS booking_time,
              MAX(e.title) AS event_title, MAX(e.start_datetime) AS start_datetime, MAX(e.poster_url) AS poster_url,
              MAX(v.name) AS venue_name, MAX(v.city) AS city,
              COUNT(bs.seat_id) AS seat_count,
              GROUP_CONCAT(s.seat_label SEPARATOR ', ') AS seats,
              MAX(p.status) AS payment_status, MAX(p.payment_method) AS payment_method
       FROM booking b
       JOIN event e ON b.event_id = e.event_id
       JOIN venue v ON e.venue_id = v.venue_id
       LEFT JOIN booking_seat bs ON b.booking_id = bs.booking_id
       LEFT JOIN seat s ON bs.seat_id = s.seat_id
       LEFT JOIN payment p ON b.booking_id = p.booking_id
       WHERE b.user_id = ?
       GROUP BY b.booking_id
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return bookings;
  }

  async cancelBooking(bookingId, userId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [bookings] = await conn.query(
        'SELECT * FROM booking WHERE booking_id = ? AND user_id = ? FOR UPDATE',
        [bookingId, userId]
      );

      if (!bookings.length) {
        await conn.rollback();
        const err = new Error('Booking not found');
        err.statusCode = 404;
        throw err;
      }

      const booking = bookings[0];
      if (booking.status === 'cancelled') {
        await conn.rollback();
        const err = new Error('Booking already cancelled');
        err.statusCode = 400;
        throw err;
      }

      // Release seats
      const [bseats] = await conn.query(
        'SELECT event_seat_id FROM booking_seat WHERE booking_id = ?',
        [bookingId]
      );

      if (bseats.length) {
        const esIds = bseats.map((b) => b.event_seat_id);
        await conn.query(
          `UPDATE event_seat SET status = 'available', updated_at = NOW()
           WHERE event_seat_id IN (${esIds.map(() => '?').join(',')})`,
          esIds
        );
      }

      // To respect the UNIQUE(event_seat_id) constraint in booking_seat, we must
      // delete the booking_seat records so these seats can be booked again.
      await conn.query('DELETE FROM booking_seat WHERE booking_id = ?', [bookingId]);

      // Update booking status
      await conn.query(
        `UPDATE booking SET status = 'cancelled', updated_at = NOW() WHERE booking_id = ?`,
        [bookingId]
      );

      await conn.query(
        `UPDATE event SET available_seats = available_seats + ? WHERE event_id = ?`,
        [bseats.length, booking.event_id]
      );

      await conn.query(
        `INSERT INTO booking_status (booking_id, status, changed_at, notes)
         VALUES (?, 'cancelled', NOW(), 'Cancelled by user')`,
        [bookingId]
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = new BookingService();
