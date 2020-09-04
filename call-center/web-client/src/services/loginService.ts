import axios, { AxiosError, AxiosResponse } from 'axios';
import { BASE_URL } from '../configs/constants';

export const login = async (name: string): Promise<AxiosResponse | AxiosError> => {
    return await axios.post(`${BASE_URL}/agents/login`, { name: name }, {
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then((resp: AxiosResponse) => resp)
        .catch((error: AxiosError) => error);
};

export const logout = async (id: number): Promise<AxiosResponse | AxiosError> => {
    return await axios.post(`${BASE_URL}/agents/logout`, { id: id }, {
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then((resp: AxiosResponse) => resp)
        .catch((error: AxiosError) => error);
};