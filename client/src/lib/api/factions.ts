
import { Faction } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getFactions(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Faction>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/factions?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch factions: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Faction[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getFaction(id: number): Promise<Faction> {
  const response = await fetch(`${API_URL}/factions/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch faction');
  }
  return response.json();
}

export async function createFaction(data: Omit<Faction, 'id'>): Promise<Faction> {
  const response = await fetch(`${API_URL}/factions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create faction');
  }
  return response.json();
}

export async function updateFaction(id: number, data: Partial<Faction>): Promise<Faction> {
  const response = await fetch(`${API_URL}/factions/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update faction');
  }
  return response.json();
}

export async function deleteFaction(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/factions/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete faction');
  }
  // No content expected for successful delete
}
