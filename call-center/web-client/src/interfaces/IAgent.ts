export default interface IAgent {
  id: number | string;
  createdAt: string;
  loggedIn: boolean;
  name: string;
  sipUsername: string;
}
