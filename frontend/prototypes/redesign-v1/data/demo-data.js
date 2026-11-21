/* Datos sintéticos para revisar jerarquía, densidad y flujos. No representan información real. */
window.VESTIX_DEMO = {
  branch: 'Palermo · Sucursal 01',
  warehouse: 'Depósito Palermo',
  lowStockThreshold: 2,
  products: [
    { id: 'RN-042', name: 'Remera Nube', color: 'Verde petróleo', category: 'Remeras', sizes: ['XS', 'S', 'M', 'L', 'XL'], stock: [2, 4, 8, 2, 0], price: 28500, variants: 5, status: 'Publicado', swatch: '#28636b' },
    { id: 'JP-108', name: 'Jean Pampa', color: 'Azul medio', category: 'Pantalones', sizes: ['36', '38', '40', '42', '44'], stock: [1, 3, 6, 4, 1], price: 63900, variants: 5, status: 'Publicado', swatch: '#597c9c' },
    { id: 'BS-016', name: 'Buzo Sur', color: 'Arena', category: 'Abrigos', sizes: ['S', 'M', 'L', 'XL'], stock: [0, 2, 4, 3], price: 47000, variants: 4, status: 'Publicado', swatch: '#b6a68f' },
    { id: 'CB-031', name: 'Camisa Bruma', color: 'Blanco tiza', category: 'Camisas', sizes: ['XS', 'S', 'M', 'L'], stock: [2, 6, 8, 3], price: 50000, variants: 4, status: 'Publicado', swatch: '#d9d5cb' },
    { id: 'BP-009', name: 'Bufanda Pampa', color: 'Borgoña', category: 'Accesorios', sizes: ['Único'], stock: [12], price: 28000, variants: 1, status: 'Publicado', swatch: '#824c58' },
    { id: 'CR-022', name: 'Cinto Riel', color: 'Cuero suela', category: 'Accesorios', sizes: ['85', '95', '105'], stock: [7, 4, 1], price: 10000, variants: 3, status: 'Borrador', swatch: '#9a6644' },
  ],
  sales: [
    { id: 'V-10482', at: '09:18', customer: 'Consumidor final', method: 'Débito', lines: [{ productId: 'RN-042', size: 'M', qty: 1 }, { productId: 'CB-031', size: 'S', qty: 1 }] },
    { id: 'V-10483', at: '10:12', customer: 'Lucía Fernández', method: 'Crédito', lines: [{ productId: 'JP-108', size: '40', qty: 1 }] },
    { id: 'V-10484', at: '11:44', customer: 'Consumidor final', method: 'Efectivo', lines: [{ productId: 'BS-016', size: 'M', qty: 2 }] },
    { id: 'V-10485', at: '12:05', customer: 'Micaela Torres', method: 'Transferencia', lines: [{ productId: 'RN-042', size: 'S', qty: 1 }, { productId: 'BP-009', size: 'Único', qty: 1 }] },
    { id: 'V-10486', at: '13:21', customer: 'Consumidor final', method: 'Débito', lines: [{ productId: 'JP-108', size: '42', qty: 1 }, { productId: 'RN-042', size: 'L', qty: 1 }, { productId: 'CR-022', size: '95', qty: 1 }] },
    { id: 'V-10487', at: '14:06', customer: 'Ana Belén Ríos', method: 'Efectivo', lines: [{ productId: 'CB-031', size: 'M', qty: 1 }, { productId: 'BP-009', size: 'Único', qty: 1 }, { productId: 'CR-022', size: '85', qty: 1 }] },
  ],
  queue: [
    { count: 4, noun: 'pedidos por preparar', context: 'Prioridad: los más antiguos primero', screen: 'sales', tone: 'warn' },
    { count: 9, noun: 'variantes para revisar', context: 'Quedan 0–2 unidades disponibles', screen: 'inventory', tone: 'warn' },
    { count: 1, noun: 'recepción pendiente', context: 'Orden OC-00318 · Proveedor Sur', screen: 'purchases', tone: 'neutral' },
  ],
  sizeRunProductId: 'RN-042',
};

(() => {
  const data = window.VESTIX_DEMO;
  const byId = new Map(data.products.map((product) => [product.id, product]));
  data.sales.forEach((sale) => {
    sale.total = sale.lines.reduce((sum, line) => sum + byId.get(line.productId).price * line.qty, 0);
    sale.units = sale.lines.reduce((sum, line) => sum + line.qty, 0);
  });
  data.todayRevenue = data.sales.reduce((sum, sale) => sum + sale.total, 0);
  data.todayUnits = data.sales.reduce((sum, sale) => sum + sale.units, 0);
  data.todayOrders = data.sales.length;
  data.variantCount = data.products.reduce((sum, product) => sum + product.variants, 0);
  data.queueCount = data.queue.reduce((sum, task) => sum + task.count, 0);
  data.products.forEach((product) => {
    product.available = product.stock.reduce((sum, units) => sum + units, 0);
    product.lowSizes = product.stock.filter((units) => units <= data.lowStockThreshold).length;
  });

  data.sales.forEach((sale) => {
    const lineValue = sale.lines.reduce((sum, line) => sum + byId.get(line.productId).price * line.qty, 0);
    console.assert(lineValue === sale.total, `El total de ${sale.id} debe coincidir con sus prendas.`);
  });
  console.assert(data.todayRevenue === 483300, 'La suma diaria debe corresponder a las ventas del ejemplo.');
  console.assert(data.todayOrders === 6 && data.todayUnits === 13, 'Operaciones y unidades deben derivarse de las filas.');
  console.assert(data.queueCount === 14, 'El resumen de tareas debe coincidir con la cola de ejemplo.');
})();
