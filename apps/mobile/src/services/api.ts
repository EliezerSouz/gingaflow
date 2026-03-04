import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// -------------------------------------------------------------------------
// PASSO 1: Gere uma URL pública (Ex: via ngrok: 'ngrok http 5175')
// PASSO 2: Cole a URL gerada abaixo
// -------------------------------------------------------------------------
// export const EXTERNAL_API_URL = 'http://192.168.1.6:5175'; // Comentado para usar emulador
export const EXTERNAL_API_URL = 'http://192.168.1.10:5175'; // Vazio = usa configuração automática
console.log('🔗 Mobile API URL:', EXTERNAL_API_URL || 'Using default fallback');

const getApiUrl = () => {
    // Se houver uma URL externa definida e não for o valor padrão, use-a.
    // Isso permite testar no celular via 4G ou WiFi sem reconstruir o app toda hora.
    if (EXTERNAL_API_URL && !EXTERNAL_API_URL.includes('sua-url')) {
        return EXTERNAL_API_URL;
    }

    if (!__DEV__) {
        return EXTERNAL_API_URL;
    }

    // Se estiver rodando no emulador Android
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:5175';
    }

    // iOS Simulator ou web
    return 'http://localhost:5175';
};

export const API_URL = getApiUrl();

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
