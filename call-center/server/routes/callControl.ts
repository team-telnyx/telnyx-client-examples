import express from 'express';
import CallControlController from '../controllers/callControl.controller';

let router = express.Router();

router.get('/', CallControlController.get);

// Actions
router.post('/actions/dial', CallControlController.dial);
router.post('/actions/conferences/invite', CallControlController.invite);
router.post('/actions/conferences/transfer', CallControlController.transfer);
router.post('/actions/conferences/hangup', CallControlController.hangup);
router.post('/actions/conferences/mute', CallControlController.mute);
router.post('/actions/conferences/unmute', CallControlController.unmute);

// Callbacks
router.post('/callbacks', CallControlController.callControl);

export default router;
