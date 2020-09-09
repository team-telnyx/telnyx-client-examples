import { Request, Response } from 'express';
import {
  getTelephonyCredentials,
  postTelephonyCredentialsToken,
} from '../services/telephonyCredentials.service';
import { getManager } from 'typeorm';
import { Agent } from '../entities/agent.entity';

class AgentsController {
  public static getLoggedIn = async function (req: Request, res: Response) {
    try {
      let agentRepository = getManager().getRepository(Agent);
      res.json({
        agents: await agentRepository.find({
          where: { loggedIn: true },
          // IDEA This could be a separate route,
          // as to not query relations on GET
          relations: ['activeCall'],
        }),
      });
    } catch (e) {
      res.status(500).send({ error: e });
    }
  };

  public static getAgent = async function (req: Request, res: Response) {
    let id = req.params.id;

    try {
      let agentRepository = getManager().getRepository(Agent);
      res.json({
        agent: await agentRepository.findOneOrFail(id),
      });
    } catch (e) {
      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  public static login = async function (req: Request, res: Response) {
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
      // TODO We may want some sort of user interaction
      // to happen before marking an agent as "available"
      // to take calls, and/or wait until WebRTC connection
      agent.available = true;
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
  };

  public static logout = async function (req: Request, res: Response) {
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
  };
}

export default AgentsController;
