const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title must be at most 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: { values: ['todo', 'in-progress', 'done'], message: 'Invalid status' },
      default: 'todo',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
