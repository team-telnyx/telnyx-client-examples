import { Request, Response } from 'express';
import { getManager, In } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';

let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

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

  public static onCallback = async function (req: Request, res: Response) {
    console.log('/callbacks/call-control-app | req body', req.body);

    let event = req.body;

    try {
      switch (event.data.event_type) {
        case 'call.initiated':
          await CallsController.handleCallInitiated(event);
          break;
        case 'call.answered':
          await CallsController.handleCallAnswered(event);
          break;
        case 'call.hangup':
          await CallsController.handleCallHangup(event);
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
      let firstAvailableAgent = await agentRepository.findOneOrFail({
        available: true,
      });

      return firstAvailableAgent;
    }

    // TODO Recursive retry
    return findFirst();
  };

  private static handleCallInitiated = async function (event: any) {
    let telnyxCall = new telnyx.Call({
      connection_id: process.env.TELNYX_CC_APP_ID,
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

    /*
     * Only answering parked calls because we also get the call.initiated
     * event for the second leg of the call
     *
     * Transfer to agent is handled in the `call.answered` event handler
     */
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
  };

  private static handleCallAnswered = async function (event: any) {
    let {
      call_control_id,
      call_session_id,
      call_leg_id,
      to,
      from,
    } = event.data.payload;

    let telnyxCall = new telnyx.Call({
      connection_id: process.env.TELNYX_CC_APP_ID,
      call_control_id: event.data.payload.call_control_id,
    });

    let callRepository = getManager().getRepository(Call);

    // FIXME More robust way to handle whether call is being answered by
    // this app (immediately after "parked" state) or by agent's SIP client?
    if (to.startsWith('sip:')) {
      console.log('call answered by agent');
    } else {
      try {
        const availableAgent = await CallsController.getAvailableAgent();

        await telnyxCall.transfer({
          to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
        });

        console.log('transfer success:', availableAgent);

        availableAgent.available = false;

        // FIXME Does this need to be a new call?
        let call = new Call();
        call.callSessionId = call_session_id;
        call.callControlId = call_control_id;
        call.callLegId = call_leg_id;
        call.to = to;
        call.from = from;
        call.agents = [availableAgent];

        callRepository.save(call);
      } catch (e) {
        // TODO Catch no available agent error and pass as hangup reason
        console.log('got error transferring call to available agent: ', e);

        telnyxCall.hangup();
      }
    }
  };

  /*
   * Cleanup agents and call relation on hangup
   */
  private static handleCallHangup = async function (event: any) {
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
