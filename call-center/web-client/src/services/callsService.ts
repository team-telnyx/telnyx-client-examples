import axios, { AxiosError, AxiosResponse } from 'axios';
import { BASE_URL } from '../configs/constants';

interface IInviteAgentParams {
  hostId: string;
  agentId: string;
}

export const inviteAgent = async (
  params: IInviteAgentParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .post(`${BASE_URL}/calls/actions/conferences/invite`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse) => resp)
    .catch((error: AxiosError) => error);
};
