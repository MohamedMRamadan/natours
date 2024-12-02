import { Router } from 'express';

import {
  createTour,
  deleteTour,
  getAllTours,
  getTour,
  updateTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistances,
  resizeTourImgs,
} from '../controllers/tour.controller.js';
import { protect, restrictTo } from '../controllers/auth.controller.js';
import reviewRouter from './review.routes.js';
import { upload } from '../middlewares/multer.js';

// We create a router , but how we connect this router with our app ?
// toureRouter is actually a middleware so we can use :
const router = Router();
// this param middleware just belong to tour router as it is part of sub app
// router.param('id', checkId);
router.get('/tours-within/:distance/center/:latlng/unit/:unit', getToursWithin);
router.get('/distances/:latlng/unit/:unit', getDistances);
router.route('/top-5-cheap').get(aliasTopTours, getAllTours);
router.route('/tour-stats').get(getTourStats);

router
  .route('/')
  .get(getAllTours)
  .post(protect, restrictTo('lead-guide', 'admin'), createTour);
router
  .route('/monthly-plan/:year')
  .get(protect, restrictTo('lead-guide', 'admin', 'guide'), getMonthlyPlan);
router
  .route('/:id')
  .get(getTour)
  .patch(
    protect,
    restrictTo('lead-guide', 'admin'),
    upload.fields([
      {
        name: 'imageCover',
        maxCount: 1,
      },
      {
        name: 'images',
        maxCount: 3,
      },
    ]),
    resizeTourImgs,
    updateTour,
  )
  .delete(protect, restrictTo('lead-guide', 'admin'), deleteTour);
// Mounting a router / nested routes
//  NOTE: reviewRouter doesn't has access to tourId #SEE THE SOLVE IN review.routes
router.use('/:tourId/reviews', reviewRouter);

export default router;
