/**
 * Unit tests for the status-filter behaviour of GET /api/tasks.
 *
 * The database is mocked so the filtering/validation logic is tested in
 * isolation and deterministically (no live database connection is made).
 */
const request = require('supertest');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const pool = require('../../db');
const app = require('../../server');

beforeEach(() => {
  pool.query.mockReset();
  pool.query.mockResolvedValue({ rows: [] });
});

describe('GET /api/tasks status filter', () => {
  test('rejects an unknown status filter', async () => {
    const response = await request(app).get('/api/tasks?status=not-a-status');

    expect(response.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test('returns the validation error message', async () => {
    const response = await request(app).get('/api/tasks?status=done');

    expect(response.body).toEqual({ error: 'Invalid task status filter' });
  });

  test.each(['all', 'pending', 'in_progress', 'completed'])(
    'accepts the "%s" filter',
    async (status) => {
      const response = await request(app).get(`/api/tasks?status=${status}`);

      expect(response.statusCode).toBe(200);
    }
  );
});
