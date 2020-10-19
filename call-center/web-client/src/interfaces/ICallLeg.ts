import {
  CallLegStatus,
  CallLegClientCallState,
  CallLegDirection,
} from '../../../server/entities/callLeg.entity';
import IConference from './IConference';

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

export { CallLegStatus, CallLegClientCallState, CallLegDirection };
export default ICallLeg;
