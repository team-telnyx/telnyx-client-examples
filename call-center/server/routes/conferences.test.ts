import TestFactory from '../TestFactory';

const telnyxMock = require('telnyx');

const testFactory = new TestFactory();

beforeAll(async () => {
  await testFactory.init();
  await testFactory.loadFixtures();
});

beforeEach(() => {
  telnyxMock.mockClear();
});

afterAll(async () => {
  await testFactory.close();
});

test('GET /:telnyx_call_control_id', () =>
  testFactory.app
    .get('/conferences/telnyxCallControlId1')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.conference).toMatchObject({
        id: 'conference1',
      });
    }));
