import { Schema, model } from 'mongoose';

const bookingSchema = new Schema(
  {
    tour: {
      type: Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A booking must belong to a tour'],
    },
    user: {
      type: Schema.ObjectId,
      ref: 'User',
      required: [true, 'A booking must belong to a user'],
    },
    price: {
      type: Number,
      required: [true, 'A booking must have a price'],
    },
    paid: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// populate
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate('tour');
  next();
});

const Booking = model('Booking', bookingSchema);

export default Booking;
