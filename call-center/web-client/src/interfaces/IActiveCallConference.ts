import IAgent from './IAgent';

export default interface IActiveCallConference {
  telnyxCallControlId: string;
  sipUsername: string;
  callerId: string;
  agents?: IAgent[];
}
