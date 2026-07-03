import axios from 'axios';
import type {
    AxiosError,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from 'axios';
import { env } from '../env';

const BASE_URL_AUTH = env.VITE_APP_AUTH_URL;

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}


const axiosInstance = axios.create({
    baseURL: env.VITE_APP_BACKEND_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);


axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as CustomAxiosRequestConfig;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            try {
               
                const response = await axios.post(
                    `${BASE_URL_AUTH}/token/refresh`,
                    {
                        refresh_token: refreshToken,
                    }
                );

                const { access_token, refresh_token } = response.data;
                localStorage.setItem('token', access_token);
                localStorage.setItem('refreshToken', refresh_token);

                
                axiosInstance.defaults.headers.common['Authorization'] =
                    `Bearer ${access_token}`;
                originalRequest.headers.Authorization = `Bearer ${access_token}`;

                
                return axiosInstance(originalRequest);
            } catch (error) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                window.location.href = '/';
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;