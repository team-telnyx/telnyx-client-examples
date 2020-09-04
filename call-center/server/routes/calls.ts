import express, { Request, Response } from 'express';
import { getManager, In } from 'typeorm';
import { Call } from '../entities/call.entity';
import { Agent } from '../entities/agent.entity';
import { toNamespacedPath } from 'path';
import CallsController from '../controllers/calls.controller';

let telnyxPackage: any = require('telnyx');

let telnyx = telnyxPackage(process.env.TELNYX_API_KEY);

let router = express.Router();

// Actions
router.post('/actions/bridge', CallsController.bridge);

// Callbacks
router.post('/callbacks/call-control-app', CallsController.onCallback);

export default router;
