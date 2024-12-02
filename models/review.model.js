import { Schema, model } from 'mongoose';
import Tour from './tour.model.js';

const reviewSchema = new Schema(
  {
    review: {
      type: String,
      trim: true,
      required: [true, 'A review must have a review'],
    },
    rating: {
      type: Number,
      required: [true, 'A review must have a rating'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be less than 5'],
    },
    tour: {
      type: Schema.Types.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour'],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: { virtuals: true },
  },
);

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});
// Unique compound index to ensure that the user can't write multiple review to the same tour
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// static method makes this keyword pointing to the model it self so that's why we can use aggregate pipeline
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  await Tour.findByIdAndUpdate(tourId, {
    ratingsAverage: stats.length > 0 ? stats[0].avgRating : 0,
    ratingsQuantity: stats.length > 0 ? stats[0].nRating : 4.5,
  });
};

// in document middleware this.constructor refers to the review model
reviewSchema.post('save', function () {
  // this === current review or the current document
  // Review.calcAverageRating(this.tour);
  this.constructor.calcAverageRatings(this.tour);
});
// in query middleware this.model refers to the review model
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here, query has already executed
  await this.model.calcAverageRatings(this.r.tour);
});

// NOTE: If we defined any middlewares after reviewModel decleration
const Review = model('Review', reviewSchema);

export default Review;
