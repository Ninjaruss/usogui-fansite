
import { Character } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getCharacters(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Character>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/characters?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch characters');
  }
  return response.json();
}

export async function getCharacter(id: number): Promise<Character> {
  const response = await fetch(`${API_URL}/characters/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch character');
  }
  return response.json();
}

export async function createCharacter(data: Omit<Character, 'id'>): Promise<Character> {
  const response = await fetch(`${API_URL}/characters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create character');
  }
  return response.json();
}

export async function updateCharacter(id: number, data: Partial<Character>): Promise<Character> {
  const response = await fetch(`${API_URL}/characters/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update character');
  }
  return response.json();
}

export async function deleteCharacter(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/characters/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete character');
  }
  // No content expected for successful delete
}
