import express from 'express';
import CallControlController from '../controllers/callControl.controller';

let router = express.Router();

router.get('/', CallControlController.get);

export default router;
