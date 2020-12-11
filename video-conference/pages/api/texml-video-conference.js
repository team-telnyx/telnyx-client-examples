export default (req, res) => {
  if (!req.body.To) {
    throw new Error("No To in the Body, cannot complete call");
  }

  let xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial>
          <Conference>Video Conference ${req.body.To}</Conference>
      </Dial>
  </Response>`;
  res.send(xmlResponse);
};
