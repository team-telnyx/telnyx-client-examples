import telnyxPackage from 'telnyx';

import { decodeClientState } from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/call-control/webhook req.body:', req.body);

  const event = req.body.data;
  const { payload } = event;
  const clientState =
    payload.client_state && decodeClientState(payload.client_state);

  if (
    event.event_type === 'call.answered' &&
    clientState &&
    clientState.transfer_to
  ) {
    // Transfer the call to the final destination
    const call = await new telnyx.Call({
      call_control_id: payload.call_control_id,
    });

    call.transfer({
      to: clientState.transfer_to,
      from: payload.from,
    });
  }

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
