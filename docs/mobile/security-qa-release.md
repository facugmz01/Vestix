# Seguridad, calidad y publicación móvil

## Seguridad

- HTTPS obligatorio en entornos no locales; rechazar endpoints HTTP de producción.
- Access tokens cortos; refresh rotativo en Keychain/Keystore; nunca AsyncStorage, logs, analytics ni URL.
- MFA coherente con el backend; el código y el token MFA pendiente sólo viven el tiempo necesario.
- Biometría sólo como desbloqueo local de una sesión ya emitida, nunca como reemplazo de la autorización backend.
- Validar certificado, permisos de cámara/ubicación/notificaciones y explicar su propósito.
- Ofuscar/minificar builds de release, desactivar logs verbosos y proteger sourcemaps.
- Sanitizar deep links y contenido de notificaciones; no ejecutar acciones críticas desde una notificación sin revalidar sesión y permiso.
- Borrar sesión, caché sensible y cola al cerrar sesión, revocar dispositivo o cambiar de organización/sucursal, según la política definida.
- No procesar ni almacenar PAN/CVV; usar SDK/tokenización del proveedor de pagos.

## Matriz mínima de pruebas

### Funcionales

- Login correcto, credenciales inválidas, MFA, usuario desactivado, logout y refresh.
- Permisos por pantalla y por endpoint; supervisor approval vencido y válido.
- Escaneo repetido, variante sin stock, promoción, descuento, cliente, pago mixto y QR.
- Venta online, timeout después de confirmación, reintento con mismo ID y duplicado.
- Pérdida de red durante cada paso, reconexión y procesamiento de batch parcial.
- Conteo con conflicto, operación rechazada y reintento manual.
- Foto, ubicación, entrega y permisos de sistema denegados.

### Calidad técnica

- Unit tests para casos de uso, reducers/estado de cola, clasificación de errores y serialización.
- Tests de integración contra backend de pruebas con PostgreSQL/Redis aislados.
- E2E en dispositivo/emulador Android e iOS: frío, background/foreground, poca batería, red lenta y reloj incorrecto.
- Pruebas de accesibilidad, tamaños de fuente, contraste, lector de pantalla y uso con una mano.
- Pruebas de rendimiento con catálogo grande, cientos de operaciones pendientes y fotos de varios MB.
- Seguridad: almacenamiento, logs, deep links, TLS, replay, revocación, rate limits y análisis de dependencias.

## Ambientes

`development` local → `staging` con API y servicios aislados → `production` con URLs, claves, push y proveedores reales. Nunca apuntar una build de desarrollo a la base de producción.

## CI/CD recomendado

1. TypeScript, lint, tests unitarios y validación de esquema OpenAPI.
2. Build Android/iOS de prueba, firma con secretos del gestor CI y versionado semántico.
3. Tests E2E contra staging.
4. Distribución interna (TestFlight/Google Play Internal Testing).
5. Canary limitado y monitoreo de crash-free sessions, login, checkout y sync.
6. Rollout gradual; mantener compatibilidad API hacia atrás durante la adopción.

## Checklist de release

- API móvil versionada y migraciones locales probadas desde al menos dos versiones anteriores.
- Rotación/revocación de refresh tokens validada.
- Catálogo, pagos, ARCA, notificaciones y permisos probados con configuración real de staging.
- Política de privacidad, términos, contacto de soporte y textos de permisos listos.
- Crash reporting sin PII y alertas de errores de sync.
- Rollback de build y plan para deshabilitar una función remota si aparece un incidente.
- Validación de versión mínima soportada y mensaje de actualización obligatoria.
