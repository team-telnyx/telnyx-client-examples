import telnyxPackage from 'telnyx';
import { encodeClientState } from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/call-control/dial req.body:', req.body);

  const payload = req.body;

  // Call the client
  const { data: call } = await telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: `sip:${payload.sip_username}@sip.telnyx.com`,
    from: payload.from,
    // Use client state to specify who to bridge the call with
    // once the client call is answered
    client_state: encodeClientState({
      transfer_to: payload.to,
    }),
  });

  res.statusCode = 200;
  res.json({
    data: {
      call_control_id: call.call_control_id,
    },
  });
};
