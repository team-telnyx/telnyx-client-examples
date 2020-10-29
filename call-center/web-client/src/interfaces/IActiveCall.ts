export default interface IActiveCall {
  telnyxCallControlId: string;
  sipUsername: string;
  callDirection: string;
  callDestination: string;
  callerId: string;
  // FIXME `IWebRTCCall.state` needs to be updated to be `State`
  // callState: State;
  callState: string;
  isDialing: boolean;
  answer: Function;
  hangup: Function;
}
