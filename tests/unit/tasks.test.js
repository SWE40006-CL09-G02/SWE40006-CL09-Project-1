const request = require('supertest');
const app = require('../../server');

describe('POST /api/tasks', () => {
  test('rejects a task with no title', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ description: 'missing a title' });

    expect(response.statusCode).toBe(400);
  });

  test('rejects a task with a blank title', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .send({ title: '   ' });

    expect(response.statusCode).toBe(400);
  });
});
