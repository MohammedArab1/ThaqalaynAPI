import dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import { IBookV2 } from '../../../types';

dotenv.config();
const url = process.env.MONGODB_URI;

mongoose.connect(url as string)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', (error as Error).message);
  });

const bookNameV2 = new Schema<IBookV2>({
  bookId: String,
  BookName: String,
  author: String,
  idRangeMin: Number,
  idRangeMax: Number
}, {
  strict: false
});

bookNameV2.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export default mongoose.model<IBookV2>('bookNamesV2', bookNameV2, 'bookNamesV2');