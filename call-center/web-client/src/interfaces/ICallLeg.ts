import IConference from './IConference';

export enum CallLegStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
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
  direction: string;
  telnyxCallControlId: string;
  telnyxConnectionId: string;
  clientCallInitiationId: string;
  muted: boolean;
  conference: IConference;
}

export default ICallLeg;
