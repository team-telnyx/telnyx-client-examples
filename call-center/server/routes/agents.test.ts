import TestFactory from '../TestFactory';

const testFactory = new TestFactory();

beforeAll(async () => {
  await testFactory.init();
  await testFactory.loadFixtures();
});

afterAll(async () => {
  await testFactory.close();
});

test('GET /', () =>
  testFactory.app
    .get('/agents')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agents).toHaveLength(3);
    }));

test('GET /:id', () =>
  testFactory.app
    .get('/agents/agent1')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agent).toMatchObject({
        id: 'agent1',
      });
    }));
