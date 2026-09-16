const express = require('express');
const pool = require('../db');

const router = express.Router();

// READ ALL TASKS (OPTIONALLY FILTERED BY STATUS)
router.get('/', async (req, res) => {
  const { status } = req.query;

  const validStatuses = [
    'pending',
    'in_progress',
    'completed'
  ];

  const filterByStatus =
    status !== undefined &&
    status !== '' &&
    status !== 'all';

  if (filterByStatus && !validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid task status filter'
    });
  }

  try {
    const result = filterByStatus
      ? await pool.query(
          `SELECT * FROM tasks
           WHERE status = $1
           ORDER BY id ASC`,
          [status]
        )
      : await pool.query(
          'SELECT * FROM tasks ORDER BY id ASC'
        );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to fetch tasks'
    });
  }
});

// CREATE TASK
router.post('/', async (req, res) => {
  const { title, description } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({
      error: 'Title is required'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description)
       VALUES ($1, $2)
       RETURNING *`,
      [title.trim(), description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to create task'
    });
  }
});

// UPDATE TASK STATUS
router.patch('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    'pending',
    'in_progress',
    'completed'
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Invalid task status'
    });
  }

  try {
    const result = await pool.query(
      `UPDATE tasks
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to update task status'
    });
  }
});

// DELETE TASK
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM tasks
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }

    res.json({
      message: 'Task deleted successfully',
      task: result.rows[0]
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: 'Failed to delete task'
    });
  }
});

module.exports = router;
