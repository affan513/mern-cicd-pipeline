require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tasks';

async function start() {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      break;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed: ${err.message}`);
      if (attempt === 10) process.exit(1);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
  app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
}

start();
