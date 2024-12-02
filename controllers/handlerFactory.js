import ApiFeatures from '../utils/apiFeatures.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow for Getting all Reviews of a tour(hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new ApiFeatures(Model.find(filter), req.query);
    const { query } = features.filter().limitFields().sort().pagination();

    //* ##### EXECUTE QUERY #####
    // explain method is used to provide detailed information about how MongoDB executes a query.
    // ex : if we want to query about the tours which it's price less than 1000, you will find that mongodb had to examine all the tour documents in order to retun the documents which match the query, that's not efficent at all and with indexs we will solve this problem by createing indexes on specific fields in a collection
    // NOTE: Mongo creates an index on the ID field by default
    // const docs = await query.explain('executionStats');
    const docs = await query;

    //* ##### SENDING RESPONSE #####
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      data: { data: docs },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

export const updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      runValidators: true,
      new: true,
    });
    if (!doc)
      return next(new AppError(`Couldn't find a doc with that ID!.`, 404));
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
export const deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc)
      return next(new AppError(`Couldn't find a document with that ID!.`, 404));
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

export const getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc)
      return next(new AppError(`Couldn't find a document with that ID!.`, 404));
    res.status(200).json({ status: 'success', data: { data: doc } });
  });
