import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';
import { format } from 'path';

let telnyxPackage: any = require('telnyx');

interface IClientState {
  // Define your own call states to direct the flow of the call
  // through your application
  appCallId: string;
  appCallState: string;
  aLegCallControlId: string;
  agentSipUsername?: string;
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

      let callRepository = getManager().getRepository(Call);

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
            // Create a new call in our database so that we have
            // a historical record of calls answered by agents
            let call = new Call();
            call.from = from;

            let { id } = await callRepository.save(call);

            // Answer the call to initiate transfer to agent
            await telnyxCall.answer({
              client_state: encodeClientState({
                appCallId: id,
                // Include a custom call state so that we know how to direct
                // the call flow in call control event handlers:
                appCallState: 'A_answer_incoming_parked',
                // Pass along the original call control ID so that events
                // coming from a bridged call can still issue commands to
                // and from the original call (i.e. A leg):
                aLegCallControlId: call_control_id,
              }),
            });
          }

          break;
        }

        case 'call.answered': {
          if (!clientState.appCallId || !clientState.aLegCallControlId) {
            // TODO Better edge case handling; app got into a bad state
            return telnyxCall.hangup();
          }

          if (clientState.appCallState === 'A_answer_incoming_parked') {
            // Handle a call answered by our application

            // Find the first available agent and transfer the call to them.
            // You may want more complex functionality here, such as transferring
            // the call to multiple available agents and then assigning the call
            // to the first agent who answers.
            let availableAgent = await CallsController.getAvailableAgent();

            if (availableAgent) {
              // Start playing hold music
              await telnyxCall.playback_start({
                // Audio file needs to be hosted somewhere that can be reached
                // via a public URL
                audio_url: process.env.HOLD_AUDIO_URL,
                loop: 'infinity',
                client_state: encodeClientState({
                  appCallId: clientState.appCallId,
                  appCallState: 'A_start_hold_audio',
                  aLegCallControlId: clientState.aLegCallControlId,
                }),
              });

              // Initiate transfer to the agent
              //
              // We're using bridging a brand new call instead transferring the
              // existing call for more fine grained control over the `client_state`
              // of each leg of the call.
              await telnyx.calls.create({
                to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
                from,
                connection_id,
                // Pass in original call's call control ID in order to share the
                // same call session ID:
                link_to: call_control_id,
                // IDEA Specify a short answer timeout so that you can quickly
                // rotate to a different agent if one doesn't answer within X
                timeout_secs: 10,
                client_state: encodeClientState({
                  appCallId: clientState.appCallId,
                  appCallState: 'B_dial_agent',
                  aLegCallControlId: clientState.aLegCallControlId,
                  agentSipUsername: availableAgent.sipUsername,
                }),
              });
            } else {
              // Handle when no agents are available to transfer the call

              await telnyxCall.playback_stop();

              await telnyxCall.speak({
                // Use client state to let our app know we should hangup after call ends
                client_state: encodeClientState({
                  appCallId: clientState.appCallId,
                  // Include a custom call state so that we know how to direct
                  // the call flow when handling the `call.speak.ended` event
                  appCallState: 'speak_no_available_agents',
                  aLegCallControlId: clientState.aLegCallControlId,
                }),
                // All following fields are required:
                language: 'en-US',
                payload:
                  'Sorry, there are no agents available to take your call.',
                voice: 'female',
              });
            }
          } else if (clientState.appCallState === 'B_dial_agent') {
            // Handle a call answered by an agent logged into the WebRTC client

            // Stop playing hold music
            //
            // Since this is a transferred call we're dealing with, we need to
            // create another Telnyx Call using the original call control ID
            // in order to issue commands from the call that initiated playback.
            await new telnyx.Call({
              call_control_id: clientState.aLegCallControlId,
            }).playback_stop({
              client_state: encodeClientState({
                appCallId: clientState.appCallId,
                appCallState: 'A_stop_hold_audio',
                aLegCallControlId: clientState.aLegCallControlId,
              }),
            });

            // Bridge the call back to the original call
            await telnyxCall.bridge({
              call_control_id: clientState.aLegCallControlId,
              client_state: encodeClientState({
                appCallId: clientState.appCallId,
                appCallState: 'A_bridge_agent',
                aLegCallControlId: clientState.aLegCallControlId,
              }),
            });

            // Save a record of who answered the call in our app database
            let agentRepository = getManager().getRepository(Agent);
            let agent = await agentRepository.findOne({
              sipUsername: clientState.agentSipUsername,
            });

            // Create a conference so that agent can add other agents to the call
            let conferenceName = `${
              (agent ? agent.name : clientState.agentSipUsername) || to
            }'s Conference Room`;

            let { data: conference } = await telnyx.conferences.create({
              call_control_id,
              name: conferenceName,
              client_state: encodeClientState({
                appCallId: clientState.appCallId,
                appCallState: 'B_create_conference',
                aLegCallControlId: clientState.aLegCallControlId,
              }),
            });

            if (agent) {
              agent.available = false;
              agent.hostConferenceId = conference.id;

              let call = await callRepository.findOne(clientState.appCallId);

              if (call) {
                if (agent.calls) {
                  agent.calls.push(call);
                } else {
                  agent.calls = [call];
                }
              }

              await agentRepository.save(agent);
            } else {
              console.warn(
                'No agent found for call control ID: ',
                call_control_id
              );
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

        case 'call.hangup': {
          if (call_control_id === clientState.aLegCallControlId) {
            // Handle hangup event from the original call

            let call = await callRepository.findOneOrFail(
              clientState.appCallId,
              {
                relations: ['agents'],
              }
            );

            if (call.agents) {
              // Mark agents as available again
              //
              // IDEA In production, you'll likely want to add some time here for
              // agent(s) to finish up tasks associated with the call.
              call.agents.forEach((agent) => {
                agent.available = true;
              });

              // Saves both ways because of cascade rules:
              await callRepository.save(call);
            }
          } else {
            if (sip_hangup_cause === '404') {
              // If an agent can't be reached in production, you'll likely want to
              // reroute the bridged call to the next available agent.
              // In this example we'll just hang up the original call.
              await new telnyx.Call({
                call_control_id: clientState.aLegCallControlId,
              }).hangup();
            }

            if (hangup_source === 'callee') {
              // If an agent hangs up, hang up the original call (A leg) as well.
              // In production, you may want to issue more commands.
              await new telnyx.Call({
                call_control_id: clientState.aLegCallControlId,
              }).hangup();
            }
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
