import { Document } from 'mongoose';

export interface IIngredientV2 extends Document {
  ingredient?: string;
  statuses?: string[];
  info?: string[];
  otherNames?: string[];
  unknown?: string[];
  [key: string]: any; // For strict: false
}

export interface IHadithV2 extends Document {
  id?: number;
  bookId?: string;
  book?: string;
  category?: string;
  categoryId?: string;
  chapter?: string;
  author?: string;
  translator?: string;
  englishText?: string;
  arabicText?: string;
  majlisiGrading?: string;
  BehdudiGrading?: string;
  MohseniGrading?: string;
  URL?: string;
  [key: string]: any; // For strict: false
}

export interface IHadithV1 extends Document {
  id?: number;
  bookId?: string;
  book?: string;
  category?: string;
  categoryId?: string;
  chapter?: string;
  author?: string;
  translator?: string;
  englishText?: string;
  arabicText?: string;
  majlisiGrading?: string;
  BehdudiGrading?: string;
  MohseniGrading?: string;
  URL?: string;
  [key: string]: any; // For strict: false
}

export interface IBookV1 extends Document {
  bookId?: string;
  BookName?: string;
  author?: string;
  idRangeMin?: number;
  idRangeMax?: number;
  [key: string]: any; // For strict: false
}

export interface IBookV2 extends Document {
  bookId?: string;
  BookName?: string;
  author?: string;
  idRangeMin?: number;
  idRangeMax?: number;
  [key: string]: any; // For strict: false
}