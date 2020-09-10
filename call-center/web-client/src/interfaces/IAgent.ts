export interface IAgent {
  id: string;
  createdAt: string;
  loggedIn: boolean;
  name: string;
  sipUsername: string;
  available: boolean;
}

export interface ILoggedInAgent extends IAgent {
  token?: string;
}

export default IAgent;
