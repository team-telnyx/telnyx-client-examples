import { CallLegClientCallState } from '../entities/callLeg.entity';
import { Conference } from '../entities/conference.entity';

export default interface ICreateCallParams {
  from: string;
  to: string;
  connectionId: string;
  clientCallState?: CallLegClientCallState;
  // For all available options:
  // https://developers.telnyx.com/docs/api/v2/call-control/Call-Commands#callDial
  telnyxCallOptions?: Object;
  appConference?: Conference;
}
