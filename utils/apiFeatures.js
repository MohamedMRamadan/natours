class ApiFeatures {
  constructor(query, reqQuery) {
    this.query = query;
    this.reqQuery = reqQuery;
  }
  //limit=5&sort=-ratingsAverage,price&price[gte]=1200
  //req.query = {limit : "5" , sort : "-ratingAverage,price" , price = {gte :"1200"}}

  filter() {
    const queryObj = { ...this.reqQuery };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    const queryString = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    //* Building the Query
    this.query = this.query.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    //sort=-ratingsAverage,price
    if (this.reqQuery.sort) {
      const sortBy = this.reqQuery.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // query = query.sort('-price');
      //* to make sort work properly as createdAt field is the same in all documents so we need another field to depend on it , and there are two sort syntax to do it :
      // /* 1 */ query = query.sort('-createdAt _id');
      /* 2 */ this.query = this.query.sort({ _createdAt: -1, _id: 1 });
    }
    return this;
  }

  pagination() {
    const page = this.reqQuery.page * 1 || 1;
    const limit = this.reqQuery.limit * 1 || 100;
    const amountOfSkipedDocument = (page - 1) * limit;
    this.query = this.query.skip(amountOfSkipedDocument).limit(limit);
    return this;
  }

  limitFields() {
    if (this.reqQuery.fields) {
      const fields = this.reqQuery.fields.split(',').join(' ');
      this.query = this.query.select(fields); // Including Fields
    } else {
      // NOTE: __v field created by mongodb as it used it internaly so we shouldn't disable it but we can select to discluding it
      this.query = this.query.select('-__v'); // Discluding Fields by adding - operator before the field
    }
    return this;
  }
}
export default ApiFeatures;
