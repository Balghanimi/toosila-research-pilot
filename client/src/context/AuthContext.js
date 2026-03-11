import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();
const isDev = process.env.NODE_ENV === 'development';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user from localStorage on app start and validate token
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('currentUser');
        const activeMode = localStorage.getItem('activeMode');

        if (token && savedUser) {
          let userData = JSON.parse(savedUser);

          // Apply persisted mode preference if it exists
          if (activeMode) {
            userData = { ...userData, isDriver: activeMode === 'driver' };
          }

          // Validate user data structure - support both email and phone-based users
          // Only require: id is present (name, email, and phone are all optional)
          if (userData.id) {
            // Load cached user first for immediate UI rendering
            setUser(userData);

            // Validate token with backend (5-second timeout)
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);

              const apiUrl =
                process.env.REACT_APP_API_URL ||
                (process.env.NODE_ENV === 'production'
                  ? 'https://toosila-backend-production.up.railway.app/api'
                  : 'http://localhost:5001/api');

              const response = await fetch(`${apiUrl}/auth/me`, {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                // Token is invalid or expired
                if (isDev) console.warn('[AUTH] Token validation failed, status:', response.status);
                localStorage.removeItem('currentUser');
                localStorage.removeItem('token');
                localStorage.removeItem('activeMode');
                setUser(null);
              } else {
                // Token is valid, update user data if needed
                const result = await response.json();
                if (result.data && result.data.user) {
                  let freshUserData = result.data.user;

                  // Re-apply mode preference to fresh data from server
                  const currentActiveMode = localStorage.getItem('activeMode');
                  if (currentActiveMode) {
                    freshUserData = { ...freshUserData, isDriver: currentActiveMode === 'driver' };
                  }

                  localStorage.setItem('currentUser', JSON.stringify(freshUserData));
                  setUser(freshUserData);
                }
              }
            } catch (tokenError) {
              // Network error or timeout - keep cached user (offline mode)
              // Token will be validated on next API call
              if (isDev)
                console.warn('[AUTH] Token validation failed (network):', tokenError.message);
            }
          } else {
            if (isDev) console.warn('[AUTH] User data missing required fields');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            localStorage.removeItem('activeMode');
          }
        }
      } catch (error) {
        if (isDev) console.error('Error loading user data:', error);
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('activeMode');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Helper function to get all users from localStorage
  const getAllUsers = () => {
    try {
      const users = localStorage.getItem('users');
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  };

  // Register function - API-based
  const register = async (userData) => {
    setError('');
    setLoading(true);

    try {
      const { name, email, password, userType = 'passenger' } = userData;

      // Validation
      if (!name || !email || !password) {
        throw new Error('الاسم والبريد الإلكتروني وكلمة المرور مطلوبة');
      }

      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }

      if (password.length < 5) {
        throw new Error('كلمة المرور يجب أن تكون 5 أحرف أو أرقام على الأقل');
      }

      // Call API
      const data = await authAPI.register({
        name,
        email,
        password,
        userType,
      });

      // Save token and user data
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));

      // Default active mode based on registration
      const isDriver = data.data.user.userType === 'driver' || data.data.user.isDriver;
      localStorage.setItem('activeMode', isDriver ? 'driver' : 'passenger');

      setUser(data.data.user);

      setLoading(false);
      return { success: true, user: data.data.user };
    } catch (error) {
      setError(error.message);
      setLoading(false);
      throw new Error(error.message);
    }
  };

  // Phone-based login function
  const loginWithPhone = async (phone) => {
    setError('');
    setLoading(true);

    try {
      if (!phone) {
        throw new Error('رقم الهاتف مطلوب');
      }

      const allUsers = getAllUsers();

      // Find user by phone
      const foundUser = allUsers.find((u) => u.phone === phone.trim());

      if (!foundUser) {
        throw new Error('رقم الهاتف غير مسجل. يرجى إنشاء حساب جديد.');
      }

      // Set current user
      const userForStorage = { ...foundUser };
      localStorage.setItem('currentUser', JSON.stringify(userForStorage));

      // Reset active mode on new login
      localStorage.setItem('activeMode', userForStorage.isDriver ? 'driver' : 'passenger');

      setUser(userForStorage);

      setLoading(false);
      return { success: true, user: userForStorage };
    } catch (error) {
      setError(error.message);
      setLoading(false);
      throw new Error(error.message);
    }
  };

  // Login function - supports both email/password and direct token/user (for OTP flow)
  const login = async (credentialsOrToken, userDataOrNull = null) => {
    setError('');
    setLoading(true);

    try {
      // Check if this is a direct login with token and user (from OTP verification)
      if (typeof credentialsOrToken === 'string' && userDataOrNull) {
        // Direct login with token and user object (OTP flow)
        const token = credentialsOrToken;
        const userData = userDataOrNull;

        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(userData));

        // Reset active mode on new login
        const mode = userData.isDriver ? 'driver' : 'passenger';
        localStorage.setItem('activeMode', mode);

        setUser(userData);

        setLoading(false);
        return { success: true, user: userData };
      }

      // Traditional email/password login
      const { email, password } = credentialsOrToken;

      if (!email || !password) {
        throw new Error('البريد الإلكتروني وكلمة المرور مطلوبان');
      }

      // Call API
      const data = await authAPI.login(email, password);

      localStorage.setItem('token', data.data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.data.user));

      // Reset active mode on new login
      const isDriver = data.data.user.isDriver;
      const mode = isDriver ? 'driver' : 'passenger';
      localStorage.setItem('activeMode', mode);

      setUser(data.data.user);

      setLoading(false);
      return { success: true, user: data.data.user };
    } catch (error) {
      if (isDev) console.error('[AUTH] Login failed:', error.message);
      setError(error.message);
      setLoading(false);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('activeMode');
    setUser(null);
    setError('');
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!user) return { success: false, error: 'غير مسجل دخول' };

    try {
      // Validate updates
      if (updates.email && !/^\S+@\S+\.\S+$/.test(updates.email)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }

      if (updates.phone && !/^07\d{9}$/.test(updates.phone)) {
        throw new Error('رقم الهاتف غير صحيح');
      }

      // Call API
      const data = await authAPI.updateProfile(updates);

      // Update current user
      let updatedUser = data.data.user;

      // Preserve active mode override if it exists
      const activeMode = localStorage.getItem('activeMode');
      if (activeMode) {
        updatedUser = { ...updatedUser, isDriver: activeMode === 'driver' };
      }

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Update token if provided (e.g. when role changes)
      if (data.data.token) {
        localStorage.setItem('token', data.data.token);
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Get user by ID
  const getUserById = (userId) => {
    const allUsers = getAllUsers();
    return allUsers.find((u) => u.id === userId);
  };

  // Check if user is authenticated
  const isAuthenticated = !!user;

  // Check if user is driver
  const isDriver = user?.isDriver === true;

  // Check if user is passenger
  const isPassenger = user?.isDriver === false;

  // Toggle user type (driver <-> passenger) - CLIENT SIDE ONLY
  // Accepts optional desiredIsDriver boolean to set specific mode
  const toggleUserType = async (desiredIsDriver = null) => {
    if (!user) return { success: false, error: 'غير مسجل دخول' };

    try {
      const currentIsDriver = user.isDriver;

      // Determine new state
      const newIsDriver = desiredIsDriver !== null ? desiredIsDriver : !currentIsDriver;

      // If no change needed, return success immediately
      if (newIsDriver === currentIsDriver) {
        return { success: true, user };
      }

      const newMode = newIsDriver ? 'driver' : 'passenger';

      // Update local storage for persistence
      localStorage.setItem('activeMode', newMode);

      // Update user state immediately without API call
      const updatedUser = { ...user, isDriver: newIsDriver };

      // Update currentUser in localStorage to keep them in sync
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setUser(updatedUser);

      return { success: true, user: updatedUser };
    } catch (error) {
      if (isDev) console.error('Error toggling user type:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    currentUser: user,
    setCurrentUser: setUser,
    loading,
    error,
    register,
    login,
    loginWithPhone,
    logout,
    updateProfile,
    toggleUserType,
    getUserById,
    isAuthenticated,
    isDriver,
    isPassenger,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
