import { v4 as uuidv4 } from 'uuid';
import telnyxPackage from 'telnyx';
import { encodeClientState } from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/call-control/dial req.body:', req.body);

  const payload = req.body;

  const conferenceRoomId = uuidv4();

  // Call the Call Control App to generate a Call Control ID we can use
  const { data: selfCall } = await telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: `sip:${conferenceRoomId}@simple-cc-demo.sip.telnyx.com`,
    from: payload.from,
  });

  // Answer the call automatically so that we can act on the
  // call immediately, e.g. to create a conference
  selfCall.answer();

  // Create a conference
  const { data: conference } = await telnyx.conferences.create({
    call_control_id: selfCall.call_control_id,
    name: `Room ${conferenceRoomId}`,
  });

  // Call the client
  telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: `sip:${payload.sip_username}@sip.telnyx.com`,
    from: payload.from,
    // Use client state to specify which conference to join once the callee answers
    client_state: encodeClientState({
      conference_id: conference.id,
    }),
  });

  // Call the final destination
  telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: payload.to,
    from: payload.from,
    // Use client state to specify which conference to join once the callee answers
    client_state: encodeClientState({
      conference_id: conference.id,
    }),
  });

  res.statusCode = 200;
  res.json({
    data: {
      call_control_id: 'selfCall.call_control_id',
    },
  });
};
