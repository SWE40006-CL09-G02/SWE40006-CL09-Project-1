# Testing Strategy — SWE40006 DevOps Task Manager

This document describes the automated test suite for the Task Manager
application. It covers the three test tiers required by the project
(**unit**, **integration**, and **end-to-end**), how to run each one, and the
decisions taken where the implementation extends the original Project Brief.

Owner: Testing & Verification (Person D). Relevant tasks: **D1** (unit and
integration tests), **D2** (end-to-end tests).

---

## Test tiers

| Tier | Location | Runner | Database | Purpose |
|------|----------|--------|----------|---------|
| Unit | `tests/unit/` | Jest + Supertest | `pg` pool **mocked** | Each route/handler in isolation: validation (400), not-found (404) and error (500) branches, plus the `/health` logic and the HTTP-latency middleware. |
| Integration | `tests/integration/` | Jest + Supertest + **pg-mem** | In-memory Postgres with the **real `database/schema.sql`** | The full Express stack and the real SQL run together: a task created over HTTP is genuinely stored, read back, updated, filtered and deleted. |
| End-to-end (E2E) | `e2e/` | **Playwright** (Chromium) | The deployed app's real database | The Create / View / Update / Delete user journeys driven through a real browser against the deployed **Staging** environment. |

### Coverage

Coverage is collected from the application logic (`server.js`, `routes/`,
`db/`) and a **hard 80 % threshold** is enforced in `jest.config.js` — the CI
build fails if coverage drops below target.

Current coverage (unit + integration combined):

```
Statements : 97.7 %
Branches   : 94.3 %
Functions  : 88.9 %
Lines      : 97.7 %
```

`routes/tasks.js` and `db/index.js` reach 100 %. The only uncovered lines are
the `app.listen(...)` server-startup block in `server.js`, which runs only when
the process is launched directly, not under test.

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

Neither the unit nor the integration suite needs a live database: units mock
the `pg` pool, and integration tests use pg-mem. This keeps the CI pipeline
fast, deterministic, and independent of the Neon database quota.

### Pointing the E2E tests at an environment

The Playwright target URL is resolved in this order (`playwright.config.js`):

1. `STAGING_URL` — set automatically by the `E2E (Staging)` CI workflow
2. `BASE_URL` — generic override for local/ad-hoc runs
3. `http://127.0.0.1:3000` — a locally running instance

```bash
STAGING_URL="http://<staging-ip>" npm run test:e2e
```

---

## Continuous integration

* **`.github/workflows/ci.yml`** runs the unit + integration suites with
  coverage on every pushed feature branch and every pull request, and uploads
  the coverage report as a build artifact. A failing test (or coverage under
  80 %) stops the workflow.
* **`.github/workflows/e2e-staging.yml`** runs the Playwright E2E suite against
  the deployed Staging URL *after* the Staging deployment completes
  successfully (via `workflow_run`), and on manual dispatch for the Level 4
  demo. It waits for `/health` to pass before testing and uploads the
  Playwright HTML report as an artifact.

To enable the E2E workflow, set a repository **variable** `STAGING_URL` to the
public Staging URL (Settings → Secrets and variables → Actions → Variables).
Once task B2's Staging deployment workflow is merged, add its `name:` to the
`workflow_run.workflows` list in `e2e-staging.yml` so E2E chains directly off
that deployment.

---

## Documentation of changes (relative to the Project Brief)

* **End-to-end tests added.** The assignment requires unit, integration *and*
  end-to-end tests, but the Project Brief listed only Jest unit and integration
  tests. An E2E suite was added using **Playwright**, covering the create, view,
  update and delete flows against the deployed Staging URL, wired into the
  pipeline as a job that runs after the Staging deployment.
* **Integration tests use an in-memory Postgres (pg-mem).** Rather than depend
  on a live Neon branch during CI, the integration suite runs the real schema
  and SQL against pg-mem. This makes the tests hermetic, fast and free of the
  database quota, while still exercising the genuine SQL statements the
  application uses in production.
* **Coverage threshold enforced at 80 %.** A `coverageThreshold` was added to
  `jest.config.js` so the pipeline fails if coverage of the application logic
  falls below the brief's target.
