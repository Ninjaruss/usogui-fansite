
import { Arc } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getArcs(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Arc>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/arcs?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch arcs');
  }
  return response.json();
}

export async function getArc(id: number): Promise<Arc> {
  const response = await fetch(`${API_URL}/arcs/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch arc');
  }
  return response.json();
}

export async function createArc(data: Omit<Arc, 'id'>): Promise<Arc> {
  const response = await fetch(`${API_URL}/arcs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create arc');
  }
  return response.json();
}

export async function updateArc(id: number, data: Partial<Arc>): Promise<Arc> {
  const response = await fetch(`${API_URL}/arcs/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update arc');
  }
  return response.json();
}

export async function deleteArc(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/arcs/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete arc');
  }
  // No content expected for successful delete
}
