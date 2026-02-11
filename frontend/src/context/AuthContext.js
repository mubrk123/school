import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await getMe();
          setUser(response.data.user);
          setSchool(response.data.school);
          setToken(response.data.access_token);
        } catch (error) {
          console.error('Auth init error:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('school', JSON.stringify(data.school));
    setToken(data.access_token);
    setUser(data.user);
    setSchool(data.school);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('school');
    setToken(null);
    setUser(null);
    setSchool(null);
  };

  const isPrincipal = user?.role === 'principal';
  const isTeacher = user?.role === 'teacher';

  return (
    <AuthContext.Provider value={{ 
      user, 
      school, 
      token, 
      loading, 
      login, 
      logout, 
      isPrincipal, 
      isTeacher,
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
