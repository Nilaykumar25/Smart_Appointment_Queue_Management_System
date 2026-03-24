import React, { createContext, useState, useContext } from 'react';

// Create a context for authentication to handle global auth state
const AuthContext = createContext();

// AuthProvider component to wrap the app and provide auth context to all components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Stub function for user registration
  const register = async (name, email, password) => {
    // Mock successful registration, in a real app this would call an API
    const newUser = { id: Date.now(), name, email };
    setUser(newUser);
    return newUser;
  };

  // Stub function for user login
  const login = async (email, password) => {
    // Mock successful login
    const loggedInUser = { id: Date.now(), name: 'Patient', email };
    setUser(loggedInUser);
    return loggedInUser;
  };

  // Function to clear user state and log out
  const logout = () => {
    setUser(null);
  };

  // Provide the user state and auth methods to children
  return (
    <AuthContext.Provider value={{ user, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for consuming auth context easily in other components
export const useAuth = () => {
  return useContext(AuthContext);
};
