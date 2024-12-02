import sharp from 'sharp';
import catchAsync from '../utils/catchAsync.js';
import Tour from '../models/tour.model.js';
import * as factory from './handlerFactory.js';
import AppError from '../utils/appError.js';
// Tours Route Handler / Tours Controllers

export const aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
export const getgMe = (req, res, next) => {
  req.params.id = req.user._id;
  next();
};

export const getAllTours = factory.getAll(Tour);
export const getTour = factory.getOne(Tour, 'reviews');
export const createTour = factory.createOne(Tour);
export const updateTour = factory.updateOne(Tour);
export const deleteTour = factory.deleteOne(Tour);

export const resizeTourImgs = async (req, res, next) => {
  if (!req.files) return next();

  if (req.files.images) {
    req.body.images = [];
    //* why we use map ?
    // since the callback inside of map method is a promise, we need a way to make this callback await the execution of it's block statments before looping to the next callback, so as map returns a value which returns a new array we can use promise.all to await all array of promises which return by map which in turn(promise all) can be await too, so next function can be executed to navigate to the next middleware after all exexution of promises being commited
    await Promise.all(
      req.files.images.map(async (file, i) => {
        const imageName = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .resize(2000, 1333) // 2/3 ratio
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/img/tours/${imageName}`);
        req.body.images.push(imageName);
      }),
    );
  }
  if (req.files.imageCover) {
    req.body.imageCover = `tourCover-${req.params.id}-${Date.now()}.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
      .resize(2000, 1333) // 2/3 ratio
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${req.body.imageCover}`);
  }
  next();
};

// Aggregation: to get all statistics for all collection's documents
export const getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }, // preliminary
    },
    {
      $group: {
        // _id: '$difficulty',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: {
        avgPrice: 1,
        _id: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});

export const getMonthlyPlan = async (req, res, next) => {
  try {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
      {
        $unwind: '$startDates', // it deconstruct the embedded document
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$startDates' },
          numTourStarts: { $sum: 1 },
          tours: { $push: '$name' },
        },
      },
      {
        $addFields: { month: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
      {
        $sort: { numTourStarts: -1 },
      },
      {
        $limit: 12,
      },
    ]);

    res.status(200).json({
      status: 'success',
      results: plan.length,
      data: plan,
    });
  } catch (err) {
    res.status(404).json({
      status: 'fail',
      message: err,
    });
  }
};
//'/tours-within/:distance/center/:latlng/unit/:unit'
// Finding Tours within Sphere(محيط) of distance of latlng
export const getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');
  const raduis = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // to convert the raduis from miles or kilometers to radiens(special unit)

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], raduis] } },
  });
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      tours,
    },
  });
});
//'/distances/:latlng/unit/:unit'
export const getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400,
      ),
    );
  }
  // Geospatial aggregation
  // has only one stage is called $geoNear, should be at first, requires at least one of our fields contains a geospatial index (as like we did to startLocation)
  // if there's only one field with a geospatial index then $geoNear will automatically uses that index in order to perform the calculation, but if we have mutliple fields with geospatial indexes then you need to use the key parameters
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+lng, +lat],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);
  res.status(200).json({
    status: 'Success',
    results: distances.length,
    data: {
      distances,
    },
  });
});
