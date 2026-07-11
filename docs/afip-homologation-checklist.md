# AFIP Homologation Checklist (Argentina)

Step-by-step guide to homologate Vestix ERP electronic invoicing (WSFE — Web Service Factura Electrónica) with AFIP/ARCA before switching to production.

Vestix integrates via `@afipsdk/afip.js`, stores certificates under `uploads/arca/{certAlias}.{crt,key,csr}`, and reads configuration from **Settings → ARCA** (`ArcaSettings`: CUIT, point of sale, environment, cert alias).

---

## Prerequisites

- [ ] Legal entity registered with AFIP (CUIT activo, condición fiscal definida).
- [ ] Clave Fiscal nivel **3** or higher for the responsible user.
- [ ] Point of sale (Punto de Venta) registered for **Factura Electrónica** in AFIP admin.
- [ ] Backend running with **Redis** (BullMQ queue `afip_invoices`) and **PostgreSQL**.
- [ ] `SETTINGS_ENCRYPTION_KEY` set in production (required for encrypted settings).
- [ ] Optional: `AFIP_ACCESS_TOKEN` for AfipSDK cloud proxy (helps if outbound WSAA/WSFE is restricted).

---

## Step 1 — AFIP admin: enable electronic invoicing

1. Log in to [AFIP](https://www.afip.gob.ar/) with Clave Fiscal.
2. Go to **Administrador de Relaciones de Clave Fiscal** and ensure your certificate/service user can access:
   - **WSFE** (Comprobantes en línea / Factura electrónica)
   - **Administración de puntos de venta y domicilios** (if creating POS)
3. Under **Comprobantes en línea → Administración de puntos de venta**:
   - [ ] Create or confirm a **Punto de Venta** for web services (not the same as a manual fiscal controller in all cases).
   - [ ] Note the **número de punto de venta** — it must match `ArcaSettings.pointOfSale` in Vestix.
4. Confirm authorized voucher types (e.g. Factura B/C, Nota de Crédito) match your business regime.

---

## Step 2 — Generate CSR and certificate (homologación)

Vestix can generate the CSR from the admin UI or CLI:

### Option A — Admin UI (recommended)

1. Log in as admin → **Settings → ARCA**.
2. Set **Environment** to `homologation` (not `production`).
3. Enter **CUIT** (11 digits, no dashes in storage).
4. Choose a **cert alias** (lowercase alphanumeric, e.g. `vestix-homo`).
5. Click **Generate CSR** — files are written to:
   - `backend/uploads/arca/{alias}.key` (private key — **never commit**)
   - `backend/uploads/arca/{alias}.csr`

### Option B — Manual OpenSSL

```bash
cd backend/uploads/arca
openssl req -new -newkey rsa:2048 -nodes \
  -keyout vestix-homo.key -out vestix-homo.csr \
  -subj "/C=AR/O=Mi Empresa/CN=vestix-homo/serialNumber=CUIT 20123456789"
```

---

## Step 3 — Upload CSR to AFIP (homologación)

1. AFIP → **Administrador de Certificados Digitales** (or WSAA certificate admin for homologación).
2. Select **homologación** environment.
3. Upload `{alias}.csr`.
4. Download the signed certificate `{alias}.crt`.
5. Place it in `backend/uploads/arca/{alias}.crt` (alongside the `.key` from step 2).

**Alternative:** set env vars instead of uploads:

```env
AFIP_CERT_PATH=/secure/path/cert.crt
AFIP_KEY_PATH=/secure/path/cert.key
AFIP_CUIT=20123456789
```

---

## Step 4 — Configure Vestix ARCA settings

In **Settings → ARCA** (or via API `/api/settings`):

| Field | Homologación value |
|-------|-------------------|
| `enabled` | `true` |
| `environment` | `homologation` |
| `cuit` | Your 11-digit CUIT |
| `pointOfSale` | AFIP POS number from Step 1 |
| `certAlias` | Same alias used for CSR (e.g. `vestix-homo`) |
| `startDate` | Date you begin issuing (ISO string) |
| `iibb` | IIBB number if applicable |

Run **Test AFIP connection** in Settings. Expected: success log showing CUIT and certificates present (`SettingsService.testAfipConnection`).

---

## Step 5 — Verify WSAA / WSFE connectivity

1. Ensure Redis is running (`REDIS_HOST`, `REDIS_PORT`).
2. Restart backend after placing certificates.
3. From Settings, run connection test — confirms configuration, not necessarily a live CAE.
4. Optional manual check with a homologación sale:
   - Complete a POS or backoffice sale with `issueInvoice: true`.
   - Monitor BullMQ queue `afip_invoices` and backend logs.
   - Inspect **AFIP failed jobs**: `GET /api/afip/failed-jobs` (requires admin JWT).

---

## Step 6 — Homologation test scenarios

Execute each scenario in **homologación** and record CAE, voucher number, and PDF/receipt:

| # | Scenario | Voucher type | Expected |
|---|----------|--------------|----------|
| 1 | Cash sale to consumidor final | Factura B (type 6) | CAE + expiration returned |
| 2 | Sale with IVA discriminated | Factura A (type 1) | Requires valid CUIT customer |
| 3 | Credit note against sale | Nota de Crédito | Links to original voucher |
| 4 | Point of sale mismatch | — | Controlled error, no orphan sale |
| 5 | Certificate expired / wrong env | — | Job fails; appears in failed-jobs |

For each successful case verify in AFIP homologación portal (or WSFE consulta) that the voucher number matches Vestix `Invoice` records.

---

## Step 7 — Error handling validation

- [ ] Failed AFIP jobs appear in `GET /api/afip/failed-jobs`.
- [ ] Retry works: `POST /api/afip/retry-job/:id`.
- [ ] Sales complete even if AFIP queue fails (invoice generation is async post-commit).
- [ ] AFIP error traces stored in integration metadata / logs (check audit and invoice records).

---

## Step 8 — Switch to production

Only after all homologación scenarios pass:

1. Generate a **new CSR** for production (do not reuse homologación certificates).
2. Upload CSR in AFIP **production** certificate admin.
3. Install production `.crt` + `.key` in `uploads/arca/` or secure env paths.
4. Update ARCA settings: `environment: production`.
5. Update `pointOfSale` if production POS differs.
6. Run connection test and one low-value real sale with managerial oversight.
7. Monitor failed jobs for 24–48 hours.

---

## Environment reference

| `ArcaSettings.environment` | Afip.js `production` flag | AFIP endpoints |
|----------------------------|---------------------------|----------------|
| `homologation` | `false` | WSAA/WSFE homologación |
| `production` | `true` | WSAA/WSFE producción |

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `Certificados AFIP no encontrados` | Missing `.crt`/`.key` or wrong alias | Check `uploads/arca/` and `certAlias` |
| `AFIP no configurado` | `enabled: false` or missing CUIT | Complete ARCA settings |
| Auth / token errors (WSAA) | Wrong environment cert | Use homologación cert only in homologación |
| `(10016) Punto de venta no habilitado` | POS not registered for WSFE | Fix in AFIP admin |
| Jobs stuck / no processing | Redis down | Start Redis, restart backend |
| `SETTINGS_ENCRYPTION_KEY` error | Missing in production | Generate 32-byte base64 key |

---

## Security checklist

- [ ] Private keys (`.key`) excluded from git and backups exposed only to ops.
- [ ] File permissions on `uploads/arca/` restricted to app user.
- [ ] Production certificates stored separately from homologación.
- [ ] `AFIP_ACCESS_TOKEN` rotated if using AfipSDK cloud.

---

## Related docs

- `docs/production-deployment.md` — server setup
- `docs/operations-checklist.md` — go-live checks
- `AGENTS.md` — local dev AFIP paths and env fallbacks
