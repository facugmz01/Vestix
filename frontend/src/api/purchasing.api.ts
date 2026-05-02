import { erpApi } from './axios.config';

export const purchasingApi = {
  getOrders: (params: any) => 
    erpApi.get('/purchasing/orders', { params }).then(res => res.data),
  
  processDirect: (data: any) => 
    erpApi.post('/purchasing/direct', data).then(res => res.data),

  getSuppliers: () =>
    erpApi.get('/suppliers').then(res => res.data),

  searchCatalog: (query: string) =>
    erpApi.get('/pos/search', { params: { query } }).then(res => res.data),
};
