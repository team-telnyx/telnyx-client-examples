import axios, { AxiosResponse } from 'axios';
import IConference from '../interfaces/IConference';
import { BASE_URL } from '../configs/constants';
import { hangup } from './callsService';

export const getConference = async (
  id: string
): Promise<AxiosResponse<{ conference: IConference }>> => {
  return await axios.get(`${BASE_URL}/conferences/${id}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const removeFromConference = async (participant: string) => {
  // Hanging up the call leg is the same removing from the conference
  return hangup({ participant });
};
