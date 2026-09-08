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


## Web App Overview

This project is a simple **Task Manager CRUD Web Application** developed for SWE40006 Software Deployment and Evolution.

The application allows users to:

- Create a task
- View tasks
- Edit a task
- Change task status
- Filter tasks
- Delete tasks

The main purpose of this project is not to build a complex web application. The application is used to demonstrate our DevOps workflow, including automated testing, staging deployment, production deployment, and CI/CD.

## Team Tasks

Each team member should work only on their assigned feature branch.

### Feature 1 — Create Task

Branch:

```text
feature/create-task
```

Tasks:

- Add a form to create a new task
- Implement `POST /api/tasks`
- Save the new task to the database
- Refresh the task list after creation

### Feature 2 — Edit Task

Branch:

```text
feature/edit-task
```

Tasks:

- Add an Edit button
- Allow users to update task title and description
- Implement `PUT /api/tasks/:id`
- Update the task in the database

### Feature 3 — Task Status

Branch:

```text
feature/task-status
```

Tasks:

- Allow task status to be changed
- Supported statuses:
  - `pending`
  - `in_progress`
  - `completed`
- Save the updated status to the database

### Feature 4 — Task Filter

Branch:

```text
feature/task-filter
```

Tasks:

- Add filters for:
  - All
  - Pending
  - In Progress
  - Completed
- Show only tasks matching the selected status

## Important

⚠️ **Only push your code to the feature branch you are working on.**

⚠️ **Do NOT push directly to `dev` or `main`.**

After completing your feature, create a Pull Request to merge your branch into `dev`.