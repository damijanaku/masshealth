import axios from "axios"
import { ACCESS_TOKEN } from "./constants"
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const baseURL = "http://164.8.39.6:8000"

// (no auth required)
export const publicApi = axios.create({
    baseURL: baseURL
});

// for authenticated requests
const privateApi = axios.create({
    baseURL: baseURL
});

privateApi.interceptors.request.use(
    async (config) => {
        const token = await SecureStore.getItemAsync(ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
);



export default privateApi;
