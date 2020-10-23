import ICallLeg from './ICallLeg';

export interface IConference {
  id: string;
  telnyxConferenceId: string;
  from: string;
  to: string;
  callLegs: ICallLeg[];
}

export default IConference;
