import IAgent from './IAgent';

export default interface ILogin {
  agent: IAgent | undefined;
  onLogin: Function;
}
