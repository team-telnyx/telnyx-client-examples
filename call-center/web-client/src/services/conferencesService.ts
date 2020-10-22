import axios, { AxiosResponse } from 'axios';
import IConference from '../interfaces/IConference';
import { BASE_URL } from '../configs/constants';

export const getConference = async (
  telnyxCallControlId: string
): Promise<AxiosResponse<{ conference: IConference }>> => {
  return await axios.get(`${BASE_URL}/conferences/${telnyxCallControlId}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
