# 📱 VESTIX ERP + POS — CONTRATOS DE INTEGRACIÓN Y ARQUITECTURA MÓVIL (OPENAPI & ANDROID KOTLIN)

Este documento define la arquitectura técnica de integración, los contratos de datos (OpenAPI 3.0), los esquemas de seguridad, los flujos transaccionales y los mecanismos de sincronización offline para la **aplicación móvil nativa en Android (Kotlin)** de **Vestix ERP + POS**.

---

## 📑 ÍNDICE GENERAL

1. [Arquitectura de Integración & Protocolo](#1-arquitectura-de-integración--protocolo)
2. [Seguridad, Headers & Autenticación](#2-seguridad-headers--autenticación)
3. [Estandarización de Payloads (Envelopes & RFC 7807)](#3-estandarización-de-payloads-envelopes--rfc-7807)
4. [Módulo A: Autenticación, Sesión & RBAC (`Mobile - Auth`)](#4-módulo-a-autenticación-sesión--rbac-mobile---auth)
5. [Módulo B: Catálogo & Escaneo Ultrarrápido (`Mobile - Catalog & Scanner`)](#5-módulo-b-catálogo--escaneo-ultrarrápido-mobile---catalog--scanner)
6. [Módulo C: Ventas Móviles, Checkout & Idempotencia (`Mobile - POS / Sales`)](#6-módulo-c-ventas-móviles-checkout--idempotencia-mobile---pos--sales)
7. [Módulo D: Inventario, Ajustes & Conteos (`Mobile - Inventory`)](#7-módulo-d-inventario-ajustes--conteos-mobile---inventory)
8. [Módulo E: Logística, Despacho & Choferes (`Mobile - Logistics / Deliveries`)](#8-módulo-e-logística-despacho--choferes-mobile---logistics--deliveries)
9. [Arquitectura Offline-First & Motor de Sincronización](#9-arquitectura-offline-first--motor-de-sincronización)
10. [Guía de Generación Automática del SDK Kotlin / Retrofit](#10-guía-de-generación-automática-del-sdk-kotlin--retrofit)

---

## 1. ARQUITECTURA DE INTEGRACIÓN & PROTOCOLO

### 1.1 Entorno y Topología
- **Backend:** NestJS 11 Modular Monolith (Node.js/TypeScript) + PostgreSQL 16 + Prisma ORM + Redis 7 / BullMQ.
- **App Móvil:** Android Nativo (Kotlin 2.0+, Jetpack Compose, Coroutines & Flow, Retrofit 2 / OkHttp 4, Room Database, WorkManager).
- **Protocolo de Red:** HTTPS (TLS 1.3 estricto en producción) / HTTP/2.
- **Prefijo Global de Rutas:** `/api` (ejemplo: `https://api.vestix.com.ar/api/...`).
- **Healthcheck Endpoint:** `/health` (Sin prefijo `/api` ni autenticación).
- **Documentación Swagger / OpenAPI 3.0:**
  - Swagger UI Interactivo: `https://api.vestix.com.ar/api/docs`
  - OpenAPI JSON Raw: `https://api.vestix.com.ar/api/docs-json`
  - OpenAPI YAML Raw: `https://api.vestix.com.ar/api/docs-yaml`

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ANDROID CLIENT (Kotlin + Retrofit)                   │
│   [ML Kit / Zebra Scanner]  [Room DB Offline]  [WorkManager Sync]      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (Bearer JWT + Idempotency)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    VESTIX BACKEND (NestJS Modular)                     │
│  ┌───────────────┐ ┌───────────────┐ ┌──────────────┐ ┌─────────────┐ │
│  │ Mobile - Auth │ │ Mobile - Sales│ │Mobile-Scanner│ │ Mobile-Logis│ │
│  └───────┬───────┘ └───────┬───────┘ └──────┬───────┘ └──────┬──────┘ │
│          │                 │                │                │        │
│          ▼                 ▼                ▼                ▼        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │                    Core Services & Prisma ORM                    │ │
│  └──────────────────────────────────┬───────────────────────────────┘ │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      ▼
                      ┌───────────────────────────────┐
                      │    PostgreSQL 16 Multi-DB     │
                      └───────────────────────────────┘
```

---

## 2. SEGURIDAD, HEADERS & AUTENTICACIÓN

### 2.1 Esquema de Autenticación Híbrido (Mobile Bearer + Web Cookie)
Para compatibilidad transparente con el backoffice web (HttpOnly cookies) y clientes móviles nativos (que no comparten jar de cookies web de forma predecible), la API soporta **Dual Token Extraction**:
1. **Header estándar (Requerido en Android):** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
2. **Cookie de respaldo (Web Backoffice):** `Cookie: erp_token=<JWT_ACCESS_TOKEN>`

### 2.2 Headers Obligatorios en Solicitudes Móviles

| Header | Tipo | Obligatorio | Descripción | Ejemplo |
| :--- | :--- | :---: | :--- | :--- |
| `Authorization` | String | Sí (en endpoints protegidos) | Token JWT emitido en el login móvil. | `Bearer eyJhbGciOiJIUzI1...` |
| `Content-Type` | String | Sí (`POST`, `PUT`, `PATCH`) | Formato del cuerpo de la petición. | `application/json` o `multipart/form-data` |
| `Accept` | String | Sí | Formato esperado de respuesta. | `application/json` |
| `X-Idempotency-Key` | UUID v4 | **Sí** (en mutaciones críticas) | Llave única para evitar duplicación de ventas y cobros en caídas de red. | `e9f8a342-9f33-4f27-a06f-6cbeec8f8682` |
| `X-App-Version` | String | Recomendado | Versión de la app Android para telemetría y deprecación. | `1.4.2` |
| `X-Device-Id` | String | Recomendado | Identificador único del dispositivo (Android ID / UUID). | `550e8400-e29b-41d4-a716-446655440000` |
| `X-Branch-Id` | UUID | Opcional | Sobrescribe la sucursal activa del usuario cuando tiene multitienda. | `3fa85f64-5717-4562-b3fc-2c963f66afa6` |

---

## 3. ESTANDARIZACIÓN DE PAYLOADS (ENVELOPES & RFC 7807)

### 3.1 Envelope Estándar de Éxito (`ApiResponse<T>`)
Todas las respuestas exitosas (200 OK, 201 Created) encapsulan su resultado en un contenedor unificado:

```json
{
  "success": true,
  "data": {
    "id": "7b79a552-8d7b-4029-9134-2e9eb647895e",
    "name": "Remera Básica Oversize",
    "sku": "REM-OVR-BLK-L",
    "price": 18500.00
  },
  "meta": {
    "timestamp": "2026-08-31T20:55:00.000Z",
    "requestId": "97f093d0-678b-4631-b9c4-277245372340",
    "version": "v1",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 142,
      "totalPages": 8
    }
  }
}
```

### 3.2 Envelope Estándar de Error (Alineado a RFC 7807)
En caso de fallo (4xx, 5xx), el servidor devuelve un payload estructurado sin fugar stack traces en producción:

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_FAILED",
  "message": [
    "items[0].quantity must be a positive number",
    "paymentMethod must be one of: CASH, DEBIT, CREDIT, MP_QR, TRANSFER"
  ],
  "requestId": "97f093d0-678b-4631-b9c4-277245372340",
  "path": "/api/sales/checkout",
  "timestamp": "2026-08-31T20:55:01.120Z",
  "details": {
    "fields": {
      "quantity": "Valor menor o igual a 0",
      "paymentMethod": "Método no soportado"
    }
  }
}
```

### 3.3 Catálogo de Códigos de Error (`errorCode`)

| `errorCode` | HTTP Status | Causa | Acción en Android |
| :--- | :---: | :--- | :--- |
| `UNAUTHORIZED` | 401 | Token ausente, inválido o expirado | Limpiar `EncryptedSharedPreferences` y redirigir a Login |
| `FORBIDDEN` | 403 | Permisos RBAC insuficientes | Mostrar diálogo "Acceso Denegado" o solicitar PIN de supervisor |
| `VALIDATION_FAILED` | 400 | Fallo en `@IsNotEmpty`, `@IsUUID`, etc. | Mostrar errores en los campos del formulario |
| `RECORD_NOT_FOUND` | 404 | SKU/Variante/Orden no encontrada | Mostrar alerta con sonido de error y permitir reescaneo |
| `INSUFFICIENT_STOCK` | 409 | Stock insuficiente en la sucursal actual | Mostrar stock disponible real y opción de ajuste/reserva |
| `DUPLICATE_IDEMPOTENCY_KEY` | 409 | Solicitud ya procesada por `X-Idempotency-Key` | Retornar la orden original almacenada sin cobrar de nuevo |
| `REGISTER_CLOSED` | 409 | La caja registradora no tiene turno abierto | Mostrar pantalla de "Apertura de Caja" |
| `PRICE_MODIFIED` | 409 | El precio del producto cambió en el servidor | Actualizar carrito y solicitar confirmación al cajero |
| `INTERNAL_SERVER_ERROR` | 500 | Error no controlado en backend | Guardar operación en cola offline local si es idempotente |

---

## 4. MÓDULO A: AUTENTICACIÓN, SESIÓN & RBAC (`Mobile - Auth`)

### 4.1 `POST /api/auth/login` (Login Móvil)
Valida credenciales de operador/vendedor y retorna el token JWT y perfil con permisos granulares.

- **Tag Swagger:** `Mobile - Auth`
- **Seguridad:** Pública (Limitada por Throttler: 10 req/min).

#### Request Body
```json
{
  "email": "vendedor.caba@vestix.com.ar",
  "password": "Password123!",
  "deviceInfo": {
    "deviceId": "9a38f712-421c-43f1-8fbb-78f9024f9f23",
    "model": "Zebra TC26",
    "osVersion": "Android 13"
  }
}
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "id": "6a9f6534-7ef2-4822-bc5d-6cbf26084f73",
      "email": "vendedor.caba@vestix.com.ar",
      "fullName": "Martín Rodríguez",
      "role": "CASHIER",
      "branch": {
        "id": "b1a43ef5-6134-4bc9-9388-12e09ff7b5a8",
        "name": "Sucursal Palermo Soho",
        "code": "SUC-PAL",
        "warehouseId": "8f395781-a968-450f-90e1-64ee4e36dca2"
      },
      "permissions": [
        "sales:create",
        "sales:read",
        "catalog:read",
        "inventory:read",
        "pos:open_session",
        "pos:close_session"
      ],
      "availableBranches": [
        {
          "id": "b1a43ef5-6134-4bc9-9388-12e09ff7b5a8",
          "name": "Sucursal Palermo Soho"
        },
        {
          "id": "e4210d77-3ba1-4fc3-b26a-72efb6d194c2",
          "name": "Sucursal Recoleta"
        }
      ]
    }
  },
  "meta": { "timestamp": "2026-08-31T20:55:10.000Z" }
}
```

### 4.2 `POST /api/auth/authorize-action` (Autorización de Supervisor)
Permite a un vendedor pedir autorización instantánea (mediante PIN de supervisor o contraseña) para aplicar un descuento especial, anular una línea de ticket o vender por debajo del costo.

- **Tag Swagger:** `Mobile - Auth`
- **Seguridad:** `BearerAuth` (Requiere sesión activa del vendedor que pide la autorización).

#### Request Body
```json
{
  "supervisorEmail": "gerente.palermo@vestix.com.ar",
  "supervisorPin": "9482",
  "action": "DISCOUNT_OVERRIDE",
  "context": {
    "cartId": "temp-cart-5501",
    "discountPercentage": 25.0
  }
}
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": {
    "authorized": true,
    "authorizationToken": "authz_tok_9f3b110a2c...",
    "supervisorName": "Laura Gómez",
    "expiresInSeconds": 300
  },
  "meta": { "timestamp": "2026-08-31T20:55:12.000Z" }
}
```

---

## 5. MÓDULO B: CATÁLOGO & ESCANEO ULTRARRÁPIDO (`Mobile - Catalog & Scanner`)

### 5.1 `GET /api/catalog/products/lookup` (Escaneo Rápido de Código de Barras / SKU)
Diseñado específicamente para hardware de captura de datos (Zebra DataWedge, Honeywell SwiftDecoder) y cámaras Android con Google ML Kit. Retorna la respuesta en menos de 50ms sin campos pesados no necesarios.

- **Tag Swagger:** `Mobile - Catalog` / `Mobile - Inventory / Scanner`
- **Seguridad:** `BearerAuth`
- **Query Params:**
  - `q` (string, requerido): Código EAN-13, CODE-128, SKU de variante, o SKU base.
  - `branchId` (UUID, opcional): Sucursal para resolver stock local inmediato. Si se omite, toma la sucursal del token.
  - `priceListId` (UUID, opcional): Lista de precios aplicable.

#### Request
```http
GET /api/catalog/products/lookup?q=7791234567890&branchId=b1a43ef5-6134-4bc9-9388-12e09ff7b5a8 HTTP/1.1
Host: api.vestix.com.ar
Authorization: Bearer eyJhbGciOiJIUzI1...
```

#### Response Body (`200 OK`)
```json
{
  "success": true,
  "data": {
    "productId": "4a71d2b8-9366-4c4f-9e7f-71b3e7bc7da8",
    "variantId": "9b1e7c54-4712-4cf4-bfa2-371501b1990c",
    "name": "Jean Slim Fit Azul Noche",
    "sku": "JEA-SLM-BLU-42",
    "barcode": "7791234567890",
    "secondaryBarcodes": ["7791234567891"],
    "brand": "Vestix Denim",
    "category": "Pantalones",
    "size": "42",
    "color": "Azul Noche",
    "imageUrl": "https://api.vestix.com.ar/uploads/products/product-1725134100-jeans.webp",
    "pricing": {
      "finalPrice": 34500.00,
      "basePrice": 34500.00,
      "costPrice": 14200.00,
      "currency": "ARS",
      "priceListName": "Lista General Mostrador",
      "taxRate": 21.0
    },
    "stock": {
      "branchId": "b1a43ef5-6134-4bc9-9388-12e09ff7b5a8",
      "availableQuantity": 14,
      "physicalQuantity": 15,
      "reservedQuantity": 1,
      "isInStock": true,
      "otherBranchesStock": [
        {
          "branchName": "Sucursal Recoleta",
          "availableQuantity": 6
        },
        {
          "branchName": "Depósito Central",
          "availableQuantity": 120
        }
      ]
    }
  },
  "meta": { "timestamp": "2026-08-31T20:55:15.000Z" }
}
```

---

## 6. MÓDULO C: VENTAS MÓVILES, CHECKOUT & IDEMPOTENCIA (`Mobile - POS / Sales`)

### 6.1 `POST /api/sales/checkout` (Creación de Pedido / Cobro Móvil)
Permite al vendedor en el salón de ventas o al operario cerrar una venta desde la terminal móvil. Soporta múltiples medios de pago, facturación electrónica AFIP optativa y clave de idempotencia estricta.

- **Tag Swagger:** `Mobile - POS / Sales`
- **Seguridad:** `BearerAuth`
- **Headers Obligatorios:** `X-Idempotency-Key: <UUIDv4>`

#### Request Body
```json
{
  "branchId": "b1a43ef5-6134-4bc9-9388-12e09ff7b5a8",
  "cashRegisterShiftId": "50c8227b-0447-4b55-b040-cfc6c4c9e881",
  "customerId": "81d77a02-23f2-491c-b26a-912f205c4ea6",
  "source": "MOBILE_POS",
  "notes": "Venta móvil en salón - Vendedor #14",
  "items": [
    {
      "variantId": "9b1e7c54-4712-4cf4-bfa2-371501b1990c",
      "quantity": 2,
      "unitPrice": 34500.00,
      "discountAmount": 3450.00,
      "discountPercentage": 5.0,
      "supervisorAuthToken": null
    }
  ],
  "discounts": [
    {
      "code": "PROMO_VERANO",
      "amount": 2000.00
    }
  ],
  "payments": [
    {
      "method": "CASH",
      "amount": 30000.00,
      "currency": "ARS"
    },
    {
      "method": "MP_QR",
      "amount": 33550.00,
      "currency": "ARS",
      "paymentReference": "MP-ORDER-88274191"
    }
  ],
  "invoice": {
    "emitInvoice": true,
    "invoiceType": "B",
    "customerDocType": "DNI",
    "customerDocNumber": "38491022"
  }
}
```

#### Response Body (`201 Created`)
```json
{
  "success": true,
  "data": {
    "orderId": "65b4c10a-3ff0-4841-8608-f1f3a2164478",
    "orderNumber": "PED-0002-00004921",
    "status": "COMPLETED",
    "paymentStatus": "PAID",
    "totalAmount": 63550.00,
    "subtotal": 69000.00,
    "discountTotal": 5450.00,
    "itemsCount": 2,
    "publicReceiptUrl": "https://app.vestix.com.ar/receipt/65b4c10a-3ff0-4841-8608-f1f3a2164478",
    "fiscalInvoice": {
      "cae": "74329182938102",
      "caeExpiration": "2026-09-10",
      "invoiceNumber": "00002-00001289",
      "qrCodeUrl": "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEs..."
    },
    "createdAt": "2026-08-31T20:55:20.000Z"
  },
  "meta": {
    "timestamp": "2026-08-31T20:55:20.500Z",
    "idempotencyKey": "e9f8a342-9f33-4f27-a06f-6cbeec8f8682"
  }
}
```

---

## 7. MÓDULO D: INVENTARIO, AJUSTES & CONTEOS (`Mobile - Inventory`)

### 7.1 `POST /api/inventory/stock/adjust` (Ajuste Rápido de Stock)
Utilizado durante auditorías o para declarar mermas/roturas desde la app móvil.

- **Tag Swagger:** `Mobile - Inventory / Scanner`
- **Seguridad:** `BearerAuth`

#### Request Body
```json
{
  "warehouseId": "8f395781-a968-450f-90e1-64ee4e36dca2",
  "variantId": "9b1e7c54-4712-4cf4-bfa2-371501b1990c",
  "quantity": -1,
  "reason": "ROTURA",
  "notes": "Mercadería dañada en percha exhibición"
}
```

### 7.2 `POST /api/inventory/audit` (Conteo Físico por Lote de Escaneo)
El operario recorre el depósito escaneando códigos en ráfaga (Batch Barcode Scanning). Al terminar, envía la lista completa para conciliación automática.

- **Tag Swagger:** `Mobile - Inventory / Scanner`
- **Seguridad:** `BearerAuth`

#### Request Body
```json
{
  "warehouseId": "8f395781-a968-450f-90e1-64ee4e36dca2",
  "auditReference": "AUDITORIA-PASILLO-4-20260831",
  "items": [
    {
      "variantId": "9b1e7c54-4712-4cf4-bfa2-371501b1990c",
      "countedQuantity": 14
    },
    {
      "variantId": "2c90a187-5120-4a88-8120-bf1249fa6b10",
      "countedQuantity": 8
    }
  ]
}
```

---

## 8. MÓDULO E: LOGÍSTICA, DESPACHO & CHOFERES (`Mobile - Logistics / Deliveries`)

### 8.1 `GET /api/shipping/deliveries` (Listado de Entregas)
Obtiene los envíos asignados a la ruta del repartidor.

- **Tag Swagger:** `Mobile - Logistics / Deliveries`
- **Seguridad:** `BearerAuth`
- **Query Params:** `status=DISPATCHED&page=1&pageSize=20`

### 8.2 `POST /api/driver/:token/location` (Baliza de Geoposicionamiento GPS)
La app móvil en segundo plano reporta la posición del chofer cada 30 segundos.

- **Tag Swagger:** `Mobile - Logistics / Deliveries`
- **Seguridad:** Tokenizada vía URL (`:token`) o `BearerAuth`

#### Request Body
```json
{
  "latitude": -34.588492,
  "longitude": -58.430598,
  "speed": 28.5,
  "batteryLevel": 82
}
```

### 8.3 `POST /api/driver/:token/complete` (Cierre de Entrega con Comprobante)
Registra la entrega exitosa o rechazada con nombre del receptor, DNI, coordenadas y firma digital.

- **Tag Swagger:** `Mobile - Logistics / Deliveries`
- **Request Body:**
```json
{
  "status": "DELIVERED",
  "receivedBy": "Federico Álvarez",
  "recipientDoc": "32194829",
  "signatureSvg": "<svg>...</svg>",
  "notes": "Entregado a encargado de edificio",
  "latitude": -34.588500,
  "longitude": -58.430600
}
```

---

## 9. ARQUITECTURA OFFLINE-FIRST & MOTOR DE SINCRONIZACIÓN

Para soportar operaciones en depósitos sin señal Wi-Fi/4G o en ferias comerciales:

### 9.1 Flujo de Transacciones Offline en Android
1. **Escritura Local:** La venta o ajuste se persiste inmediatamente en **Room Database** con estado `SYNC_PENDING` y su respectivo `idempotencyKey = UUID.randomUUID().toString()`.
2. **Cola de Encolado (WorkManager):** `SyncWorker` con `Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED)` escucha conectividad.
3. **Envío en Lote (`POST /api/offline/sync`):**

```json
{
  "batchId": "c56a1b24-7491-4cf6-bb0a-49339e802511",
  "operations": [
    {
      "id": "e9f8a342-9f33-4f27-a06f-6cbeec8f8682",
      "type": "SALE_CHECKOUT",
      "createdAt": "2026-08-31T20:30:00.000Z",
      "payload": { ... }
    }
  ]
}
```

4. **Resolución de Conflictos:**
   - **Precios:** Prevalece el precio del servidor si hubo cambio, alertando en el reporte de sincronización.
   - **Stock Negativo:** El servidor registra el movimiento como ajuste diferido y encola alerta de auditoría al administrador.

---

## 10. GUÍA DE GENERACIÓN AUTOMÁTICA DEL SDK KOTLIN / RETROFIT

### 10.1 Exportación del Esquema OpenAPI desde NestJS
Ejecutar el siguiente comando para generar o descargar el `swagger.json`:

```bash
# Opción A: Vía cURL con el backend corriendo en http://localhost:3001
curl -s http://localhost:3001/api/docs-json > openapi-spec.json

# Opción B: Script npm en backend/package.json
npm run export:openapi
```

### 10.2 Generación del SDK Kotlin con `openapi-generator-cli`

```bash
npx @openapitools/openapi-generator-cli generate \
  -i openapi-spec.json \
  -g kotlin \
  -o ../android/vestix-api-sdk \
  --additional-properties=\
library=jvm-retrofit2,\
useCoroutines=true,\
serializationLibrary=kotlinx_serialization,\
dateLibrary=java8,\
packageName=com.vestix.mobile.api,\
enumPropertyNaming=UPPERCASE
```

### 10.3 Configuración en Gradle de Android (`build.gradle.kts`)

```kotlin
plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.serialization)
    id("org.openapi.generator") version "7.4.0"
}

openApiGenerate {
    generatorName.set("kotlin")
    inputSpec.set("$rootDir/specs/openapi-spec.json")
    outputDir.set("$buildDir/generated/openapi")
    packageName.set("com.vestix.mobile.api")
    configOptions.set(
        mapOf(
            "library" to "jvm-retrofit2",
            "useCoroutines" to "true",
            "serializationLibrary" to "kotlinx_serialization",
            "dateLibrary" to "java8"
        )
    )
}
```

### 10.4 Configuración del Cliente Retrofit & Interceptores

```kotlin
class AuthInterceptor(private val tokenProvider: () -> String?) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val requestBuilder = chain.request().newBuilder()
            .header("Accept", "application/json")
            .header("X-App-Version", BuildConfig.VERSION_NAME)
        
        tokenProvider()?.let { token ->
            requestBuilder.header("Authorization", "Bearer $token")
        }
        
        return chain.proceed(requestBuilder.build())
    }
}

class IdempotencyInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        if (request.method == "POST" || request.method == "PUT") {
            if (request.header("X-Idempotency-Key") == null) {
                val newRequest = request.newBuilder()
                    .header("X-Idempotency-Key", UUID.randomUUID().toString())
                    .build()
                return chain.proceed(newRequest)
            }
        }
        return chain.proceed(request)
    }
}
```
