import express from 'express';
import CallsController from '../controllers/calls.controller';

let router = express.Router();

router.get('/', CallsController.get);

export default router;
