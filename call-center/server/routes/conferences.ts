import express from 'express';
import ConferencesController from '../controllers/conferences.controller';

let router = express.Router();

// Actions
router.get('/:telnyx_call_control_id', ConferencesController.get);

export default router;
