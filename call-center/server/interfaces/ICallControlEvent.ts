export enum CallControlEventType {
  CALL_INITIATED = 'call.initiated',
  CALL_ANSWERED = 'call.answered',
  CALL_SPEAK_ENDED = 'call.speak.ended',
  CALL_HANGUP = 'call.hangup',
  CONFERENCE_PARTICIPANT_JOINED = 'conference.participant.joined',
}

export interface ICallControlEventPayload {
  state: string;
  call_control_id: string;
  connection_id: string;
  from: string;
  to: string;
  direction: string;
  client_state?: string;
}

export interface ICallControlEvent {
  event_type: CallControlEventType;
  payload: ICallControlEventPayload;
}

export default ICallControlEvent;
