import Booking from '../models/booking.model.js';
import Tour from '../models/tour.model.js';
import User from '../models/user.model.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const alerts = (req, res, next) => {
  const { alert } = req.query;

  if (alert === 'booking')
    res.locals.alert =
      "Your Booking was successfull! Please check your email for a confirmation. if your booking didn't show up immediately, please come back later.";

  next();
};

export const getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find();
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  });
});

export const getTour = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const tour = await Tour.findOne({ slug }).populate({
    path: 'reviews',
    select: 'review rating user',
  });
  if (!tour) return next(new AppError('There is no tour with this name', 404));

  res.status(200).render('tour', {
    title: `${tour.name} tour`,
    tour,
  });
});
export const getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });

  res.status(200).render('bookings', {
    title: 'My Bookings',
    bookings,
  });
});
export const login = catchAsync(async (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log Into you account 😁',
  });
});
export const account = catchAsync(async (req, res, next) => {
  res.status(200).render('account', {
    title: 'account',
  });
});
export const updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
      photo: req.file.filename,
    },
    {
      new: true,
      runValidators: true,
    },
  );
  res.status(200).render('account', {
    title: 'account',
    user: updatedUser,
  });
});
