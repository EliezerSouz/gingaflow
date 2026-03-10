import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { User } from '../types';

interface AuthContextData {
    user: User | null;
    loading: boolean;
    signIn: (email: string, pass: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Safety timeout: never block the app more than 3 seconds
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('⚠️ AuthContext: timeout on storage load, proceeding without session');
                setLoading(false);
            }
        }, 3000);

        async function loadStorageData() {
            try {
                const token = await AsyncStorage.getItem('@gingaflow_token');
                const userStr = await AsyncStorage.getItem('@gingaflow_user');

                if (mounted && token && userStr) {
                    api.defaults.headers.Authorization = `Bearer ${token}`;
                    setUser(JSON.parse(userStr));
                }
            } catch (e) {
                console.error('❌ Falha ao carregar storage:', e);
            } finally {
                if (mounted) {
                    clearTimeout(timeout);
                    setLoading(false);
                }
            }
        }

        loadStorageData();

        return () => {
            mounted = false;
            clearTimeout(timeout);
        };
    }, []);

    async function signIn(email: string, pass: string) {
        const response = await api.post('/auth/login', {
            email,
            password: pass,
        });

        const { token, user } = response.data;

        setUser(user);
        api.defaults.headers.Authorization = `Bearer ${token}`;

        await AsyncStorage.setItem('@gingaflow_token', token);
        await AsyncStorage.setItem('@gingaflow_user', JSON.stringify(user));
    }

    async function signOut() {
        await AsyncStorage.removeItem('@gingaflow_token');
        await AsyncStorage.removeItem('@gingaflow_user');
        delete (api.defaults.headers as any).Authorization;
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
