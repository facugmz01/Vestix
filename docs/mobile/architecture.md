# Arquitectura móvil propuesta

## Stack

Se recomienda React Native con Expo y TypeScript para reutilizar conocimientos de React, tipos y patrones de `frontend/`, manteniendo una aplicación nativa para cámara, notificaciones, almacenamiento seguro y ubicación.

Paquetes sugeridos:

- Expo Router o React Navigation para rutas protegidas y deep links.
- TanStack Query para datos remotos y caché en memoria.
- Zustand sólo para estado de sesión, dispositivo, carrito y cola; no duplicar el servidor como una segunda base de datos.
- `expo-secure-store`/Keychain/Keystore para refresh token y secretos de dispositivo.
- SQLite/Drizzle o WatermelonDB para catálogo y cola transaccional; no usar AsyncStorage para ventas offline.
- Cámara/escáner, ubicación y notificaciones con permisos explícitos y degradación elegante.

## Estructura sugerida

```text
mobile/
  app/                 # rutas y layouts
  src/
    api/               # cliente HTTP, DTOs y adaptadores
    auth/              # sesión, MFA, refresh, guards
    features/
      home/
      pos/
      catalog/
      inventory/
      orders/
      delivery/
      sync/
    db/                # schema local, migraciones, repositorios
    navigation/
    permissions/
    stores/
    components/
    telemetry/
    theme/
  app.config.ts
```

## Capas

1. Pantallas y componentes: sólo interacción y presentación.
2. Casos de uso: `completeCheckout`, `countStock`, `completeDelivery`, etc.
3. Repositorios: deciden remoto vs local y escriben la cola en la misma transacción local que el dato de negocio.
4. API: DTOs, serialización, timeout, refresh, clasificación de errores y correlation ID.
5. Persistencia local: catálogo versionado, sesión mínima, cola durable y logs técnicos acotados.

## Sesión móvil requerida

El backend actual crea `erp_token` en cookie HttpOnly de un día. Para móvil se requiere un contrato explícito, recomendado:

- `POST /api/mobile/auth/login` → `accessToken` corto, `refreshToken` opaco/rotativo, usuario y `sessionId`.
- `POST /api/mobile/auth/mfa` → completa el desafío temporal.
- `POST /api/mobile/auth/refresh` → rota refresh token y revoca el anterior.
- `POST /api/mobile/auth/logout` → revoca la sesión y limpia almacenamiento seguro.
- `GET /api/mobile/auth/me` → datos frescos y permisos.
- `POST /api/mobile/devices` / `DELETE /api/mobile/devices/:id` → registro y revocación de dispositivo/push.

El access token viaja en `Authorization: Bearer`. El refresh token no se registra, no se loguea y se almacena sólo en almacenamiento seguro. Debe existir rotación, detección de reutilización, expiración configurable y revocación por usuario/dispositivo.

## Configuración por entorno

La app debe recibir una URL HTTPS de API por entorno, por ejemplo `MOBILE_API_BASE_URL`. No compilar secretos ni URLs de producción en el bundle. El certificado TLS se valida con el sistema operativo; certificate pinning sólo después de evaluar el costo operativo de rotación.

## Observabilidad

Enviar un `X-Request-ID` generado en cliente y asociar errores con `sessionId`, `deviceId` y versión de app, sin enviar contraseñas, tokens, datos completos de tarjeta, CVV ni payloads sensibles. Registrar métricas de login, checkout, sync y crash-free sessions con retención limitada.
