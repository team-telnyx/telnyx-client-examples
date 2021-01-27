// TODO use same constants as `VideoCall`
const END_RECORDING_DTMF_KEY = '0';

export default (req, res) => {
  console.log('api/texml/record req.body: ', req.body);
  console.log('api/texml/record req.body.From: ', req.body.From);
  console.log('api/texml/record req.body.To: ', req.body.To);
  console.log('api/texml/record req.headers: ', req.headers);

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Record playBeep="true" finishOnKey="${END_RECORDING_DTMF_KEY}" />
  </Response>`;

  res.send(xmlResponse);
};
