import { getManager } from 'typeorm';
import { CallLeg } from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';
import TestFactory from '../TestFactory';
import { encodeClientState } from '../controllers/calls.controller';

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
      expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.TELNYX_SIP_OB_NUMBER,
          to: 'sip:agent3SipUsername@sip.telnyx.com',
          connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
        })
      );
      expect(telnyxMock.callMock.bridge).toHaveBeenCalled();
    }));

test('POST /actions/dial', () =>
  testFactory.app
    .post('/calls/actions/dial')
    .send({
      to: '+15551231234',
      callerSipUsername: 'agent1SipUsername',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const conference = await getManager()
        .getRepository(Conference)
        .findOne({
          where: {
            telnyxConferenceId: 'fake_conference_id',
            from: process.env.TELNYX_SIP_OB_NUMBER,
          },
          relations: ['callLegs'],
        });

      expect(conference).toBeDefined();
      expect(conference?.callLegs).toEqual([
        expect.objectContaining({
          to: '+15551231234',
          direction: 'outgoing',
          telnyxCallControlId: 'fake_call_control_id',
          telnyxConnectionId: process.env.TELNYX_SIP_CONNECTION_ID,
          status: 'active',
          muted: false,
        }),
      ]);
      expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.TELNYX_SIP_OB_NUMBER,
          to: '+15551231234',
          connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
        })
      );
      expect(telnyxMock.conferencesCreateMock).toHaveBeenCalled();
    }));

test('POST /actions/invite', () =>
  testFactory.app
    .post('/calls/actions/conferences/invite')
    .send({
      initiatorSipUsername: 'agent1SipUsername',
      to: 'sip:agent3SipUsername@sip.telnyx.com',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const callLeg = await getManager()
        .getRepository(CallLeg)
        .findOne({
          where: {
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: 'sip:agent3SipUsername@sip.telnyx.com',
            direction: 'outgoing',
            telnyxCallControlId: 'fake_call_control_id',
            telnyxConnectionId: 'telnyxConnectionId1',
            muted: false,
          },
          relations: ['conference'],
        });

      expect(callLeg).toBeDefined();
      expect(callLeg?.conference?.id).toEqual('conference1');
      expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.TELNYX_SIP_OB_NUMBER,
          to: 'sip:agent3SipUsername@sip.telnyx.com',
          connection_id: 'telnyxConnectionId1',
        })
      );
    }));

test('POST /actions/transfer', () =>
  testFactory.app
    .post('/calls/actions/conferences/transfer')
    .send({
      initiatorSipUsername: 'agent1SipUsername',
      to: 'sip:agent3SipUsername@sip.telnyx.com',
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const callLeg = await getManager()
        .getRepository(CallLeg)
        .findOne({
          where: {
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: 'sip:agent3SipUsername@sip.telnyx.com',
            direction: 'outgoing',
            telnyxCallControlId: 'fake_call_control_id',
            telnyxConnectionId: 'telnyxConnectionId1',
            muted: false,
          },
          relations: ['conference'],
        });

      expect(callLeg).toBeDefined();
      expect(callLeg?.conference?.id).toEqual('conference1');
      expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          from: process.env.TELNYX_SIP_OB_NUMBER,
          to: 'sip:agent3SipUsername@sip.telnyx.com',
          connection_id: 'telnyxConnectionId1',
        })
      );
      // TODO Determine which call received hangup
      expect(telnyxMock.callMock.hangup).toHaveBeenCalled();
    }));

test('POST /actions/conferences/hangup', () =>
  testFactory.app
    .post('/calls/actions/conferences/hangup')
    .send({
      participant: 'sip:agent1SipUsername@sip.telnyx.com',
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
      participant: 'sip:agent1SipUsername@sip.telnyx.com',
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
      participant: 'sip:agent2SipUsername@sip.telnyx.com',
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

test('POST /callbacks/call-control-app | call.initiated', () =>
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

test('POST /callbacks/call-control-app | call.answered | client_state.answer_incoming_parked', () =>
  testFactory.app
    .post('/calls/callbacks/call-control-app')
    .send({
      data: {
        event_type: 'call.answered',
        payload: {
          client_state: encodeClientState({
            appCallState: 'answer_incoming_parked',
          }),
          call_control_id: 'telnyxCallControlId1',
          connection_id: 'telnyxConnectionId1',
          from: 'fake_from',
          to: 'sip:agent1SipUsername@sip.telnyx.com',
          direction: 'incoming',
        },
      },
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(async () => {
      const conference = await getManager()
        .getRepository(Conference)
        .findOne({
          where: {
            telnyxConferenceId: 'fake_conference_id',
            from: 'fake_from',
          },
          relations: ['callLegs'],
        });

      expect(conference).toBeDefined();
      expect(conference?.callLegs).toContainEqual(
        expect.objectContaining({
          to: 'sip:agent1SipUsername@sip.telnyx.com',
          direction: 'incoming',
          telnyxCallControlId: 'telnyxCallControlId1',
          telnyxConnectionId: 'telnyxConnectionId1',
          status: 'active',
        })
      );
      expect(telnyxMock.conferencesCreateMock).toHaveBeenCalled();
    }));

test('POST /callbacks/call-control-app | call.answered | client_state.dial_agent', () =>
  testFactory.app
    .post('/calls/callbacks/call-control-app')
    .send({
      data: {
        event_type: 'call.answered',
        payload: {
          client_state: encodeClientState({
            appCallState: 'dial_agent',
            appConferenceId: 'conference1',
          }),
          call_control_id: 'telnyxCallControlId1',
          connection_id: 'telnyxConnectionId1',
          from: 'fake_from',
          to: 'sip:agent1SipUsername@sip.telnyx.com',
          direction: 'incoming',
        },
      },
    })
    .expect('Content-type', /json/)
    .expect(200)
    .then(() => {
      expect(telnyxMock.conferenceMock.join).toHaveBeenCalledWith({
        call_control_id: 'telnyxCallControlId1',
        start_conference_on_enter: true,
      });
    }));
