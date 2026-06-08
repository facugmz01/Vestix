"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const http_exception_filter_1 = require("./core/filters/http-exception.filter");
async function bootstrap() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret_for_dev_only') {
        throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing or insecure!');
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.use((0, cookie_parser_1.default)());
    app.use((0, helmet_1.default)());
    const bodyParser = require('body-parser');
    app.use(bodyParser.json({ limit: '2mb' }));
    app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));
    const allowedOrigins = [
        'http://localhost:5173',
        'https://app.roindumentaria.com.ar',
        'https://roindumentaria.com.ar',
    ];
    if (process.env.STOREFRONT_DOMAIN) {
        allowedOrigins.push(`https://${process.env.STOREFRONT_DOMAIN}`);
        allowedOrigins.push(`http://${process.env.STOREFRONT_DOMAIN}`);
    }
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (origin.includes('://tienda.'))
                return callback(null, true);
            if (allowedOrigins.includes(origin))
                return callback(null, true);
            callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        allowedHeaders: 'Content-Type, Accept, Authorization, Cookie',
    });
    app.useGlobalFilters(new http_exception_filter_1.GlobalHttpExceptionFilter());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => {
            const formattedErrors = errors.reduce((acc, err) => {
                acc[err.property] = Object.values(err.constraints || {}).join(', ');
                return acc;
            }, {});
            return new common_1.BadRequestException({
                statusCode: 400,
                message: 'Validation failed',
                errors: formattedErrors,
            });
        },
    }));
    app.setGlobalPrefix('api', { exclude: ['health'] });
    const port = process.env.PORT || 3000;
    await app.listen(port);
    app.get(nestjs_pino_1.Logger).log(`Application running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}
bootstrap();
//# sourceMappingURL=main.js.map