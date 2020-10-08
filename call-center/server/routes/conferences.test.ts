import { getManager } from 'typeorm';
import { CallLeg } from '../entities/callLeg.entity';
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

test('GET /:id_or_sip_address', () =>
  testFactory.app
    .get('/conferences/conference1')
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body.conference).toMatchObject({
        id: 'conference1',
      });
    }));
