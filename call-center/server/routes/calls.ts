import express from 'express';
import CallsController from '../controllers/calls.controller';

let router = express.Router();

router.get('/', CallsController.get);

// Actions
router.post('/actions/dial', CallsController.dial);
router.post('/actions/conferences/invite', CallsController.invite);
router.post('/actions/conferences/transfer', CallsController.transfer);
router.post('/actions/conferences/hangup', CallsController.hangup);
router.post('/actions/conferences/mute', CallsController.mute);
router.post('/actions/conferences/unmute', CallsController.unmute);

// Callbacks
router.post('/callbacks/call-control-app', CallsController.callControl);

export default router;
