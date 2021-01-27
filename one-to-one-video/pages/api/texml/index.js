const TIME_LIMIT_SECONDS = 3600; // max length of calls

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

  // TODO recordings
  // <Record recordingStatusCallBack="/api/texml/recordings" playBeep="true" />

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial callerId="${req.body.From}" timeLimit="${TIME_LIMIT_SECONDS}">
          <Sip>sip:${req.body.To.replace(
            `${process.env.NEXT_PUBLIC_TELNYX_SIP_SUBDOMAIN}.`,
            ''
          )}</Sip>
      </Dial>
      <Record recordingStatusCallBack="/api/texml/recordings" playBeep="true" />
  </Response>`;

  res.send(xmlResponse);
};
