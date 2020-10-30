import IAgent from './IAgent';

export default interface IAgents {
  agents?: IAgent[];
  addToCall?: Function;
  transferCall?: Function;
}
