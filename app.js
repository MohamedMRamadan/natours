import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import { webhookCheckout } from './controllers/booking.controller.js';
import globalErrorHandler from './controllers/error.controller.js';
import bookingRouter from './routes/booking.routes.js';
import reviewRouter from './routes/review.routes.js';
import tourRouter from './routes/tour.routes.js';
import userRouter from './routes/user.routes.js';
import viewRouter from './routes/view.routes.js';
import AppError from './utils/appError.js';
import sanitizeMiddleware from './middlewares/sanitizeMiddleware.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const app = express();
// some hosts modify the headers of the request, so we need to define this line of code to make req.headers['x-forwarded-proto'] being set and read it's value, which we need it in createSendToken function to enable of disable secure option
app.enable('trust proxy');
// app.set('trust proxy', 1); // Trust the first proxy

// Setting template engine (pug) which is called views
// thery are the view in the MVC architecture
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//* ==============================================GLOBAL MIDDLEWARES ========================================
app.use(cors());
app.options('*', cors());
// Set Security HTTP headers (helmet package) to prevent CROSS-SITE SCRIPTING (XSS) ATTACKS
// Help secure Express apps by setting HTTP response headers, declare it at the start of Global middlwares
// this config for helmet beacuse helmet and Content Security Policy (CSP) is due to restrictions that prevent loading resources like https://unpkg.com and https://fonts.googleapis.com.
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        'https://unpkg.com',
        'https://cdnjs.cloudflare.com/ajax/libs/axios/1.7.2/axios.min.js',
        'https://js.stripe.com',
      ],
      frameSrc: ['https://js.stripe.com'], // Allow framing from Stripe

      styleSrc: ["'self'", 'https://unpkg.com', 'https://fonts.googleapis.com'],
      imgSrc: [
        "'self'",
        'data:',
        'https://unpkg.com',
        'https://tile.openstreetmap.org',
      ], // Allow images from OpenStreetMap
      connectSrc: ["'self'", 'ws://localhost:*'],
    },
  }),
);
// Development Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.post(
  '/webhook-checkout',
  express.raw({ type: 'application/json' }),
  webhookCheckout,
);

// Serving static Files
// aslo the href and srcs in .pug files will be served them routes as static files
app.use(express.static(path.join(__dirname, 'public')));
// Body parser, Reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
// parse data coming from url encoded form
// allow us to pass more complex data and parsing it
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// parsing cookie
app.use(cookieParser());

// Data sanitization against noSQL Query injection
// it filters out all req.params,body,query from all $ and dots
app.use(ExpressMongoSanitize());
// Data sanitization against XSS
// app.use(xss());
app.use(sanitizeMiddleware);

// Prevent parameter pollution
// ex: {{URL}}api/v1/tours?sort=duraion&sort=price, as duplicating sort field and in case of duplicating the values of two sort field will combained into an array so in ApiFeatue sort method we can't split(",") an array.. and that's the problem, so we use hpp to depend on the last sort field on the url, with configure whitlest option we define the fields that we accept duplicating
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsAverage',
      'ratingsQuantity',
      'price',
    ],
  }),
);
app.use(compression());
// Implementing rate limiting to prevent BRUTE FORCE ATTACKS
// Limit requests from same API
const limiter = rateLimit({
  limit: 100, // 100 request
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Test Middleware
// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

// Mounting Routers
// as it says if you find the src of a router like this ==> /api/v1/tours, getting into tourRouter
// tourRouter is a sub app or a middleware
app.use('/api/v1/tours', tourRouter);

// as it means we apply this router(sub app) as middlware only for specific route ( first argument ) , so tourRouter middleware only runs for this route(url)
// so it's like we create a small sub app for each of these resources ==> .route("..") <==
// This process called ==> Mounting the Router <==
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/', viewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.all('*', (req, res, next) => {
  // any thing we will pass into next argument, express will know automatically that is an error , so it will skip all other middlewares in middleware stack and sent the error to global error middleware handler
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//* GlOBAL ERROR MIDDLEWARE
app.use(globalErrorHandler);

export default app;
