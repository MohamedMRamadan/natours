import AppError from '../utils/appError.js';

const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }

  console.error('sendErrorDev', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};
const sendErrorProd = (err, req, res) => {
  // Operationl, trusted error: send message to the client
  if (req.originalUrl === '/api') {
    if (err.isOperational)
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    // Programming or other 3rd-library: don't leek error details
    // 1) Log error
    console.error('ERROR', err);
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong, please try again later.',
    });
  }
  if (err.isOperational)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  // Programming or other 3rd-library: don't leek error details

  // 1) Log error
  console.error('ERROR', err);

  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later',
  });
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateErrorDB = (err) => {
  const message = `Duplicate field value: ${err.errorResponse.keyValue.name}, please insert another value.`;
  return new AppError(message, 400);
};
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(' ')}`;
  return new AppError(message, 400);
};
const handleJWTExpiredError = () =>
  new AppError('Your token has been expired,  Please log in again!.', 401);

const handleJWTError = () =>
  new AppError(`Invalid token, Please log in again!. `, 401);

const isEnv = (nodeEnv = 'development') => process.env.NODE_ENV === nodeEnv;

// by defining it with 4 arguments, express will recognize it as global error middleware
export default (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  if (isEnv('development')) sendErrorDev(err, req, res);
  else if (isEnv('production')) {
    let error = JSON.parse(JSON.stringify(err)); // deep clone
    error.message = err.message;

    // When u want to get a specefic tour with invalid id
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    // when u want to create a tour with duplicated unique fields
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
