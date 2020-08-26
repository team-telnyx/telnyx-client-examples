import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';

import callsController from './controllers/callsController';
import agentsController from './controllers/agentsController';

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/calls', callsController);
app.use('/agents', agentsController);

app.listen(process.env.TELNYX_APP_PORT, function () {
  console.log(`App is listening on port ${process.env.TELNYX_APP_PORT}`);
});
