import telnyxPackage from 'telnyx';
import { encodeClientState } from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/sip-connection/webhook req.body:', req.body);

  const event = req.body;
  const { payload } = event;

  if (
    event.event_type === 'call_initiated' &&
    payload.state === 'parked' &&
    payload.direction === 'outgoing'
  ) {
    const call = await new telnyx.Call({
      call_control_id: payload.call_control_id,
    });

    call.answer();

    // Create conference
    const { data: conference } = await telnyx.conferences.create({
      call_control_id: payload.call_control_id,
      name: `From ${payload.from}`,
    });

    console.log('conference.id:', conference.id);

    // Call the final destination through Call Control
    const { data: outgoingCall } = await telnyx.calls.create({
      connection_id: process.env.TELNYX_CC_APP_ID,
      to: payload.to,
      from: payload.from,
      client_state: encodeClientState({
        conference_id: conference.id,
      }),
    });

    console.log('outgoingCall:', outgoingCall.call_control_id);

    // // Transfer the call to final destination
    // call.transfer({
    //   to: payload.to,
    //   from: payload.from,
    // });
  }

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
