export default interface IClientState {
  // Define your own call states with `appCallState` to direct
  // the flow of the call through your application
  appCallState?: string;
  appConferenceId?: string;
  appConferenceOptions?: object;
  transferrerTelnyxCallControlId?: string;
}
