/**
 * Unit tests for the task API route handlers (routes/tasks.js).
 *
 * These are true unit tests: the database layer (db/index.js) is replaced
 * with a Jest mock so each route handler is exercised in isolation. Every
 * branch is covered - the happy path, input validation (400), not-found
 * handling (404) and the error/catch paths (500) - for the full
 * Create / Read / Update / Delete surface plus the status-update route.
 */
const request = require('supertest');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const pool = require('../../db');
const app = require('../../server');

// A representative task row as Postgres would return it.
const sampleTask = {
  id: 1,
  title: 'Write unit tests',
  description: 'Cover every route',
  status: 'pending',
  created_at: '2026-10-13T00:00:00.000Z',
  updated_at: '2026-10-13T00:00:00.000Z'
};

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/tasks (View / Read all)', () => {
  test('returns 200 with the list of tasks and no status filter', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleTask] });

    const response = await request(app).get('/api/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([sampleTask]);

    // Unfiltered read must not pass a status parameter.
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(pool.query.mock.calls[0][1]).toBeUndefined();
  });

  test('treats status=all as "no filter"', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/api/tasks?status=all');

    expect(response.statusCode).toBe(200);
    expect(pool.query.mock.calls[0][1]).toBeUndefined();
  });

  test.each(['pending', 'in_progress', 'completed'])(
    'filters by the valid status "%s" using a parameterised query',
    async (status) => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get(`/api/tasks?status=${status}`);

      expect(response.statusCode).toBe(200);
      // The handler must bind the status as a query parameter (no SQL injection).
      expect(pool.query.mock.calls[0][1]).toEqual([status]);
    }
  );

  test('rejects an invalid status filter with 400', async () => {
    const response = await request(app).get('/api/tasks?status=not-a-status');

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid task status filter' });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns 500 when the database query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('db down'));

    const response = await request(app).get('/api/tasks');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to fetch tasks' });
  });
});

describe('POST /api/tasks (Create)', () => {
  test('creates a task and returns 201 with the created row', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleTask] });

    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'Write unit tests', description: 'Cover every route' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toEqual(sampleTask);
    // Title is trimmed and description is forwarded.
    expect(pool.query.mock.calls[0][1]).toEqual([
      'Write unit tests',
      'Cover every route'
    ]);
  });

  test('trims the title and defaults a missing description to null', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleTask] });

    await request(app).post('/api/tasks').send({ title: '  Spaced title  ' });

    expect(pool.query.mock.calls[0][1]).toEqual(['Spaced title', null]);
  });

  test('rejects a missing title with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ description: 'no title' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Title is required' });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('rejects a blank (whitespace-only) title with 400', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });

    expect(response.statusCode).toBe(400);
  });

  test('returns 500 when the insert fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('insert failed'));

    const response = await request(app)
      .post('/api/tasks')
      .send({ title: 'valid title' });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to create task' });
  });
});

describe('PUT /api/tasks/:id (Update title and description)', () => {
  test('updates an existing task and returns 200', async () => {
    const updated = { ...sampleTask, title: 'Updated', description: 'New' };
    pool.query.mockResolvedValueOnce({ rows: [updated] });

    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: 'Updated', description: 'New' });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(updated);
    expect(pool.query.mock.calls[0][1]).toEqual(['Updated', 'New', '1']);
  });

  test('trims title and description before updating', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleTask] });

    await request(app)
      .put('/api/tasks/1')
      .send({ title: '  T  ', description: '  D  ' });

    expect(pool.query.mock.calls[0][1]).toEqual(['T', 'D', '1']);
  });

  test('returns 404 when the task does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .put('/api/tasks/999')
      .send({ title: 'Does not matter' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found' });
  });

  test('rejects an update with no title (400)', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ description: 'missing a title' });

    expect(response.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns 500 when the update query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('update failed'));

    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: 'valid' });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update task' });
  });
});

describe('PATCH /api/tasks/:id/status (Update status)', () => {
  test.each(['pending', 'in_progress', 'completed'])(
    'accepts the valid status "%s" and returns 200',
    async (status) => {
      pool.query.mockResolvedValueOnce({ rows: [{ ...sampleTask, status }] });

      const response = await request(app)
        .patch('/api/tasks/1/status')
        .send({ status });

      expect(response.statusCode).toBe(200);
      expect(response.body.status).toBe(status);
      expect(pool.query.mock.calls[0][1]).toEqual([status, '1']);
    }
  );

  test('rejects an invalid status with 400', async () => {
    const response = await request(app)
      .patch('/api/tasks/1/status')
      .send({ status: 'archived' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid task status' });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns 404 when the task does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .patch('/api/tasks/999/status')
      .send({ status: 'completed' });

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found' });
  });

  test('returns 500 when the status update query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('patch failed'));

    const response = await request(app)
      .patch('/api/tasks/1/status')
      .send({ status: 'completed' });

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to update task status' });
  });
});

describe('DELETE /api/tasks/:id (Delete)', () => {
  test('deletes an existing task and returns 200 with a confirmation', async () => {
    pool.query.mockResolvedValueOnce({ rows: [sampleTask] });

    const response = await request(app).delete('/api/tasks/1');

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: 'Task deleted successfully',
      task: sampleTask
    });
    expect(pool.query.mock.calls[0][1]).toEqual(['1']);
  });

  test('returns 404 when deleting a task that does not exist', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).delete('/api/tasks/999');

    expect(response.statusCode).toBe(404);
    expect(response.body).toEqual({ error: 'Task not found' });
  });

  test('returns 500 when the delete query fails', async () => {
    pool.query.mockRejectedValueOnce(new Error('delete failed'));

    const response = await request(app).delete('/api/tasks/1');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Failed to delete task' });
  });
});
