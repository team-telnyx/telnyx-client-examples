import axios, { AxiosError, AxiosResponse } from 'axios';
import ICallLeg from '../interfaces/ICallLeg';
import { BASE_URL } from '../configs/constants';

interface IInviteAgentParams {
  inviterSipUsername: string;
  to: string;
}

interface ITransferAgentParams {
  transfererSipUsername: string;
  to: string;
}

interface IConferenceActionsParams {
  participant: string;
}

interface IConferenceActionsResponse {
  data: ICallLeg;
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

export const transfer = async (
  params: ITransferAgentParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .post(`${BASE_URL}/calls/actions/conferences/transfer`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse) => resp)
    .catch((error: AxiosError) => error);
};

export const hangup = async (
  params: IConferenceActionsParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .post(`${BASE_URL}/calls/actions/conferences/hangup`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse<IConferenceActionsResponse>) => resp)
    .catch((error: AxiosError) => error);
};

export const mute = async (
  params: IConferenceActionsParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .post(`${BASE_URL}/calls/actions/conferences/mute`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse<IConferenceActionsResponse>) => resp)
    .catch((error: AxiosError) => error);
};

export const unmute = async (
  params: IConferenceActionsParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios
    .post(`${BASE_URL}/calls/actions/conferences/unmute`, params, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
    .then((resp: AxiosResponse<IConferenceActionsResponse>) => resp)
    .catch((error: AxiosError) => error);
};
