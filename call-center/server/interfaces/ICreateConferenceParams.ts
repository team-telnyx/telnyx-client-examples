export default interface ICreateConferenceParams {
  from: string;
  to: string;
  direction: string;
  callControlId: string;
  // For all available options:
  // https://developers.telnyx.com/docs/api/v2/call-control/Conference-Commands#createConference
  telnyxConferenceOptions?: Object;
}
