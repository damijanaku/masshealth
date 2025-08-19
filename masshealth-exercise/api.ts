import axios from "axios"
import { ACCESS_TOKEN } from "./constants"
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const baseURL = "http://10.0.2.2:8000";

// Public API - for registration, login (no auth required)
export const publicApi = axios.create({
    baseURL: baseURL
});

// Private API - for authenticated requests
const privateApi = axios.create({
    baseURL: baseURL
});

// Only add auth headers to private API
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

// Default export is the private API for backward compatibility
export default privateApi;