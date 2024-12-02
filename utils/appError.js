class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode || 500;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // to make sure that error.stack work properly
    // when a new object is created, as where function constructor is called it won't gonna appear in the stack trace
    Error.captureStackTrace(this, this.constructor);
    //مش هتظهر, this.constructor بتاعت errors بشكل متفلتر شوية يعني الـ stack يعني من الاخر هو هيظهر الـ
  }
}
export default AppError;
