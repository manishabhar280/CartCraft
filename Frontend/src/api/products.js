import api from './client';

export async function fetchProducts() {
  const response = await api.get('/api/products');
  return Array.isArray(response.data?.products) ? response.data.products : [];
}