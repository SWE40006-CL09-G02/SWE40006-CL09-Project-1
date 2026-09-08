# SWE40006 CL09 Project 1

Simple CRUD Task Manager for SWE40006 Software Deployment and Evolution.

## Important

<span style="color:red">

**IMPORTANT: Only push your code to the feature branch you are working on.**

**Do NOT push directly to `dev` or `main`.**

Because for this assignment, it's like to simulate the real developing environment

</span>

Example:

```bash
git checkout feature/create-task

git add .
git commit -m "Add create task feature"
git push origin feature/create-task
```

After your feature is complete, create a Pull Request to merge your feature branch into `dev`.

## Setup

### 1. Clone the repository

```bash
git clone git@github-swinburne:105385294/SWE40006-CL09-Project-1.git
cd SWE40006-CL09-Project-1
```

### 2. Switch to the development branch

```bash
git checkout dev
git pull origin dev
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create the environment file

```bash
cp .env.example .env
```

Update `.env` with the development database connection string:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=YOUR_DEVELOPMENT_DATABASE_URL
```

I will share the Neon PostgreSQL connection string in our group chat

### 5. Run the application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

### 6. Run tests

```bash
npm test
```

## Development

Before starting work:

```bash
git checkout dev
git pull origin dev
```

Create your feature branch:

```bash
git checkout -b feature/your-feature
```

After finishing:

```bash
git add .
git commit -m "Add your feature"
git push -u origin feature/your-feature
```

Then create a Pull Request from your feature branch into `dev`.

Do not develop directly on `main`.