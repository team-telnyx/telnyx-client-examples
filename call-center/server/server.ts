import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';

import calls from './controllers/calls';

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
  res.send('Hello world');
});

app.use('/calls', calls);

app.listen(process.env.TELNYX_APP_PORT, function () {
  console.log(`App is listening on port ${process.env.TELNYX_APP_PORT}`);
});
