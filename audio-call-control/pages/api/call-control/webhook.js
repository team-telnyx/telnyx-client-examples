import telnyxPackage from 'telnyx';

import { decodeClientState } from '../../../utils/encodeClientState';

const telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

export default async (req, res) => {
  console.log('/api/call-control/webhook req.body:', req.body);

  // const event = req.body.data;
  // const { payload } = event;
  // const clientState =
  //   payload.client_state && decodeClientState(payload.client_state);

  // console.log('client_state:', clientState);

  // if (
  //   event.event_type === 'call.answered' &&
  //   clientState &&
  //   clientState.conference_id
  // ) {
  //   // Join conference
  //   const conference = await new telnyx.Conference({
  //     id: clientState.conference_id,
  //   });

  //   conference.join({
  //     call_control_id: payload.call_control_id,
  //   });
  // }

  res.statusCode = 200;
  res.json({ message: 'Success' });
};
