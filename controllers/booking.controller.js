import Stripe from 'stripe';
import Tour from '../models/tour.model.js';
import catchAsync from '../utils/catchAsync.js';
import Booking from '../models/booking.model.js';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory.js';
import User from '../models/user.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const STRIPE_WEBHOOK_SECRET =
  process.env.NODE_ENV === 'development'
    ? process.env.STRIPE_WEBHOOK_SECRET_LOCAL
    : process.env.STRIPE_WEBHOOK_SECRET;

// eslint-disable-next-line import/prefer-default-export
export const getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently wanted tour to be booked
  const tour = await Tour.findById(req.params.tourId);
  // 2) create checkout session

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: tour.name,
            description: tour.summary,
            images: [
              `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
            ],
          },
          unit_amount: tour.price * 100, // Amount in cents
        },
        quantity: 1,
      },
    ],
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/me/bookings?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    mode: 'payment',
  });
  res.status(200).json({ session });
});

const createBookingCheckout = async (session) => {
  const user = await User.findOne({
    email: session.customer_email,
  });
  await Booking.create({
    user: user._id,
    tour: session.client_reference_id,
    price: session.amount_total / 100,
  });
};
export const webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    // stripe will receive this as it is who actually call webhook and execute this route handeler
    return res.status(400).send(`Webhook error: ${err.message}`);
  }
  switch (event.type) {
    case 'checkout.session.completed':
      await createBookingCheckout(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
  res.status(200).json({ received: true });
};
export const getAllBookings = getAll(Booking);
export const getBooking = getOne(Booking);
export const createBooking = createOne(Booking);
export const updateBooking = updateOne(Booking);
export const deleteBooking = deleteOne(Booking);
