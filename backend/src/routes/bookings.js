const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const bookingService = require('../services/bookingService');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/bookings - Create booking
router.post(
  '/',
  authenticate,
  [
    body('event_id').isInt().withMessage('Valid event_id required'),
    body('seat_ids').isArray({ min: 1 }).withMessage('At least one seat required'),
    body('seat_ids.*').isInt().withMessage('Seat IDs must be integers'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { event_id, seat_ids } = req.body;
    const booking = await bookingService.createBooking(req.user.user_id, event_id, seat_ids);
    res.status(201).json({ success: true, data: booking });
  })
);

// GET /api/bookings - Current User's bookings
router.get(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const bookings = await bookingService.getUserBookings(req.user.user_id);
    res.json({ success: true, data: bookings });
  })
);

// GET /api/bookings/user/:userId - Specific User's bookings
router.get(
  '/user/:userId',
  authenticate,
  asyncHandler(async (req, res) => {
    // Allows admin or the user themselves to fetch the bookings
    if (req.user.role !== 'admin' && req.user.user_id !== parseInt(req.params.userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    const bookings = await bookingService.getUserBookings(parseInt(req.params.userId));
    res.json({ success: true, data: bookings });
  })
);

// GET /api/bookings/:id
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const booking = await bookingService.getBookingById(
      parseInt(req.params.id), req.user.user_id
    );
    res.json({ success: true, data: booking });
  })
);

// DELETE /api/bookings/:id - Cancel booking
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    await bookingService.cancelBooking(parseInt(req.params.id), req.user.user_id);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  })
);

module.exports = router;
