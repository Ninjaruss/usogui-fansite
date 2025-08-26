
import { Event } from '../../types/resources';
import { API_URL, PaginatedResponse } from './types';

export async function getEvents(options: { page?: number; limit?: number; } = {}): Promise<PaginatedResponse<Event>> {
  const { page = 1, limit = 20 } = options;
  const response = await fetch(`${API_URL}/events?page=${page}&limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch events');
  }
  return response.json();
}

export async function getEvent(id: number): Promise<Event> {
  const response = await fetch(`${API_URL}/events/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch event');
  }
  return response.json();
}

export async function createEvent(data: Omit<Event, 'id'>): Promise<Event> {
  const response = await fetch(`${API_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to create event');
  }
  return response.json();
}

export async function updateEvent(id: number, data: Partial<Event>): Promise<Event> {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error('Failed to update event');
  }
  return response.json();
}

export async function deleteEvent(id: number): Promise<void> {
  const response = await fetch(`${API_URL}/events/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete event');
  }
  // No content expected for successful delete
}
