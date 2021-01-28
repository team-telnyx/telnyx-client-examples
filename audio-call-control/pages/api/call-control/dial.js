import telnyxPackage from 'telnyx';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/call-control/dial req.body:', req.body);

  const payload = req.body;

  // Call the client
  const { data: callToClient } = await telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: `sip:${payload.sip_username}@sip.telnyx.com`,
    from: payload.from,
  });

  // Call the destination
  const { data: outgoingCall } = await telnyx.calls.create({
    connection_id: process.env.TELNYX_CC_APP_ID,
    to: payload.to,
    from: payload.from,
  });

  res.statusCode = 200;
  res.json({
    data: {
      call_control_id: callToClient.call_control_id,
    },
  });
};
