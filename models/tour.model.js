import { Schema, model } from 'mongoose';
import slugify from 'slugify';
// import User from './user.model.js';
// const validator = require('validator');

const tourSchema = new Schema(
  {
    name: {
      // Schema Options
      type: String,
      required: [true, 'A Tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [40, 'A tour name must have less or equal than 40 characters'],
      minLength: [10, 'A tour name must have more or equal than 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contains characters'],
    },
    startDates: [Date],
    dates: [
      {
        date: Date,
        participants: Number,
        soldOut: Boolean,
      },
    ],
    imageCover: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a cover image'],
    },
    images: [String],
    slug: String,
    price: {
      type: Number,
      required: [true, 'A Tour must have a price'], // Validator
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // ==> this keyword only point to current doc only when we creating a new document
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    duration: {
      type: Number,
      required: [true, 'A Tour must have a duration'],
    },
    difficulty: {
      type: String,
      required: [true, 'A Tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, meduim, difficult',
      },
    },
    // Geospatial data
    startLocation: {
      // uses GeoJSON Format
      // it should has at least 2 subfields like type and coordinates
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: Schema.ObjectId,
        ref: 'User',
      },
    ],
    maxGroupSize: {
      type: Number,
      required: [true, 'A Tour must have a group size'],
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.66666 * 10 => 46.6666 => 47 => 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    secretTour: {
      type: Boolean,
      default: false,
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
      required: [true, 'A Tour must have a description'],
    },
  },
  {
    timestamps: true,
    // they are options to make sure that virtual property show up whenever there is an output
    toJSON:
      /* it means that each time the data outputted as json we want virtuals to be true */ {
        virtuals: true,
      },
    // data outputted as object ...
    toObject: { virtuals: true },
  },
);
// ⚪ Single field index
// tourSchema.index({ price: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });
//⚪ Compound Index , it will works for both fields and even one of them
tourSchema.index({ price: 1, ratingsAverage: -1 });

//* Hide timestamps by default
tourSchema.path('createdAt').select(false);
tourSchema.path('updatedAt').select(false);

//* Virtual properties :
// fields we define in our schema but it won't be persisted in database, it's value will be derived from another field , so we can't build query with it as it's not part of database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
//* Virtual popualte
// as like populate + virtual
//==> in the end the id of localField is the same to id in foreginField
// NOTE: to popualte we have to got to the tour controller and populate in getTour route handler
tourSchema.virtual('reviews', {
  ref: 'Review', // ref option contains the model we want to popualte with or reference to
  foreignField: 'tour', // the field in the model which ref option assigned to has the id of tourModel
  localField: '_id', // the field that has the id of Tour model
});

// tourSchema.virtual('bookings', {
//   ref: 'Booking',
//   localField: 'tour',
//   foreignField: '_id',
//   as: 'bookings',
// });
//* Mongoose middleware
// 4 types of Middleware in mongoose : document, query, aggregate and model

//* 1) Document Middleware
//  each time document is saved in database we can run function between save command is issued and actual saving
// called pre & post hooks .. function run before or after a certain event .save() and .create()
// each document middleware have access to next function
// it's called post/pre save (hook or middleware) .. which the save event is called hook
// we cann add multiple pre/post middlewares
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.pre('save', function (next) {
  this.dates = this.startDates.map((date) => ({
    date,
    participants: 0,
    soldOut: false,
  }));
  next();
});
// ==> Embedding tour guides document into tour document
// tourSchema.pre('save', async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id)); // array of promises
//   this.guides = await Promise.all(guidesPromises);
//   next();
// });
//* 2) Query Middleware
// before find query being executed
tourSchema.pre(/^find/, function (next) {
  // this keyword will point to the query
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordUpdatedAt',
  });
  next();
});
// after find query being executed
// tourSchema.post(/^find/, function (docs, next) {
//   // this keyword will point to the document as it's finished
//   console.log(`Query tooks ${Date.now() - this.start} Milliseconds`);
//   next();
// });
//* 3) Aggregation middleware
tourSchema.pre('aggregate', function (next) {
  // this keyword will point to aggregation query object which in there we access to pipeline as it's the array we passed in aggregate method , so we simply pass another match stage at the beginning , as it will remove all the documents that have secretTour set to true
  console.log(this.pipeline()[0]);
  if (Object.keys(this.pipeline()[0])[0] !== '$geoNear')
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  next();
});

const Tour = model('Tour', tourSchema);
export default Tour;
