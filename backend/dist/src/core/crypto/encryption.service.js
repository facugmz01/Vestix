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
var EncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const crypto = __importStar(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const ENC_PREFIX = 'enc:';
let EncryptionService = EncryptionService_1 = class EncryptionService {
    constructor() {
        this.logger = new common_1.Logger(EncryptionService_1.name);
        const raw = process.env.SETTINGS_ENCRYPTION_KEY;
        if (!raw) {
            this.logger.warn('SETTINGS_ENCRYPTION_KEY is not set. Sensitive settings fields will NOT be encrypted. ' +
                'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"');
            this.enabled = false;
            this.key = Buffer.alloc(32);
        }
        else {
            this.key = Buffer.from(raw, 'base64');
            if (this.key.length !== 32) {
                throw new Error(`SETTINGS_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits). Got ${this.key.length} bytes.`);
            }
            this.enabled = true;
        }
    }
    encrypt(plaintext) {
        if (!this.enabled || !plaintext || plaintext.startsWith(ENC_PREFIX)) {
            return plaintext;
        }
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${ENC_PREFIX}${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    }
    decrypt(value) {
        if (!value || !value.startsWith(ENC_PREFIX)) {
            return value;
        }
        if (!this.enabled) {
            this.logger.warn('Encrypted value found but SETTINGS_ENCRYPTION_KEY is not configured. Returning raw value.');
            return value;
        }
        try {
            const [, ivHex, tagHex, ctHex] = value.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const tag = Buffer.from(tagHex, 'hex');
            const ct = Buffer.from(ctHex, 'hex');
            const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_LENGTH });
            decipher.setAuthTag(tag);
            return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
        }
        catch (err) {
            this.logger.error(`Failed to decrypt value: ${err.message}`);
            return '';
        }
    }
    isEncrypted(value) {
        return typeof value === 'string' && value.startsWith(ENC_PREFIX);
    }
    isEnabled() {
        return this.enabled;
    }
    mask(value) {
        if (!value || value === '')
            return '';
        return '••••••••';
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = EncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map