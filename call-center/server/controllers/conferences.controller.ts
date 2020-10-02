import { Conference } from '../entities/conference.entity';
import { Request, Response } from 'express';
import { getManager } from 'typeorm';
import { CallLeg, CallLegStatus } from '../entities/callLeg.entity';

class ConferencesController {
  public static get = async function (req: Request, res: Response) {
    let idOrSipAddress = req.params.id_or_sip_address;

    try {
      let isSipAddress = idOrSipAddress.startsWith('sip:');
      let appConference = isSipAddress
        ? await ConferencesController.getConferenceBySipAddress(idOrSipAddress)
        : await ConferencesController.getConferenceByID(idOrSipAddress);

      res.json({
        conference: appConference,
      });
    } catch (e) {
      console.error(e);

      res
        .status(e && e.name === 'EntityNotFound' ? 404 : 500)
        .send({ error: e });
    }
  };

  private static getConferenceBySipAddress = async function (
    sipAddress: string
  ) {
    // TODO Once INIT-1896 is done, the WebRTC SDK will expose the Call Control
    // ID. We will be able to ask for the conference related to the Call
    // Control ID directly instead of infering from its participant SIP address
    let callLegRepository = getManager().getRepository(CallLeg);
    let appTransfererCallLeg = await callLegRepository.findOneOrFail({
      where: {
        status: CallLegStatus.ACTIVE,
        to: sipAddress,
      },
      relations: ['conference', 'conference.callLegs'],
    });

    return appTransfererCallLeg.conference;
  };

  private static getConferenceByID = async function (id: string) {
    // TODO Once INIT-1896 is done, the WebRTC SDK will expose the Call Control
    // ID. We will be able to ask for the conference related to the Call
    // Control ID directly instead of infering from its participant SIP address
    let conferenceRepository = getManager().getRepository(Conference);
    let appConference = await conferenceRepository.findOneOrFail({
      where: {
        id,
      },
      relations: ['callLegs'],
    });

    return appConference;
  };
}

export default ConferencesController;
