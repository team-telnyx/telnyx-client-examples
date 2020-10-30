import { getRepository } from 'typeorm';
import { Conference } from '../entities/conference.entity';
import TestFactory from '../TestFactory';

const telnyxMock = require('telnyx');

const testFactory = new TestFactory();

beforeAll(async () => {
  await testFactory.init();
});

beforeEach(async () => {
  await testFactory.clear();
  await testFactory.loadFixtures();
  telnyxMock.mockClear();
});

afterAll(async () => {
  await testFactory.close();
});

describe('GET /', () => {
  test('filters results', () =>
    testFactory.app
      .get('/calls?telnyxCallControlId=telnyxCallControlId1')
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.calls).toHaveLength(1);
        expect(resp.body.calls[0]).toEqual(
          expect.objectContaining({
            id: 'callLeg1',
          })
        );
      }));

  test('limits results', () =>
    testFactory.app
      .get('/calls?status=active&limit=2')
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.calls).toHaveLength(2);
      }));
});
