import { getRepository } from 'typeorm';
import { CallLeg, CallLegClientCallState } from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';
import TestFactory from '../TestFactory';
import CallsController, { encodeClientState } from './calls.controller';

const telnyxMock = require('telnyx');

const testFactory = new TestFactory();
const mockRes = { json: () => {} };

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

describe('.dial', () => {
  test('creates and answers inbound app call leg', async () => {
    telnyxMock.callMock.answer.mockClear();

    const req = {
      body: {
        to: '+15551231234',
        initiatorSipUsername: 'agent1SipUsername',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.dial(req, mockRes);

    const call = await getRepository(CallLeg).findOne({
      where: {
        to: process.env.TELNYX_SIP_OB_NUMBER,
        from: process.env.TELNYX_SIP_OB_NUMBER,
      },
    });

    expect(call).toBeDefined();
    expect(telnyxMock.callMock.answer).toHaveBeenCalled();
  });

  test('creates the correct conference call legs', async () => {
    telnyxMock.callsCreateMock.mockClear();
    telnyxMock.conferencesCreateMock.mockClear();

    const req = {
      body: {
        to: '+15551231234',
        initiatorSipUsername: 'agent1SipUsername',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.dial(req, mockRes);

    const conference = await getRepository(Conference).findOne({
      where: {
        to: '+15551231234',
        from: 'sip:agent1SipUsername@sip.telnyx.com',
      },
      relations: ['callLegs'],
    });

    expect(conference?.callLegs).toHaveLength(2);
    expect(conference?.callLegs?.[0]).toEqual(
      expect.objectContaining({
        clientCallState: 'auto_answer',
        direction: 'outgoing',
        from: process.env.TELNYX_SIP_OB_NUMBER,
        muted: false,
        status: 'new',
        telnyxCallControlId: 'fake_call_control_id',
        telnyxConnectionId: process.env.TELNYX_CC_APP_ID,
        to: 'sip:agent1SipUsername@sip.telnyx.com',
      })
    );
    expect(conference?.callLegs?.[1]).toEqual(
      expect.objectContaining({
        clientCallState: 'default',
        direction: 'outgoing',
        from: process.env.TELNYX_SIP_OB_NUMBER,
        muted: false,
        status: 'new',
        telnyxCallControlId: 'fake_call_control_id',
        telnyxConnectionId: process.env.TELNYX_CC_APP_ID,
        to: '+15551231234',
      })
    );
    expect(telnyxMock.conferencesCreateMock).toHaveBeenCalled();
    expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.TELNYX_SIP_OB_NUMBER,
        to: 'sip:agent1SipUsername@sip.telnyx.com',
      })
    );
    expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.TELNYX_SIP_OB_NUMBER,
        to: '+15551231234',
      })
    );
  });
});

