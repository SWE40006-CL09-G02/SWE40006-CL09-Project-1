/**
 * In-memory Postgres helper for integration tests.
 *
 * pg-mem provides a real, SQL-executing Postgres engine that runs entirely in
 * memory and exposes a `pg`-compatible Pool. This lets the integration suites
 * exercise the application's actual SQL (SERIAL ids, RETURNING clauses,
 * CURRENT_TIMESTAMP, status defaults, ORDER BY) against the real schema
 * (database/schema.sql) without requiring a live Neon database branch.
 *
 * The result is a drop-in replacement for the module at db/index.js, so the
 * Express app under test runs completely unmodified.
 */
const fs = require('fs');
const path = require('path');
const { newDb } = require('pg-mem');

function createInMemoryPool() {
  const db = newDb();

  // Load the exact production schema so the tests run against real DDL.
  const schema = fs.readFileSync(
    path.join(__dirname, '..', '..', 'database', 'schema.sql'),
    'utf8'
  );
  db.public.none(schema);

  const { Pool } = db.adapters.createPg();
  const pool = new Pool();

  // Expose the backing engine so suites can reset state between test cases.
  pool.__memoryDb = db;
  pool.reset = () => db.public.none('DELETE FROM tasks');

  return pool;
}

module.exports = { createInMemoryPool };
