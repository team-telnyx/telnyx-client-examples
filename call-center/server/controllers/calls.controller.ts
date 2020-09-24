import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { CallLeg } from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';
import { Agent } from '../entities/agent.entity';
import { format } from 'path';

let telnyxPackage: any = require('telnyx');

interface IClientState {
  // Define your own call states to direct the flow of the call
  // through your application
  // appCallLegId: string;
  appCallState?: string;
  appConferenceId?: string;
}

class CallsController {
  public static bridge = async function (req: Request, res: Response) {
    // TODO Move `telnyx` declaration to module import once issue is re-fixed:
    // https://github.com/team-telnyx/telnyx-node/issues/26
    let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

    let { call_control_id, to } = req.body.data;
    let callToBridge = await telnyx.calls.create({
      connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
      from: process.env.TELNYX_SIP_OB_NUMBER,
      to,
    });

    callToBridge.bridge({ call_control_id });
    res.json({});
  };

  // Invite an agent or phone number to join another agent's conference call
  public static invite = async function (req: Request, res: Response) {
    // TODO Move `telnyx` declaration to module import once issue is re-fixed:
    // https://github.com/team-telnyx/telnyx-node/issues/26
    let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

    let { inviterSipUsername, to } = req.body;

    try {
      // Find the correct call leg by inviter's SIP username
      let callLegRepository = getManager().getRepository(CallLeg);
      let appInviterCallLeg = await callLegRepository.findOneOrFail({
        where: {
          // status: '',
          to: `sip:${inviterSipUsername}@sip.telnyx.com`,
        },
        relations: ['conference'],
      });

      // NOTE Specifying the host SIP username doesn't seem to work,
      // possibly because connection ID relationship?
      // let from = `sip:${inviterSipUsername}@sip.telnyx.com`;
      let from = process.env.TELNYX_SIP_OB_NUMBER || '';

      let { agentTelnyxCall } = await telnyx.calls.create({
        to,
        from,
        connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
        client_state: encodeClientState({
          appCallState: 'dial_agent',
          appConferenceId: appInviterCallLeg.conference.id,
        }),
      });

      // Save newly created leg to our database
      let appAgentCallLeg = new CallLeg();
      appAgentCallLeg.from = from;
      appAgentCallLeg.to = to;
      appAgentCallLeg.telnyxCallControlId = agentTelnyxCall.call_control_id;
      appAgentCallLeg.conference = appInviterCallLeg.conference;

      await callLegRepository.save(appAgentCallLeg);

      res.json({
        data: agentTelnyxCall,
      });
    } catch (e) {
      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  /*
   * Directs the call flow based on the Call Control event type
   */
  public static callControl = async function (req: Request, res: Response) {
    // TODO Move `telnyx` declaration to module import once issue is re-fixed:
    // https://github.com/team-telnyx/telnyx-node/issues/26
    let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

    console.log('\n\n/callbacks/call-control-app | req body', req.body);

    try {
      let event = req.body;

      let {
        state,
        client_state,
        call_control_id,
        connection_id,
        from,
        to,
        sip_hangup_cause,
        hangup_source,
      } = event.data.payload;

      let clientState = decodeClientState(client_state);

      console.log('=== clientState ===', clientState);

      let callLegRepository = getManager().getRepository(CallLeg);
      let conferenceRepository = getManager().getRepository(Conference);

      // Create a new Telnyx Call in order to issue call control commands
      let telnyxCall = new telnyx.Call({
        call_control_id,
      });

      switch (event.data.event_type) {
        case 'call.initiated': {
          /*
           * Only answering parked calls because we also get the call.initiated
           * event for the second leg of the call
           */
          if (state === 'parked') {
            // Create a new call in our database so that we can retrieve call
            // information on the frontend
            let appIncomingCallLeg = new CallLeg();
            appIncomingCallLeg.from = from;
            appIncomingCallLeg.to = to;
            appIncomingCallLeg.telnyxCallControlId = call_control_id;

            await callLegRepository.save(appIncomingCallLeg);

            // Answer the call to initiate transfer to agent
            await telnyxCall.answer({
              // Use client state to pass around data between webhook events
              client_state: encodeClientState({
                // Include a custom call state so that we know how to direct
                // the call flow in call control event handlers:
                appCallState: 'answer_incoming_parked',
              }),
            });
          }

          break;
        }

        case 'call.answered': {
          if (clientState.appCallState === 'answer_incoming_parked') {
            // Handle a call answered by our application

            // Find the first available agent and transfer the call to them.
            // You may want more complex functionality here, such as transferring
            // the call to multiple available agents and then assigning the call
            // to the first agent who answers.
            let availableAgent = await CallsController.getAvailableAgent();

            if (availableAgent) {
              // Create a new Telnyx Conference to organize & issue commands
              // to multiple call legs at once
              let { data: telnyxConference } = await telnyx.conferences.create({
                name: `Call from ${from}`,
                call_control_id,
              });

              // Save the conference and incoming call in our database so that we can
              // retrieve call control IDs later on user interaction
              let appConference = new Conference();
              let appIncomingCallLeg = await callLegRepository.findOneOrFail({
                telnyxCallControlId: call_control_id,
              });
              appConference.telnyxConferenceId = telnyxConference.id;
              appConference.from = from;
              appConference.callLegs = [appIncomingCallLeg];

              await conferenceRepository.save(appConference);

              // Place caller on hold
              await telnyxConference.hold({
                call_control_id,
                hold_audio_url: process.env.HOLD_AUDIO_URL,
              });

              // Call the agent to invite them to join the conference call
              let { data: agentTelnyxCall } = await telnyx.calls.create({
                to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
                from,
                connection_id,
                // Pass in original call's call control ID in order to share the
                // same call session ID:
                link_to: call_control_id,
                // IDEA Specify a short answer timeout so that you can quickly
                // rotate to a different agent if one doesn't answer within X
                timeout_secs: 60,
                client_state: encodeClientState({
                  appCallState: 'dial_agent',
                  appConferenceId: appConference.id,
                }),
              });

              // Save newly created leg to our database
              let appAgentCallLeg = new CallLeg();
              appAgentCallLeg.from = from;
              appAgentCallLeg.to = to;
              appAgentCallLeg.telnyxCallControlId =
                agentTelnyxCall.call_control_id;
              appAgentCallLeg.conference = appConference;

              await callLegRepository.save(appAgentCallLeg);
            } else {
              // Handle when no agents are available to transfer the call

              await telnyxCall.speak({
                // All following fields are required:
                language: 'en-US',
                payload:
                  'Sorry, there are no agents available to take your call.',
                voice: 'female',
                // Use client state to let our app know we should hangup after call ends
                client_state: encodeClientState({
                  // Include a custom call state so that we know how to direct
                  // the call flow when handling the `call.speak.ended` event
                  appCallState: 'speak_no_available_agents',
                }),
              });
            }
          } else if (clientState.appCallState === 'dial_agent') {
            // Handle a call answered by an agent logged into the WebRTC client

            if (clientState.appConferenceId) {
              let appConference = await conferenceRepository.findOneOrFail(
                clientState.appConferenceId,
                {
                  relations: ['callLeg'],
                }
              );

              // Join the conference with the original caller
              let telnyxConference = await new telnyx.Conference({
                id: appConference.telnyxConferenceId,
              });

              telnyxConference.join({
                call_control_id,
              });

              // Stop playing hold music
              telnyxConference.unhold({
                call_control_ids: appConference.callLegs.map(
                  (callLeg) => callLeg.telnyxCallControlId
                ),
              });
            }
          }

          break;
        }

        case 'call.speak.ended': {
          if (clientState.appCallState === 'speak_no_available_agents') {
            await telnyxCall.hangup();
          }

          break;
        }

        default:
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

export default CallsController;
