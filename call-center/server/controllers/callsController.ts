import express from 'express';
let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

let router = express.Router();

// Actions
router.post('/actions/bridge', function (req, res) {
  let { call_control_id } = req.body.data;
  let currentTelnyxCall = new telnyx.Call({ call_control_id });
  console.log(currentTelnyxCall);
  res.json({});
});

// Callbacks
router.post('/callbacks/call-control-app', async function (req, res) {
  console.log('/callbacks/call-control-app | req body', req.body);

  let event = req.body;
  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CONNECTION_ID,
    call_control_id: event.data.payload.call_control_id,
  });

  try {
    switch (event.data.event_type) {
      case 'call.initiated':
        telnyxCall.answer();
        break;
      case 'call.answered':
        telnyxCall.transfer({
          to: `sip:${process.env.TELNYX_SIP_USERNAME}@sip.telnyx.com`,
        });
        break;
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }

  res.json({});
});

export default router;
