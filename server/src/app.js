const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const tasks = require('./routes/tasks');

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
app.use(express.json());

// Real health check: reports 503 when the database is not connected.
app.get('/api/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'connected' : 'disconnected',
    time: new Date().toISOString(),
  });
});

app.use('/api/tasks', tasks);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

module.exports = app;
