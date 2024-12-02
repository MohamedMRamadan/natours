import { model, Schema } from 'mongoose';

const tourSchema = new Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
  },
});

const Tour = model('Tour', tourSchema);

export default Tour;
