const request = require('supertest');

jest.mock('../../db', () => ({
  query: jest.fn()
}));

const pool = require('../../db');
const app = require('../../server');

describe('Health endpoint', () => {
  test('GET /health should return 200 when database is connected', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(500);

    expect(response.body).toEqual({
      status: 'ok',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  test('GET /health should return 503 when database is disconnected', async () => {
    pool.query.mockRejectedValueOnce(
      new Error('Database connection failed')
    );

    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(503);

    expect(response.body).toEqual({
      status: 'error',
      database: 'disconnected'
    });
  });
});