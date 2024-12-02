import { Router } from 'express';
import {
  getOverview,
  getTour,
  login,
  account,
  updateUserData,
  getMyBookings,
  alerts,
} from '../controllers/view.controller.js';
import { isLoggedin, protect } from '../controllers/auth.controller.js';
import { upload } from '../middlewares/multer.js';
import { resizeUserPhoto } from '../controllers/user.controller.js';

const router = Router();
router.use(alerts);
router.get('/', isLoggedin, getOverview);
router.get('/tours/:slug', isLoggedin, getTour);
router.get('/login', isLoggedin, login);
router.use(protect);
router.get('/me', account);
router.get('/me/bookings', getMyBookings);
router.post(
  '/submit-user-data',
  upload.single('photo'),
  resizeUserPhoto,
  updateUserData,
);

export default router;

// import { Router } from 'express';
// import {
//   getOverview,
//   getTour,
//   login,
//   account,
//   updateUserData,
//   getMyTours,
//   alerts,
// } from '../controllers/view.controller.js';
// import { isLoggedin, protect } from '../controllers/auth.controller.js';

// const router = Router();
// router.use(alerts);
// router.get('/', isLoggedin, getOverview);
// router.get('/tours/:slug', isLoggedin, getTour);
// router.get('/login', isLoggedin, login);
// router.get('/me', protect, account);
// router.get('/my-tours', protect, getMyTours);
// router.post('/submit-user-data', protect, updateUserData);

// export default router;
