import express from 'express';
import { getManager, In } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';

let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

let router = express.Router();

// Actions
router.post('/actions/bridge', async function (req, res) {
  let { call_control_id, to } = req.body.data;
  let callToBridge = await telnyx.calls.create({
    connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
    from: process.env.TELNYX_SIP_OB_NUMBER,
    to,
  });

  callToBridge.bridge({ call_control_id });
  res.json({});
});

async function getAvailableAgent() {
  let agentRepository = getManager().getRepository(Agent);

  async function findFirst() {
    let firstAvailableAgent = await agentRepository.findOneOrFail({
      available: true,
    });

    return firstAvailableAgent;
  }

  // TODO Recursive retry
  return findFirst();
}

async function transferParkedCall(event: any) {
  let callRepository = getManager().getRepository(Call);

  let {
    call_control_id,
    call_session_id,
    call_leg_id,
    to,
    from,
  } = event.data.payload;

  let call = new Call();
  call.callSessionId = call_session_id;
  call.callControlId = call_control_id;
  call.callLegId = call_leg_id;
  call.to = to;
  call.from = from;

  await callRepository.save(call);

  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CC_APP_ID,
    call_control_id: event.data.payload.call_control_id,
  });

  try {
    const availableAgent = await getAvailableAgent();

    telnyxCall.transfer({
      to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
    });
  } catch (e) {
    // TODO Catch no available agent error and pass as hangup reason
    console.log('got error transferring call to available agent: ', e);

    telnyxCall.hangup();
  }
}

async function handleCallInitiated(event: any) {
  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CC_APP_ID,
    call_control_id: event.data.payload.call_control_id,
  });

  switch (event.data.payload.state) {
    /*
     * Only answering parked calls because we also get the call.initiated event for the second leg of the call
     */
    case 'parked': {
      transferParkedCall(event);
      break;
    }

    /*
     * Fired on transfer initiation
     */
    case 'bridging': {
      console.log('bridging call');

      // TODO Save agent who answers
      break;
    }

    default:
      break;
  }
}

async function handleCallAnswered(event: any) {
  console.log('answered call: ', event);
}

async function handleCallHangup(event: any) {
  let telnyxCall = new telnyx.Call({
    connection_id: process.env.TELNYX_CC_APP_ID,
    call_control_id: event.data.payload.call_control_id,
  });
  let callRepository = getManager().getRepository(Call);
  let { call_session_id, call_leg_id } = event.data.payload;

  let calls = await callRepository.find({
    where: {
      callSessionId: call_session_id,
      callLegId: call_leg_id,
    },
    relations: ['agents'],
  });

  if (calls.length > 0) {
    // TODO Mark agents as available again

    let agentRepository = getManager().getRepository(Agent);

    // FIXME Better way of handling this using query builder?
    await callRepository.save(
      calls.map((call) => {
        call.agents = call.agents.map((agent) => {
          agent.available = true;

          return agent;
        });

        return call;
      })
    );
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
      case 'call.hangup':
        await handleCallHangup(event);
        break;
    }
  } catch (e) {
    res.status(500).json({ error: e });
  }

  res.json({});
});

export default router;
