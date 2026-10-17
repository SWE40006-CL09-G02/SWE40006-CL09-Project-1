/**
 * Integration tests for the Task API.
 *
 * Unlike the unit tests (which mock the database), these tests run the Express
 * application end-to-end against a real, SQL-executing Postgres engine
 * (pg-mem) loaded with the production schema. They verify that the HTTP layer,
 * routing, SQL statements and data persistence all work together: a task
 * created over HTTP is genuinely stored, read back, updated and deleted using
 * the real queries from routes/tasks.js.
 */
const request = require('supertest');

// Replace db/index.js with an in-memory Postgres pool (see tests/helpers/pgmem.js).
jest.mock('../../db', () => {
  const { createInMemoryPool } = require('../helpers/pgmem');
  return createInMemoryPool();
});

const pool = require('../../db');
const app = require('../../server');

beforeEach(() => {
  // Start every test from an empty tasks table.
  pool.reset();
});

afterAll(async () => {
  await pool.end();
});

describe('Task CRUD lifecycle (full stack, real SQL)', () => {
  test('a created task is persisted and returned by the read endpoints', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .send({ title: 'Deploy pipeline', description: 'Set up CI/CD' });

    expect(createRes.statusCode).toBe(201);
    expect(createRes.body).toMatchObject({
      title: 'Deploy pipeline',
      description: 'Set up CI/CD',
      status: 'pending'
    });
    expect(createRes.body.id).toEqual(expect.any(Number));
    expect(createRes.body.created_at).toBeDefined();

    const id = createRes.body.id;

    // Read all -> the task is present.
    const listRes = await request(app).get('/api/tasks');
    expect(listRes.statusCode).toBe(200);
    expect(listRes.body).toHaveLength(1);
    expect(listRes.body[0].id).toBe(id);
  });

  test('a task can be updated (title + description) and the change persists', async () => {
    const { body: created } = await request(app)
      .post('/api/tasks')
      .send({ title: 'Original', description: 'Original description' });

    const updateRes = await request(app)
      .put(`/api/tasks/${created.id}`)
      .send({ title: 'Updated title', description: 'Updated description' });

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body.title).toBe('Updated title');
    expect(updateRes.body.description).toBe('Updated description');

    // Confirm persistence via a fresh read.
    const listRes = await request(app).get('/api/tasks');
    expect(listRes.body[0].title).toBe('Updated title');
  });

  test('a task status can be changed and is filterable', async () => {
    const { body: created } = await request(app)
      .post('/api/tasks')
      .send({ title: 'Status task' });

    const patchRes = await request(app)
      .patch(`/api/tasks/${created.id}/status`)
      .send({ status: 'completed' });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.body.status).toBe('completed');

    // The completed filter now returns it; the pending filter does not.
    const completed = await request(app).get('/api/tasks?status=completed');
    expect(completed.body).toHaveLength(1);

    const pending = await request(app).get('/api/tasks?status=pending');
    expect(pending.body).toHaveLength(0);
  });

  test('a task can be deleted and no longer appears', async () => {
    const { body: created } = await request(app)
      .post('/api/tasks')
      .send({ title: 'Temporary task' });

    const deleteRes = await request(app).delete(`/api/tasks/${created.id}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toBe('Task deleted successfully');

    const listRes = await request(app).get('/api/tasks');
    expect(listRes.body).toHaveLength(0);
  });

  test('multiple tasks are returned in ascending id order', async () => {
    await request(app).post('/api/tasks').send({ title: 'First' });
    await request(app).post('/api/tasks').send({ title: 'Second' });
    await request(app).post('/api/tasks').send({ title: 'Third' });

    const listRes = await request(app).get('/api/tasks');
    const titles = listRes.body.map((t) => t.title);

    expect(titles).toEqual(['First', 'Second', 'Third']);
    expect(listRes.body[0].id).toBeLessThan(listRes.body[1].id);
  });
});

describe('Task API error handling against a real database', () => {
  test('updating a non-existent task returns 404', async () => {
    const res = await request(app)
      .put('/api/tasks/424242')
      .send({ title: 'Nope' });

    expect(res.statusCode).toBe(404);
  });

  test('deleting a non-existent task returns 404', async () => {
    const res = await request(app).delete('/api/tasks/424242');
    expect(res.statusCode).toBe(404);
  });

  test('creating a task without a title returns 400 and stores nothing', async () => {
    const res = await request(app).post('/api/tasks').send({ description: 'x' });
    expect(res.statusCode).toBe(400);

    const listRes = await request(app).get('/api/tasks');
    expect(listRes.body).toHaveLength(0);
  });
});
