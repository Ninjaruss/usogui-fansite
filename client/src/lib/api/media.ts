// Media submission API helpers

import { CreateMediaRequest, Media, Character } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Submit media for approval
export async function submitMedia(mediaData: CreateMediaRequest): Promise<Media> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/media`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(mediaData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to submit media');
  }

  return response.json();
}

// Get all characters for selection
export async function getAllCharacters(): Promise<Character[]> {
  const response = await fetch(`${API_URL}/characters`);
  if (!response.ok) {
    throw new Error('Failed to fetch characters');
  }
  const data = await response.json();
  return data.data || [];
}

// Get user's submitted media
export async function getUserMedia(page = 1, limit = 20): Promise<{ data: Media[]; total: number; page: number; totalPages: number }> {
  const token = localStorage.getItem('authToken');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/media?page=${page}&limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch media');
  }

  return response.json();
}
