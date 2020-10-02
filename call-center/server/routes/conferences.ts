import express from 'express';
import ConferencesController from '../controllers/conferences.controller';

let router = express.Router();

// Actions
router.get('/:id_or_sip_address', ConferencesController.get);

export default router;
