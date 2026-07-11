import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import Afip from '@afipsdk/afip.js';
import { SettingsService } from '../../modules/settings/settings.service';
import {
  evaluateAfipConfiguration,
  resolveAfipCertificates,
} from './afip-config.util';

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

  private roundAmount(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private formatReceiptNumber(pointOfSale: number, voucherNumber: number): string {
    return `${String(pointOfSale).padStart(5, '0')}-${String(voucherNumber).padStart(8, '0')}`;
  }

  private buildAfipClient(arca: Awaited<ReturnType<SettingsService['getArcaSettings']>>): InstanceType<typeof Afip> {
    const materials = resolveAfipCertificates(arca);
    if (!materials) {
      throw new ServiceUnavailableException('Certificados AFIP no encontrados');
    }

    const cuit = (arca.cuit || process.env.AFIP_CUIT || '').replace(/\D/g, '');
    const options: Record<string, unknown> = {
      CUIT: Number(cuit),
      cert: materials.cert,
      key: materials.key,
      production: arca.environment === 'production',
    };

    const accessToken = process.env.AFIP_ACCESS_TOKEN?.trim();
    if (accessToken) {
      options.access_token = accessToken;
    }

    return new Afip(options as ConstructorParameters<typeof Afip>[0]);
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
    ivaId?: number;
    condicionIvaReceptorId?: number;
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
      const afip = this.buildAfipClient(arca);
      const lastVoucher = await afip.ElectronicBilling.getLastVoucher(
        payload.pointOfSale,
        payload.invoiceType,
      );
      const nextVoucher = Number(lastVoucher) + 1;

      const netAmount = this.roundAmount(payload.netAmount);
      const vatAmount = this.roundAmount(payload.vatAmount);
      const totalAmount = this.roundAmount(payload.totalAmount);

      const today = new Date();
      const cbteFch = parseInt(
        `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`,
        10,
      );

      const voucherData = {
        CantReg: 1,
        PtoVta: payload.pointOfSale,
        CbteTipo: payload.invoiceType,
        Concepto: 1,
        DocTipo: payload.documentType,
        DocNro: payload.documentNumber,
        CbteDesde: nextVoucher,
        CbteHasta: nextVoucher,
        CbteFch: cbteFch,
        ImpTotal: totalAmount,
        ImpTotConc: 0,
        ImpNeto: netAmount,
        ImpOpEx: 0,
        ImpIVA: vatAmount,
        ImpTrib: 0,
        MonId: 'PES',
        MonCotiz: 1,
        CondicionIVAReceptorId: payload.condicionIvaReceptorId ?? 5,
        Iva: [
          {
            Id: payload.ivaId ?? 5,
            BaseImp: netAmount,
            Importe: vatAmount,
          },
        ],
      };

      const result = await afip.ElectronicBilling.createVoucher(voucherData);

      return {
        cae: String(result.CAE),
        caeExpiration: result.CAEFchVto,
        receiptNumber: this.formatReceiptNumber(payload.pointOfSale, nextVoucher),
      };
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new InternalServerErrorException(`AFIP Integration Error: ${error.message}`);
    }
  }
}
