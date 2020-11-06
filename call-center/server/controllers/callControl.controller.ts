/*
 * Manage calls programmatically using Telnyx Call Control + Conferences
 *
 * Note on variable naming: Calls and conferences in the app server database
 * are prefixed with `app`, ex: `appCall` or `appIncomingCall`. Calls and
 * conference objects returned by the Telnyx Call Control SDK are prefixed
 * with `telnyx`, ex: `telnyxConference`.
 *
 * To set up Call Control: https://developers.telnyx.com/docs/v2/call-control/quickstart
 */
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import logger from '../helpers/logger';
import {
  CallLeg,
  CallLegStatus,
  CallLegClientCallState,
  CallLegDirection,
} from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';
import { Agent } from '../entities/agent.entity';
import ICallControlEvent, {
  CallControlEventType,
  ICallControlEventPayload,
} from '../interfaces/ICallControlEvent';
import IClientState from '../interfaces/IClientState';
import ICreateCallParams from '../interfaces/ICreateCallParams';
import ICreateConferenceParams from '../interfaces/ICreateConferenceParams';

const {
  TELNYX_API_KEY,
  TELNYX_CC_APP_ID,
  TELNYX_HOLD_AUDIO_URL,
  TELNYX_SIP_DOMAIN,
  TELNYX_SIP_OB_NUMBER,
} = process.env;

let telnyxPackage: any = require('telnyx');
// Initialize the Telnyx package with your API key when your app
// starts up. Find your key here: https://portal.telnyx.com/#/app/api-keys
let telnyx = telnyxPackage(TELNYX_API_KEY);

