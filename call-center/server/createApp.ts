import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

import callControl from './routes/callControl';
import agents from './routes/agents';
import conferences from './routes/conferences';

function createApp() {
  let app = express();
  app.use(cors());

  app.use(express.static('public'));

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/call-control', callControl);
  app.use('/agents', agents);
  app.use('/conferences', conferences);

  return app;
}

export default createApp;
