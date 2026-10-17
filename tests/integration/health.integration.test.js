/**
 * Integration test for the /health endpoint against a real (in-memory)
 * Postgres database. Confirms that the readiness probe genuinely executes a
 * query against the database and reports a connected status - this endpoint
 * is relied on by the deployment workflows (staging and production) to gate a
 * release.
 */
const request = require('supertest');

jest.mock('../../db', () => {
  const { createInMemoryPool } = require('../helpers/pgmem');
  return createInMemoryPool();
});

const pool = require('../../db');
const app = require('../../server');

afterAll(async () => {
  await pool.end();
});

describe('GET /health (real database)', () => {
  test('reports ok and connected when the database responds', async () => {
    const response = await request(app).get('/health');

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.database).toBe('connected');
    expect(response.body.environment).toBeDefined();
  });
});
