import IAgent from './IAgent';

export interface IUser extends IAgent {
  token?: string;
}

export default IUser;
