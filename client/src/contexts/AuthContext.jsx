import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginUser, signupUser, logoutUser, getMe } from '../api/auth.api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  // On mount, check if user is already logged in via cookies
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await getMe();
        setUser(data.data?.user ?? data.user ?? data);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await loginUser({ email, password });
    const loggedInUser = data.data?.user ?? data.user ?? data;
    setUser(loggedInUser);
    toast.success('Logged in successfully');
    navigate('/dashboard');
    return loggedInUser;
  }, [navigate]);

  const signup = useCallback(async (signupData) => {
    const { data } = await signupUser(signupData);
    const newUser = data.data?.user ?? data.user ?? data;
    setUser(newUser);
    toast.success('Account created successfully');
    navigate('/dashboard');
    return newUser;
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // Proceed with local logout even if API call fails
    }
    setUser(null);
    toast.success('Logged out');
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
