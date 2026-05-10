process.env.DATABASE_URL = 'postgresql://fake:fake@localhost:5432/fake_test';
process.env.JWT_SECRET = 'test_jwt_secret_32_chars_minimum_ok';
process.env.ADMIN_PASSWORD = 'test_admin_pass';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('GET /health returns 200 and ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /nonexistent returns 404', async () => {
    const res = await request(app).get('/api/nonexistent_route_xyz');
    expect(res.statusCode).toBe(404);
  });
});
