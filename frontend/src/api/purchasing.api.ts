import { apiClient } from './client';

export const purchasingApi = {
  getOrders: (params: any) => 
    apiClient.get('/purchasing/orders', { params }).then(res => res.data),
  
  processDirect: (data: any) => 
    apiClient.post('/purchasing/direct', data).then(res => res.data),

  getSuppliers: () =>
    apiClient.get('/suppliers').then(res => res.data),

  searchCatalog: (query: string) =>
    apiClient.get('/pos/catalog/search', { params: { q: query } }).then(res => res.data),

  autoReplenish: () =>
    apiClient.post('/purchasing/auto-replenish').then(res => res.data),
};
