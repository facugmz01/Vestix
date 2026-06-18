"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const products_service_1 = require("./src/domains/catalog/services/products.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const productsService = app.get(products_service_1.ProductsService);
    const rows = [
        {
            name: "Short print modal soft",
            sku: "0004",
            category: "Shorts",
            brand: "The Maker",
            costPrice: 5000,
            basePrice: 8750,
            initialStock: 0
        }
    ];
    try {
        const result = await productsService.bulkImport({ rows });
        console.log(result);
    }
    catch (e) {
        console.error(e);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-import.js.map