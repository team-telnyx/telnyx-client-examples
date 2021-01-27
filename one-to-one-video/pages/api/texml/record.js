export default (req, res) => {
  console.log('api/texml/record req.body: ', req.body);
  console.log('api/texml/record req.body.From: ', req.body.From);
  console.log('api/texml/record req.body.To: ', req.body.To);
  console.log('api/texml/record req.headers: ', req.headers);

  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Record playBeep="true" finishOnKey="1" />
  </Response>`;

  res.send(xmlResponse);
};
