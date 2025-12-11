const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Make sure your MongoDB server is running locally on port 27017.');
      console.error('If you are using Atlas, check your MONGO_URI in .env');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
