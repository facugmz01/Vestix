import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SettingsService } from '../../modules/settings/settings.service';
import { evaluateAfipConfiguration } from './afip-config.util';

export interface AfipVoucherResponse {
  cae: string;
  caeExpiration: Date | string;
  receiptNumber: string;
}

@Injectable()
export class AfipService {
  constructor(private readonly settingsService: SettingsService) {}

  async isConfigured(): Promise<boolean> {
    const arca = await this.settingsService.getArcaSettings();
    return evaluateAfipConfiguration(arca).configured;
  }

  async getConfigurationStatus() {
    const arca = await this.settingsService.getArcaSettings();
    return evaluateAfipConfiguration(arca);
  }

  /**
   * AFIP WSFE (Web Service Factura Electrónica) Integration
   * Requests a legal CAE to validate a sale with the Argentine government.
   */
  async createElectronicInvoice(payload: {
    pointOfSale: number;
    invoiceType: number;
    documentType: number;
    documentNumber: number;
    netAmount: number;
    vatAmount: number;
    totalAmount: number;
  }): Promise<AfipVoucherResponse> {
    const arca = await this.settingsService.getArcaSettings();
    const config = evaluateAfipConfiguration(arca);

    if (!config.configured) {
      throw new ServiceUnavailableException(
        `AFIP no está configurado: ${config.missing.join(', ')}. ` +
          'Configure CUIT, certificados y habilite ARCA antes de emitir comprobantes.',
      );
    }

    try {
      // Production path: instantiate AFIP SDK (e.g. afip.js) with server certificates
      // and call ElectronicBilling.createVoucher(payload).
      throw new ServiceUnavailableException(
        'Integración AFIP WSFE no implementada. ' +
          'Los comprobantes no pueden autorizarse hasta conectar el SDK con certificados reales.',
      );
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new InternalServerErrorException(`AFIP Integration Error: ${error.message}`);
    }
  }
}
