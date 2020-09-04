export default interface IUser {
    agent: {
        id: number | string,
        createdAt: string,
        loggedIn: boolean,
        name: string,
        sipUsername: string,
    },
    error: string;
}