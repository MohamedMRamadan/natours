/* eslint-disable no-console*/
import mongoose from 'mongoose';

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log(`👉 UNCAUGHT EXCEPTION! 😢 Shutting down...`);
  process.exit(1);
});
// eslint-disable-next-line import/first
import app from './app.js';

const DB = process.env.REMOTE_DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.set('strictQuery', false);
mongoose
  .connect(DB)
  .then(() => {
    console.log('DB Connected successfully');
  })
  .catch(() => console.log('Failed to connect to database'));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running in port ${port}`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log(`👉 UNHANDELED REJECTION! 😢 Shutting down...`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forcefully shutting down');
    process.exit(1);
  }, 30000);
});
