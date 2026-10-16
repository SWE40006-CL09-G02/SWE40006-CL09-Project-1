/**
 * Jest configuration for the SWE40006 DevOps Task Manager backend.
 *
 * Covers both test tiers required by Level 3 of the project:
 *   - tests/unit/         fast, isolated tests with the pg pool mocked
 *   - tests/integration/  full-stack API tests against an in-memory Postgres
 *
 * Coverage is collected from the application logic only (server + routes + db
 * adapter) and a hard 80% threshold is enforced so the suite fails the CI
 * build if coverage of the main application logic drops below target.
 *
 * End-to-end tests (Playwright) live in e2e/ and are intentionally excluded;
 * they are executed by `npm run test:e2e` / the e2e-staging workflow, not Jest.
 */
module.exports = {
  testEnvironment: 'node',

  // Only treat *.test.js under tests/ as Jest suites.
  testMatch: ['**/tests/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/e2e/'],

  // Measure coverage of the main application logic.
  collectCoverageFrom: [
    'server.js',
    'routes/**/*.js',
    'db/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'cobertura'],

  // Fail the build if coverage of the application logic falls under 80%.
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },

  // Reset mock state between tests so suites stay independent.
  clearMocks: true
};
