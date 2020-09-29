import express from 'express';
import ConferenceController from '../controllers/confereces.controller';

let router = express.Router();

// Actions
router.get('/:id_or_sip_address', ConferenceController.get);

export default router;
