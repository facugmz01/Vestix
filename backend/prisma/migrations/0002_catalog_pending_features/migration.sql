-- Price audit trail and MercadoLibre variant mappings

CREATE TABLE IF NOT EXISTS "catalog"."PriceHistory" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "priceListId" TEXT,
  "oldPrice" DOUBLE PRECISION NOT NULL,
  "newPrice" DOUBLE PRECISION NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'MANUAL',
  "changedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PriceHistory_variantId_createdAt_idx"
  ON "catalog"."PriceHistory"("variantId", "createdAt");

ALTER TABLE "catalog"."PriceHistory"
  ADD CONSTRAINT "PriceHistory_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "catalog"."ProductVariant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "core"."MlVariantMapping" (
  "id" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "mlItemId" TEXT NOT NULL,
  "mlVariationId" TEXT,
  "lastSyncAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MlVariantMapping_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MlVariantMapping_variantId_key"
  ON "core"."MlVariantMapping"("variantId");

ALTER TABLE "core"."MlVariantMapping"
  ADD CONSTRAINT "MlVariantMapping_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "catalog"."ProductVariant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
