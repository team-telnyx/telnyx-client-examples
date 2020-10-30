import axios, { AxiosError, AxiosResponse } from 'axios';
import ICallLeg from '../interfaces/ICallLeg';
import { BASE_URL } from '../configs/constants';

interface IFindManyParams {
  limit: number;
}

interface IActiveCallActionParams {
  telnyxCallControlId: string;
}

interface ICallActionsParams {
  to: string;
}

interface IConferenceActionsResponse {
  data: ICallLeg;
}

export const getCall = async (
  params: Partial<ICallLeg & IFindManyParams>
): Promise<AxiosResponse<{ calls: ICallLeg[] }>> => {
  return await axios.get(`${BASE_URL}/call-control/`, {
    params,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const dial = async (
  params: ICallActionsParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios.post(`${BASE_URL}/call-control/actions/dial`, params, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const invite = async (
  params: ICallActionsParams & IActiveCallActionParams
): Promise<AxiosResponse | AxiosError> => {
  return await axios.post(
    `${BASE_URL}/call-control/actions/conferences/invite`,
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
    `${BASE_URL}/call-control/actions/conferences/transfer`,
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
    `${BASE_URL}/call-control/actions/conferences/hangup`,
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
    .post(`${BASE_URL}/call-control/actions/conferences/mute`, params, {
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
    `${BASE_URL}/call-control/actions/conferences/unmute`,
    params,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
