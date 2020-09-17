import axios, { AxiosError, AxiosResponse } from 'axios';
import IAgent from '../interfaces/IAgent';
import { BASE_URL } from '../configs/constants';

export const getAgent = async (
  id: any
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .get(`${BASE_URL}/agents/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse) => resp)
    .catch((error: AxiosError) => error);
};

export const getLoggedInAgents = async (): Promise<
  AxiosResponse<{ agents: IAgent[] }>
> => {
  return await axios.get(`${BASE_URL}/agents`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const updateAgent = async (
  id: any,
  params: Partial<IAgent>
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .patch(`${BASE_URL}/agents/${id}`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse) => resp)
    .catch((error: AxiosError) => error);
};
