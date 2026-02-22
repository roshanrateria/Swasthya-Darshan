import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, login as apiLogin, register as apiRegister } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('swasthya_token');
        if (token) {
            getProfile()
                .then(res => setUser(res.data))
                .catch(() => {
                    localStorage.removeItem('swasthya_token');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const res = await apiLogin({ email, password });
        localStorage.setItem('swasthya_token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const register = async (data) => {
        const res = await apiRegister(data);
        localStorage.setItem('swasthya_token', res.data.token);
        setUser(res.data.user);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('swasthya_token');
        setUser(null);
    };

    const isAuthenticated = !!user;

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated, setUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
