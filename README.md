# Task Manager CI/CD Pipeline

A small Node.js task manager, used to demonstrate a full CI/CD pipeline: automated tests, a staging environment, a manual approval gate and a production deployment.

Built by group CL09-G02 for SWE40006 Software Deployment and Evolution.

## The app

A CRUD task manager (Express and PostgreSQL) with a plain HTML/JS frontend. Users can create, view, edit and delete tasks, change a task's status (`pending`, `in_progress`, `completed`) and filter by status.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks, optionally `?status=` |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/:id` | Edit title and description |
| PATCH | `/api/tasks/:id/status` | Change status |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/health` | Health check, including a database query |

## Environments

| Environment | Where it runs | Database |
|---|---|---|
| Development | Local machine (Node or Docker) | Neon `development` branch |
| Testing | GitHub Actions runner | In-memory Postgres (pg-mem) |
| Staging | AWS EC2 | Neon `staging` branch |
| Production | AWS EC2, monitored with CloudWatch | Neon `production` branch |

Staging and Production run on AWS Learner Lab instances, so they are only available while the lab is running. Database connection strings are never stored in the image or the repository. They are passed at runtime (`.env` locally, GitHub secrets and server environment files elsewhere).

## Pipeline

```
feature/** branch ──> pull request into dev
                      (CI tests must pass, 1 approval required)
                              │
                       push to dev starts the pipeline:
                              │
   Test ──> Merge dev into staging ──> Staging ──> E2E (Staging)
                                                       │
   Production <── approval <── Merge staging into main ┘
```

1. **Test:** unit and integration tests (Jest) run with a coverage threshold of 80%.
2. **Staging:** the Docker image is built once, pushed to GitHub Container Registry with a commit-sha tag, and deployed to the Staging server. A health check must pass.
3. **E2E:** Playwright tests run against the live Staging site.
4. **Production:** a reviewer approves, then the same image that was tested on Staging is deployed to Production.

If any stage fails, the later stages do not run. The workflows are in `.github/workflows/`: `ci.yml`, `staging.yml`, `e2e-staging.yml`, `deploy-production.yml` and `pipeline.yml`, which ties them together.

## Architecture

- **Source and CI/CD:** GitHub and GitHub Actions
- **Image registry:** GitHub Container Registry (GHCR)
- **Servers:** two AWS EC2 instances (Staging, Production) running the Docker image
- **Databases:** Neon PostgreSQL, one branch per environment
- **Monitoring:** CloudWatch on Production (CPU, memory, disk, network, HTTP latency)

## Branches

| Branch | Purpose |
|---|---|
| `feature/*` | Work in progress. Open a pull request into `dev`. |
| `dev` | Integration branch. Needs a pull request, one approval and a passing `Test` check. |
| `staging` | Updated by the pipeline. Force pushes and deletions are blocked. |
| `main` | Updated by the pipeline. Force pushes and deletions are blocked. Production deploys wait for approval. |

## Run locally

```bash
git clone https://github.com/SWE40006-CL09-G02/SWE40006-CL09-Project-1.git
cd SWE40006-CL09-Project-1
npm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to the Neon development connection string (ask the team). Then:

```bash
npm run dev
```

The app is at `http://localhost:3000` and the health check at `http://localhost:3000/health`.

### Docker

```bash
docker build -t task-manager .
docker run --rm -p 3000:3000 --env-file .env task-manager
```

### Tests

```bash
npm test                 # unit and integration tests
npm run test:coverage    # with the coverage report
npm run test:e2e         # Playwright, uses STAGING_URL or BASE_URL
```

Unit tests mock the database, and integration tests use an in-memory Postgres loaded with `database/schema.sql`, so neither needs a database connection. The end-to-end tests need a running instance: set `STAGING_URL` (or `BASE_URL`, default `http://127.0.0.1:3000`).
