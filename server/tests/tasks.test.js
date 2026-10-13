const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const Task = require('../src/models/Task');

let mongod;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
afterEach(async () => {
  await Task.deleteMany({});
});

describe('API', () => {
  test('TC1 health returns 200 and status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('TC2 create task with valid title', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'Write report' });
    expect(res.status).toBe(200);
    expect(res.body._id).toBeDefined();
    expect(res.body.status).toBe('todo');
  });

  test('TC3 empty title is rejected', async () => {
    const res = await request(app).post('/api/tasks').send({ title: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/title/i);
  });

  test('TC4 list is newest first', async () => {
    await request(app).post('/api/tasks').send({ title: 'first' });
    await sleep(10);
    await request(app).post('/api/tasks').send({ title: 'second' });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(res.body.map((t) => t.title)).toEqual(['second', 'first']);
  });

  test('TC5 update status', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'a' });
    const res = await request(app).put(`/api/tasks/${created.body._id}`).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });

  test('TC6 unknown status is rejected', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'a' });
    const res = await request(app).put(`/api/tasks/${created.body._id}`).send({ status: 'nope' });
    expect(res.status).toBe(400);
    const again = await Task.findById(created.body._id);
    expect(again.status).toBe('todo');
  });

  test('TC7 delete with malformed id', async () => {
    const res = await request(app).delete('/api/tasks/not-an-id');
    expect(res.status).toBe(400);
  });

  test('TC8 delete unknown id', async () => {
    const res = await request(app).delete(`/api/tasks/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
  });

  test('TC9 delete existing task', async () => {
    const created = await request(app).post('/api/tasks').send({ title: 'gone' });
    const res = await request(app).delete(`/api/tasks/${created.body._id}`);
    expect(res.status).toBe(204);
    const list = await request(app).get('/api/tasks');
    expect(list.body).toHaveLength(0);
  });
});
