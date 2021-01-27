const TIME_LIMIT_SECONDS = 3600; // max length of calls
// TODO use same constants as `VideoCall`
const START_RECORDING_DTMF_KEY = '1';

export default (req, res) => {
  console.log('api/texml req.body: ', req.body);
  console.log('api/texml req.body.From: ', req.body.From);
  console.log('api/texml req.body.To: ', req.body.To);
  console.log('api/texml req.headers: ', req.headers);

  console.log(
    'api/texml forward to:',
    `sip:${req.body.To.replace(
      `${process.env.NEXT_PUBLIC_TELNYX_SIP_SUBDOMAIN}.`,
      ''
    )}`
  );

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial callerId="${req.body.From}" timeLimit="${TIME_LIMIT_SECONDS}">
          <Sip>sip:${req.body.To.replace(
            `${process.env.NEXT_PUBLIC_TELNYX_SIP_SUBDOMAIN}.`,
            ''
          )}</Sip>
      </Dial>
      <Gather action="/api/texml/record" numDigits="1" finishOnKey="${START_RECORDING_DTMF_KEY}" timeout="1" />
  </Response>`;

  res.send(xmlResponse);
};
