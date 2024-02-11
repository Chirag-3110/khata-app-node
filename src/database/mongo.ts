import mongoose from 'mongoose';

// Use environment variables for sensitive information
const mongoUri = "mongodb+srv://chirag:3Ghomu9MZiMLYCkF@cluster0.rpaoiv2.mongodb.net/TodoDataBase?retryWrites=true&w=majority";

interface Config {
  useNewUrlParser: boolean;
  useUnifiedTopology: boolean;
}

const config: Config = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const mongoConnect = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

export default mongoConnect;
