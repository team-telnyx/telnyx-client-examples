export default interface IUser {
    agent: {
        id: number,
        createdAt: string,
        loggedIn: boolean,
        name: string,
        sipUsername: string,
    },
    error: string;
}