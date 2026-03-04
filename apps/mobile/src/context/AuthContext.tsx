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
        async function loadStorageData() {
            try {
                const [storagedUser, storagedToken] = await AsyncStorage.multiGet([
                    '@gingaflow_user',
                    '@gingaflow_token',
                ]);

                if (storagedUser[1] && storagedToken[1]) {
                    api.defaults.headers.Authorization = `Bearer ${storagedToken[1]}`;
                    setUser(JSON.parse(storagedUser[1]));
                }
            } catch (e) {
                console.error('Falha ao carregar storage', e);
            } finally {
                setLoading(false);
            }
        }

        loadStorageData();
    }, []);

    async function signIn(email: string, pass: string) {
        const response = await api.post('/auth/login', {
            email,
            password: pass,
        });

        const { token, user } = response.data;

        setUser(user);

        api.defaults.headers.Authorization = `Bearer ${token}`;

        await AsyncStorage.multiSet([
            ['@gingaflow_token', token],
            ['@gingaflow_user', JSON.stringify(user)],
        ]);
    }

    async function signOut() {
        await AsyncStorage.clear();
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
