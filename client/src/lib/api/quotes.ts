
import { Quote } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getQuotes(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Quote>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/quotes?page=${page}&limit=${limit}`);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Failed to fetch quotes: ${response.status} ${text}`);
  }

  const body = await response.json();
  return {
    data: body.data as Quote[],
    total: body.total as number,
    page: body.page as number,
    totalPages: body.totalPages as number,
  };
}

export async function getQuote(id: number): Promise<Quote> {
  const response = await fetch(`${API_URL}/quotes/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quote');
  }
  return response.json();
}

export async function createQuote(data: Omit<Quote, 'id'>): Promise<Quote> {
  const response = await fetch(`${API_URL}/quotes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create quote');
  }
  return response.json();
}

export async function updateQuote(id: number, data: Partial<Quote>): Promise<Quote> {
  const response = await fetch(`${API_URL}/quotes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update quote');
  }
  return response.json();
}

export async function deleteQuote(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/quotes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete quote');
  }
  // No content expected for successful delete
}
