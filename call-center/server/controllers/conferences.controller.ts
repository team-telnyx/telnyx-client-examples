import { Conference } from '../entities/conference.entity';
import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import logger from '../helpers/logger';

class ConferencesController {
  // Find conference by call leg Call Control ID
  public static get = async function (req: Request, res: Response) {
    let telnyxCallControlId = req.params.telnyx_call_control_id;

    try {
      let conferenceRepository = getRepository(Conference);

      let appConference = await conferenceRepository
        .createQueryBuilder('conference')
        // Find conference by call leg with matching CC ID
        .innerJoin(
          'conference.callLegs',
          'callLeg',
          'callLeg.telnyxCallControlId = :telnyxCallControlId',
          { telnyxCallControlId }
        )
        // Return all call legs with the conference
        .leftJoinAndSelect('conference.callLegs', 'callLegs')
        .orderBy({
          'callLegs.createdAt': 'ASC',
        })
        .getOne();

      res.json({
        conference: appConference,
      });
    } catch (e) {
      logger.debug(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };
}

export default ConferencesController;
