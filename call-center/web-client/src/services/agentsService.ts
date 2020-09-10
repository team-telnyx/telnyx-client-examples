import axios, { AxiosError, AxiosResponse } from 'axios';
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
