/**
 * Unit tests for application-level concerns in server.js:
 *   - static hosting of the front-end (public/index.html)
 *   - the HTTP latency logging middleware used for Level 2 monitoring
 *
 * The database layer is mocked; these tests do not touch Postgres.
 */
const request = require('supertest');

jest.mock('../../db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] })
}));

const app = require('../../server');

describe('Static front-end hosting', () => {
  test('GET / serves the Task Manager HTML page', async () => {
    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('DevOps Task Manager');
  });
});

describe('HTTP latency logging middleware', () => {
  test('logs an HTTP_LATENCY line once a request completes', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await request(app).get('/health');

    const latencyLogged = logSpy.mock.calls
      .map((call) => String(call[0]))
      .some((line) => /HTTP_LATENCY method=GET path=\/health duration_ms=\d+/.test(line));

    expect(latencyLogged).toBe(true);

    logSpy.mockRestore();
  });
});
