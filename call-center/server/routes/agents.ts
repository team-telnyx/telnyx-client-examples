import express from 'express';
import AgentsController from '../controllers/agents.controller';

let router = express.Router();

router.get('/', AgentsController.getLoggedIn);
router.post('/login', AgentsController.login);
router.post('/logout', AgentsController.logout);

export default router;
