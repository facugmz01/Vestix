import * as fs from 'fs';
import * as path from 'path';
import type { ArcaSettings } from '../../modules/settings/settings.service';

export interface AfipConfigStatus {
  configured: boolean;
  enabled: boolean;
  hasCuit: boolean;
  hasCertificates: boolean;
  missing: string[];
}

export const ARCA_UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'arca');

export function sanitizeCertAlias(alias: string): string {
  const normalized = alias.trim().toLowerCase();
  if (!/^[a-z0-9_-]+$/.test(normalized)) {
    throw new Error('El alias del certificado solo puede contener letras, números, guiones y guiones bajos');
  }
  return normalized;
}

export function getArcaCertFilePaths(certAlias: string) {
  const alias = sanitizeCertAlias(certAlias);
  return {
    alias,
    certPath: path.join(ARCA_UPLOADS_DIR, `${alias}.crt`),
    keyPath: path.join(ARCA_UPLOADS_DIR, `${alias}.key`),
    csrPath: path.join(ARCA_UPLOADS_DIR, `${alias}.csr`),
  };
}

export function arcaUploadCertificatesExist(certAlias: string): boolean {
  try {
    const { certPath, keyPath } = getArcaCertFilePaths(certAlias);
    return fs.existsSync(certPath) && fs.existsSync(keyPath);
  } catch {
    return false;
  }
}

export interface AfipCertificateMaterial {
  cert: string;
  key: string;
}

export function resolveAfipCertificates(
  arca: Partial<ArcaSettings>,
  env: NodeJS.ProcessEnv = process.env,
): AfipCertificateMaterial | null {
  const certPath = env.AFIP_CERT_PATH?.trim();
  const keyPath = env.AFIP_KEY_PATH?.trim();
  if (certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    return {
      cert: fs.readFileSync(certPath, { encoding: 'utf8' }),
      key: fs.readFileSync(keyPath, { encoding: 'utf8' }),
    };
  }

  const alias = arca.certAlias?.trim();
  if (alias && arcaUploadCertificatesExist(alias)) {
    const { certPath: uploadCertPath, keyPath: uploadKeyPath } = getArcaCertFilePaths(alias);
    return {
      cert: fs.readFileSync(uploadCertPath, { encoding: 'utf8' }),
      key: fs.readFileSync(uploadKeyPath, { encoding: 'utf8' }),
    };
  }

  return null;
}

export function evaluateAfipConfiguration(
  arca: Partial<ArcaSettings>,
  env: NodeJS.ProcessEnv = process.env,
): AfipConfigStatus {
  const enabled = arca.enabled === true;
  const cuit = (arca.cuit || env.AFIP_CUIT || '').trim();
  const hasCuit = cuit.replace(/\D/g, '').length >= 11;

  const certPath = env.AFIP_CERT_PATH?.trim();
  const keyPath = env.AFIP_KEY_PATH?.trim();
  const hasEnvCerts =
    !!certPath &&
    !!keyPath &&
    fs.existsSync(certPath) &&
    fs.existsSync(keyPath);

  const alias = arca.certAlias?.trim();
  const hasUploadCerts = !!alias && arcaUploadCertificatesExist(alias);
  const hasCertificates = hasEnvCerts || hasUploadCerts;

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
