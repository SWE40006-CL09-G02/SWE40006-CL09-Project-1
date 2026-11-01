# Testing Strategy

This document describes the automated tests for the Task Manager app, how to run them, and where they run in the pipeline.

---

## Test tiers

| Tier | Location | Runner | Database | Purpose |
|------|----------|--------|----------|---------|
| Unit | `tests/unit/` | Jest + Supertest | `pg` pool **mocked** | Each route in isolation: validation (400), not-found (404) and error (500) branches, plus `/health` and the HTTP latency middleware. |
| Integration | `tests/integration/` | Jest + Supertest + **pg-mem** | In-memory Postgres loaded from `database/schema.sql` | The full Express stack and the real SQL together: a task created over HTTP is stored, read back, updated, filtered and deleted. |
| End-to-end (E2E) | `e2e/` | **Playwright** (Chromium) | Neon staging branch, through the deployed app | Create, view, update and delete journeys driven through a real browser against the deployed **Staging** environment. |

### Coverage

Coverage is collected from `server.js`, `routes/` and `db/`. `jest.config.js` enforces an **80 % threshold**, so the Test stage fails if coverage drops below it.

Current coverage (unit + integration combined):

```
Statements : 97.7 %
Branches   : 91.4 %
Functions  : 88.9 %
Lines      : 97.7 %
```

The only uncovered lines are the `app.listen(...)` startup block in `server.js`, which only runs when the server is started directly.

---

## Running the tests

```bash
# Unit + integration (Jest)
npm test                 # all Jest suites
npm run test:unit        # unit only
npm run test:integration # integration only
npm run test:coverage    # all suites + coverage report (coverage/)

# End-to-end (Playwright)
npm run test:e2e         # runs against STAGING_URL / BASE_URL (default: http://127.0.0.1:3000)
```

The unit and integration suites don't need a live database: units mock the `pg` pool and integration tests use pg-mem. This keeps CI fast and independent of the Neon database.

### Pointing the E2E tests at an environment

`playwright.config.js` picks the target URL in this order:

1. `STAGING_URL`: set by the pipeline from the repository variable of the same name
2. `BASE_URL`: override for local or ad-hoc runs
3. `http://127.0.0.1:3000`: a locally running instance

```bash
STAGING_URL="http://<staging-host>" npm run test:e2e
```

---

## Where the tests run

The tests run in `.github/workflows/pipeline.yml`, which starts on every push to `dev`:

| Stage | Workflow | Tests |
|-------|----------|-------|
| Test | `ci.yml` | Unit + integration with coverage. Uploads the `coverage-report` artifact. A failure here stops the pipeline. |
| E2E | `e2e-staging.yml` | Playwright against the Staging URL, after the Staging deploy. Waits for `/health`, then uploads the Playwright HTML report. A failure here stops the merge to `main` and the Production deploy. |

The tests run once per change. Production deploys the image that already passed them and doesn't re-run them.

Outside the pipeline:

* `ci.yml` also runs on pushes to `feature/**` branches and on pull requests into `dev`. The `Test` check must pass before a PR can be merged.
* `e2e-staging.yml` can be started by hand from the Actions tab, with an optional `staging_url` input. It also runs after a manual run of `Deploy to Staging`.

The E2E workflow needs a repository **variable** `STAGING_URL` set to the public Staging URL (Settings → Secrets and variables → Actions → Variables).

---

## Changes from the original plan

* **E2E tests added.** The brief only listed Jest unit and integration tests. We added Playwright E2E tests that run against the deployed Staging app, as their own pipeline stage.
* **Integration tests use pg-mem.** The brief planned to test against a Neon staging branch. pg-mem runs the real schema and SQL in memory instead, so tests are fast, repeatable and don't use up database quota.
* **80 % coverage threshold.** Added to `jest.config.js` so the pipeline fails when coverage drops below it.
