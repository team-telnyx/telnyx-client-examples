export interface IAgent {
  id: string;
  createdAt: string;
  loggedIn: boolean;
  name: string;
  sipUsername: string;
}

export interface ILoggedInAgent extends IAgent {
  token?: string;
}

export default IAgent;
