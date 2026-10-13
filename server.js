require('dotenv').config();

const express = require('express');
const path = require('path');
const pool = require('./db');

const taskRoutes = require('./routes/tasks');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Record HTTP request latency for CloudWatch monitoring
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    console.log(
      `HTTP_LATENCY method=${req.method} path=${req.path} duration_ms=${duration}`
    );
  });

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/tasks', taskRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.status(200).json({
      status: 'ok',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected'
    });
  }
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;