import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gym_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('gym_auth_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/api/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('gym_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/api/auth/login', { identifier, password });
    const data = res.data;
    localStorage.setItem('gym_auth_token', data.token);
    setToken(data.token);

    const userObj = {
      memberId: data.memberId,
      memberCode: data.memberCode,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
    };
    setUser(userObj);
    localStorage.setItem('gym_user', JSON.stringify(userObj));
    return data;
  };

  const logout = () => {
    localStorage.removeItem('gym_auth_token');
    localStorage.removeItem('gym_user');
    setToken(null);
    setUser(null);
  };

  const refreshProfile = async () => {
    if (user?.memberId) {
      try {
        const res = await api.get(`/api/members/${user.memberId}`);
        setUser((prev) => ({ ...prev, ...res.data }));
      } catch (e) {
        console.error("Failed to refresh profile", e);
      }
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshProfile,
    isAdmin: user?.role === 'ROLE_ADMIN',
    isMember: user?.role === 'ROLE_MEMBER',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
