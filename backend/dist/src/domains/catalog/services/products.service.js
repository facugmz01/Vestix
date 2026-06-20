"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../core/prisma/prisma.service");
const taxonomy_service_1 = require("./taxonomy.service");
const crypto = __importStar(require("crypto"));
let ProductsService = class ProductsService {
    constructor(prisma, categoriesService, brandsService) {
        this.prisma = prisma;
        this.categoriesService = categoriesService;
        this.brandsService = brandsService;
    }
    async create(createProductDto) {
        await this.categoriesService.findOne(createProductDto.categoryId);
        if (createProductDto.brandId) {
            await this.brandsService.findOne(createProductDto.brandId);
        }
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const posSettings = settings?.pos || {};
        const skuSettings = settings?.skuBarcode || {};
        if (createProductDto.metadata?.usdCurrency) {
            const type = createProductDto.metadata.usdCurrency;
            const rate = type === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
            const costUsd = parseFloat(createProductDto.metadata.costUsd || '0');
            if (rate && costUsd > 0) {
                createProductDto.costPrice = costUsd * rate;
                if (createProductDto.variants) {
                    createProductDto.variants = createProductDto.variants.map(v => ({
                        ...v,
                        costPrice: costUsd * rate
                    }));
                }
            }
        }
        if (posSettings.requireInternalCode && !createProductDto.baseSku) {
            throw new common_1.ConflictException('El Código Interno (SKU) es obligatorio según la configuración de ventas.');
        }
        if (posSettings.requireBrand && !createProductDto.brandId) {
            throw new common_1.ConflictException('La Marca es obligatoria según la configuración de ventas.');
        }
        if (posSettings.requireDescription && !createProductDto.description?.trim()) {
            throw new common_1.ConflictException('La Descripción es obligatoria según la configuración de ventas.');
        }
        if (posSettings.requireBarcode) {
            const variants = createProductDto.variants || [];
            const hasMissingBarcode = variants.some(v => !v.barcode?.trim());
            if (hasMissingBarcode || variants.length === 0) {
                throw new common_1.ConflictException('El Código de Barras es obligatorio para el producto según la configuración de ventas.');
            }
        }
        if (posSettings.requireShippingDimensions) {
            const { weight, width, height, depth } = createProductDto.metadata || {};
            if (!weight || !width || !height || !depth) {
                throw new common_1.ConflictException('Las dimensiones de envío (peso, ancho, alto, largo) son obligatorias según la configuración de ventas.');
            }
        }
        let finalSku = createProductDto.baseSku;
        if (!finalSku) {
            if (skuSettings.skuAutoGenerate) {
                const prefix = skuSettings.skuPrefix || 'PROD-';
                const seq = parseInt(skuSettings.nextSkuSequence) || 1;
                finalSku = `${prefix}${seq.toString().padStart(4, '0')}`;
                await this.prisma.systemSettings.update({
                    where: { id: 'default' },
                    data: {
                        skuBarcode: {
                            ...skuSettings,
                            nextSkuSequence: seq + 1
                        }
                    }
                });
            }
            else {
                finalSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
            }
        }
        const exists = await this.prisma.product.findUnique({ where: { baseSku: finalSku } });
        if (exists)
            throw new common_1.ConflictException(`El SKU Base ${finalSku} ya está en uso`);
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: createProductDto.name,
                    baseSku: finalSku,
                    description: createProductDto.description,
                    categoryId: createProductDto.categoryId,
                    brandId: createProductDto.brandId,
                    type: createProductDto.type || 'SINGLE',
                    manageBatches: createProductDto.manageBatches || false,
                    isVariable: createProductDto.isVariable || false,
                    costPrice: createProductDto.costPrice || 0,
                    isActive: true,
                    isPublished: false,
                    images: createProductDto.images || [],
                    metadata: createProductDto.metadata || {},
                    comboLines: createProductDto.type === 'COMBO' && createProductDto.comboLines?.length ? {
                        create: createProductDto.comboLines.map(cl => ({
                            childVariantId: cl.childVariantId,
                            quantity: cl.quantity
                        }))
                    } : undefined
                },
                include: { category: true, brand: true }
            });
            if (createProductDto.isVariable && createProductDto.variants?.length) {
                await tx.productVariant.createMany({
                    data: createProductDto.variants.map(v => {
                        const parts = [finalSku, v.size, v.color].filter(Boolean).join('-');
                        return {
                            ...v,
                            productId: product.id,
                            costPrice: v.costPrice || createProductDto.costPrice || 0,
                            sku: v.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
                        };
                    })
                });
            }
            else {
                await tx.productVariant.create({
                    data: {
                        productId: product.id,
                        sku: finalSku,
                        basePrice: createProductDto.basePrice || createProductDto.variants?.[0]?.basePrice || 0,
                        costPrice: createProductDto.costPrice || 0,
                        isActive: true
                    }
                });
            }
            return product;
        });
    }
    async findAll(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.brandId)
            where.brandId = query.brandId;
        if (query.isActive !== undefined)
            where.isActive = query.isActive === 'true';
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { baseSku: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true, brand: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: pageSize,
            }),
            this.prisma.product.count({ where }),
        ]);
        return { data, total, page, pageSize };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: { category: true, brand: true, variants: true }
        });
        if (!product)
            throw new common_1.NotFoundException(`Producto ${id} no encontrado`);
        return product;
    }
    async update(id, updateProductDto) {
        const product = await this.findOne(id);
        if (updateProductDto.categoryId)
            await this.categoriesService.findOne(updateProductDto.categoryId);
        if (updateProductDto.brandId)
            await this.brandsService.findOne(updateProductDto.brandId);
        const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'default' } });
        const posSettings = settings?.pos || {};
        const checkBrandId = updateProductDto.brandId !== undefined ? updateProductDto.brandId : product.brandId;
        if (posSettings.requireBrand && !checkBrandId) {
            throw new common_1.ConflictException('La Marca es obligatoria según la configuración de ventas.');
        }
        const checkDescription = updateProductDto.description !== undefined ? updateProductDto.description : product.description;
        if (posSettings.requireDescription && !checkDescription?.trim()) {
            throw new common_1.ConflictException('La Descripción es obligatoria según la configuración de ventas.');
        }
        if (posSettings.requireBarcode && updateProductDto.variants) {
            const hasMissingBarcode = updateProductDto.variants.some((v) => v.barcode !== undefined && !v.barcode?.trim());
            if (hasMissingBarcode) {
                throw new common_1.ConflictException('El Código de Barras no puede quedar vacío según la configuración de ventas.');
            }
        }
        if (posSettings.requireShippingDimensions) {
            const newMetadata = updateProductDto.metadata !== undefined ? updateProductDto.metadata : product.metadata;
            const { weight, width, height, depth } = newMetadata || {};
            if (!weight || !width || !height || !depth) {
                throw new common_1.ConflictException('Las dimensiones de envío (peso, ancho, alto, largo) son obligatorias según la configuración de ventas.');
            }
        }
        if (updateProductDto.metadata?.usdCurrency) {
            const type = updateProductDto.metadata.usdCurrency;
            const rate = type === 'Oficial' ? posSettings.officialDollarQuote : posSettings.blueDollarQuote;
            const costUsd = parseFloat(updateProductDto.metadata.costUsd || '0');
            if (rate && costUsd > 0) {
                updateProductDto.costPrice = costUsd * rate;
                if (updateProductDto.variants) {
                    updateProductDto.variants = updateProductDto.variants.map((v) => ({
                        ...v,
                        costPrice: costUsd * rate
                    }));
                }
            }
        }
        if (updateProductDto.baseSku && updateProductDto.baseSku !== product.baseSku) {
            const exists = await this.prisma.product.findUnique({ where: { baseSku: updateProductDto.baseSku } });
            if (exists)
                throw new common_1.ConflictException('El SKU Base ya está en uso por otro producto');
        }
        const { variants, images, basePrice, comboLines, ...data } = updateProductDto;
        return this.prisma.$transaction(async (tx) => {
            if (data.type === 'COMBO' && comboLines !== undefined) {
                await tx.productComboLine.deleteMany({ where: { parentProductId: id } });
            }
            const updatedProduct = await tx.product.update({
                where: { id },
                data: {
                    ...data,
                    images: images,
                    comboLines: data.type === 'COMBO' && comboLines ? {
                        create: comboLines.map((cl) => ({
                            childVariantId: cl.childVariantId,
                            quantity: cl.quantity
                        }))
                    } : undefined
                },
                include: { category: true, brand: true, comboLines: true }
            });
            if (variants && Array.isArray(variants)) {
                const existingVariants = await tx.productVariant.findMany({ where: { productId: id } });
                const variantsToKeepIds = variants.filter(v => v.id).map(v => v.id);
                const variantsToDelete = existingVariants.filter(v => !variantsToKeepIds.includes(v.id));
                for (const variant of variantsToDelete) {
                    try {
                        await tx.productVariant.delete({ where: { id: variant.id } });
                    }
                    catch (error) {
                        if (error.code === 'P2003') {
                            await tx.productVariant.update({
                                where: { id: variant.id },
                                data: { isActive: false }
                            });
                        }
                        else {
                            throw error;
                        }
                    }
                }
                for (const variant of variants) {
                    if (variant.id) {
                        const { id: varId, productId, createdAt, updatedAt, ...varData } = variant;
                        await tx.productVariant.update({
                            where: { id: varId },
                            data: varData
                        });
                    }
                    else {
                        const finalSku = updateProductDto.baseSku || product.baseSku;
                        const parts = [finalSku, variant.size, variant.color].filter(Boolean).join('-');
                        await tx.productVariant.create({
                            data: {
                                ...variant,
                                productId: id,
                                costPrice: variant.costPrice || updateProductDto.costPrice || product.costPrice || 0,
                                sku: variant.sku || `${parts}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase()
                            }
                        });
                    }
                }
                const isNowVariable = updateProductDto.isVariable !== undefined ? updateProductDto.isVariable : product.isVariable;
                if (!isNowVariable && variants.length === 0) {
                    const remaining = await tx.productVariant.count({ where: { productId: id, isActive: true } });
                    if (remaining === 0) {
                        const finalSku = updateProductDto.baseSku || product.baseSku;
                        await tx.productVariant.create({
                            data: {
                                productId: id,
                                sku: finalSku || `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
                                basePrice: updateProductDto.basePrice || 0,
                                costPrice: updateProductDto.costPrice || product.costPrice || 0,
                                isActive: true
                            }
                        });
                    }
                }
            }
            return updatedProduct;
        });
    }
    async findVariants(productId) {
        return this.prisma.productVariant.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' }
        });
    }
    async createVariant(productId, data) {
        return this.prisma.productVariant.create({
            data: {
                ...data,
                productId,
                sku: data.sku || `SKU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
            }
        });
    }
    async updateVariant(id, data) {
        return this.prisma.productVariant.update({
            where: { id },
            data
        });
    }
    async deleteVariant(id) {
        return this.prisma.productVariant.delete({
            where: { id }
        });
    }
    async generateCombinations(productId, dto) {
        const { attributes, basePrice } = dto;
        const attrNames = Object.keys(attributes);
        if (attrNames.length === 0)
            return [];
        let combinations = [{}];
        for (const name of attrNames) {
            const next = [];
            const values = attributes[name];
            for (const val of values) {
                for (const combo of combinations) {
                    next.push({ ...combo, [name]: val });
                }
            }
            combinations = next;
        }
        const variantsData = combinations.map(combo => {
            const colorKey = Object.keys(combo).find(k => k.toLowerCase() === 'color');
            const sizeKey = Object.keys(combo).find(k => ['size', 'talle', 'talla', 'tamaño'].includes(k.toLowerCase()) ||
                k.toLowerCase().startsWith('talle'));
            const color = colorKey ? combo[colorKey] : null;
            const size = sizeKey ? combo[sizeKey] : null;
            const attrString = Object.values(combo).join('-');
            const sku = `${productId.substring(0, 4)}-${attrString}`.toUpperCase().replace(/\s+/g, '');
            return {
                productId,
                color,
                size,
                attributes: combo,
                basePrice: basePrice || 0,
                sku,
                isActive: true
            };
        });
        return this.prisma.productVariant.createMany({
            data: variantsData,
            skipDuplicates: true
        });
    }
    async remove(id) {
        const stockLevels = await this.prisma.stockLevel.findMany({
            where: {
                variant: { productId: id },
                quantity: { gt: 0 },
            },
        });
        if (stockLevels.length > 0) {
            throw new common_1.ConflictException('No se puede eliminar el producto porque tiene stock en uno o más depósitos. Realice un ajuste de salida primero.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.productComboLine.deleteMany({
                where: { parentProductId: id },
            });
            const variants = await tx.productVariant.findMany({
                where: { productId: id },
                select: { id: true },
            });
            const variantIds = variants.map((v) => v.id);
            await tx.productComboLine.deleteMany({
                where: { childVariantId: { in: variantIds } },
            });
            await tx.stockLevel.deleteMany({
                where: { variantId: { in: variantIds } },
            });
            await tx.priceListEntry.deleteMany({
                where: { variantId: { in: variantIds } },
            });
            await tx.productVariant.deleteMany({
                where: { productId: id },
            });
            await tx.product.delete({
                where: { id },
            });
            return { success: true };
        });
    }
    async bulkValidate(dto) {
        const validRows = [];
        const conflicts = [];
        const skus = dto.rows.map(r => r.sku).filter(s => !!s);
        const existingVariants = await this.prisma.productVariant.findMany({
            where: { sku: { in: skus } },
            include: { product: true }
        });
        const existingMap = new Map(existingVariants.map(v => [v.sku, v]));
        for (const row of dto.rows) {
            if (row.sku && existingMap.has(row.sku)) {
                conflicts.push({
                    row,
                    existingProduct: existingMap.get(row.sku)
                });
            }
            else {
                validRows.push(row);
            }
        }
        return { validRows, conflicts };
    }
    async bulkImport(dto) {
        return this.prisma.$transaction(async (tx) => {
            let createdCount = 0;
            let updatedCount = 0;
            let defaultWarehouse = await tx.warehouse.findFirst({
                where: { code: 'DEP-01' }
            });
            if (!defaultWarehouse) {
                defaultWarehouse = await tx.warehouse.findFirst();
            }
            const groupedProducts = new Map();
            for (const row of dto.rows) {
                if (row.resolution === 'skip')
                    continue;
                const name = row.name.trim();
                if (!groupedProducts.has(name)) {
                    groupedProducts.set(name, []);
                }
                groupedProducts.get(name).push(row);
            }
            for (const [name, rows] of groupedProducts.entries()) {
                const firstRow = rows[0];
                let categoryId = null;
                if (firstRow.category) {
                    let cat = await tx.category.findFirst({ where: { name: firstRow.category } });
                    if (!cat) {
                        cat = await tx.category.create({ data: { name: firstRow.category } });
                    }
                    categoryId = cat.id;
                }
                else {
                    let cat = await tx.category.findFirst({ where: { name: 'Sin Categoría' } });
                    if (!cat)
                        cat = await tx.category.create({ data: { name: 'Sin Categoría' } });
                    categoryId = cat.id;
                }
                let brandId = null;
                if (firstRow.brand) {
                    let br = await tx.brand.findFirst({ where: { name: firstRow.brand } });
                    if (!br) {
                        br = await tx.brand.create({ data: { name: firstRow.brand } });
                    }
                    brandId = br.id;
                }
                const isVariable = rows.length > 1 || firstRow.type?.toLowerCase() === 'variable' || (firstRow.variant && firstRow.variant !== 'Única' && firstRow.variant !== 'DUMMY');
                let baseSku = null;
                if (isVariable) {
                    const skus = rows.map(r => r.sku).filter(s => !!s);
                    if (skus.length > 0) {
                        const parts = skus[0].split('-');
                        if (parts.length > 1) {
                            baseSku = parts[0];
                        }
                        else {
                            baseSku = skus[0].replace(/-\d+$/, '');
                        }
                    }
                }
                else {
                    baseSku = firstRow.sku;
                }
                if (!baseSku) {
                    baseSku = `PROD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
                }
                let product = await tx.product.findFirst({
                    where: {
                        OR: [
                            { baseSku },
                            { name }
                        ]
                    }
                });
                if (product) {
                    product = await tx.product.update({
                        where: { id: product.id },
                        data: {
                            name,
                            categoryId,
                            brandId,
                            type: isVariable ? 'VARIABLE' : 'SINGLE',
                            isVariable
                        }
                    });
                }
                else {
                    product = await tx.product.create({
                        data: {
                            name,
                            baseSku,
                            categoryId,
                            brandId,
                            isActive: true,
                            type: isVariable ? 'VARIABLE' : 'SINGLE',
                            isVariable
                        }
                    });
                    createdCount++;
                }
                for (const row of rows) {
                    const sku = row.sku || `${baseSku}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();
                    const costPrice = row.costPrice || 0;
                    const basePrice = row.basePrice || 0;
                    const variantName = (!row.variant || row.variant === 'DUMMY' || row.variant === 'Única') ? null : row.variant;
                    const existingVariant = await tx.productVariant.findUnique({ where: { sku } });
                    let variantId;
                    if (existingVariant && row.resolution === 'overwrite') {
                        const updated = await tx.productVariant.update({
                            where: { id: existingVariant.id },
                            data: {
                                barcode: row.barcode || null,
                                costPrice,
                                basePrice,
                                size: variantName,
                                isActive: true
                            }
                        });
                        variantId = updated.id;
                        updatedCount++;
                    }
                    else if (!existingVariant) {
                        const created = await tx.productVariant.create({
                            data: {
                                productId: product.id,
                                sku,
                                barcode: row.barcode || null,
                                costPrice,
                                basePrice,
                                size: variantName,
                                isActive: true
                            }
                        });
                        variantId = created.id;
                    }
                    else {
                        variantId = existingVariant.id;
                    }
                    if (row.initialStock && row.initialStock > 0 && defaultWarehouse) {
                        const existingStock = await tx.stockLevel.findFirst({
                            where: {
                                variantId,
                                warehouseId: defaultWarehouse.id,
                                batchId: null
                            }
                        });
                        if (!existingStock || existingStock.physicalQuantity === 0) {
                            const quantityToAdd = row.initialStock;
                            await tx.inventoryMovement.create({
                                data: {
                                    variantId,
                                    destinationWarehouseId: defaultWarehouse.id,
                                    type: 'INITIAL_STOCK',
                                    quantity: quantityToAdd,
                                    unitCost: costPrice
                                }
                            });
                            if (existingStock) {
                                await tx.stockLevel.update({
                                    where: { id: existingStock.id },
                                    data: {
                                        physicalQuantity: { increment: quantityToAdd },
                                        availableQuantity: { increment: quantityToAdd }
                                    }
                                });
                            }
                            else {
                                await tx.stockLevel.create({
                                    data: {
                                        variantId,
                                        warehouseId: defaultWarehouse.id,
                                        physicalQuantity: quantityToAdd,
                                        availableQuantity: quantityToAdd
                                    }
                                });
                            }
                        }
                    }
                }
            }
            return { success: true, createdCount, updatedCount };
        }, {
            timeout: 30000
        });
    }
    async clearCatalog() {
        return this.prisma.$transaction(async (tx) => {
            await tx.$executeRawUnsafe(`
        TRUNCATE TABLE 
          "catalog"."Product", 
          "catalog"."ProductVariant", 
          "catalog"."Category", 
          "catalog"."Brand", 
          "catalog"."Attribute", 
          "catalog"."AttributeValue", 
          "catalog"."PriceList",
          "catalog"."PriceListEntry",
          "sales"."SaleOrder",
          "sales"."SaleReturn",
          "purchasing"."PurchaseOrder",
          "purchasing"."GoodsReceipt",
          "inventory"."StockTransfer",
          "finance"."Invoice",
          "finance"."FinancialTransaction"
        CASCADE;
      `);
            return { success: true };
        });
    }
    async findAllVariants(search) {
        const where = {};
        if (search) {
            where.OR = [
                { sku: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { product: { name: { contains: search, mode: 'insensitive' } } },
            ];
        }
        return this.prisma.productVariant.findMany({
            where,
            include: { product: true },
            take: 50,
        });
    }
    async bulkUpdatePrices(dto) {
        const { categoryId, brandId, percentage } = dto;
        const multiplier = 1 + (percentage / 100);
        return this.prisma.$transaction(async (tx) => {
            const where = {};
            if (categoryId)
                where.categoryId = categoryId;
            if (brandId)
                where.brandId = brandId;
            const products = await tx.product.findMany({
                where,
                include: { variants: true }
            });
            let updatedCount = 0;
            for (const product of products) {
                const newCost = Math.round((product.costPrice || 0) * multiplier);
                await tx.product.update({
                    where: { id: product.id },
                    data: { costPrice: newCost }
                });
                for (const variant of product.variants) {
                    const vCost = Math.round((variant.costPrice || 0) * multiplier);
                    const vBase = Math.round((variant.basePrice || 0) * multiplier);
                    await tx.productVariant.update({
                        where: { id: variant.id },
                        data: { costPrice: vCost, basePrice: vBase }
                    });
                }
                updatedCount++;
            }
            return { success: true, updatedCount };
        });
    }
    async getPublicProducts(query = {}) {
        const page = parseInt(query.page) || 1;
        const pageSize = parseInt(query.pageSize) || 15;
        const skip = (page - 1) * pageSize;
        const where = { isPublished: true, isActive: true };
        if (query.categoryId)
            where.categoryId = query.categoryId;
        if (query.brandId)
            where.brandId = query.brandId;
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { baseSku: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: true,
                    brand: true,
                    variants: {
                        where: { isActive: true },
                        include: { stockLevels: true },
                    },
                },
                orderBy: { name: 'asc' },
                skip,
                take: pageSize,
            }),
            this.prisma.product.count({ where }),
        ]);
        const mapped = data.map(p => {
            let lowestPrice = 0;
            let totalStock = 0;
            const mappedVariants = p.variants.map(v => {
                const variantStock = v.stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);
                totalStock += variantStock;
                if (lowestPrice === 0 || v.basePrice < lowestPrice) {
                    lowestPrice = v.basePrice;
                }
                return {
                    id: v.id,
                    sku: v.sku,
                    price: v.basePrice,
                    stock: variantStock,
                    attributes: v.attributes,
                };
            });
            return {
                id: p.id,
                name: p.name,
                description: p.description,
                images: p.images,
                category: p.category?.name,
                brand: p.brand?.name,
                lowestPrice,
                inStock: totalStock > 0,
                totalStock,
                variants: mappedVariants,
            };
        });
        return {
            data: mapped,
            total,
            page,
            pageSize,
        };
    }
    async getPublicProduct(id) {
        const p = await this.prisma.product.findFirst({
            where: { id, isPublished: true, isActive: true },
            include: {
                category: true,
                brand: true,
                variants: {
                    where: { isActive: true },
                    include: { stockLevels: true },
                },
            },
        });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado o no disponible en Tienda Web');
        let lowestPrice = 0;
        let totalStock = 0;
        const mappedVariants = p.variants.map(v => {
            const variantStock = v.stockLevels.reduce((sum, sl) => sum + sl.availableQuantity, 0);
            totalStock += variantStock;
            if (lowestPrice === 0 || v.basePrice < lowestPrice) {
                lowestPrice = v.basePrice;
            }
            return {
                id: v.id,
                sku: v.sku,
                price: v.basePrice,
                stock: variantStock,
                attributes: v.attributes,
            };
        });
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            images: p.images,
            category: p.category?.name,
            brand: p.brand?.name,
            lowestPrice,
            inStock: totalStock > 0,
            totalStock,
            variants: mappedVariants,
        };
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        taxonomy_service_1.CategoriesService,
        taxonomy_service_1.BrandsService])
], ProductsService);
//# sourceMappingURL=products.service.js.map