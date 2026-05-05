const express = require('express');
const { body, query, param } = require('express-validator');
const router = express.Router();
const eventService = require('../services/eventService');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/events - List events with search/filter
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { category, search, page, limit, upcoming } = req.query;
    const result = await eventService.getEvents({
      category, search,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 12,
      upcoming: upcoming !== 'false',
    });
    res.json({ success: true, data: result });
  })
);

// GET /api/events/categories
router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    const categories = await eventService.getCategories();
    res.json({ success: true, data: categories });
  })
);

// GET /api/events/venues
router.get(
  '/venues',
  asyncHandler(async (req, res) => {
    const venues = await eventService.getVenues();
    res.json({ success: true, data: venues });
  })
);

// GET /api/events/organizer/my-events
router.get(
  '/organizer/my-events',
  authenticate,
  requireRole('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const events = await eventService.getOrganizerEvents(req.user.user_id);
    res.json({ success: true, data: events });
  })
);

// GET /api/events/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const eventId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const event = await eventService.getEventById(eventId);
    res.json({ success: true, data: event });
  })
);

// GET /api/events/:id/seats
router.get(
  '/:id/seats',
  asyncHandler(async (req, res) => {
    const eventId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event id' });
    }
    const seats = await eventService.getEventSeats(eventId);
    res.json({ success: true, data: seats });
  })
);

// POST /api/events - Create event (organizer only)
router.post(
  '/',
  authenticate,
  requireRole('organizer', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('start_datetime').isISO8601().withMessage('Valid start datetime required'),
    body('end_datetime').isISO8601().withMessage('Valid end datetime required'),
    body('venue_id').isInt().withMessage('Valid venue_id required'),
    body('total_seats').isInt({ min: 1 }).withMessage('total_seats must be a positive integer'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const eventId = await eventService.createEvent(req.body, req.user.user_id);
    res.status(201).json({ success: true, message: 'Event created', data: { event_id: eventId } });
  })
);

// PUT /api/events/:id - Update event
router.put(
  '/:id',
  authenticate,
  requireRole('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const event = await eventService.updateEvent(
      parseInt(req.params.id), req.body, req.user.user_id
    );
    res.json({ success: true, data: event });
  })
);

// PUT /api/events/:id/sections/:sectionId/price - Set seat prices
router.put(
  '/:id/sections/:sectionId/price',
  authenticate,
  requireRole('organizer', 'admin'),
  [body('price').isFloat({ min: 0 }).withMessage('Valid price required')],
  validate,
  asyncHandler(async (req, res) => {
    await eventService.setEventSeatPrices(
      parseInt(req.params.id),
      parseInt(req.params.sectionId),
      parseFloat(req.body.price),
      req.user.user_id
    );
    res.json({ success: true, message: 'Prices updated' });
  })
);

// GET /api/events/:id/bookings (organizer view)
router.get(
  '/:id/bookings',
  authenticate,
  requireRole('organizer', 'admin'),
  asyncHandler(async (req, res) => {
    const bookings = await eventService.getEventBookings(
      parseInt(req.params.id), req.user.user_id
    );
    res.json({ success: true, data: bookings });
  })
);

module.exports = router;
