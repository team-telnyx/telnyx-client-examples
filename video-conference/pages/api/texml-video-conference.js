export default (req, res) => {
  if (!req.method === "POST") {
    throw new Error("Your TeXML Application should send a POST webhook");
  }
  if (!req.body.To) {
    throw new Error("No To in the Body, cannot complete call");
  }

  let xmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Dial>
          <Conference videoLayoutName="group:grid_zoom" statusCallback="https://e95c25777e39.ngrok.io/api/log" statusCallbackEvent="start,end,join,leave">Video Conference ${req.body.To}</Conference>
      </Dial>
  </Response>`;
  res.send(xmlResponse);
};
