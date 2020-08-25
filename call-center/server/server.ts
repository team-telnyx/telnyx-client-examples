import dotenv from 'dotenv';
dotenv.config();

import express from 'express';

let app = express();

app.get('/', function (req, res) {
  res.send('Hello world');
});

app.listen(process.env.TELNYX_APP_PORT, function () {
  console.log(`App is listening on post ${TELNYX_APP_PORT}`);
});
