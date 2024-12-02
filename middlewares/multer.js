import multer from 'multer';
import AppError from '../utils/appError.js';

export const storage = multer.memoryStorage();

export const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    return cb(null, true);
  }
  return cb(
    new AppError('Not an image! please upload only images.', 400),
    false,
  );
};
export const upload = multer({ storage, fileFilter });
