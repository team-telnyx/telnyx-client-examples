const telnyx = require('telnyx')(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/sip-connection/webhook req.body:', req.body);

  const event = req.body;
  const { payload } = event;

  if (event.event_type === 'call_initiated' && payload.state === 'parked') {
    if (payload.direction === 'outgoing') {
      const inboundCall = await new telnyx.Call({
        call_control_id: payload.call_control_id,
      });

      inboundCall.answer();

      // Transfer the call to final destination
      inboundCall.transfer({
        to: payload.to,
        from: payload.from,
      });
    }
  }

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
