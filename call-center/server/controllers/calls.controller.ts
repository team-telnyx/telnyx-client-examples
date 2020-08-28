import express, { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { Call } from '../entities/call.entity';

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

async function handleCallInitiated(event: any) {
  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CONNECTION_ID,
    call_control_id: event.data.payload.call_control_id,
  });
  let callRepository = getManager().getRepository(Call);

  let {
    state,
    call_control_id,
    call_session_id,
    call_leg_id,
    to,
    from,
  } = event.data.payload;

  if (state === 'parked') {
    let call = new Call();
    call.callSessionId = call_session_id;
    call.callControlId = call_control_id;
    call.callLegId = call_leg_id;
    call.to = to;
    call.from = from;
    await callRepository.save(call);

    telnyxCall.answer();
  }
}

async function handleCallAnswered(event: any) {
  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CONNECTION_ID,
    call_control_id: event.data.payload.call_control_id,
  });
  let callRepository = getManager().getRepository(Call);
  let { call_session_id, call_leg_id } = event.data.payload;

  let call = await callRepository.find({
    callSessionId: call_session_id,
    callLegId: call_leg_id,
  });

  if (call.length > 0) {
    telnyxCall.transfer({
      to: `sip:${process.env.TELNYX_SIP_USERNAME}@sip.telnyx.com`,
    });
  }
}

// Callbacks
router.post('/callbacks/call-control-app', async function (req, res) {
  console.log('/callbacks/call-control-app | req body', req.body);

  let event = req.body;

  try {
    switch (event.data.event_type) {
      case 'call.initiated':
        await handleCallInitiated(event);
        break;
      case 'call.answered':
        await handleCallAnswered(event);
        break;
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }

  res.json({});
});

export default router;
