import axios from 'axios';
import { BASE_URL } from '../configs/constants';

export const login = async (name: string): Promise<any | string> => {
    return await axios.post(`${BASE_URL}/agents/login`, { name: name }, {
        headers: {
            "Content-Type": "application/json",
        }
    })
        .then(resp => resp.data)
        .catch(error => error.message);
};