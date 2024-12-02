import { Router } from 'express';

import {
  createUser,
  deleteMe,
  deleteUser,
  getAllUsers,
  getUser,
  resizeUserPhoto,
  updateMe,
  updateUser,
} from '../controllers/user.controller.js';
import {
  login,
  protect,
  signup,
  restrictTo,
  resetPassword,
  forgotPassword,
  updatePassword,
  logout,
} from '../controllers/auth.controller.js';
import { getgMe } from '../controllers/tour.controller.js';
import { upload } from '../middlewares/multer.js';

const router = Router();

router.post('/signup', signup);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);
router.post('/login', login);
router.get('/logout', logout);

// as router is sub app and a middleware so it has access to use method which in turn accept middleware
// also middleware runs in sequence, so protect middleware will be applied to all routes under it's defination
// as protect middleware is the next middleware in the middlewares stack
router.use(protect);

router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', upload.single('photo'), resizeUserPhoto, updateMe);
router.delete('/deleteMe', deleteMe);
router.get('/me', getgMe, getUser);

router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
