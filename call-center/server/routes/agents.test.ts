import TestFactory from '../TestFactory';

const testFactory = new TestFactory();

beforeEach(async () => {
  await testFactory.init();
});

afterEach(async () => {
  await testFactory.destroy();
});

test('GET /', () =>
  testFactory.app
    .get('/agents/')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.agents).toEqual([]);
    }));
