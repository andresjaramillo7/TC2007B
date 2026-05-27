import request from 'supertest';
import app from '../src/app';

describe('GET /nonexistent', () => {
  it('should return 404 with fail status', async () => {
    const res = await request(app).get('/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('fail');
    expect(res.body.message).toBe('Route not found');
  });
});

describe('GET /api/auth/test', () => {
  it('should return 501 not implemented', async () => {
    const res = await request(app).get('/api/auth/test');
    expect(res.status).toBe(501);
    expect(res.body.message).toBe('Auth endpoints not yet implemented');
  });
});

describe('GET /api/mobile/test', () => {
  it('should return 501 not implemented', async () => {
    const res = await request(app).get('/api/mobile/test');
    expect(res.status).toBe(501);
    expect(res.body.message).toBe('Mobile endpoints not yet implemented');
  });
});

describe('GET /api/teacher/test', () => {
  it('should return 501 not implemented', async () => {
    const res = await request(app).get('/api/teacher/test');
    expect(res.status).toBe(501);
    expect(res.body.message).toBe('Teacher endpoints not yet implemented');
  });
});
