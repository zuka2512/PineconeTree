import axios from 'axios';

// Postavi bazni URL za sve API pozive
const api = axios.create({
  baseURL: 'http://localhost:3000', // Ovdje dodaj točan URL backend servera
});

// Tipovi za čvorove
export type Node = {
  id: number;
  parentId: number | null;
  title: string;
  ordering: number;
};

// Dohvaćanje stabla čvorova
export const fetchTree = async (parentId?: number) => {
  const response = await api.get<Node[]>(`/tree/${parentId || ''}`);
  return response.data;
};

// Dodavanje novog čvora
export const addNode = async (parentId: number, name: string) => {
  const response = await api.post<Node>('/node', { parentId: parentId, title: name });
  return response.data;
};

// Ažuriranje čvora
export const updateNode = async (id: number, name: string) => {
  const response = await api.put(`/node/${id}`, { name });
  return response.data;
};

// Brisanje čvora
export const deleteNode = async (id: number) => {
  const response = await api.delete(`/node/${id}`);
  return response.data;
};

// Premještanje čvora
export const moveNode = async (id: number, newParentId: number) => {
  const response = await api.patch(`/node/${id}/move`, { newParentId });
  return response.data;
};

// Promjena redoslijeda čvora
export const reorderNode = async (id: number, newOrder: number) => {
  const response = await api.patch(`/node/${id}/reorder`, { newOrder });
  return response.data;
};