describe('.invite', () => {
  test('creates the correct conference call legs', async () => {
    telnyxMock.callsCreateMock.mockClear();

    const req = {
      body: {
        to: 'sip:agent3SipUsername@sip.telnyx.com',
        telnyxCallControlId: 'telnyxCallControlId1',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.invite(req, mockRes);

    const conference = await getRepository(Conference).findOne('conference1', {
      relations: ['callLegs'],
    });

    expect(conference?.callLegs).toHaveLength(2);
    expect(conference?.callLegs?.[0]).toEqual(
      expect.objectContaining({
        clientCallState: 'default',
        direction: 'incoming',
        to: 'sip:agent1SipUsername@sip.telnyx.com',
      })
    );
    expect(conference?.callLegs?.[1]).toEqual(
      expect.objectContaining({
        clientCallState: 'default',
        direction: 'outgoing',
        from: process.env.TELNYX_SIP_OB_NUMBER,
        muted: false,
        status: 'new',
        telnyxCallControlId: 'fake_call_control_id',
        telnyxConnectionId: 'telnyxConnectionId1',
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
    );
    expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.TELNYX_SIP_OB_NUMBER,
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
    );
  });
});

describe('.transfer', () => {
  test('creates the correct conference call legs', async () => {
    telnyxMock.callMock.hangup.mockClear();
    telnyxMock.callsCreateMock.mockClear();

    const req = {
      body: {
        to: 'sip:agent3SipUsername@sip.telnyx.com',
        telnyxCallControlId: 'telnyxCallControlId1',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.transfer(req, mockRes);

    const conference = await getRepository(Conference).findOne('conference1', {
      relations: ['callLegs'],
    });

    expect(conference?.callLegs).toHaveLength(2);
    expect(conference?.callLegs?.[0]).toEqual(
      expect.objectContaining({
        clientCallState: 'default',
        direction: 'incoming',
        to: 'sip:agent1SipUsername@sip.telnyx.com',
      })
    );
    expect(conference?.callLegs?.[1]).toEqual(
      expect.objectContaining({
        clientCallState: 'default',
        direction: 'outgoing',
        from: process.env.TELNYX_SIP_OB_NUMBER,
        muted: false,
        status: 'new',
        telnyxCallControlId: 'fake_call_control_id',
        telnyxConnectionId: 'telnyxConnectionId1',
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
    );
    expect(telnyxMock.callMock.hangup).toHaveBeenCalled();
    expect(telnyxMock.callsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: process.env.TELNYX_SIP_OB_NUMBER,
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
    );
  });
});

describe('.hangup', () => {
  test('hangs up the Telnxy call', async () => {
    telnyxMock.callMock.hangup.mockClear();

    const req = {
      body: {
        telnyxCallControlId: 'telnyxCallControlId1',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.hangup(req, mockRes);

    expect(telnyxMock.callMock.hangup).toHaveBeenCalled();
  });
});

describe('.mute', () => {
  test('mutes the Telnyx Call', async () => {
    telnyxMock.conferenceMock.mute.mockClear();

    const req = {
      body: {
        telnyxCallControlId: 'telnyxCallControlId1',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.mute(req, mockRes);

    expect(telnyxMock.conferenceMock.mute).toHaveBeenCalledWith({
      call_control_ids: ['telnyxCallControlId1'],
    });
  });

  test('marks the call as muted in DB', async () => {
    telnyxMock.conferenceMock.mute.mockClear();

    const req = {
      body: {
        telnyxCallControlId: 'telnyxCallControlId1',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.mute(req, mockRes);

    let call = await getRepository(CallLeg).findOne({
      telnyxCallControlId: req.body.telnyxCallControlId,
    });

    expect(call?.muted).toEqual(true);
  });
});

describe('.unmute', () => {
  test('unmutes the Telnyx Call', async () => {
    telnyxMock.conferenceMock.unmute.mockClear();

    const req = {
      body: {
        telnyxCallControlId: 'telnyxCallControlId2',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.unmute(req, mockRes);

    expect(telnyxMock.conferenceMock.unmute).toHaveBeenCalledWith({
      call_control_ids: ['telnyxCallControlId2'],
    });
  });

  test('marks the call as unmuted in DB', async () => {
    telnyxMock.conferenceMock.unmute.mockClear();

    const req = {
      body: {
        telnyxCallControlId: 'telnyxCallControlId2',
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.unmute(req, mockRes);

    let call = await getRepository(CallLeg).findOne({
      telnyxCallControlId: req.body.telnyxCallControlId,
    });

    expect(call?.muted).toEqual(false);
  });
});

describe('.callControl', () => {
  test('handles new incoming calls', async () => {
    telnyxMock.callMock.answer.mockClear();

    const req = {
      body: {
        data: {
          event_type: 'call.initiated',
          payload: {
            state: 'parked',
            client_state: null,
            call_control_id: 'fake_call_control_id__incoming_parked',
            connection_id: 'fake_connection_id',
            from: 'fake_from',
            to: 'fake_to',
            direction: 'incoming',
          },
        },
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.callControl(req, mockRes);

    const callLeg = await getRepository(CallLeg).findOne({
      from: 'fake_from',
      to: 'fake_to',
      direction: 'incoming',
      telnyxCallControlId: 'fake_call_control_id__incoming_parked',
      telnyxConnectionId: 'fake_connection_id',
      clientCallState: 'default',
      muted: false,
    });
    expect(callLeg).toBeDefined();
    expect(telnyxMock.callMock.answer).toHaveBeenCalled();
  });

  test('handles answered new incoming calls', async () => {
    telnyxMock.callsCreateMock.mockClear();
    telnyxMock.conferencesCreateMock.mockClear();

    const req = {
      body: {
        data: {
          event_type: 'call.answered',
          payload: {
            client_state: encodeClientState({
              appCallState: 'answer_incoming_parked',
            }),
            call_control_id: 'telnyxCallControlId1',
            connection_id: 'fake_connection_id',
            from: 'fake_from',
            to: 'fake_to',
            direction: 'incoming',
          },
        },
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.callControl(req, mockRes);

    const conference = await getRepository(Conference).findOne({
      where: {
        from: 'fake_from',
        to: 'fake_to',
      },
      relations: ['callLegs'],
    });

    expect(conference?.callLegs).toHaveLength(2);
    expect(conference?.callLegs?.[0]).toEqual(
      expect.objectContaining({
        id: 'callLeg1',
      })
    );
    expect(conference?.callLegs?.[1]).toEqual(
      expect.objectContaining({
        to: 'sip:agent1SipUsername@sip.telnyx.com',
        from: 'fake_from',
      })
    );
    expect(telnyxMock.callsCreateMock).toHaveBeenCalled();
    expect(telnyxMock.conferencesCreateMock).toHaveBeenCalled();
  });

  test('handles answered app dials', async () => {
    telnyxMock.conferenceMock.join.mockClear();

    const req = {
      body: {
        data: {
          event_type: 'call.answered',
          payload: {
            client_state: encodeClientState({
              appCallState: 'join_conference',
              appConferenceId: 'conference3',
            }),
            call_control_id: 'telnyxCallControlId1',
            connection_id: 'fake_connection_id',
            from: 'fake_from',
            to: 'fake_to',
            direction: 'incoming',
          },
        },
      },
    };
    // FIXME Better solution than ignoring dial type
    // @ts-ignore
    await CallsController.callControl(req, mockRes);

    expect(telnyxMock.conferenceMock.join).toHaveBeenCalledWith({
      call_control_id: 'telnyxCallControlId1',
    });
  });
});
