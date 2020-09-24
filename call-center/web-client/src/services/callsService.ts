import axios, { AxiosError, AxiosResponse } from 'axios';
import { BASE_URL } from '../configs/constants';

interface IInviteAgentParams {
  inviterSipUsername: string;
  to: string;
}

export const invite = async (
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
