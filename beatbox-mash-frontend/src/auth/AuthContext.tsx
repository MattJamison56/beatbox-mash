/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
  avatarUrl: string | null;
  user_id: string | null;
  login: (role: string, token: string, avatarUrl: string, user_id: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [user_id, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    const savedAvatarUrl = localStorage.getItem('avatar_url');
    const savedUserId = localStorage.getItem('user_id');
  
    if (savedToken && savedRole && savedUserId) {
      setIsAuthenticated(true);
      setRole(savedRole);
      setAvatarUrl(savedAvatarUrl || null);
      setUserId(savedUserId);
    } else {
      setIsAuthenticated(false);
      setRole(null);
    }
  }, []);  

  const login = (newRole: string, newToken: string, newAvatarUrl: string, newUserID: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('avatar_url', newAvatarUrl);
    localStorage.setItem('user_id', newUserID); // Make sure user_id is passed correctly
    setIsAuthenticated(true);
    setRole(newRole);
    setToken(newToken);
    setAvatarUrl(newAvatarUrl);
    setUserId(newUserID);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('avatar_url');
    localStorage.removeItem('user_id');
    setIsAuthenticated(false);
    setRole(null);
    setToken(null);
    setAvatarUrl(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, role, avatarUrl, user_id, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};