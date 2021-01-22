export default (req, res) => {
  let xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial>
          <Sip>sip:video@sipdev.telnyx.com</Sip>
      </Dial>
  </Response>`;
  res.send(xmlResponse);
};
