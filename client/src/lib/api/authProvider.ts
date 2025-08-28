"use client";

import { AuthProvider } from 'react-admin';
import { AuthUser, LoginRequest, LoginResponse, RefreshResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const authProvider: AuthProvider = {
  login: async (params: LoginRequest) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data: LoginResponse = await response.json();

    // Store the access token and user info
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('authUser', JSON.stringify(data.user));

    return Promise.resolve();
  },

  logout: async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
    }

    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    return Promise.resolve();
  },

  checkAuth: async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No token found');
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Token invalid');
      }

      return Promise.resolve();
    } catch {
      // Try to refresh the token
      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!refreshResponse.ok) {
          throw new Error('Refresh failed');
        }

        const refreshData: RefreshResponse = await refreshResponse.json();

        localStorage.setItem('authToken', refreshData.access_token);
        localStorage.setItem('authUser', JSON.stringify(refreshData.user));

        return Promise.resolve();
      } catch {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        throw new Error('Authentication failed');
      }
    }
  },

  checkError: (error: { status?: number }) => {
    const status = error.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      return Promise.reject();
    }
    return Promise.resolve();
  },

  getIdentity: async () => {
    const userString = localStorage.getItem('authUser');
    if (!userString) {
      throw new Error('No user found');
    }

    const user: AuthUser = JSON.parse(userString);
    return {
      id: user.id,
      fullName: user.username,
      avatar: undefined,
    };
  },

  getPermissions: async () => {
    const userString = localStorage.getItem('authUser');
    if (!userString) {
      return null;
    }

    const user: AuthUser = JSON.parse(userString);
    return user.role;
  },
};
