const request = require('supertest');
const app = require('../../server');

describe('GET /api/tasks status filter', () => {
  test('rejects an unknown status filter', async () => {
    const response = await request(app)
      .get('/api/tasks?status=not-a-status');

    expect(response.statusCode).toBe(400);
  });

  test('returns the validation error message', async () => {
    const response = await request(app)
      .get('/api/tasks?status=done');

    expect(response.body).toEqual({
      error: 'Invalid task status filter'
    });
  });

  test.each([
    'all',
    'pending',
    'in_progress',
    'completed'
  ])('accepts the "%s" filter', async (status) => {
    const response = await request(app)
      .get(`/api/tasks?status=${status}`);

    expect(response.statusCode).not.toBe(400);
  });
});
