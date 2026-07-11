import { INestApplication } from '@nestjs/common';
import { agent, createTestApp, describeE2e } from './test-helpers';

describeE2e('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok with postgresql up', async () => {
    const res = await agent(app).get('/health').expect(200);

    expect(res.body.status).toBe('ok');
    expect(res.body.info?.postgresql?.status || res.body.details?.postgresql?.status).toBe(
      'up',
    );
  });
});
