import express from 'express';
import {
  getTelephonyCredentials,
  postTelephonyCredentialsToken,
} from '../services/telephonyCredentials.service';
import { getManager } from 'typeorm';
import { Agent } from '../entities/agent.entity';

let router = express.Router();

router.get('/', async function (req, res) {
  try {
    let agentRepository = getManager().getRepository(Agent);
    res.json({
      agents: await agentRepository.find({ loggedIn: true }),
    });
  } catch (e) {
    res.status(500).send({ error: e });
  }
});

router.post('/login', async function (req, res) {
  try {
    let credential = await getTelephonyCredentials({
      connection_id: process.env.TELNYX_SIP_CONNECTION_ID,
    });

    let token = await postTelephonyCredentialsToken({
      credential_id: credential.data.data.id,
    });

    let agentRepository = getManager().getRepository(Agent);

    console.log(req.body);
    let name = req.body.name || 'Unknown';
    let agent = new Agent();
    agent.name = name;
    agent.sipUsername = credential.data.data.sip_username;
    agent.loggedIn = true;
    let savedAgent = await agentRepository.save(agent);

    res.json({
      agent: savedAgent,
      token: token.data,
      credential: credential.data.data,
    });
  } catch (e) {
    if (e.response) console.log(e.response.data);
    res.status(500).send({ error: e });
  }
});

router.post('/logout', async function (req, res) {
  try {
    let id = req.body.id;
    let agentRepository = getManager().getRepository(Agent);

    let loggedAgent = await agentRepository.findOne({ id });
    if (loggedAgent) {
      loggedAgent.loggedIn = false;
      await agentRepository.save(loggedAgent);
    }

    res.status(200).json({});
  } catch (e) {
    res.status(500).json({ error: e });
  }
});

export default router;
