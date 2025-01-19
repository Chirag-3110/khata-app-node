import mongoose from 'mongoose';
import config from '../config';
// import dotenv from 'dotenv';
// dotenv.config();

const mongoConnect = async () => {
  try {
    await mongoose.connect(config.DB);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

export default mongoConnect;
