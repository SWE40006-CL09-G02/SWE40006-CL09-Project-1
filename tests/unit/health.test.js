const request = require('supertest');
const app = require('../../server');

describe('Health endpoint', () => {
  test('GET /health should return a response', async () => {
    const response = await request(app).get('/health');

    expect([200, 503]).toContain(response.statusCode);
  });
});
