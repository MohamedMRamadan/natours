import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReview,
  setToursUsersId,
  updateReview,
} from '../controllers/review.controller.js';
import { protect, restrictTo } from '../controllers/auth.controller.js';

// To solve the problem of not getting access to the tourId of the router in tour.routes
// with setting mergeParams to true we have access to the resource params of Mounted tour router with review router
const router = Router({ mergeParams: true });

router.use(protect);
router
  .route('/')
  .get(getAllReviews)
  .post(restrictTo('user'), setToursUsersId, createReview);
router
  .route('/:id')
  .get(getReview)
  .delete(restrictTo('user', 'admin'), deleteReview)
  .patch(restrictTo('user', 'admin'), updateReview);

export default router;
