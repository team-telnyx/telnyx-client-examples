import express from 'express';
import CallsController from '../controllers/calls.controller';

let router = express.Router();

// Actions
router.post('/actions/bridge', CallsController.bridge);
router.post('/actions/conferences/invite', CallsController.invite);
router.post('/actions/conferences/transfer', CallsController.transfer);
router.post('/actions/conferences/hangup', CallsController.hangup);

// Callbacks
router.post('/callbacks/call-control-app', CallsController.callControl);

export default router;
