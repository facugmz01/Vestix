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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WooCommerceApiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WooCommerceApiService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let WooCommerceApiService = WooCommerceApiService_1 = class WooCommerceApiService {
    constructor() {
        this.logger = new common_1.Logger(WooCommerceApiService_1.name);
        this.configPath = path.join(__dirname, 'integrations-config.json');
    }
    getConfig() {
        let fileConfig = {};
        try {
            if (fs.existsSync(this.configPath)) {
                const fileContent = fs.readFileSync(this.configPath, 'utf8');
                const allConfig = JSON.parse(fileContent);
                fileConfig = allConfig.woocommerce || {};
            }
        }
        catch (e) {
            this.logger.error('Error reading integrations config file:', e);
        }
        return {
            storeUrl: process.env.WC_BASE_URL ?? fileConfig.storeUrl ?? 'https://mystore.com',
            consumerKey: process.env.WC_CONSUMER_KEY ?? fileConfig.consumerKey ?? 'ck_mock',
            consumerSecret: process.env.WC_CONSUMER_SECRET ?? fileConfig.consumerSecret ?? 'cs_mock',
        };
    }
    getBaseUrl() {
        const config = this.getConfig();
        let url = config.storeUrl;
        if (!url.endsWith('/wp-json/wc/v3')) {
            url = `${url.replace(/\/$/, '')}/wp-json/wc/v3`;
        }
        return url;
    }
    getAuth() {
        const config = this.getConfig();
        return {
            username: config.consumerKey,
            password: config.consumerSecret,
        };
    }
    async updateProductStock(wcProductId, wcVariationId, stockQuantity) {
        const url = `${this.getBaseUrl()}/products/${wcProductId}/variations/${wcVariationId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Stock update request — Product ${wcProductId} / Variation ${wcVariationId}: ${stockQuantity} units`);
            const response = await axios_1.default.put(url, { stock_quantity: stockQuantity, manage_stock: true }, { auth: this.getAuth(), timeout: 10000 });
            this.logger.log(`[WooCommerce] ✓ Stock updated successfully`);
            return response.data;
        }
        catch (err) {
            this.logger.error(`[WooCommerce] ✗ Failed to update stock: ${err.message}`);
            throw new common_1.InternalServerErrorException(`WooCommerce stock update failed: ${err.message}`);
        }
    }
    async updateProductPrice(wcProductId, wcVariationId, regularPrice) {
        const url = `${this.getBaseUrl()}/products/${wcProductId}/variations/${wcVariationId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Price update request — Product ${wcProductId}: $${regularPrice}`);
            const response = await axios_1.default.put(url, { regular_price: regularPrice }, { auth: this.getAuth(), timeout: 10000 });
            this.logger.log(`[WooCommerce] ✓ Price updated successfully`);
            return response.data;
        }
        catch (err) {
            this.logger.error(`[WooCommerce] ✗ Failed to update price: ${err.message}`);
            throw new common_1.InternalServerErrorException(`WooCommerce price update failed: ${err.message}`);
        }
    }
    async updateOrderStatus(wcOrderId, status) {
        const url = `${this.getBaseUrl()}/orders/${wcOrderId}`;
        try {
            this.logger.log(`[WooCommerce] ↑ Order status update request — Order ${wcOrderId} → ${status}`);
            const response = await axios_1.default.put(url, { status }, { auth: this.getAuth(), timeout: 10000 });
            this.logger.log(`[WooCommerce] ✓ Order status updated successfully`);
            return response.data;
        }
        catch (err) {
            this.logger.error(`[WooCommerce] ✗ Failed to update order status: ${err.message}`);
            throw new common_1.InternalServerErrorException(`WooCommerce order update failed: ${err.message}`);
        }
    }
    async getOrder(wcOrderId) {
        const url = `${this.getBaseUrl()}/orders/${wcOrderId}`;
        try {
            this.logger.log(`[WooCommerce] ↓ Fetching order details for Order ${wcOrderId}`);
            const response = await axios_1.default.get(url, { auth: this.getAuth(), timeout: 10000 });
            return response.data;
        }
        catch (err) {
            this.logger.error(`[WooCommerce] ✗ Failed to fetch order details: ${err.message}`);
            if (this.getAuth().username === 'ck_mock' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
                this.logger.warn(`[WooCommerce] Returning mock order payload for local development/test`);
                return {
                    id: wcOrderId,
                    status: 'processing',
                    billing: { email: 'customer@example.com', phone: '5491122334455', first_name: 'John', last_name: 'Doe' },
                    line_items: [
                        { product_id: 101, variation_id: 202, quantity: 2, price: '20.00' }
                    ],
                    total: '40.00'
                };
            }
            throw new common_1.InternalServerErrorException(`WooCommerce order fetch failed: ${err.message}`);
        }
    }
};
exports.WooCommerceApiService = WooCommerceApiService;
exports.WooCommerceApiService = WooCommerceApiService = WooCommerceApiService_1 = __decorate([
    (0, common_1.Injectable)()
], WooCommerceApiService);
//# sourceMappingURL=woocommerce-api.service.js.map