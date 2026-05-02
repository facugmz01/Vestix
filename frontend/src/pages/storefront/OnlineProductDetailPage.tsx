import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import toast from 'react-hot-toast';

export default function OnlineProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.storefront.product(id!),
    queryFn: () => storefrontApi.getProduct(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Cargando producto...</div>;
  }

  if (!product) {
    return <div style={{ padding: '60px', textAlign: 'center' }}>Producto no encontrado</div>;
  }

  const fmtCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(val);

  // Auto-select first variant if not selected
  if (!selectedVariantId && product.variants?.length > 0) {
    setSelectedVariantId(product.variants[0].id);
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const price = selectedVariant?.price || product.basePrice;

  // Mock stock check
  const isAvailable = true; // In reality: selectedVariant.stock > 0

  const handleAddToCart = () => {
    toast.success('Agregado al carrito (Demo)');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
      
      <Link to="/store" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b', textDecoration: 'none', fontWeight: 600, marginBottom: '32px' }}>
        <ChevronLeft size={20} /> Volver al catálogo
      </Link>

      <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
        
        {/* Left: Gallery */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#f1f5f9', borderRadius: '16px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '100px', color: '#cbd5e1', fontWeight: 900 }}>{product.name.charAt(0)}</span>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ flex: 1, aspectRatio: '1', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0', cursor: 'pointer' }} />
            ))}
          </div>
        </div>

        {/* Right: Info & Buy Box */}
        <div style={{ width: '450px', flexShrink: 0 }}>
          
          <div style={{ marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>{product.brand || 'Sin Marca'}</span>
            <h1 style={{ margin: '8px 0', fontSize: '32px', fontWeight: 900, lineHeight: 1.2, color: '#0f172a' }}>{product.name}</h1>
            <p style={{ margin: 0, fontSize: '16px', color: '#475569', lineHeight: 1.6 }}>{product.description || 'Sin descripción disponible.'}</p>
          </div>

          <div style={{ marginBottom: '32px', padding: '24px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '36px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{fmtCurrency(price)}</span>
              {product.taxRate > 0 && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '8px' }}>+ {product.taxRate}% IVA</span>}
            </div>

            {/* Selectors */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '12px', color: '#0f172a' }}>Seleccionar Variante (SKU/Talla/Color)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {product.variants.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariantId(v.id)}
                      style={{ 
                        padding: '10px 16px', 
                        borderRadius: '8px', 
                        border: selectedVariantId === v.id ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                        background: selectedVariantId === v.id ? '#eff6ff' : '#fff',
                        color: selectedVariantId === v.id ? '#1d4ed8' : '#475569',
                        fontWeight: 600,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      {v.size ? `Talla ${v.size}` : (v.color || v.sku)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0 16px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800 }}>-</button>
                <div style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#fff' }}>{qty}</div>
                <button onClick={() => setQty(qty + 1)} style={{ padding: '0 16px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800 }}>+</button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={!isAvailable}
                style={{ 
                  flex: 1, 
                  background: isAvailable ? '#3b82f6' : '#cbd5e1', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontSize: '16px', 
                  fontWeight: 800, 
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isAvailable ? '0 4px 6px -1px rgba(59, 130, 246, 0.4)' : 'none'
                }}
              >
                <ShoppingCart size={20} />
                {isAvailable ? 'Agregar al Carrito' : 'Agotado'}
              </button>
            </div>

            {isAvailable ? (
              <p style={{ margin: 0, fontSize: '13px', color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', display: 'inline-block' }} /> Stock Disponible
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: '13px', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', display: 'inline-block' }} /> Sin Stock Temporalmente
              </p>
            )}
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
              <Truck size={24} color="#3b82f6" />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Envío Rápido</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>Despachamos en el día a todo el país.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
              <ShieldCheck size={24} color="#3b82f6" />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Compra Protegida</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>Seguridad SSL en todas tus transacciones.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#475569' }}>
              <RotateCcw size={24} color="#3b82f6" />
              <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Devoluciones Gratis</h4>
                <p style={{ margin: 0, fontSize: '13px' }}>Tenés 30 días para realizar cambios.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
