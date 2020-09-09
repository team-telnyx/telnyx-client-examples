import { Request, Response } from 'express';
import { getManager, In } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';

let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

// The CC API expects base64 encdoed values
const base64Encode = (data: string) => {
  let buffer = new Buffer(data);

  return buffer.toString('base64');
};

const ENCODED_CALL_CLIENT_STATE = {
  HANGUP: base64Encode('hangup'),
  BRIDGING: base64Encode('bridging'),
  BRIDGED: base64Encode('bridged'),
};

class CallsController {
  public static bridge = async function (req: Request, res: Response) {
    let { call_control_id, to } = req.body.data;
    let callToBridge = await telnyx.calls.create({
      connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
      from: process.env.TELNYX_SIP_OB_NUMBER,
      to,
    });

    callToBridge.bridge({ call_control_id });
    res.json({});
  };

  public static callControl = async function (req: Request, res: Response) {
    console.log('/callbacks/call-control-app | req body', req.body);

    let event = req.body;

    try {
      switch (event.data.event_type) {
        case 'call.initiated':
          await CallsController.handleInitiated(event);
          break;
        case 'call.answered':
          await CallsController.handleAnswered(event);
          break;
        case 'call.hangup':
          await CallsController.handleHangup(event);
          break;
        case 'call.speak.ended':
          await CallsController.handleSpeakEnded(event);
          break;
      }
    } catch (e) {
      res.status(500).json({ error: e });
    }

    res.json({});
  };

  private static getAvailableAgent = async function () {
    let agentRepository = getManager().getRepository(Agent);

    async function findFirst() {
      let firstAvailableAgent = await agentRepository.findOne({
        available: true,
      });

      return firstAvailableAgent;
    }

    // TODO Recursive retry
    return findFirst();
  };

  private static handleInitiated = async function (event: any) {
    let callRepository = getManager().getRepository(Call);

    let {
      state,
      call_control_id,
      call_session_id,
      call_leg_id,
      to,
      from,
    } = event.data.payload;

    /*
     * Only answering parked calls because we also get the call.initiated
     * event for the second leg of the call
     */
    if (state === 'parked') {
      let call = new Call();
      call.callSessionId = call_session_id;
      call.callControlId = call_control_id;
      call.callLegId = call_leg_id;
      call.to = to;
      call.from = from;

      await callRepository.save(call);

      CallsController.transferParkedCall(event);
    }
  };

  private static transferParkedCall = async function (event: any) {
    let callRepository = getManager().getRepository(Call);
    let { call_session_id, call_leg_id } = event.data.payload;

    let call = await callRepository.findOneOrFail({
      callSessionId: call_session_id,
      callLegId: call_leg_id,
    });

    let telnyxCall = new telnyx.Call({
      call_control_id: event.data.payload.call_control_id,
    });

    await telnyxCall.answer({
      client_state: ENCODED_CALL_CLIENT_STATE.BRIDGING,
    });

    let availableAgent = await CallsController.getAvailableAgent();

    if (availableAgent) {
      await telnyxCall.transfer({
        to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
        // NOTE Client state only persists on original leg of
        // the call (not the one we're transferring to)
        client_state: ENCODED_CALL_CLIENT_STATE.BRIDGED,
      });

      availableAgent.available = false;
      call.agents = [availableAgent];

      callRepository.save(call);
    } else {
      telnyxCall.speak({
        // Let our app know we should hangup after call ends
        client_state: ENCODED_CALL_CLIENT_STATE.HANGUP,
        // All following fields are required:
        language: 'en-US',
        payload: 'Sorry, there are no agents available to take your call.',
        voice: 'female',
      });
    }
  };

  private static handleAnswered = async function (event: any) {
    let { client_state } = event.data.payload;

    if (client_state === ENCODED_CALL_CLIENT_STATE.BRIDGING) {
      console.log('call answered by app\n');
    } else {
      console.log('call answered by agent\n');
    }
  };

  private static handleSpeakEnded = async function (event: any) {
    let { client_state } = event.data.payload;

    if (client_state === ENCODED_CALL_CLIENT_STATE.HANGUP) {
      let telnyxCall = new telnyx.Call({
        call_control_id: event.data.payload.call_control_id,
      });

      telnyxCall.hangup();
    }
  };

  /*
   * Cleanup agents and call relation on hangup
   */
  private static handleHangup = async function (event: any) {
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
      // FIXME Better way of handling saves using query builder?
      await callRepository.save(
        calls.map((call) => {
          call.agents = call.agents.map((agent) => {
            agent.available = true;

            return agent;
          });

          return call;
        })
      );

      // Remove active calls from agents
      // Saves both ways because of cascade rules
      await callRepository.save(
        calls.map((call) => {
          call.agents = [];

          return call;
        })
      );
    }
  };
}

export default CallsController;
