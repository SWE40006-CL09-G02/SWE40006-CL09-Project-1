/**
 * Unit test for the database adapter (db/index.js).
 *
 * Confirms the module exports a configured pg Pool that the rest of the
 * application can query. The pool is created from DATABASE_URL but never
 * actually connects here (no query is issued), so no live database is needed.
 */
describe('db/index.js', () => {
  test('exports a pg Pool with a query interface', async () => {
    const { Pool } = require('pg');
    const pool = require('../../db');

    expect(pool).toBeInstanceOf(Pool);
    expect(typeof pool.query).toBe('function');
    expect(typeof pool.end).toBe('function');

    // Close the idle pool so Jest does not report an open handle.
    await pool.end();
  });
});
