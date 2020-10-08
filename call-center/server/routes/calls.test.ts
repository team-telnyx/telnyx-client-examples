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

test('POST /actions/bridge', () =>
  testFactory.app
    .post('/calls/actions/bridge')
    .send({
      data: {
        call_control_id: 'fake_call_control_id',
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      },
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(() => {
      expect(telnyxMock.callMock.bridge).toHaveBeenCalled();
    }));

test('POST /actions/conferences/hangup', () =>
  testFactory.app
    .post('/calls/actions/conferences/hangup')
    .send({
      participant: 'sip:callLeg1@sip.telnyx.com',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(() => {
      expect(telnyxMock.callMock.hangup).toHaveBeenCalled();
    }));

test('POST /actions/conferences/mute', () =>
  testFactory.app
    .post('/calls/actions/conferences/mute')
    .send({
      participant: 'sip:callLeg1@sip.telnyx.com',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const callLeg = await getManager()
        .getRepository(CallLeg)
        .findOne('callLeg2');

      expect(callLeg?.muted).toEqual(true);
      expect(telnyxMock.conferenceMock.mute).toHaveBeenCalled();
    }));

test('POST /actions/conferences/unmute', () =>
  testFactory.app
    .post('/calls/actions/conferences/unmute')
    .send({
      participant: 'sip:callLeg2@sip.telnyx.com',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const callLeg = await getManager()
        .getRepository(CallLeg)
        .findOne('callLeg2');

      expect(callLeg?.muted).toEqual(false);
      expect(telnyxMock.conferenceMock.unmute).toHaveBeenCalled();
    }));

test('POST /callbacks/call-control-app', () =>
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
      expect(telnyxMock.callMock.answer).toHaveBeenCalled();
    }));
