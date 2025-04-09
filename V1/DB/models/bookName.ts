import dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import { IBookV1 } from '../../../types';

dotenv.config();
const url = process.env.MONGODB_URI;

mongoose.connect(url as string)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error: Error) => {
    console.log('error connecting to MongoDB:', error.message);
  });

const bookSchema = new Schema<IBookV1>({
  bookId: String,
  BookName: String,
  author: String,
  idRangeMin: Number,
  idRangeMax: Number,
}, {
  strict: false
});

bookSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export default mongoose.model<IBookV1>('bookNames', bookSchema, 'bookNames');