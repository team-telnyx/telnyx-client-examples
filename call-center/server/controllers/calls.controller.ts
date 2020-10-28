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

interface ICallControlEventPayload {
  state: string;
  call_control_id: string;
  connection_id: string;
  from: string;
  to: string;
  direction: string;
  client_state?: string;
}

interface ICallControlEvent {
  event_type: string;
  payload: ICallControlEventPayload;
}

interface IClientState {
  // Define your own call states to direct the flow of the call
  // through your application
  appCallState?: string;
  appConferenceId?: string;
  appConferenceOptions?: object;
  transferrerTelnyxCallControlId?: string;
}

interface ICreateCallParams {
  from: string;
  to: string;
  connectionId: string;
  clientCallState?: CallLegClientCallState;
  telnyxCallOptions?: Object;
  appConference?: Conference;
}

interface ICreateConferenceParams {
  from: string;
  to: string;
  direction: string;
  callControlId: string;
  telnyxConferenceOptions?: Object;
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

  // Initiate an outgoing call
  public static dial = async function (req: Request, res: Response) {
    let { initiatorSipUsername, to } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      // Create a call leg back into our call center
      // IDEA Create a separate phone number or webhook to handle
      // routing calls instead of checking to/from in CC event
      let appCall = await CallsController.createCall({
        to: process.env.TELNYX_SIP_OB_NUMBER!,
        from,
        connectionId: process.env.TELNYX_CC_APP_ID!,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'initiate_dial',
          }),
        },
      });

      let telnyxCall = new telnyx.Call({
        call_control_id: appCall.telnyxCallControlId,
      });

      // NOTE Call must be answered before creating a conference
      await telnyxCall.answer();

      // Create a conference
      let appConference = await CallsController.createConference({
        to,
        from: `sip:${initiatorSipUsername}@sip.telnyx.com`,
        direction: CallLegDirection.OUTGOING,
        callControlId: appCall.telnyxCallControlId,
      });

      // Create a call leg for the agent who initiated the call
      await CallsController.createCall({
        to: `sip:${initiatorSipUsername}@sip.telnyx.com`,
        from,
        connectionId: process.env.TELNYX_CC_APP_ID!,
        clientCallState: CallLegClientCallState.AUTO_ANSWER,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appConference.id,
            // Specify that we should hang up on the call center call leg
            // after joining the conference
            transferrerTelnyxCallControlId: appCall.telnyxCallControlId,
          }),
        },
        appConference,
      });

      // Create the outgoing call leg
      let appOutgoingCall = await CallsController.createCall({
        to,
        from,
        connectionId: process.env.TELNYX_CC_APP_ID!,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appConference.id,
          }),
        },
        appConference,
      });

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

  // Invite an agent or phone number to join another agent's conference call
  public static invite = async function (req: Request, res: Response) {
    let { to, telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appInviterCallLeg = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
        },
        relations: ['conference'],
      });

      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallsController.createCall({
        to,
        from,
        connectionId: appInviterCallLeg.telnyxConnectionId,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appInviterCallLeg.conference.id,
          }),
        },
        appConference: appInviterCallLeg.conference,
      });

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
    let { to, telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appTransfererCallLeg = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
        },
        relations: ['conference'],
      });

      let from = process.env.TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallsController.createCall({
        to,
        from,
        connectionId: appTransfererCallLeg.telnyxConnectionId,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appTransfererCallLeg.conference.id,
          }),
        },
        appConference: appTransfererCallLeg.conference,
      });

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
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
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
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
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
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getManager().getRepository(CallLeg);
      let appCall = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
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
      let event: ICallControlEvent = req.body.data;
      let eventPayload = event.payload;

      let {
        state,
        client_state,
        call_control_id,
        connection_id,
        from,
        to,
        direction,
      } = eventPayload;

      let clientState = decodeClientState(client_state);

      console.log('=== clientState ===', clientState);

      let callLegRepository = getManager().getRepository(CallLeg);

      // Create a new Telnyx Call in order to issue call control commands
      let telnyxCall = new telnyx.Call({
        call_control_id,
      });

      switch (event.event_type) {
        case 'call.initiated': {
          /*
           * Only answering parked calls because we also get the call.initiated
           * event for the second leg of the call
           */
          if (
            direction === 'incoming' &&
            state === 'parked' &&
            !client_state &&
            // IDEA Create a separate phone number or webhook to handle
            // routing calls instead of checking to/from in CC event
            !(from === process.env.TELNYX_SIP_OB_NUMBER && to === from)
          ) {
            await CallsController.answerIncomingParkedCall(eventPayload);

            // Find the first available agent and transfer the call to them.
            // You may want more complex functionality here, such as transferring
            // the call to multiple available agents and then assigning the call
            // to the first agent who answers.
            let availableAgent = await CallsController.getAvailableAgent();

            if (availableAgent) {
              await CallsController.startConferenceWithAgent(
                eventPayload,
                availableAgent
              );
            } else {
              // Handle when no agents are available to transfer the call

              await CallsController.speakNoAvailableAgents(eventPayload);
            }
          }
          break;
        }

        case 'call.answered': {
          // Handle a call answered from a call center dial

          if (
            clientState.appCallState === 'join_conference' &&
            clientState.appConferenceId
          ) {
            await CallsController.joinConference(eventPayload);
          }

          break;
        }

        case 'call.speak.ended': {
          if (clientState.appCallState === 'speak_no_available_agents') {
            await telnyxCall.hangup();
          }

          break;
        }

        case 'conference.participant.joined': {
          try {
            // Mark call as active in our DB
            let appCall = await callLegRepository.findOneOrFail({
              telnyxCallControlId: call_control_id,
            });
            appCall.status = CallLegStatus.ACTIVE;
            callLegRepository.save(appCall);
          } catch (e) {
            console.error(e);
          }

          break;
        }

        case 'call.hangup': {
          try {
            // Find the leg that hung up, and save it as inactive
            let appCall = await callLegRepository.findOneOrFail({
              telnyxCallControlId: call_control_id?.toString(),
            });
            appCall.status = CallLegStatus.INACTIVE;
            callLegRepository.save(appCall);
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

  private static async answerIncomingParkedCall(
    eventPayload: ICallControlEventPayload
  ) {
    // Access database repository to perform database operations
    let callLegRepository = getManager().getRepository(CallLeg);

    // Create a new Telnyx Call in order to issue call control commands
    let telnyxCall = new telnyx.Call({
      call_control_id: eventPayload.call_control_id,
    });

    // Create a new call in our database so that we can retrieve call
    // information on the frontend
    let appIncomingCallLeg = new CallLeg();
    appIncomingCallLeg.from = eventPayload.from;
    appIncomingCallLeg.to = eventPayload.to;
    appIncomingCallLeg.direction = CallLegDirection.INCOMING;
    appIncomingCallLeg.telnyxCallControlId = eventPayload.call_control_id;
    appIncomingCallLeg.telnyxConnectionId = eventPayload.connection_id;
    appIncomingCallLeg.clientCallState = CallLegClientCallState.DEFAULT;
    appIncomingCallLeg.muted = false;

    await callLegRepository.save(appIncomingCallLeg);

    // Answer the call to initiate transfer to agent or speak
    await telnyxCall.answer();
  }

  private static async startConferenceWithAgent(
    eventPayload: ICallControlEventPayload,
    agent: Agent
  ) {
    // Access database repository to perform database operations
    let callLegRepository = getManager().getRepository(CallLeg);
    let appIncomingCallLeg = await callLegRepository.findOneOrFail({
      telnyxCallControlId: eventPayload.call_control_id,
    });

    // Create a new Telnyx Conference to organize & issue commands
    // to multiple call legs at once and save it to our DB
    let appConference = await CallsController.createConference({
      from: eventPayload.from,
      to: eventPayload.to,
      direction: eventPayload.direction,
      callControlId: eventPayload.call_control_id,
      telnyxConferenceOptions: {
        // Place caller on hold until agent joins the call
        hold_audio_url: process.env.HOLD_AUDIO_URL,
        start_conference_on_create: false,
      },
    });

    // Add call to conference
    appIncomingCallLeg.conference = appConference;
    await callLegRepository.save(appIncomingCallLeg);

    // Call the agent to invite them to join the conference call
    await CallsController.createCall({
      to: `sip:${agent.sipUsername}@sip.telnyx.com`,
      from: eventPayload.from,
      connectionId: eventPayload.connection_id,
      telnyxCallOptions: {
        // IDEA Specify a short answer timeout so that you can quickly
        // rotate to a different agent if one doesn't answer within X
        timeout_secs: 60,
        client_state: encodeClientState({
          appCallState: 'join_conference',
          appConferenceId: appConference.id,
          appConferenceOptions: {
            // Start the conference upon joining. This will also stop the
            // hold music playing for the caller
            start_conference_on_enter: true,
          },
        }),
      },
      appConference,
    });
  }

  private static async speakNoAvailableAgents(
    eventPayload: ICallControlEventPayload
  ) {
    // Create a new Telnyx Call in order to issue call control commands
    let telnyxCall = new telnyx.Call({
      call_control_id: eventPayload.call_control_id,
    });

    await telnyxCall.speak({
      // All following fields are required:
      language: 'en-US',
      payload: 'Sorry, there are no agents available to take your call.',
      voice: 'female',
      // Use client state to let our app know we should hangup after call ends
      client_state: encodeClientState({
        // Include a custom call state so that we know how to direct
        // the call flow when handling the `call.speak.ended` event
        appCallState: 'speak_no_available_agents',
      }),
    });
  }

  private static async joinConference(eventPayload: ICallControlEventPayload) {
    let clientState = decodeClientState(eventPayload.client_state);

    // Access database repository to perform database operations
    let conferenceRepository = getManager().getRepository(Conference);
    let appConference = await conferenceRepository.findOneOrFail(
      clientState.appConferenceId
    );

    // Join the conference with the original caller
    let telnyxConference = await new telnyx.Conference({
      id: appConference.telnyxConferenceId,
    });

    await telnyxConference.join({
      call_control_id: eventPayload.call_control_id,
      ...clientState.appConferenceOptions,
    });

    // Check if we should hang up the conference creator
    // after joining the conference
    if (clientState.transferrerTelnyxCallControlId) {
      let telnyxCall = new telnyx.Call({
        call_control_id: clientState.transferrerTelnyxCallControlId,
      });

      await telnyxCall.hangup();
    }
  }

  private static createConference = async function ({
    from,
    to,
    direction,
    callControlId,
    telnyxConferenceOptions,
  }: ICreateConferenceParams) {
    let conferenceRepository = getManager().getRepository(Conference);
    let { data: telnyxConference } = await telnyx.conferences.create({
      name: `Call ${
        direction === CallLegDirection.OUTGOING ? `to ${to}` : `from ${from}`
      } at ${Date.now()}`,
      call_control_id: callControlId,
      ...telnyxConferenceOptions,
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
    appConference,
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
    appOutgoingCall.telnyxCallControlId = telnyxOutgoingCall.call_control_id;
    appOutgoingCall.telnyxConnectionId = connectionId;
    appOutgoingCall.clientCallState =
      clientCallState || CallLegClientCallState.DEFAULT;
    appOutgoingCall.muted = false;

    if (appConference) {
      appOutgoingCall.conference = appConference;
    }

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
