import { Request, Response } from 'express';
import { FindManyOptions, getRepository } from 'typeorm';
import logger from '../helpers/logger';
import { CallLeg } from '../entities/callLeg.entity';

class CallsController {
  public static get = async function (req: Request, res: Response) {
    let { limit, ...callLegQuery } = req.query;
    let findOpts = {
      // NOTE You'll likely want to do some validation here
      // to check for valid columns to query
      where: callLegQuery,
    } as FindManyOptions;

    if (limit) {
      findOpts.take = parseInt(limit as string);
    }

    try {
      let callLegRepository = getRepository(CallLeg);

      res.json({
        calls: await callLegRepository.find(findOpts),
      });
    } catch (e) {
      logger.warn('Error details:', e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e.toString() });
    }
  };
}

export default CallsController;
