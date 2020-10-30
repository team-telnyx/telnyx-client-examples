import { CallLegStatus } from './ICallLeg';

export default interface IConferenceParticipant {
  status: CallLegStatus;
  displayName: string;
  muted?: boolean;
  participantTelnyxCallControlId: string;
  participant: string;
}
