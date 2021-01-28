import telnyxPackage from 'telnyx';
import { v4 as uuidv4 } from 'uuid';
import {
  encodeClientState,
  decodeClientState,
} from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);
const TELNYX_API_URL = 'https://api.telnyx.com';

export default async (req, res) => {
  console.log('/api/call-control/webhook req.body:', req.body);

  const event = req.body.data;
  const { payload } = event;
  const clientState =
    payload.client_state && decodeClientState(payload.client_state);

  if (
    event.event_type === 'call.answered' &&
    clientState &&
    clientState.conference_id
  ) {
    // Join the conference
    const conference = await new telnyx.Conference({
      id: clientState.conference_id,
    });

    conference.join({
      call_control_id: payload.call_control_id,
      // End conference when participant hangs up
      // This is useful during development to quickly debug calls,
      // but you'll likely want to disable this in production if your
      // conference app should persist even after end users hang up
      end_conference_on_exit: true,
    });
  }

  if (
    event.event_type === 'call.initiated' &&
    payload.state === 'parked' &&
    payload.direction === 'incoming' &&
    !clientState
  ) {
    const call = await new telnyx.Call({
      call_control_id: payload.call_control_id,
    });

    // Answer the call automatically so that we can act on the
    // call immediately, e.g. to create a conference
    call.answer({
      client_state: encodeClientState({}),
    });

    const conferenceRoomId = uuidv4();

    // Create a conference
    const { data: conference } = await telnyx.conferences.create({
      call_control_id: call.call_control_id,
      name: `Room ${conferenceRoomId}`,
    });

    // Get SIP username from matching credential
    // You can also store the SIP username in your database
    const credential = await fetch(
      `${TELNYX_API_URL}/v2/telephony_credentials?filter[name]=${encodeURIComponent(
        `caller_id_e164:${payload.to}`
      )}&filter[status]=active&page[number]=1&page[size]=1`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.TELNYX_API_KEY}`,
        },
      }
    )
      .then((resp) => resp.json())
      .then(({ data }) => data[0]);

    // You'll want to do some additional checks here to see
    // the client is logged in before calling it
    if (credential) {
      // Call the client
      await telnyx.calls.create({
        connection_id: process.env.TELNYX_CC_APP_ID,
        to: `sip:${credential.sip_username}@sip.telnyx.com`,
        // from: `sip:${conferenceRoomId}@simple-cc-demo.sip.telnyx.com`,
        from: payload.from,
        // Use client state to specify which conference to join once the callee answers
        client_state: encodeClientState({
          conference_id: conference.id,
        }),
      });
    } else {
      console.log('Client does not exist');
    }
  }

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
