const pool = require('../db/pool');

class EventService {
  async getEvents({ category, search, page = 1, limit = 12, upcoming = true } = {}) {
    let where = ['e.is_active = 1'];
    const params = [];

    if (upcoming) {
      where.push('e.start_datetime >= NOW()');
    }

    if (search) {
      where.push('(e.title LIKE ? OR e.description LIKE ? OR v.name LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }

    if (category) {
      where.push('ec.slug = ?');
      params.push(category);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countQuery = `
      SELECT COUNT(DISTINCT e.event_id) as total
      FROM event e
      LEFT JOIN venue v ON e.venue_id = v.venue_id
      LEFT JOIN event_category_map ecm ON e.event_id = ecm.event_id
      LEFT JOIN event_category ec ON ecm.category_id = ec.category_id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT
        e.event_id, e.title, e.description, e.start_datetime, e.end_datetime,
        e.poster_url, e.banner_url, e.status, e.total_seats, e.available_seats,
        v.name AS venue_name, v.city, v.state,
        MIN(es.price) AS min_price, MAX(es.price) AS max_price,
        GROUP_CONCAT(DISTINCT ec.name ORDER BY ec.name SEPARATOR ',') AS categories
      FROM event e
      LEFT JOIN venue v ON e.venue_id = v.venue_id
      LEFT JOIN event_category_map ecm ON e.event_id = ecm.event_id
      LEFT JOIN event_category ec ON ecm.category_id = ec.category_id
      LEFT JOIN event_seat es ON e.event_id = es.event_id
      ${whereClause}
      GROUP BY e.event_id
      ORDER BY e.start_datetime ASC
      LIMIT ? OFFSET ?
    `;

    const [countResult] = await pool.query(countQuery, params);
    const [events] = await pool.query(dataQuery, [...params, parseInt(limit), offset]);

    return {
      events,
      total: countResult[0].total,
      page: parseInt(page),
      totalPages: Math.ceil(countResult[0].total / limit),
    };
  }

  async getEventById(eventId) {
    const [events] = await pool.query(
      `SELECT
        e.*,
        v.name AS venue_name, v.address, v.city, v.state, v.country,
        v.capacity, v.latitude, v.longitude, v.image_url AS venue_image,
        u.name AS organizer_name, u.email AS organizer_email,
        GROUP_CONCAT(DISTINCT ec.name ORDER BY ec.name SEPARATOR ',') AS categories
       FROM event e
       LEFT JOIN venue v ON e.venue_id = v.venue_id
       LEFT JOIN user u ON e.organizer_id = u.user_id
       LEFT JOIN event_category_map ecm ON e.event_id = ecm.event_id
       LEFT JOIN event_category ec ON ecm.category_id = ec.category_id
       WHERE e.event_id = ? AND e.is_active = 1
       GROUP BY e.event_id`,
      [eventId]
    );

    if (!events.length) {
      const err = new Error('Event not found');
      err.statusCode = 404;
      throw err;
    }

    return events[0];
  }

  async getEventSeats(eventId) {
    const [rows] = await pool.query(
      `SELECT
         vs.section_id,
         vs.name AS section_name,
         vs.section_type,
         s.seat_id,
         s.row_label,
         s.col_number,
         s.seat_label,
         es.event_seat_id,
         es.price,
         es.currency,
         LOWER(es.status) AS status,
         CASE
           WHEN es.status <> 'available' OR bs.event_seat_id IS NOT NULL THEN 'booked'
           ELSE 'available'
         END AS seat_status
       FROM event_seat es
       JOIN seat s ON es.seat_id = s.seat_id
       JOIN venue_section vs ON s.section_id = vs.section_id
       LEFT JOIN booking_seat bs ON es.event_seat_id = bs.event_seat_id
       WHERE es.event_id = ?
       ORDER BY vs.name, s.row_label, s.col_number`,
      [eventId]
    );

    const sections = {};
    for (const row of rows) {
      if (!sections[row.section_id]) {
        sections[row.section_id] = {
          section_id: row.section_id,
          section_name: row.section_name,
          section_type: row.section_type,
          seats: [],
        };
      }

      sections[row.section_id].seats.push({
        seat_id: row.seat_id,
        row_label: row.row_label,
        col_number: row.col_number,
        seat_label: row.seat_label,
        event_seat_id: row.event_seat_id,
        price: row.price,
        currency: row.currency,
        status: row.status,
        seat_status: row.seat_status,
      });
    }

    return Object.values(sections);
  }

  async getCategories() {
    const [rows] = await pool.query(
      'SELECT category_id, name, slug, description, icon_url FROM event_category WHERE is_active = 1 ORDER BY name'
    );
    return rows;
  }

  async createEvent(data, organizerId) {
    const {
      title, description, start_datetime, end_datetime,
      venue_id, poster_url, banner_url, total_seats, category_ids = [],
    } = data;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO event
         (title, description, start_datetime, end_datetime, venue_id, organizer_id,
          poster_url, banner_url, total_seats, available_seats, status, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', 1, NOW())`,
        [title, description, start_datetime, end_datetime, venue_id, organizerId,
         poster_url || null, banner_url || null, total_seats, total_seats]
      );

      const eventId = result.insertId;

      if (category_ids.length) {
        const catValues = category_ids.map((cid) => [eventId, cid]);
        await conn.query('INSERT INTO event_category_map (event_id, category_id) VALUES ?', [catValues]);
      }

      await conn.commit();
      return eventId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async updateEvent(eventId, data, organizerId) {
    const [existing] = await pool.query(
      'SELECT event_id FROM event WHERE event_id = ? AND organizer_id = ?',
      [eventId, organizerId]
    );
    if (!existing.length) {
      const err = new Error('Event not found or access denied');
      err.statusCode = 403;
      throw err;
    }

    const allowed = ['title', 'description', 'start_datetime', 'end_datetime',
                     'poster_url', 'banner_url', 'status'];
    const updates = [];
    const vals = [];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        vals.push(data[key]);
      }
    }

    if (updates.length) {
      await pool.query(
        `UPDATE event SET ${updates.join(', ')}, updated_at = NOW() WHERE event_id = ?`,
        [...vals, eventId]
      );
    }

    return this.getEventById(eventId);
  }

  async setEventSeatPrices(eventId, sectionId, price, organizerId) {
    const [event] = await pool.query(
      'SELECT event_id FROM event WHERE event_id = ? AND organizer_id = ?',
      [eventId, organizerId]
    );
    if (!event.length) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    await pool.query(
      `UPDATE event_seat es
       JOIN seat s ON es.seat_id = s.seat_id
       SET es.price = ?, es.updated_at = NOW()
       WHERE es.event_id = ? AND s.section_id = ?`,
      [price, eventId, sectionId]
    );
  }

  async getOrganizerEvents(organizerId) {
    const [rows] = await pool.query(
      `SELECT e.*, MAX(v.name) AS venue_name, MAX(v.city) AS city,
              COUNT(DISTINCT b.booking_id) AS booking_count,
              COALESCE(SUM(p.amount), 0) AS total_revenue
       FROM event e
       LEFT JOIN venue v ON e.venue_id = v.venue_id
       LEFT JOIN booking b ON e.event_id = b.event_id AND b.status != 'cancelled'
       LEFT JOIN (
           SELECT booking_id, MAX(amount) AS amount FROM payment WHERE status = 'success' GROUP BY booking_id
       ) p ON b.booking_id = p.booking_id
       WHERE e.organizer_id = ? AND e.is_active = 1
       GROUP BY e.event_id
       ORDER BY e.created_at DESC`,
      [organizerId]
    );
    return rows;
  }

  async getEventBookings(eventId, organizerId) {
    const [event] = await pool.query(
      'SELECT event_id FROM event WHERE event_id = ? AND organizer_id = ?',
      [eventId, organizerId]
    );
    if (!event.length) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    const [rows] = await pool.query(
      `SELECT b.booking_id, b.booking_ref, b.status, b.total_amount, b.created_at,
              MAX(u.name) AS customer_name, MAX(u.email) AS customer_email,
              COUNT(bs.seat_id) AS seat_count,
              GROUP_CONCAT(s.seat_label SEPARATOR ', ') AS seats,
              MAX(p.status) AS payment_status, MAX(p.payment_method) AS payment_method
       FROM booking b
       JOIN user u ON b.user_id = u.user_id
       LEFT JOIN booking_seat bs ON b.booking_id = bs.booking_id
       LEFT JOIN seat s ON bs.seat_id = s.seat_id
       LEFT JOIN payment p ON b.booking_id = p.booking_id
       WHERE b.event_id = ?
       GROUP BY b.booking_id
       ORDER BY b.created_at DESC`,
      [eventId]
    );
    return rows;
  }

  async getVenues() {
    const [rows] = await pool.query(
      'SELECT venue_id, name, address, city, state, country, capacity FROM venue ORDER BY name'
    );
    return rows;
  }

  async createEventSeats(eventId, sectionId, price, organizerId) {
    const [event] = await pool.query(
      'SELECT event_id, venue_id FROM event WHERE event_id = ? AND organizer_id = ?',
      [eventId, organizerId]
    );
    if (!event.length) {
      const err = new Error('Access denied');
      err.statusCode = 403;
      throw err;
    }

    // Get all seats for the section
    const [seats] = await pool.query(
      'SELECT seat_id FROM seat WHERE section_id = ?',
      [sectionId]
    );

    if (!seats.length) {
      const err = new Error('No seats found for this section');
      err.statusCode = 400;
      throw err;
    }

    const values = seats.map((s) => [eventId, s.seat_id, price, 'INR', 'available']);
    await pool.query(
      `INSERT IGNORE INTO event_seat (event_id, seat_id, price, currency, status, created_at)
       VALUES ? `,
      [values.map((v) => [...v, new Date()])]
    );
  }
}

module.exports = new EventService();




