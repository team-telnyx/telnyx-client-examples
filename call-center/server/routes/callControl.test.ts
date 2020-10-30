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

describe('POST /actions/dial', () => {
  test('returns the outgoing call', () =>
    testFactory.app
      .post('/call-control/actions/dial')
      .send({
        to: '+15551231234',
        initiatorSipUsername: 'agent1SipUsername',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.data).toEqual(
          expect.objectContaining({
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: '+15551231234',
            direction: 'outgoing',
            conference: expect.objectContaining({
              from: 'sip:agent1SipUsername@sip.telnyx.com',
              to: '+15551231234',
            }),
          })
        );
      }));
});

describe('POST /actions/invite', () => {
  test('returns the outgoing call when inviting an agent', () =>
    testFactory.app
      .post('/call-control/actions/conferences/invite')
      .send({
        telnyxCallControlId: 'telnyxCallControlId1',
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then(async (resp) => {
        let expectedConference = await getRepository(Conference).findOne(
          'conference1'
        );

        expect(resp.body.data).toEqual(
          expect.objectContaining({
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: 'sip:agent3SipUsername@sip.telnyx.com',
            direction: 'outgoing',
            conference: expectedConference,
          })
        );
      }));

  test('returns the outgoing call when inviting a phone number', () =>
    testFactory.app
      .post('/call-control/actions/conferences/invite')
      .send({
        telnyxCallControlId: 'telnyxCallControlId1',
        to: '+115551231234',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then(async (resp) => {
        let expectedConference = await getRepository(Conference).findOne(
          'conference1'
        );

        expect(resp.body.data).toEqual(
          expect.objectContaining({
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: '+115551231234',
            direction: 'outgoing',
            conference: expectedConference,
          })
        );
      }));
});

describe('POST /actions/conferences/transfer', () => {
  test('returns the outgoing call', () =>
    testFactory.app
      .post('/call-control/actions/conferences/transfer')
      .send({
        telnyxCallControlId: 'telnyxCallControlId1',
        to: 'sip:agent3SipUsername@sip.telnyx.com',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then(async (resp) => {
        let expectedConference = await getRepository(Conference).findOne(
          'conference1'
        );

        expect(resp.body.data).toEqual(
          expect.objectContaining({
            from: process.env.TELNYX_SIP_OB_NUMBER,
            to: 'sip:agent3SipUsername@sip.telnyx.com',
            direction: 'outgoing',
            conference: expectedConference,
          })
        );
      }));
});

describe('POST /actions/conferences/mute', () => {
  test('returns the muted call', () =>
    testFactory.app
      .post('/call-control/actions/conferences/mute')
      .send({
        telnyxCallControlId: 'telnyxCallControlId4',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.data).toEqual(
          expect.objectContaining({
            id: 'callLeg4',
            muted: true,
          })
        );
      }));
});

describe('POST /actions/conferences/unmute', () => {
  test('returns the unmuted call', () =>
    testFactory.app
      .post('/call-control/actions/conferences/unmute')
      .send({
        telnyxCallControlId: 'telnyxCallControlId2',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.data).toEqual(
          expect.objectContaining({
            id: 'callLeg2',
            muted: false,
          })
        );
      }));
});

describe('POST /actions/conferences/hangup', () => {
  test('returns the ended call', () =>
    testFactory.app
      .post('/call-control/actions/conferences/hangup')
      .send({
        telnyxCallControlId: 'telnyxCallControlId2',
      })
      .expect('Content-type', /json/)
      .expect(200)
      .then((resp) => {
        expect(resp.body.data).toEqual(
          expect.objectContaining({
            id: 'callLeg2',
          })
        );
      }));
});

describe('POST /callbacks', () => {
  test('empty response', () =>
    testFactory.app
      .post('/call-control/callbacks')
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
      .then((resp) => {
        expect(resp.body).toEqual({});
      }));
});
