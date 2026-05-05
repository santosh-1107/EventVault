const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const paymentService = require('../services/paymentService');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { asyncHandler } = require('../middleware/errorHandler');

// POST /api/payments - Process payment
router.post(
  '/',
  authenticate,
  [
    body('booking_id').isInt().withMessage('Valid booking_id required'),
    body('payment_method')
      .isIn(['upi', 'card', 'netbanking', 'wallet'])
      .withMessage('Invalid payment method'),
    body('card_last4').optional().isLength({ min: 4, max: 4 }).withMessage('Last 4 digits required'),
    body('upi_id').optional().matches(/^[\w.-]+@[\w.-]+$/).withMessage('Invalid UPI ID'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const { booking_id, payment_method, card_last4, upi_id } = req.body;
    const payment = await paymentService.processPayment(
      booking_id, req.user.user_id, { payment_method, card_last4, upi_id }
    );
    res.status(201).json({ success: true, data: payment });
  })
);

// GET /api/payments/booking/:bookingId
router.get(
  '/booking/:bookingId',
  authenticate,
  asyncHandler(async (req, res) => {
    const payment = await paymentService.getPaymentByBooking(
      parseInt(req.params.bookingId), req.user.user_id
    );
    res.json({ success: true, data: payment });
  })
);

module.exports = router;
