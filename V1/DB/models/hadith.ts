import dotenv from 'dotenv';
import mongoose, { Schema, Document } from 'mongoose';
import random from 'mongoose-simple-random';
import { IHadithV1 } from '../../../types';

dotenv.config();
const url = process.env.MONGODB_URI;

mongoose.connect(url as string)
  .then(() => {
    console.log('connected to MongoDB');
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', (error as Error).message);
  });


// Add the mongoose-simple-random plugin types
declare module 'mongoose' {
  interface Model<T extends Document> {
    findRandom(conditions: any, projection: any, options: any, callback: (err: any, result: T[]) => void): void;
    findOneRandom(conditions: any, projection: any, options: any, callback: (err: any, result: T | null) => void): void;
  }
}

const hadithSchema = new Schema<IHadithV1>({
  id: Number,
  bookId: String,
  book: String,
  category: String,
  categoryId: String,
  chapter: String,
  author: String,
  translator: String,
  englishText: String,
  arabicText: String,
  majlisiGrading: String,
  BehdudiGrading: String,
  MohseniGrading: String,
  URL: String,
}, {
  strict: false
});

hadithSchema.plugin(random);

hadithSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  }
});

export default mongoose.model<IHadithV1>('AllBooks', hadithSchema, 'AllBooks');