import axios from 'axios';
import type { Document, UserUsage } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function fetchDocuments(): Promise<Document[]> {
  const { data } = await api.get<{ documents: Document[] }>('/api/documents');
  return data.documents;
}

export async function fetchDocument(id: string) {
  const { data } = await api.get(`/api/documents/${id}`);
  return data;
}

export async function deleteDocument(id: string) {
  await api.delete(`/api/documents/${id}`);
}

export async function fetchUsage(): Promise<UserUsage> {
  const { data } = await api.get<UserUsage>('/api/user/usage');
  return data;
}

export default api;
