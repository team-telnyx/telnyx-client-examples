// TODO use same constants as `VideoCall`
const START_RECORDING_DTMF_KEY = '1';

export default (req, res) => {
  console.log('api/texml req.body: ', req.body);
  console.log('api/texml req.body.From: ', req.body.From);
  console.log('api/texml req.body.To: ', req.body.To);
  console.log('api/texml req.headers: ', req.headers);

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Gather action="/record" numDigits="${START_RECORDING_DTMF_KEY}" timeout="1" />
  </Response>`;

  res.send(xmlResponse);
};
