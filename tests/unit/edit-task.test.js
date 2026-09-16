const request = require('supertest');
const app = require('../../server');

describe('PUT /api/tasks/:id', () => {
  test('rejects an update with no title', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ description: 'missing a title' });

    expect(response.statusCode).toBe(400);
  });

  test('rejects an update with a blank title', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: '   ' });

    expect(response.statusCode).toBe(400);
  });

  test('returns the validation error message', async () => {
    const response = await request(app)
      .put('/api/tasks/1')
      .send({ title: '' });

    expect(response.body).toEqual({
      error: 'Title is required'
    });
  });
});
