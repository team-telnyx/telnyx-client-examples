import express from 'express';
import CallsController from '../controllers/calls.controller';

let router = express.Router();

// Actions
router.post('/actions/bridge', CallsController.bridge);

// Callbacks
router.post('/callbacks/call-control-app', CallsController.callControl);

export default router;
