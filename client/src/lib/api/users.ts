// User profile API helpers

import { UserProfile, UpdateProfileRequest, Quote, Gamble } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Get current user profile
export async function getCurrentUserProfile(): Promise<UserProfile> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return response.json();
}

// Update user profile
export async function updateUserProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update profile');
  }

  return response.json();
}

// Get all quotes for selection
export async function getAllQuotes(): Promise<Quote[]> {
  const response = await fetch(`${API_URL}/quotes`);
  if (!response.ok) {
    throw new Error('Failed to fetch quotes');
  }
  const data = await response.json();
  return data.data || [];
}

// Get all gambles for selection
export async function getAllGambles(): Promise<Gamble[]> {
  const response = await fetch(`${API_URL}/gambles`);
  if (!response.ok) {
    throw new Error('Failed to fetch gambles');
  }
  const data = await response.json();
  return data.data || [];
}
