export default (req, res) => {
  console.log('req.body: ', req.body);
  console.log('req.body.From: ', req.body.From);
  console.log('req.body.To: ', req.body.To);
  console.log('req.headers: ', req.headers);

  // 1. Answer and setup recording IVR
  // 2. Call final destination
  const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Say>
          Hi
      </Say>
  </Response>`;
  // const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  // <Response>
  //     <Dial>
  //         <Sip>sip:${fromSipUsername}@${process.env.TELNYX_SIP_DOMAIN}</Sip>
  //     </Dial>
  //     <Dial>
  //         <Sip>sip:${toSipUsername}@${process.env.TELNYX_SIP_DOMAIN}</Sip>
  //     </Dial>
  // </Response>`;

  res.send(xmlResponse);
};
