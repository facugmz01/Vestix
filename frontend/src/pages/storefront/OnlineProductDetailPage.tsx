import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ShoppingCart, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { storefrontApi } from '@/api/storefront.api';
import { queryKeys } from '@/api/queryKeys';
import { useCartStore } from '@/store/cart.store';
import { storePrefix } from '@/utils/storefrontDomain';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils/formatCurrency';

export default function OnlineProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const prefix = storePrefix();
  const addItem = useCartStore(s => s.addItem);

  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [qty, setQty] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data: product, isLoading } = useQuery({
    queryKey: queryKeys.storefront.product(id!),
    queryFn: () => storefrontApi.getProduct(id!),
    enabled: !!id,
  });

  // Auto-select first available variant
  useEffect(() => {
    if ((product?.variants?.length ?? 0) > 0 && !selectedVariantId) {
      setSelectedVariantId(product!.variants![0].id);
    }
  }, [product, selectedVariantId]);


  if (isLoading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '80px auto', padding: '0 24px', display: 'flex', gap: '48px', flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '16px', aspectRatio: '1' }} />
        <div style={{ width: isMobile ? '100%' : '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: i === 1 ? 40 : 20, background: '#f1f5f9', borderRadius: 8 }} />)}
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '80px', textAlign: 'center' }}>
        <h2>Producto no encontrado</h2>
        <Link to={`${prefix}/`} style={{ color: '#3b82f6' }}>Volver al catálogo</Link>
      </div>
    );
  }

  const selectedVariant = product.variants?.find(v => v.id === selectedVariantId);
  const isAvailable = selectedVariant ? selectedVariant.stock > 0 : product.inStock;
  const displayPrice = selectedVariant?.price ?? product.price ?? product.basePrice ?? 0;
  const priceRange =
    product.maxPrice && product.maxPrice > product.price
      ? `${formatCurrency(product.price)} – ${formatCurrency(product.maxPrice)}`
      : formatCurrency(displayPrice);

  const handleAddToCart = () => {
    if (!selectedVariant && (product.variants?.length ?? 0) > 0) {
      toast.error('Seleccioná una variante antes de agregar al carrito.');
      return;
    }
    const variantId = selectedVariant?.id || `${product.id}-default`;

    for (let i = 0; i < qty; i++) {
      addItem({
        variantId,
        productId: product.id,
        name: product.name,
        sku: selectedVariant?.sku || product.id,
        size: selectedVariant?.size,
        color: selectedVariant?.color,
        price: displayPrice,
      });
    }

    setJustAdded(true);
    toast.success(`${qty > 1 ? `${qty}x ` : ''}${product.name} agregado al carrito.`);
    setTimeout(() => setJustAdded(false), 2500);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: isMobile ? '20px 16px' : '32px 24px' }}>

      <Link to={`${prefix}/`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#64748b', textDecoration: 'none', fontWeight: 600, marginBottom: '24px', fontSize: '14px' }}>
        <ChevronLeft size={18} /> Volver al catálogo
      </Link>

      <div style={{ display: 'flex', gap: isMobile ? '24px' : '48px', alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}>
        
        {/* Left: Gallery */}
        <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: (product.images && product.images.length > 0) ? '#fff' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', borderRadius: '16px', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {product.images && product.images.length > 0 ? (
              <img src={product.images[activeImageIndex] || product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: isMobile ? '80px' : '120px', color: '#cbd5e1', fontWeight: 900, userSelect: 'none' }}>{product.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {product.images.map((img: string, i: number) => (
                <div 
                  key={i} 
                  onClick={() => setActiveImageIndex(i)}
                  style={{ 
                    width: '80px', flexShrink: 0, aspectRatio: '1', background: '#f1f5f9', borderRadius: '10px', 
                    border: '2px solid', borderColor: i === activeImageIndex ? '#3b82f6' : 'transparent', 
                    cursor: 'pointer', overflow: 'hidden' 
                  }}
                >
                  <img src={img} alt={`${product.name} thumbnail ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Buy Box */}
        <div style={{ width: isMobile ? '100%' : '430px', flexShrink: 0 }}>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              {product.brand && <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{product.brand}</span>}
              {product.category && <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>/ {product.category}</span>}
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: isMobile ? '22px' : '28px', fontWeight: 900, lineHeight: 1.2, color: '#0f172a' }}>{product.name}</h1>
            {product.description && <p style={{ margin: 0, fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>{product.description}</p>}
          </div>

          {/* Buy Box */}
          <div style={{ padding: '20px', background: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06)', marginBottom: '24px', boxSizing: 'border-box' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: isMobile ? '28px' : '32px', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                {selectedVariant ? formatCurrency(displayPrice) : priceRange}
              </span>
              {product.basePrice && product.basePrice > product.price && (
                <span style={{ marginLeft: '12px', fontSize: '16px', color: '#94a3b8', textDecoration: 'line-through' }}>{formatCurrency(product.basePrice)}</span>
              )}
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: isAvailable ? '#22c55e' : '#ef4444', borderRadius: '50%', display: 'inline-block' }} />
                <span style={{ fontSize: '13px', color: isAvailable ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
                  {isAvailable ? 'Stock Disponible' : 'Sin Stock'}
                </span>
              </div>
            </div>

            {/* Variant selectors */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, marginBottom: '10px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Variante
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {product.variants.map((v: any) => {
                    const isSel = selectedVariantId === v.id;
                    const noStock = v.stock === 0;
                    return (
                      <button
                        key={v.id}
                        onClick={() => !noStock && setSelectedVariantId(v.id)}
                        title={noStock ? 'Sin stock' : undefined}
                        style={{
                          padding: '10px 16px',
                          borderRadius: '8px',
                          border: isSel ? '2px solid #3b82f6' : '1px solid #cbd5e1',
                          background: isSel ? '#eff6ff' : noStock ? '#fafafa' : '#fff',
                          color: isSel ? '#1d4ed8' : noStock ? '#cbd5e1' : '#475569',
                          fontWeight: 600,
                          fontSize: '13px',
                          cursor: noStock ? 'not-allowed' : 'pointer',
                          outline: 'none',
                          textDecoration: noStock ? 'line-through' : 'none',
                        }}
                      >
                        {v.size && v.color ? `${v.size} - ${v.color}` : v.size ? `T. ${v.size}` : v.color ? v.color : v.sku}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Qty + Add to Cart */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '10px 14px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800, fontSize: '16px' }}>−</button>
                <div style={{ width: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, background: '#fff', fontSize: '15px' }}>{qty}</div>
                <button onClick={() => setQty(qty + 1)} style={{ padding: '10px 14px', border: 'none', background: '#f1f5f9', cursor: 'pointer', fontWeight: 800, fontSize: '16px' }}>+</button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                style={{
                  flex: 1,
                  background: justAdded ? '#22c55e' : (isAvailable ? '#3b82f6' : '#cbd5e1'),
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: isAvailable ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background 0.3s ease',
                  padding: '12px 16px'
                }}
              >
                {justAdded ? <><Check size={18} /> Agregado!</> : <><ShoppingCart size={18} /> {isAvailable ? 'Agregar al Carrito' : 'Agotado'}</>}
              </button>
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[
              { icon: Truck, title: 'Envío Rápido', desc: 'Despachamos en el día a todo el país.' },
              { icon: ShieldCheck, title: 'Compra Protegida', desc: 'Seguridad SSL en todas tus transacciones.' },
              { icon: RotateCcw, title: 'Devoluciones Gratis', desc: 'Tenés 30 días para realizar cambios.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', background: '#eff6ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color="#3b82f6" />
                </div>
                <div>
                  <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{title}</p>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



