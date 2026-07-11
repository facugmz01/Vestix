import { INestApplication } from '@nestjs/common';
import { agent, createTestApp, describeE2e } from './test-helpers';

describeE2e('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login succeeds with seeded admin credentials', async () => {
    const res = await agent(app)
      .post('/api/auth/login')
      .send({ email: 'admin@erp.com', password: 'Admin123!' })
      .expect(200);

    expect(res.body.message).toMatch(/exitoso/i);
    expect(res.body.user.email).toBe('admin@erp.com');
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    const cookies = res.headers['set-cookie'];
    const cookieHeader = Array.isArray(cookies) ? cookies.join('; ') : cookies;
    expect(cookieHeader).toContain('erp_token=');
  });

  it('POST /api/auth/login rejects invalid password', async () => {
    await agent(app)
      .post('/api/auth/login')
      .send({ email: 'admin@erp.com', password: 'wrong-password' })
      .expect(401);
  });

  it('GET /api/auth/me returns profile when authenticated', async () => {
    const login = await agent(app)
      .post('/api/auth/login')
      .send({ email: 'admin@erp.com', password: 'Admin123!' })
      .expect(200);

    const cookie = login.headers['set-cookie'];

    const me = await agent(app)
      .get('/api/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    expect(me.body.email).toBe('admin@erp.com');
    expect(me.body.permissions?.length).toBeGreaterThan(0);
  });
});
