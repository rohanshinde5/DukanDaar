import { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    const email = Cookies.get('email');
    if (token) {
      setUser({ token, email });
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    Cookies.set('token', userData.token, { expires: 30 });
    Cookies.set('email', userData.email, { expires: 30 });
    setUser(userData);
  };

  const logout = () => {
    Cookies.remove('token');
    Cookies.remove('email');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
