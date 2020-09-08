import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createConnection } from 'typeorm';

import calls from './routes/calls';
import agents from './routes/agents';

createConnection().then(function () {
  let app = express();
  app.use(cors());

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/calls', calls);
  app.use('/agents', agents);

  app.listen(process.env.TELNYX_SERVER_APP_PORT, function () {
    console.log(
      `App is listening on port ${process.env.TELNYX_SERVER_APP_PORT}`
    );
  });
});
