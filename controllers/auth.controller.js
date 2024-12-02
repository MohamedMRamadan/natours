import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user.model.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import Email from '../utils/email.js';

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRETKEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
export const createSendToken = (req, res, user, statusCode) => {
  const token = signToken(user._id);
  user.password = undefined;

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    /* secure: true, */ // .HTTPS الكوكي دي مش هتتبعت إلا لو الاتصال بين السيرفر والعميل مشفّر باستخدام
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
    httpOnly: true, // cookie cannot be accessed or modified in any way by the browser, importent to prevent CROSS-SITE SCRIPTING (XSS) ATTACKS
    //   سواء (كودك الخاص أو كود ضار) من الوصول للكوكيز JavaScript تمنع اي
  };
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({ status: 'success', token, data: { user } });
};

export const signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm } = req.body;

  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
  });
  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();
  createSendToken(req, res, newUser, 201);
});
export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    next(new AppError('Please provide email and password', 400));
  const user = await User.findOne({ email }).select('+password');
  if (!(await user?.correctPassword(password, user.password)) || !user)
    return next(new AppError('Incorrect email or password', 401));
  createSendToken(req, res, user, 200);
});
// why we need to define a cookie when logging out?
// ans : beacuse when we logged in, we define a cookie with httpOnly:true which makes the cookie cannot be accessed or modified in any way by the browser, so we need to a hack or away to modify it, and the solution is to create a token with the same token name with empty value, and the new one will override the old one.
export const logout = catchAsync((req, res, next) => {
  res.cookie('jwt', '', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
});

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  let token;
  if (
    req.headers.authorization ||
    req.headers.authorization?.startsWith('Bear')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token)
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401),
    );
  // 2) Verify token which means check if it is valid
  // NOTE:  when the token is correct the verify method returns the decoded payload with the time when token was created or issued at (iat)
  const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
  // 3) check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(
      new AppError('The user belongs to this token no longer exist.', 401),
    );
  // 4) check if user changed password after the token was issued
  // iat ==> issued at, token creation time
  if (currentUser.isPasswordUpdatedAfter(decoded.iat))
    return next(
      new AppError('User changed password recently, please login again!.', 401),
    );
  // Grant Access to Protected Route
  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});
export const isLoggedin = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  if (req.cookies.jwt) {
    // 2) Verify token
    const decoded = jwt.verify(req.cookies.jwt, process.env.JWT_SECRETKEY);
    // 3) check if user still exist
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) return next();
    if (currentUser.isPasswordUpdatedAfter(decoded.iat)) return next();
    // IF USER IS LOGGED IN
    // any pug template have access to locals, so we put the user info into locals
    res.locals.user = currentUser;
    return next();
  }
  next();
});
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    next();
  };

export const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError('There is no user with Email address.', 404));
  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  // validateBeforeSave configure it into false, as when we use SAVE method it requires the validated fields and the user document doesn't have the passwordConfirm, that's why we need to configure into false
  await user.save({ validateBeforeSave: false });
  // 3) send it to user's email

  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetUrl).sendPasswordReset();
    res.status(200).json({
      status: 'success',
      message: 'Please check you email inbox to reset your password!',
    });
  } catch (err) {
    user.passwordResetToken = 0;
    user.passwordResetExpires = 0;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('There was an error sending the email.', 500));
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  //1) Hashing plain text token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  // 2) Find the user by the hashed token and passwordResetExpires
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or has expired', 400));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) update passwordChangedAt in user.model
  //4) login user, send JWT
  createSendToken(req, res, user, 200);
});
export const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError('current user password is not correct', 401));
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  createSendToken(req, res, user, 200);
});
