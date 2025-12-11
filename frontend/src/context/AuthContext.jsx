import { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (token) {
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            // Re-use token already in localStorage (interceptor picks it up)
            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch user", err);
            // If invalid token, clear it
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.success) {
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser({
                _id: res.data._id,
                name: res.data.name,
                email: res.data.email,
                role: res.data.role
            });
            return true;
        }
        return false;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
