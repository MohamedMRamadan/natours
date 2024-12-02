import sharp from 'sharp';

import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import * as factory from './handlerFactory.js';
import { filterObj } from '../utils/helper.js';

// Users Route Handeler / Users Controllers

export const resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) return next();
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);
  next();
});
export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        'This route is not for updating password, Please use /updateMyPassword instead!',
      ),
      400,
    );
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) filteredBody.photo = req.file.filename;
  // We can use findByIdAndUpdate as it better to use than save method in case of handling with un sensetive data
  const user = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true, // to let mongoose validate our document
  });
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});
// When user actually delete his account he actually set his activation to false
export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
export const getAllUsers = factory.getAll(User);
export const createUser = factory.createOne(User);
export const updateUser = factory.updateOne(User);
// when adminstrator delete a user he actually delete it from database
export const deleteUser = factory.deleteOne(User);
export const getUser = factory.getOne(User);
