import React, { createContext, useState, useContext } from 'react';
import { login as authLogin, logout as authLogout, register as authRegister, isAuthenticated, getRole, getName } from '../services/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    if (isAuthenticated()) {
      return { name: getName(), role: getRole() };
    }
    return null;
  });

  const register = async (name, email, password) => {
    const result = await authRegister(name, email, password);
    if (!result.success) throw new Error(result.message);
    const newUser = { name: result.name, role: result.role };
    setUser(newUser);
    return newUser;
  };

  const login = async (email, password) => {
    const result = await authLogin(email, password);
    if (!result.success) throw new Error(result.message);
    const loggedInUser = { name: result.name, role: result.role };
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