class CallControlController {
  /*
   * Creates a conference and invites the specified destination
   */
  public static dial = async function (req: Request, res: Response) {
    let { initiatorSipUsername, to } = req.body;

    try {
      let from = TELNYX_SIP_OB_NUMBER!;

      // Create a call leg back into our call center
      // IDEA Create a separate phone number or webhook to handle
      // routing calls instead of checking to/from in CC event
      let appIncomingCall = await CallControlController.createCall({
        to: TELNYX_SIP_OB_NUMBER!,
        from,
        connectionId: TELNYX_CC_APP_ID!,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'initiate_dial',
          }),
        },
      });

      let telnyxIncomingCall = new telnyx.Call({
        call_control_id: appIncomingCall.telnyxCallControlId,
      });

      // NOTE Call must be answered before creating a conference
      await telnyxIncomingCall.answer();

      // Create a conference
      let appConference = await CallControlController.createConference({
        to,
        from: `sip:${initiatorSipUsername}@${TELNYX_SIP_DOMAIN}`,
        direction: CallLegDirection.OUTGOING,
        callControlId: appIncomingCall.telnyxCallControlId,
      });

      // Create the outgoing call leg
      let appOutgoingCall = await CallControlController.createCall({
        to,
        from,
        connectionId: TELNYX_CC_APP_ID!,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appConference.id,
          }),
        },
        appConference,
      });

      // Create a call leg for the agent who initiated the call
      await CallControlController.createCall({
        to: `sip:${initiatorSipUsername}@${TELNYX_SIP_DOMAIN}`,
        from,
        connectionId: TELNYX_CC_APP_ID!,
        clientCallState: CallLegClientCallState.AUTO_ANSWER,
        telnyxCallOptions: {
          client_state: encodeClientState({
            appCallState: 'join_conference',
            appConferenceId: appConference.id,
            // Specify that we should hang up on the call center call leg
            // after joining the conference
            transferrerTelnyxCallControlId: appIncomingCall.telnyxCallControlId,
          }),
        },
        appConference,
      });

      res.json({
        data: appOutgoingCall,
      });
    } catch (e) {
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Adds someone to an existing conference call
   */
  public static invite = async function (req: Request, res: Response) {
    let { to, telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getRepository(CallLeg);
      let appInviterCallLeg = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
        },
        relations: ['conference'],
      });

      let from = TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallControlController.createCall({
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
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Transfers the call specified destination
   */
  public static transfer = async function (req: Request, res: Response) {
    let { to, telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getRepository(CallLeg);
      let appTransfererCallLeg = await callLegRepository.findOneOrFail({
        where: {
          telnyxCallControlId,
        },
        relations: ['conference'],
      });

      let from = TELNYX_SIP_OB_NUMBER!;

      // Call someone to invite them to join the conference call
      let appOutgoingCall = await CallControlController.createCall({
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
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Mutes an active call in a conference
   */
  public static mute = async function (req: Request, res: Response) {
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getRepository(CallLeg);
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
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Unmutes an active call in a conference
   */
  public static unmute = async function (req: Request, res: Response) {
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getRepository(CallLeg);
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
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Hangs up a call by the specified destination, e.g. to remove someone
   * from a conference call
   */
  public static hangup = async function (req: Request, res: Response) {
    let { telnyxCallControlId } = req.body;

    try {
      let callLegRepository = getRepository(CallLeg);
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
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };

  /*
   * Webhook callback that directs the call flow
   *
   * https://developers.telnyx.com/docs/v2/call-control/receiving-webhooks
   */
  public static callControl = async function (req: Request, res: Response) {
    try {
      let event: ICallControlEvent = req.body.data;
      let { event_type: eventType, payload: eventPayload } = event;

      let clientState = decodeClientState(eventPayload.client_state);

      logger.debug(
        'Webhook received | Event type: %s\nEvent payload: %O',
        eventType,
        {
          ...event.payload,
          client_state: clientState,
        }
      );

      if (eventType === CallControlEventType.CALL_INITIATED) {
        // IDEA Specify a different webhook URL for all subsequent calls,
        // so that we don't need to check whether this is the start of
        // the call flow for a call coming into our call center application
        // for the very first time
        if (CallControlController.isStartOfIncomingCallFlow(eventPayload)) {
          await CallControlController.answerStartOfIncomingCall(eventPayload);

          // Find the first available agent and transfer the call to them.
          // You may want more complex functionality here, such as transferring
          // the call to multiple available agents and then assigning the call
          // to the first agent who answers.
          let availableAgent = await CallControlController.getAvailableAgent();

          if (availableAgent) {
            await CallControlController.startConferenceWithAgent(
              eventPayload,
              availableAgent
            );
          } else {
            // Handle when no agents are available to transfer the call

            await CallControlController.speakNoAvailableAgents(eventPayload);
          }
        }
      } else if (eventType === CallControlEventType.CALL_ANSWERED) {
        // Handle a call answered from a call center dial

        if (
          clientState.appCallState === 'join_conference' &&
          clientState.appConferenceId
        ) {
          await CallControlController.joinConference(eventPayload);
        }
      } else if (eventType === CallControlEventType.CALL_SPEAK_ENDED) {
        if (clientState.appCallState === 'speak_no_available_agents') {
          await CallControlController.hangupCall(eventPayload);
        }
      } else if (
        eventType === CallControlEventType.CONFERENCE_PARTICIPANT_JOINED
      ) {
        await CallControlController.markCallActive(eventPayload);
      } else if (eventType === CallControlEventType.CALL_HANGUP) {
        await CallControlController.markCallInactive(eventPayload);
      }
    } catch (e) {
      logger.warn('Error details:', e);

      res.status(500).json({ error: e });
    }

    res.json({});
  };

  /*
   * Checks if this is a new incoming call into the call center based
   * on the event properties
   *
   * We need to perform this check because the `call.initiated` event
   * is generated for each new leg of the call, for example when
   * transferring a call to a different destination
   */
  private static isStartOfIncomingCallFlow(
    eventPayload: ICallControlEventPayload
  ) {
    return (
      eventPayload.direction === 'incoming' &&
      eventPayload.state === 'parked' &&
      !eventPayload.client_state &&
      !(
        eventPayload.from === TELNYX_SIP_OB_NUMBER &&
        eventPayload.to === eventPayload.from
      )
    );
  }

  /*
   * Saves the new incoming call to our call center phone number and
   * programatically answers it. Note, all calls must be answered
   * before performing further programatic actions on the call, for
   * example to transfer the call
   */
  private static async answerStartOfIncomingCall(
    eventPayload: ICallControlEventPayload
  ) {
    // Access database repository to perform database operations
    let callLegRepository = getRepository(CallLeg);

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

  /*
   * Start a conference with an agent
   */
  private static async startConferenceWithAgent(
    eventPayload: ICallControlEventPayload,
    agent: Agent
  ) {
    // Access database repository to perform database operations
    let callLegRepository = getRepository(CallLeg);
    let appIncomingCallLeg = await callLegRepository.findOneOrFail({
      telnyxCallControlId: eventPayload.call_control_id,
    });

    // Create a new Telnyx Conference to organize & issue commands
    // to multiple call legs at once and save it to our DB
    let appConference = await CallControlController.createConference({
      from: eventPayload.from,
      to: eventPayload.to,
      direction: eventPayload.direction,
      callControlId: eventPayload.call_control_id,
      telnyxConferenceOptions: {
        // Place caller on hold until agent joins the call
        hold_audio_url: TELNYX_HOLD_AUDIO_URL,
        start_conference_on_create: false,
      },
    });

    // Add call to conference
    appIncomingCallLeg.conference = appConference;
    await callLegRepository.save(appIncomingCallLeg);

    // Call the agent to invite them to join the conference call
    await CallControlController.createCall({
      to: `sip:${agent.sipUsername}@${TELNYX_SIP_DOMAIN}`,
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

  /*
   * Play audio to the caller letting them no that there are no available
   * agents to take their call
   */
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

  /*
   * Add an answered call to a conference
   */
  private static async joinConference(eventPayload: ICallControlEventPayload) {
    let clientState = decodeClientState(eventPayload.client_state);

    // Access database repository to perform database operations
    let conferenceRepository = getRepository(Conference);
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

  /*
   * Programatically hangup a call
   */
  private static async hangupCall(eventPayload: ICallControlEventPayload) {
    // Create a new Telnyx Call in order to issue call control commands
    let telnyxCall = new telnyx.Call({
      call_control_id: eventPayload.call_control_id,
    });

    await telnyxCall.hangup();
  }

  /*
   * Mark a call leg as active
   */
  private static async markCallActive(eventPayload: ICallControlEventPayload) {
    // Access database repository to perform database operations
    let callLegRepository = getRepository(CallLeg);

    let appCall = await callLegRepository.findOne({
      telnyxCallControlId: eventPayload.call_control_id,
      status: CallLegStatus.NEW,
    });

    if (appCall) {
      appCall.status = CallLegStatus.ACTIVE;
      await callLegRepository.save(appCall);
    } else {
      logger.warn(
        `No call leg with telnyxCallControlId ${eventPayload.call_control_id} found`
      );
    }
  }

  /*
   * Mark a call leg as inactive
   */
  private static async markCallInactive(
    eventPayload: ICallControlEventPayload
  ) {
    // Access database repository to perform database operations
    let callLegRepository = getRepository(CallLeg);

    let appCall = await callLegRepository.findOne({
      telnyxCallControlId: eventPayload.call_control_id,
      status: CallLegStatus.ACTIVE,
    });

    if (appCall) {
      appCall.status = CallLegStatus.INACTIVE;
      await callLegRepository.save(appCall);
    } else {
      logger.warn(
        `No call leg with telnyxCallControlId ${eventPayload.call_control_id} found`
      );
    }
  }

  /*
   * Create a Telnyx conference and the corresponding database record
   */
  private static createConference = async function ({
    from,
    to,
    direction,
    callControlId,
    telnyxConferenceOptions,
  }: ICreateConferenceParams) {
    let conferenceRepository = getRepository(Conference);
    let { data: telnyxConference } = await telnyx.conferences.create({
      name: `Call ${
        direction === CallLegDirection.OUTGOING ? `to ${to}` : `from ${from}`
      } at ${Date.now()}`,
      call_control_id: callControlId,
      // For all available options:
      // https://developers.telnyx.com/docs/api/v2/call-control/Conference-Commands#createConference
      ...telnyxConferenceOptions,
    });

    // Save the conference in our database so that we can
    // retrieve call control IDs later on user interaction
    let appConference = new Conference();
    appConference.telnyxConferenceId = telnyxConference.id;
    appConference.from = from;
    appConference.to = to;

    return conferenceRepository.save(appConference);
  };

  /*
   * Create a Telnyx call (i.e. dial some destination) and create the
   * corresponding database record in our app
   */
  private static createCall = async function ({
    from,
    to,
    connectionId,
    clientCallState,
    telnyxCallOptions,
    appConference,
  }: ICreateCallParams) {
    let callLegRepository = getRepository(CallLeg);

    let { data: telnyxOutgoingCall } = await telnyx.calls.create({
      to,
      from,
      connection_id: connectionId,
      // For all available options:
      // https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callDial
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

    return callLegRepository.save(appOutgoingCall);
  };

  /*
   * Get the first available agent
   *
   * In production you'll likely want to introduce some other mechanism
   * for choosing the agent, such as round robin or balancing the load
   * between agents by hours of calls answered
   */
  private static getAvailableAgent = async function () {
    let agentRepository = getRepository(Agent);
    let firstAvailableAgent = await agentRepository.findOne({
      available: true,
    });

    return firstAvailableAgent;
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

export default CallControlController;
