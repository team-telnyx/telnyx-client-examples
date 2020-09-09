export default interface IUser {
  id: number | string,
  createdAt: string,
  loggedIn: boolean,
  name: string,
  sipUsername: string,
  error: string;
}