import { Request, Response } from 'express';
import { FindManyOptions, getManager } from 'typeorm';
import {
  CallLeg,
  CallLegStatus,
  CallLegClientCallState,
  CallLegDirection,
} from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';
import { Agent } from '../entities/agent.entity';
import { format } from 'path';

let telnyxPackage: any = require('telnyx');
let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

interface IClientState {
  // Define your own call states to direct the flow of the call
  // through your application
  appCallState?: string;
  appConferenceId?: string;
  clientCallDestination?: string;
}

interface ICreateCallParams {
  from: string;
  to: string;
  connectionId: string;
  clientCallState?: CallLegClientCallState;
  telnyxCallOptions?: Object;
}

interface ICreateConferenceParams {
  from: string;
  to: string;
  direction: string;
  callControlId: string;
  options?: Object;
}

class CallsController {
  public static get = async function (req: Request, res: Response) {
    let { limit, ...callLegQuery } = req.query;
    let findOpts = {
      // NOTE You'll likely want to do some validation here
      // to check for valid columns to query
      where: callLegQuery,
    } as FindManyOptions;

    if (limit) {
      findOpts.take = parseInt(limit as string);
    }

    try {
      let callLegRepository = getManager().getRepository(CallLeg);

      res.json({
        calls: await callLegRepository.find(findOpts),
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

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

  // Initiate an outgoing call
  // Calls from the client are identified by a temporary client call
  // initiation UUID, which tells the server create a conference call
  // between the client (agent) and the final call destination
  public static dial = async function (req: Request, res: Response) {
    let { initiatorSipUsername, to } = req.body;

    try {
      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      let appAgentCall = await CallsController.createCall({
        to: `sip:${initiatorSipUsername}@sip.telnyx.com`,
        from,
        connectionId: process.env.TELNYX_CC_APP_ID!,
        clientCallState: CallLegClientCallState.AUTO_ANSWER,
        telnyxCallOptions: {
          // Client state tells our call control handler how to
          // route this call after the agent answers
          client_state: encodeClientState({
            appCallState: 'initiate_dial',
            clientCallDestination: to,
          }),
        },
      });

      res.json({
        data: appAgentCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  // Invite an agent or phone number to join another agent's conference call
  public static invite = async function (req: Request, res: Response) {
    let { initiatorSipUsername, to } = req.body;

    try {
      // Find the correct call leg and conference by inviter's SIP username
      // TODO Once INIT-1896 is done, the WebRTC SDK will expose the Call Control
      // ID. We will be able to ask for the conference related to the Call
      // Control ID directly instead of infering from its participant SIP address
      let callLegRepository = getManager().getRepository(CallLeg);
      let appInviterCallLeg = await callLegRepository.findOneOrFail({
        where: {
          status: CallLegStatus.ACTIVE,
          to: `sip:${initiatorSipUsername}@sip.telnyx.com`,
        },
        relations: ['conference'],
      });

      // NOTE Specifying the host SIP username doesn't seem to work,
      // possibly because connection ID relationship?
      // let from = `sip:${initiatorSipUsername}@sip.telnyx.com`;
      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallsController.createCall({
        to,
        from,
        connectionId: appInviterCallLeg.telnyxConnectionId,
        telnyxCallOptions: CallsController.isToAgent(to)
          ? CallsController.getDialAgentOptions({
              appConferenceId: appInviterCallLeg.conference.id,
            })
          : undefined,
      });

      // Add outgoing call to conference
      appOutgoingCall.conference = appInviterCallLeg.conference;
      await callLegRepository.save(appOutgoingCall);

      res.json({
        data: appOutgoingCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  // Transfer the call to an agent or phone number to join
  public static transfer = async function (req: Request, res: Response) {
    let { initiatorSipUsername, to } = req.body;

    try {
      // Find the correct call leg and conference by transferer's SIP username
      // TODO Once INIT-1896 is done, the WebRTC SDK will expose the Call Control
      // ID. We will be able to ask for the conference related to the Call
      // Control ID directly instead of infering from its participant SIP address
      let callLegRepository = getManager().getRepository(CallLeg);
      let appTransfererCallLeg = await callLegRepository.findOneOrFail({
        where: {
          status: CallLegStatus.ACTIVE,
          to: `sip:${initiatorSipUsername}@sip.telnyx.com`,
        },
        relations: ['conference'],
      });

      // NOTE Specifying the host SIP username doesn't seem to work,
      // possibly because connection ID relationship?
      // let from = `sip:${initiatorSipUsername}@sip.telnyx.com`;
      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallsController.createCall({
        to,
        from,
        connectionId: appTransfererCallLeg.telnyxConnectionId,
        telnyxCallOptions: CallsController.isToAgent(to)
          ? CallsController.getDialAgentOptions({
              appConferenceId: appTransfererCallLeg.conference.id,
            })
          : undefined,
      });

      // Add outgoing call to conference
      appOutgoingCall.conference = appTransfererCallLeg.conference;
      await callLegRepository.save(appOutgoingCall);

      // Create a new Telnyx Call in order to issue call control commands
      // to the transferer call leg
      let transfererCall = new telnyx.Call({
        call_control_id: appTransfererCallLeg.telnyxCallControlId,
      });

      // Hang the transferer up
      transfererCall.hangup();

      res.json({
        data: appOutgoingCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  // Mute a call
  // NOTE call must be active participant in a conference
  public static mute = async function (req: Request, res: Response) {
    let { participant } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          status: CallLegStatus.ACTIVE,
          to: participant,
        },
        relations: ['conference'],
      });
      let appConference = appCall.conference;

      // Create a new Telnyx Conference in order to issue call control
      // commands to the participating call leg
      let telnyxConference = new telnyx.Conference({
        id: appConference.telnyxConferenceId,
      });

      await telnyxConference.mute({
        call_control_ids: [appCall.telnyxCallControlId],
      });

      // Mark call as muted in app db
      appCall.muted = true;
      await callLegRepository.save(appCall);

      res.json({
        data: appCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  // Unmute a call
  // NOTE call must be active participant in a conference
  public static unmute = async function (req: Request, res: Response) {
    let { participant } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          status: CallLegStatus.ACTIVE,
          to: participant,
        },
        relations: ['conference'],
      });
      let appConference = appCall.conference;

      // Create a new Telnyx Conference in order to issue call control
      // commands to the participating call leg
      let telnyxConference = new telnyx.Conference({
        id: appConference.telnyxConferenceId,
      });

      await telnyxConference.unmute({
        call_control_ids: [appCall.telnyxCallControlId],
      });

      // Mark call as unmuted in app db
      appCall.muted = false;
      await callLegRepository.save(appCall);

      res.json({
        data: appCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  // Hang up a call by the specified destination, e.g. to remove a number
  // from a conference call
  public static hangup = async function (req: Request, res: Response) {
    let { participant } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          status: CallLegStatus.ACTIVE,
          to: participant,
        },
      });

      // Create a new Telnyx Call in order to issue call control commands
      // to the call leg to hang up
      let telnyxCall = new telnyx.Call({
        call_control_id: appCall.telnyxCallControlId,
      });

      // Hang up the call
      await telnyxCall.hangup();

      res.json({
        data: appCall,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  /*
   * Directs the call flow based on the Call Control event type
   */
  public static callControl = async function (req: Request, res: Response) {
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
        direction,
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
          if (direction === 'incoming' && state === 'parked' && !client_state) {
            // Create a new call in our database so that we can retrieve call
            // information on the frontend
            let appIncomingCallLeg = new CallLeg();
            appIncomingCallLeg.from = from;
            appIncomingCallLeg.to = to;
            appIncomingCallLeg.direction = CallLegDirection.INCOMING;
            appIncomingCallLeg.telnyxCallControlId = call_control_id;
            appIncomingCallLeg.telnyxConnectionId = connection_id;
            appIncomingCallLeg.clientCallState = CallLegClientCallState.DEFAULT;
            appIncomingCallLeg.muted = false;

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
              // to multiple call legs at once and save it to our DB
              let appConference = await CallsController.createConference({
                from,
                to,
                direction,
                callControlId: call_control_id,
                options: {
                  // Place caller on hold until agent joins the call
                  hold_audio_url: process.env.HOLD_AUDIO_URL,
                  start_conference_on_create: false,
                },
              });

              // Save incoming call leg status as active and add to conference
              let appIncomingCallLeg = await callLegRepository.findOneOrFail({
                telnyxCallControlId: call_control_id,
              });
              appIncomingCallLeg.status = CallLegStatus.ACTIVE;
              appIncomingCallLeg.conference = appConference;
              await callLegRepository.save(appIncomingCallLeg);

              // Call the agent to invite them to join the conference call
              let appOutgoingCall = await CallsController.createCall({
                to: `sip:${availableAgent.sipUsername}@sip.telnyx.com`,
                from,
                connectionId: connection_id,
                telnyxCallOptions: CallsController.getDialAgentOptions({
                  appConferenceId: appConference.id,
                }),
              });

              // Add outgoing call to conference
              appOutgoingCall.conference = appConference;
              await callLegRepository.save(appOutgoingCall);
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
          } else if (clientState.appCallState === 'dial') {
            // Handle a call answered by an agent logged into the WebRTC client

            if (clientState.appConferenceId) {
              let appConference = await conferenceRepository.findOneOrFail(
                clientState.appConferenceId
              );

              // Join the conference with the original caller
              let telnyxConference = await new telnyx.Conference({
                id: appConference.telnyxConferenceId,
              });

              await telnyxConference.join({
                call_control_id,
                // Start the conference upon joining. This will also stop the
                // hold music playing for the caller
                start_conference_on_enter: true,
              });
            }
          } else if (
            clientState.appCallState === 'initiate_dial' &&
            clientState.clientCallDestination
          ) {
            // Handle the first leg of the call created in an outgoing call

            console.log('initiate dial');

            // Create new conference
            let appConference = await CallsController.createConference({
              from: to,
              to: clientState.clientCallDestination,
              direction: CallLegDirection.OUTGOING,
              callControlId: call_control_id,
            });

            // Create outgoing call
            await CallsController.createCall({
              from,
              to: clientState.clientCallDestination,
              connectionId: process.env.TELNYX_CC_APP_ID!,
              telnyxCallOptions: {
                client_state: encodeClientState({
                  appCallState: 'dial',
                  appConferenceId: appConference.id,
                }),
              },
            });
          }

          break;
        }

        case 'conference.participant.joined': {
          break;
        }

        case 'call.speak.ended': {
          if (clientState.appCallState === 'speak_no_available_agents') {
            await telnyxCall.hangup();
          }

          break;
        }

        case 'call.hangup': {
          try {
            // Find the leg that hung up, and save it as inactive
            let appCallLeg = await callLegRepository.findOneOrFail({
              telnyxCallControlId: call_control_id?.toString(),
            });
            appCallLeg.status = CallLegStatus.INACTIVE;
            callLegRepository.save(appCallLeg);
          } catch (e) {
            console.error(e);
          }

          break;
        }

        default:
          break;
      }
    } catch (e) {
      console.error(e);

      if (e?.raw?.errors) {
        console.error(e.raw.errors);
      }

      res.status(500).json({ error: e });
    }

    res.json({});
  };

  private static isToAgent = function (to: string) {
    return to.endsWith('@sip.telnyx.com');
  };

  private static getSipUsernameFromTo = function (to: string) {
    return to.substring(to.indexOf(':') + 1, to.indexOf('@sip'));
  };

  private static getDialAgentOptions = function ({
    appConferenceId,
  }: {
    appConferenceId: string;
  }) {
    return {
      // IDEA Specify a short answer timeout so that you can quickly
      // rotate to a different agent if one doesn't answer within X
      timeout_secs: 60,
      client_state: encodeClientState({
        appCallState: 'dial',
        appConferenceId,
      }),
    };
  };

  private static createConference = async function ({
    from,
    to,
    direction,
    callControlId,
    options,
  }: ICreateConferenceParams) {
    // let callLegRepository = getManager().getRepository(CallLeg);
    let conferenceRepository = getManager().getRepository(Conference);
    let { data: telnyxConference } = await telnyx.conferences.create({
      name: `Call ${
        direction === CallLegDirection.OUTGOING ? `to ${to}` : `from ${from}`
      } at ${Date.now()}`,
      call_control_id: callControlId,
      ...options,
    });

    // Save the conference in our database so that we can
    // retrieve call control IDs later on user interaction
    let appConference = new Conference();
    appConference.telnyxConferenceId = telnyxConference.id;
    appConference.from = from;
    appConference.to = to;

    return await conferenceRepository.save(appConference);
  };

  private static createCall = async function ({
    from,
    to,
    connectionId,
    clientCallState,
    telnyxCallOptions,
  }: ICreateCallParams) {
    let callLegRepository = getManager().getRepository(CallLeg);

    let { data: telnyxOutgoingCall } = await telnyx.calls.create({
      to,
      from,
      connection_id: connectionId,
      ...telnyxCallOptions,
    });

    // Save newly created leg to our database
    let appOutgoingCall = new CallLeg();
    appOutgoingCall.to = to;
    appOutgoingCall.from = from;
    appOutgoingCall.direction = CallLegDirection.OUTGOING;
    appOutgoingCall.status = CallLegStatus.ACTIVE;
    appOutgoingCall.telnyxCallControlId = telnyxOutgoingCall.call_control_id;
    appOutgoingCall.telnyxConnectionId = connectionId;
    appOutgoingCall.clientCallState =
      clientCallState || CallLegClientCallState.DEFAULT;
    appOutgoingCall.muted = false;

    return await callLegRepository.save(appOutgoingCall);
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
export function encodeClientState(data: IClientState) {
  let jsonStr = JSON.stringify(data);
  let buffer = Buffer.from(jsonStr);

  return buffer.toString('base64');
}

export function decodeClientState(data?: string): Partial<IClientState> {
  if (!data) return {};

  let buffer = Buffer.from(data, 'base64');
  let str = buffer.toString('ascii');

  return JSON.parse(str);
}

export default CallsController;
