import { getManager } from 'typeorm';
import { CallLeg } from '../entities/callLeg.entity';
import TestFactory from '../TestFactory';

const telnyxPackage = require('telnyx');

const testFactory = new TestFactory();

beforeAll(async () => {
  await testFactory.init();
  await testFactory.loadFixtures();
});

afterAll(async () => {
  await testFactory.close();
});

test('POST /actions/bridge', () =>
  testFactory.app
    .post('/calls/actions/bridge')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test('POST /actions/conferences/invite', () =>
  testFactory.app
    .post('/calls/actions/conferences/invite')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test('POST /actions/conferences/transfer', () =>
  testFactory.app
    .post('/calls/actions/conferences/transfer')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test('POST /actions/conferences/hangup', () =>
  testFactory.app
    .post('/calls/actions/conferences/hangup')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test('POST /actions/conferences/mute', () =>
  testFactory.app
    .post('/calls/actions/conferences/mute')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test('POST /actions/conferences/unmute', () =>
  testFactory.app
    .post('/calls/actions/conferences/unmute')
    .send({})
    .expect('Content-type', /json/)
    .expect(200)
    .then((resp) => {
      expect(resp.body).toBeDefined();
    }));

test.only('POST /callbacks/call-control-app', () =>
  testFactory.app
    .post('/calls/callbacks/call-control-app')
    .send({
      data: {
        event_type: 'call.initiated',
        payload: {
          state: 'parked',
          client_state: null,
          call_control_id: 'fake_call_control_id',
          connection_id: 'fake_connection_id',
          from: 'fake_from',
          to: 'fake_to',
          direction: 'incoming',
        },
      },
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const callLeg = await getManager().getRepository(CallLeg).findOne({
        from: 'fake_from',
        to: 'fake_to',
        direction: 'incoming',
        telnyxCallControlId: 'fake_call_control_id',
        telnyxConnectionId: 'fake_connection_id',
        muted: false,
      });

      expect(callLeg).toBeDefined();
    }));
