import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Use the environment variable from .env or apply automatic fallback
const getApiUrl = () => {
    // 1. Try public env variable
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. Auto-detect local development if env is not defined
    if (__DEV__) {
        // Enulador Android official uses 10.0.2.2
        // Genymotion uses 10.0.3.2 
        // Physical device uses computer IP
        if (Platform.OS === 'android') {
            return 'http://10.0.2.2:5175';
        }
        return 'http://localhost:5175';
    }

    // Default production URL if none of the above
    return 'http://gingaflow-api.local';
};

export const API_URL = getApiUrl();
console.log('🔗 Mobile API URL:', API_URL);

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        // O Ngrok gratuito exibe uma página de aviso HTML que quebra a API JSON.
        // Esse header faz o Ngrok pular esse aviso e entregar o JSON direto.
        'ngrok-skip-browser-warning': 'true',
    },
    timeout: 10000, // 10s timeout
});

// Interceptor para injetar token
api.interceptors.request.use(async (config) => {
    const token = await AsyncStorage.getItem('@gingaflow_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`📡 Request: [${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`);
    return config;
}, error => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
});

// Interceptor para tratar erros (ex: token expirado)
api.interceptors.response.use(
    (response) => {
        console.log(`✅ Response: [${response.status}] ${response.config.url}`);
        return response;
    },
    async (error) => {
        console.error(`❌ Response Error: ${error.message}`);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data:`, error.response.data);
            if (error.response.status === 404) {
                console.error(`⚠️ 404 Warning: URL ${error.config.baseURL}${error.config.url} not found.`);
            }
        }

        if (error.response?.status === 401) {
            // Token expirado ou inválido
            await AsyncStorage.removeItem('@gingaflow_token');
            await AsyncStorage.removeItem('@gingaflow_user');
        }
        return Promise.reject(error);
    }
);
