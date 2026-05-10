process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake_test';
process.env.JWT_SECRET = 'test_jwt_secret_32_chars_minimum_ok';
process.env.ADMIN_PASSWORD = 'correct_admin_password';
process.env.NODE_ENV = 'test';

// Mock the database so tests don't need a real Postgres connection
jest.mock('../src/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('returns 401 when user not found', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 when password is wrong', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    db.query.mockResolvedValueOnce({
      rows: [{ id: 'uuid-1', email: 'user@test.com', password_hash: hash, role: 'owner', branch_id: null, full_name: 'Test User', is_active: true }]
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with token on valid credentials', async () => {
    const hash = await bcrypt.hash('correctpassword', 10);
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 'uuid-1', email: 'user@test.com', password_hash: hash, role: 'owner', branch_id: null, full_name: 'Test User' }] })
      .mockResolvedValueOnce({ rows: [] }); // branch query
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@test.com', password: 'correctpassword' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('user@test.com');
  });
});

describe('POST /api/auth/admin-login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 401 with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('returns 200 with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ password: 'correct_admin_password' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 with empty password', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ password: '' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => jest.clearAllMocks());

  it('always returns success (anti-enumeration)', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@test.com' });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain('reset link');
  });

  it('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({});
    expect(res.statusCode).toBe(400);
  });
});

describe('Protected routes require auth', () => {
  it('GET /api/members returns 401 without token', async () => {
    const res = await request(app).get('/api/members');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/branches returns 401 without token', async () => {
    const res = await request(app).get('/api/branches');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/leads returns 401 without token', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.statusCode).toBe(401);
  });
});
