import React, { createContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import { toast } from '../utils/toast';

export const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('AuthContext: Checking for existing token:', !!token);
    
    if (token) {
      console.log('AuthContext: Token found, fetching user data');
      // Fetch user info from backend
      axiosInstance.get('/auth/user')
        .then((res) => {
          console.log('AuthContext: User data fetched successfully:', res.data);
          setUser(res.data.userData);
        })
        .catch((error) => {
          console.error('AuthContext: Error fetching user data:', error);
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      console.log('AuthContext: No token found');
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    console.log('AuthContext: Login attempt started with credentials:', { 
      username: credentials.username, 
      passwordLength: credentials.password?.length 
    });
    
    try {
      // Validate credentials before sending
      if (!credentials.username || !credentials.password) {
        console.error('AuthContext: Missing credentials');
        toast.error('Username and password are required');
        return false;
      }

      if (credentials.username.trim().length === 0 || credentials.password.trim().length === 0) {
        console.error('AuthContext: Empty credentials');
        toast.error('Username and password cannot be empty');
        return false;
      }

      console.log('AuthContext: Sending login request to server');
      const response = await axiosInstance.post('/auth/login', {
        username: credentials.username.trim(),
        password: credentials.password.trim()
      });
      
      console.log('AuthContext: Login response received:', {
        status: response.status,
        hasToken: !!response.data.token,
        userId: response.data.userId
      });

      if (!response.data.token) {
        console.error('AuthContext: No token in response');
        toast.error('Login failed: No authentication token received');
        return false;
      }

      // Store token
      localStorage.setItem('token', response.data.token);
      console.log('AuthContext: Token stored in localStorage');
      
      // Fetch user data after login
      console.log('AuthContext: Fetching user data after login');
      const userResponse = await axiosInstance.get('/auth/user');
      
      console.log('AuthContext: User data response:', userResponse.data);
      
      if (!userResponse.data.userData) {
        console.error('AuthContext: No user data in response');
        toast.error('Login failed: Unable to fetch user data');
        localStorage.removeItem('token');
        return false;
      }

      setUser(userResponse.data.userData);
      console.log('AuthContext: User state updated successfully');
      
      toast.success('Login successful');
      return true;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      // Clear any stored token on error
      localStorage.removeItem('token');
      setUser(null);
      
      // Handle different types of errors
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        console.error('AuthContext: Network error detected');
        toast.error('Network error: Unable to connect to server. Please check your connection.');
      } else if (error.response) {
        console.error('AuthContext: Server error response:', error.response.data);
        const errorMessage = error.response.data?.message || 'Login failed';
        toast.error(errorMessage);
      } else if (error.request) {
        console.error('AuthContext: No response from server:', error.request);
        toast.error('No response from server. Please try again.');
      } else {
        console.error('AuthContext: Unexpected error:', error.message);
        toast.error('An unexpected error occurred. Please try again.');
      }
      
      return false;
    }
  };

  const logout = () => {
    console.log('AuthContext: Logout initiated');
    localStorage.removeItem('token');
    setUser(null);
    toast.info('Logged out');
  };

  const register = async (data) => {
    console.log('AuthContext: Registration attempt started');
    
    try {
      await axiosInstance.post('/auth/register', data);
      console.log('AuthContext: Registration successful');
      toast.success('Registration successful. Please login.');
      return true;
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      
      if (error.response) {
        const errorMessage = error.response.data?.message || 'Registration failed';
        toast.error(errorMessage);
      } else {
        toast.error('Registration failed. Please try again.');
      }
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
