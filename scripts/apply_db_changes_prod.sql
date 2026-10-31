-- =============================================================================
-- Vestix ERP - Script Transaccional de Migración y Limpieza en Producción
-- 
-- Cambios aplicados:
-- 1. Claves foráneas: CASCADE en PriceListEntry y SET NULL en Customer.
-- 2. Clientes: Desvinculación de listas de precios (priceListId = NULL).
-- 3. Listas de precios: Eliminación de todas las entradas (PriceListEntry) y listas (PriceList).
-- 4. Configuración: Reseteo de defaultPriceListId y priceListToShow en SystemSettings.
-- 5. Variantes de producto: basePrice = 0 en todas las variantes (costPrice intacto).
-- =============================================================================

BEGIN;

-- 1. Sincronización de Foreign Keys para permitir borrado seguro
ALTER TABLE catalog."PriceListEntry"
  DROP CONSTRAINT IF EXISTS "PriceListEntry_priceListId_fkey",
  ADD CONSTRAINT "PriceListEntry_priceListId_fkey"
    FOREIGN KEY ("priceListId") REFERENCES catalog."PriceList"(id) ON DELETE CASCADE;

ALTER TABLE catalog."PriceListEntry"
  DROP CONSTRAINT IF EXISTS "PriceListEntry_variantId_fkey",
  ADD CONSTRAINT "PriceListEntry_variantId_fkey"
    FOREIGN KEY ("variantId") REFERENCES catalog."ProductVariant"(id) ON DELETE CASCADE;

ALTER TABLE sales."Customer"
  DROP CONSTRAINT IF EXISTS "Customer_priceListId_fkey",
  ADD CONSTRAINT "Customer_priceListId_fkey"
    FOREIGN KEY ("priceListId") REFERENCES catalog."PriceList"(id) ON DELETE SET NULL;

-- 2. Desvincular clientes asignados a cualquier lista
UPDATE sales."Customer"
SET "priceListId" = NULL
WHERE "priceListId" IS NOT NULL;

-- 3. Limpiar entradas de listas de precios
DELETE FROM catalog."PriceListEntry";

-- 4. Eliminar listas de precios
DELETE FROM catalog."PriceList";

-- 5. Resetear referencias de listas en configuración global
UPDATE settings."SystemSettings"
SET 
  pricing = jsonb_set(COALESCE(pricing::jsonb, '{}'::jsonb), '{defaultPriceListId}', '""'::jsonb, true),
  storefront = jsonb_set(COALESCE(storefront::jsonb, '{}'::jsonb), '{priceListToShow}', '""'::jsonb, true)
WHERE id = 'default';

-- 6. Poner en 0 el precio base de venta de todas las variantes, preservando costo de compra
UPDATE catalog."ProductVariant"
SET "basePrice" = 0;

COMMIT;
