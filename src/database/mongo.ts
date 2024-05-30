import mongoose from 'mongoose';

const mongoUri = "mongodb+srv://takchirag828:ln8nkqC42O3DEZEb@khatabook.qfoibva.mongodb.net/?retryWrites=true&w=majority&appName=khatabook";

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
