// Guide submission API helpers

import { CreateGuideRequest, Guide } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create a new guide
export async function createGuide(guideData: CreateGuideRequest): Promise<Guide> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/guides`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(guideData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create guide');
  }

  return response.json();
}

// Get user's guides
export async function getUserGuides(page = 1, limit = 20): Promise<{ data: Guide[]; total: number; page: number; totalPages: number }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/guides?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch guides');
  }

  return response.json();
}
