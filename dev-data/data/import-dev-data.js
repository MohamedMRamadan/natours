/* eslint-disable no-console*/

import { readFileSync } from 'fs';
import { set, connect } from 'mongoose';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Tour from '../../models/tour.model.js';
import Review from '../../models/review.model.js';
import User from '../../models/user.model.js';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const DB = process.env.REMOTE_DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);
set('strictQuery', false);
connect(DB)
  .then(() => {
    console.log('DB Connected successfully');
  })
  .catch(() => console.log('Failed to connect to database'));

const reviews = JSON.parse(readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(readFileSync(`${__dirname}/users.json`, 'utf-8'));
const tours = JSON.parse(readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const importData = async () => {
  try {
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews);
    await Tour.create(tours);
    console.log('Data successfully created');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};
const deleteData = async () => {
  try {
    await Review.deleteMany();
    await Tour.deleteMany();
    await User.deleteMany();
    console.log('Data successfully deleted');
  } catch (err) {
    console.log(err);
  } finally {
    process.exit();
  }
};
if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}
// const getAllTours = async (req, res)  => {
export default { importData, deleteData };
