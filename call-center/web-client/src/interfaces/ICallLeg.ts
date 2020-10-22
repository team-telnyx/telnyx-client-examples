import IConference from './IConference';

// TODO Same import as in `callLeg.entity`
export enum CallLegStatus {
  INACTIVE = 'inactive',
  NEW = 'new',
  ACTIVE = 'active',
}

export enum CallLegClientCallState {
  DEFAULT = 'default',
  AUTO_ANSWER = 'auto_answer',
}

export enum CallLegDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export interface ICallLeg {
  id: string;
  status: CallLegStatus;
  from: string;
  to: string;
  direction: CallLegDirection;
  telnyxCallControlId: string;
  telnyxConnectionId: string;
  clientCallState: CallLegClientCallState;
  muted: boolean;
  conference: IConference;
}

export default ICallLeg;
