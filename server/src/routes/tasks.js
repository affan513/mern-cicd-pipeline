const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/Task');

const router = express.Router();

// Wraps async handlers and turns Mongoose validation errors into HTTP 400.
const wrap = (fn) => (req, res, next) =>
  fn(req, res, next).catch((err) => {
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((e) => e.message).join(', ');
      return res.status(400).json({ error: message });
    }
    return next(err);
  });

const validId = (req, res, next) =>
  mongoose.isValidObjectId(req.params.id)
    ? next()
    : res.status(400).json({ error: 'Invalid id' });

router.get('/', wrap(async (_req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1, _id: -1 });
  res.json(tasks);
}));

router.post('/', wrap(async (req, res) => {
  const { title, description, status } = req.body;
  const task = await Task.create({ title, description, status });
  res.status(201).json(task);
}));

router.put('/:id', validId, wrap(async (req, res) => {
  const { title, description, status } = req.body;
  const task = await Task.findByIdAndUpdate(
    req.params.id,
    { title, description, status },
    { new: true, runValidators: true }
  );
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json(task);
}));

router.delete('/:id', validId, wrap(async (req, res) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.status(204).end();
}));

module.exports = router;
