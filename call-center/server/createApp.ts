import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';

import { logStream } from './helpers/logger';
import callControl from './routes/callControl';
import calls from './routes/calls';
import agents from './routes/agents';
import conferences from './routes/conferences';

const { NODE_ENV } = process.env;

function createApp() {
  let app = express();
  app.use(cors());

  app.use(express.static('public'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  // Enable HTTP logging middleware
  app.use(
    morgan(NODE_ENV === 'production' ? 'combined' : 'dev', {
      stream: logStream,
    })
  );

  app.use('/call-control', callControl);
  app.use('/calls', calls);
  app.use('/agents', agents);
  app.use('/conferences', conferences);

  return app;
}

export default createApp;
