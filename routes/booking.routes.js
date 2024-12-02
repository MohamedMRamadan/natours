import { Router } from 'express';
import { protect, restrictTo } from '../controllers/auth.controller.js';
import {
  getCheckoutSession,
  createBooking,
  getBooking,
  updateBooking,
  getAllBookings,
  deleteBooking,
} from '../controllers/booking.controller.js';

const router = Router();
router.use(protect);
router.get('/checkout-session/:tourId', getCheckoutSession);
router.use(restrictTo('admin', 'lead-guide'));
router.route('/').get(getAllBookings).post(createBooking);
router.route('/:id').get(getBooking).patch(updateBooking).delete(deleteBooking);

export default router;
