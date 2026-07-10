import * as fs from 'fs';
import type { ArcaSettings } from '../../modules/settings/settings.service';

export interface AfipConfigStatus {
  configured: boolean;
  enabled: boolean;
  hasCuit: boolean;
  hasCertificates: boolean;
  missing: string[];
}

export function evaluateAfipConfiguration(
  arca: Partial<ArcaSettings>,
  env: NodeJS.ProcessEnv = process.env,
): AfipConfigStatus {
  const enabled = arca.enabled === true;
  const cuit = (arca.cuit || env.AFIP_CUIT || '').trim();
  const hasCuit = cuit.length >= 11;

  const certPath = env.AFIP_CERT_PATH?.trim();
  const keyPath = env.AFIP_KEY_PATH?.trim();
  const hasEnvCerts =
    !!certPath &&
    !!keyPath &&
    fs.existsSync(certPath) &&
    fs.existsSync(keyPath);

  const hasCertAlias = !!arca.certAlias?.trim();
  const hasCertificates = hasEnvCerts || hasCertAlias;

  const missing: string[] = [];
  if (!enabled) missing.push('ARCA deshabilitado');
  if (!hasCuit) missing.push('CUIT no configurado');
  if (!hasCertificates) missing.push('certificados AFIP no configurados');

  return {
    configured: enabled && hasCuit && hasCertificates,
    enabled,
    hasCuit,
    hasCertificates,
    missing,
  };
}
