import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';

let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

// Define your own call states to direct the flow of the call
// through your application
enum AppCallStates {
  AnswerIncomingParked = 'answer_incoming_parked',
  TransferToAgent = 'transfer_to_agent',
  SpeakNoAvailableAgents = 'speak_no_available_agents',
}

interface IClientState {
  appCallState: AppCallStates;
}

// The Telnyx Call Control API expects the client state to be
// base64 encoded, so we have our encode/decode helpers here
function encodeClientState(data: IClientState) {
  let jsonStr = JSON.stringify(data);
  let buffer = Buffer.from(jsonStr);

  return buffer.toString('base64');
}

function decodeClientState(data?: string): Partial<IClientState> {
  if (!data) return {};

  let buffer = Buffer.from(data, 'base64');
  let str = buffer.toString('ascii');

  return JSON.parse(str);
}

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

  /*
   * Directs the call flow based on the Call Control event type
   */
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
      console.error(e);

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
    let { state, call_control_id, call_session_id, from } = event.data.payload;

    /*
     * Only answering parked calls because we also get the call.initiated
     * event for the second leg of the call
     */
    if (state === 'parked') {
      // Create a new call in our database so that we have
      // a historical record of calls answered by agents
      let callRepository = getManager().getRepository(Call);

      let call = new Call();
      call.callSessionId = call_session_id;
      call.from = from;

      await callRepository.save(call);

      // Create a new Telnyx Call in order to issue call control commands
      let telnyxCall = new telnyx.Call({
        call_control_id,
      });

      telnyxCall.answer({
        client_state: encodeClientState({
          // Include a custom call state so that we know how to direct
          // the call flow when handling the `call.answered` event
          appCallState: AppCallStates.AnswerIncomingParked,
        }),
      });
    }
  };

  private static handleAnswered = async function (event: any) {
    let {
      call_control_id,
      call_session_id,
      to,
      client_state,
    } = event.data.payload;
    let callRepository = getManager().getRepository(Call);
    let call = await callRepository.findOneOrFail({
      callSessionId: call_session_id,
    });

    // Create a new Telnyx Call in order to issue call control commands
    let telnyxCall = new telnyx.Call({
      call_control_id,
    });

    let clientState = decodeClientState(client_state);

    if (clientState.appCallState === AppCallStates.AnswerIncomingParked) {
      // Handle a call answered by our application

      // Find the first available agent and transfer the call to them.
      // You may want more complex functionality here, such as transferring
      // the call to multiple available agents and then assigning the call
      // to the first agent who answers.
      let availableAgent = await CallsController.getAvailableAgent();

      if (availableAgent) {
        telnyxCall.transfer({
          to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
          // NOTE Client state only persists on original call
          client_state: encodeClientState({
            // Include a custom call state so that we know how to direct
            // the call flow when handling the `call.answered` event
            appCallState: AppCallStates.TransferToAgent,
          }),
        });
      } else {
        // Handle when no agents are available to answer the call

        telnyxCall.speak({
          // Use client state to let our app know we should hangup after call ends
          client_state: encodeClientState({
            // Include a custom call state so that we know how to direct
            // the call flow when handling the `call.speak.ended` event
            appCallState: AppCallStates.SpeakNoAvailableAgents,
          }),
          // All following fields are required:
          language: 'en-US',
          payload: 'Sorry, there are no agents available to take your call.',
          voice: 'female',
        });
      }
    } else {
      // Handle a call answered by an agent logged into the WebRTC client

      let sipUsername = to.substring(to.indexOf(':') + 1, to.indexOf('@sip'));

      if (sipUsername) {
        // Save a record of who answered the call in our app database
        let agentRepository = getManager().getRepository(Agent);
        let agent = await agentRepository.findOneOrFail({
          sipUsername,
        });

        agent.available = false;

        if (agent.calls) {
          agent.calls.push(call);
        } else {
          agent.calls = [call];
        }

        agentRepository.save(agent);
      }
    }
  };

  private static handleSpeakEnded = async function (event: any) {
    let { call_control_id, client_state } = event.data.payload;
    let clientState = decodeClientState(client_state);

    if (clientState.appCallState === AppCallStates.SpeakNoAvailableAgents) {
      let telnyxCall = new telnyx.Call({
        call_control_id,
      });

      telnyxCall.hangup();
    }
  };

  /*
   * Cleanup agents and call relation on hangup
   */
  private static handleHangup = async function (event: any) {
    // let callRepository = getManager().getRepository(Call);
    let { call_session_id, client_state } = event.data.payload;
    let clientState = decodeClientState(client_state);

    if (clientState.appCallState === AppCallStates.TransferToAgent) {
      let callRepository = getManager().getRepository(Call);
      let call = await callRepository.findOneOrFail({
        where: {
          callSessionId: call_session_id,
        },
        relations: ['agents'],
      });

      if (call.agents) {
        // IDEA In production, you'll likely want to add some time here for
        // agent(s) to finish up tasks associated with the call before
        // marking them as available again.
        call.agents.forEach((agent) => {
          agent.available = true;
        });

        // Saves both ways because of cascade rules:
        callRepository.save(call);
      }
    }
  };
}

export default CallsController;
