import axios, { AxiosError, AxiosResponse } from 'axios';
import ICallLeg from '../interfaces/ICallLeg';
import { BASE_URL } from '../configs/constants';
import IFindManyParams from '../interfaces/IFindManyParams';
import ICallActionsParams from '../interfaces/ICallActionsParams';
import IActiveCallActionParams from '../interfaces/IActiveCallActionParams';
import IConferenceActionsResponse from '../interfaces/IConferenceActionsResponse';

export const getCall = async (
  params: Partial<ICallLeg & IFindManyParams>
): Promise<AxiosResponse<{ calls: ICallLeg[] }>> => {
  return await axios.get(`${BASE_URL}/calls/`, {
    params,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const dial = async (
  params: ICallActionsParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios.post(`${BASE_URL}/calls/actions/dial`, params, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const invite = async (
  params: ICallActionsParams & IActiveCallActionParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios.post(
    `${BASE_URL}/calls/actions/conferences/invite`,
    params,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const transfer = async (
  params: ICallActionsParams & IActiveCallActionParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios.post(
    `${BASE_URL}/calls/actions/conferences/transfer`,
    params,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const hangup = async (
  params: IActiveCallActionParams
): Promise<AxiosResponse<IConferenceActionsResponse> | AxiosError> => {
  return await axios.post(
    `${BASE_URL}/calls/actions/conferences/hangup`,
    params,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const mute = async (
  params: IActiveCallActionParams
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
  params: IActiveCallActionParams
): Promise<AxiosResponse<IConferenceActionsResponse> | AxiosError> => {
  return await axios.post(
    `${BASE_URL}/calls/actions/conferences/unmute`,
    params,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
