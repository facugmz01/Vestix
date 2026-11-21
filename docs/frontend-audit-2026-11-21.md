# Auditoría del frontend Vestix

**Fecha:** 21 de noviembre de 2026  
**Alcance:** revisión estática del código actual de `frontend/src`, rutas activas, estilos globales, configuración y memoria de proyecto.  
**Límite:** no se inició la app ni se probaron interacciones en navegador, API real, dispositivos o lector de pantalla. Por eso este informe describe estructura e indicios del código; los problemas visuales y de comportamiento deben confirmarse durante una revisión visual y pruebas de flujos.

## Resumen ejecutivo

Vestix tiene una base funcional extensa: backoffice con rutas separadas por permisos, POS de pantalla completa, tienda pública con identidad propia, páginas de logística para conductores y capacidades PWA/offline. La app usa React 18, Vite, React Router, TanStack Query, Zustand, Axios, CSS Modules y componentes reutilizables.

La principal oportunidad no es agregar más pantallas: es convertir la cobertura funcional en una experiencia coherente y predecible. El frontend contiene **94 archivos de páginas, 214 archivos bajo features y 104 CSS Modules** en la revisión de archivos. La escala multiplica el costo de mantener navegación, formularios, tablas, estados y responsive de forma consistente. Conviene abordar el rediseño como una renovación por superficies y patrones compartidos, no como una capa de estilos aislada.

### Lectura general

| Área | Evaluación estática | Lectura |
|---|---|---|
| Cobertura funcional | Alta | Catálogo, inventario, compras, ventas, caja, finanzas, reportes, configuración, tienda y POS están representados en rutas/código. |
| Organización técnica | Buena base | Carga diferida por rutas, separación por features, guards y módulos de UI; hay que sostener convenciones comunes. |
| UX operativa | Mixta | Hay herramientas específicas de operación (búsqueda global, POS, filtros, drawers); la navegación profunda y la densidad hacen importante revisar descubribilidad y consistencia. |
| Lenguaje visual | Inconsistente / en transición | Los tokens describen una estética, pero persisten utilidades globales de otra etapa y múltiples hojas de estilo locales. |
| Responsive | Parcialmente previsto | Hay breakpoints y navegación móvil; el POS, tablas densas, formularios largos y drawers requieren validación por dispositivo. |
| Accesibilidad | Parcialmente prevista | Se observan skip links, etiquetas y respeto a movimiento reducido en algunos niveles; no se acredita cobertura uniforme de teclado, foco, contraste o semántica. |
| Rendimiento percibido | Buenas decisiones iniciales | Rutas lazy y caché de consultas. Falta medición real de bundles, render, carga de imágenes y tiempos en conexiones lentas. |

## Mapa funcional activo

La aplicación declara las rutas en [App.tsx](../frontend/src/App.tsx). En términos de producto, las superficies son:

1. **Acceso y configuración inicial:** login, setup, acceso denegado.
2. **Backoffice:** dashboard/reportes; catálogo y variantes; promociones, colecciones, listas de precio, etiquetas y scanner; inventario, movimientos, transferencias y reservas; compras, recepciones y proveedores; ventas, devoluciones y entregas; clientes, fidelización y gift cards; caja, cuentas corrientes, gastos, pagos y facturación; usuarios, roles, sucursales, depósitos, ubicaciones, registros de caja; integraciones, notificaciones, auditoría, backups, sincronización, perfil y ajustes.
3. **POS:** ruta protegida `/pos`, fuera del shell administrativo, con carrito, checkout, medios de pago, QR, redenciones, impresión y componentes offline dedicados.
4. **Tienda pública:** `/store/*` en el dominio admin y rutas raíz cuando se detecta dominio de tienda. Incluye catálogo, detalle, carrito, checkout y estados, login, perfil, pedidos.
5. **Entregas públicas:** seguimiento, vista del conductor y comprobante.

El árbol de rutas usa `RequireAuth`, `RequireGuest` y `RequirePermission`. Esto estructura la experiencia, aunque los guards visuales por sí solos no sustituyen autorización de API. El backoffice usa `AdminLayout`; POS tiene superficie propia; la tienda tiene `StorefrontLayout` y autenticación/estado de carrito separados.

## Funcionamiento: fortalezas y temas a verificar

### Fortalezas observables

- `React.lazy` divide la mayoría de las páginas por ruta, reduciendo la carga inicial potencial.
- TanStack Query centraliza carga y caché; Zustand mantiene estado local para sesión, tema, sidebar, carrito y cola offline.
- El cliente HTTP tiene un punto central y la app monta un motor de sincronización global; también hay indicador de estado offline y actualización PWA con confirmación.
- Hay componentes compartidos para botones, tablas, formularios, drawers, modales, paginación, errores y skeletons.
- El catálogo dispone de varias representaciones y acciones masivas, útiles para tareas distintas; debe revisarse si la elección es clara y si todas mantienen paridad funcional.
- La tienda restaura posición de scroll al volver al catálogo y contempla el teclado virtual mediante `visualViewport`.

### Riesgos o incertidumbres a revisar en prototipo

- **Estados de red:** verificar en cada listado/formulario carga inicial, actualización, vacío, error recuperable, permiso insuficiente, mutación en curso y éxito. La existencia de `EmptyState`, `ApiErrorDisplay` o skeletons no garantiza uso consistente.
- **Acciones y feedback:** comprobar que operaciones de impacto (eliminar, ajuste, devolución, cierre de caja, facturación, actualización masiva) explican consecuencias, permiten corregir errores y dan confirmación contextual.
- **Actualización y offline:** probar reconexión, reintento, conflicto, operación duplicada y banner de versión mientras una operación está en curso; son caminos críticos de POS.
- **Sesión y salida:** comprobar expiración, retorno a ruta original tras login, errores de sesión y diferencias entre sesión ERP y tienda.
- **Navegación:** confirmar cómo se llega a cada módulo con permisos parciales, enlaces directos, refresh en subrutas, regreso desde drawer/modal y navegación móvil.
- **Datos de Argentina:** auditar formatos homogéneos de moneda, fecha, zona horaria, CUIT, teléfono y estados fiscales a través de listados, comprobantes y exportaciones.

## UX/UI y diseño

### Backoffice

La composición actual combina sidebar colapsable, topbar con breadcrumbs/búsqueda/contexto de caja y contenido con scroll independiente. El patrón es apropiado para ERP denso, pero la cantidad de módulos y niveles requiere reducir la carga de orientación: nombres inequívocos, agrupaciones estables, estado activo evidente, búsqueda tolerante a sinónimos y atajos descubribles. El menú contraído expone submódulos en un flyout activado por hover; debe validarse que sea igual de operable con teclado y touch.

El dashboard organiza métricas y tareas pendientes, con filtros y pestañas para ventas, stock, compras y caja. Conviene priorizar acciones que llevan a resolver alertas y permitir entender período, sucursal, actualización y origen de cada cifra sin ambigüedad.

### Formularios y tareas complejas

El repositorio usa muchos drawers y modales para creación, detalle y edición. Son eficaces para tareas cortas y contexto de lista, pero pueden sobrecargar operaciones largas o formularios con dependencias. Rediseñar con reglas explícitas: página para procesos secuenciales largos, drawer para edición contextual breve y modal para decisión puntual. Estandarizar encabezado, ancho, pie fijo, validación junto al campo, guardado/cancelación, cambios sin guardar y navegación por teclado.

### POS

POS es una superficie crítica, separada del menú y con componentes dedicados. La revisión debe tratarlo como flujo de caja en tiempo real, no como una página de administración: lectura rápida, foco de scanner/búsqueda, estados de turno y red, prevención de errores, edición de cantidades, descuentos sujetos a permiso, pago mixto/QR, resultado de checkout, impresión y recuperación offline. Validar teclado, resolución táctil, modo de alto contraste y rendimiento en hardware de tienda.

### Storefront

La tienda usa un sistema editorial único, con color primario configurable, cabecera, búsqueda, cuenta, carrito y footer. Las rutas públicas están separadas del ERP y usan sus stores propios. Las prioridades son móvil primero, calidad/consistencia de imágenes, filtros y búsqueda, variantes/talles, disponibilidad, precio total y claridad de envío/pago/devolución durante checkout. La búsqueda plegable y el sticky behavior necesitan prueba en pantallas pequeñas y con teclado virtual.

### Sistema visual

`tokens.css` define superficies, texto, bordes, acento índigo, estados y modo oscuro; `index.css` vuelve a declarar fuente y geometría, y conserva conceptos/clases de una etapa anterior como `spatial-workspace`, `glass-*`, orbes animados y estilos genéricos. Además, las páginas y features tienen muchas hojas CSS Module independientes. Esto aumenta la probabilidad de divergencias de espaciado, controles, foco, estados, sombras, radios y breakpoints.

La carga tipográfica tiene tres pares/familias declarados: DM Sans e IBM Plex Mono en `index.html`, Inter y JetBrains Mono vía `fontsource` en `main.tsx`, y otra solicitud Inter/JetBrains Mono en `index.css`. El token global usa Inter. Consolidar la fuente efectiva y eliminar solicitudes duplicadas/no usadas; medir el efecto en carga y cambios de métricas de texto. Las clases `glass-*` ya son superficies sólidas, por lo que sus nombres no describen el resultado visual actual. No hace falta conservar terminología legacy en un sistema renovado.

## Accesibilidad y responsive: auditoría estática

Hay señales positivas: el storefront implementa enlace para saltar al contenido; varios controles tienen `aria-label`/`aria-expanded`; campos compartidos conectan errores con `aria-describedby`; existe `prefers-reduced-motion`; el contenido admin tiene `main` enfocable. La cobertura vista es desigual y requiere medición.

Hallazgos estáticos que conviene tratar como **prioridad alta para verificación**, sin afirmar incumplimiento completo antes de probar el árbol de accesibilidad:

- `SidebarGroupItem.tsx`: en modo colapsado el botón del grupo no tiene `onClick`; los submódulos se exponen mediante el flyout de `Sidebar.tsx`, abierto por `onMouseEnter`. Esto deja la navegación hija dependiente de hover para teclado/touch. Hacer el flyout activable por foco/click o mantener un camino equivalente.
- `index.css` aplica `outline: none` global a controles; algunos componentes restauran `:focus-visible`, pero no es una garantía global. Auditar por control, empezando por `Modal.module.css` (botón cerrar con estilo hover, sin regla de foco visible en esa hoja) y filtros compartidos que también quitan outline.
- `Drawer.tsx` enfoca el botón cerrar y escucha Escape; validar ciclo/contención de foco, foco de retorno y aislamiento del contenido de fondo. En la lectura estática no aparece un mecanismo de focus trap.
- La app tiene navegación móvil y targets de 44 px en varios controles; la skill recomienda comprobar tabla en scroll/card, overlays fijos y viewport móvil, no asumir que el breakpoint por sí solo resuelve desbordamientos.

Checklist para la fase visual/QA:

- Recorrer todas las tareas solo con teclado: orden de tabulación, foco visible, Escape, retorno de foco tras cerrar overlays y activación de navegación colapsada.
- Revisar roles y estados de tabs, acordeones, menús, diálogos, tablas interactivas, toasts y anuncios de sincronización.
- Comprobar etiquetas persistentes (no solo placeholder), mensajes de validación asociados, lectura de errores y anuncios de cambios asíncronos.
- Medir contraste en tokens y estados; no inferir conformidad WCAG por comentario de CSS.
- Probar zoom 200%, ancho 320 px, tablet, touch targets, scroll horizontal de tablas y ventanas bajas.
- Revisar animaciones de carga/transición junto a preferencia de movimiento reducido.

El shell admin fija el workspace a `100vw` y `100dvh`, oculta overflow exterior y mantiene scroll en el área de contenido. Es coherente para escritorio de trabajo, pero puede amplificar problemas de viewport virtual, zoom y teclado móvil; validar antes de conservar ese esquema.

## Rendimiento y calidad técnica

**A favor:** code splitting por página, caché de consultas y PWA; la tienda usa imágenes progresivas y restauración de scroll.  
**A medir:** bundle inicial y por ruta, dependencias duplicadas, imágenes grandes, cascadas de consultas, renders en tablas largas, animaciones, Core Web Vitals, cargas con red lenta y memoria en sesiones extensas. No se deben afirmar mejoras o regresiones sin profiling.

**Mantenibilidad:** la separación por `features` ayuda, aunque la escala de páginas/CSS invita a crear contratos visuales y patrones antes de multiplicar excepciones. La presencia visible de numerosos `as any` en UI y wrappers puede esconder desacuerdos entre contrato y presentación; priorizar la revisión de tipos en las tareas que se rediseñen.

## Prioridades recomendadas para el rediseño

### P0 — Definir base y medir

1. Inventariar usuarios/tareas principales por rol y frecuencia; mapear pasos, errores y tiempo actual en POS, catálogo/stock, compras/recepción, venta/devolución, caja y despacho.
2. Capturar pantallas actuales por viewport y definir una línea base de accesibilidad, rendimiento y responsive.
3. Acordar dirección visual de ERP y storefront como productos relacionados, con tokens compartidos y densidad adecuada a cada contexto.

### P1 — Sistema de diseño operativo

4. Consolidar tokens de color semántico, tipografía, escala de espaciado, radio, elevación, foco, movimiento y breakpoints; definir variantes claro/oscuro.
5. Normalizar primitives: botón, campo, selección, tabla, filtros, pestañas, badge/estado, alertas, skeleton/vacío/error, confirmación, modal/drawer y paginación.
6. Publicar especificaciones de estados y accesibilidad de cada primitive y ejemplos de composición de una página/listado/formulario.

### P2 — Rediseño por flujo y valor

7. Empezar por **POS** y **catálogo/inventario** (frecuencia e impacto operativo), luego dashboard, compras/recepción, ventas/entregas y caja/finanzas.
8. Rediseñar storefront como flujo comercial móvil completo: catálogo → detalle/variante → carrito → checkout → seguimiento.
9. Continuar con configuración, integraciones y módulos de menor frecuencia usando los patrones ya probados.

### P3 — Consolidar y verificar

10. Eliminar estilos/utilidades obsoletos al migrar consumidores, evitando una reescritura big bang.
11. Criterios de aceptación por página: responsive, teclado, foco, estados de consulta/mutación, permisos, formatos locales y navegación directa.
12. Mantener pruebas de flujo de alto valor y revisar bundle/telemetría visual al incorporar cada grupo.

## Secuencia sugerida de trabajo

1. Acordar primero usuarios objetivo, problema principal y dirección visual, usando este informe como mapa.
2. Hacer un taller corto de tareas y revisar las pantallas reales en navegador; ajustar prioridades con evidencia.
3. Crear tokens, primitives y prototipos de los tres flujos de referencia: POS, listado/formulario de catálogo e inicio/checkout de tienda.
4. Validar con usuarios de tienda/administración y con teclado, touch, viewport móvil y escritorio.
5. Migrar por módulos manteniendo compatibilidad de rutas, contratos y capacidades offline.

## Revalidación con `ui-ux-pro-max`

Se ejecutó la búsqueda `--design-system` para “retail ERP operations dashboard dense data”, más búsquedas de UX para checkout POS, tienda móvil, foco/teclado y tablas responsive, además de una búsqueda de stack React. La salida recomienda un estilo **Data-Dense Dashboard**, baja intensidad de movimiento, densidad alta, contraste, teclado y foco visible; la recomendación React confirma el uso de carga diferida por ruta ya presente en el proyecto.

La misma salida incluye una plantilla “Enterprise Gateway” con hero, logos y CTA comercial. Es una sugerencia para sitio de marketing, por lo que no la trasladé al backoffice. Para la tienda pública tomé las pautas pertinentes (mobile-first, tipos de teclado apropiados, manejo responsive de tablas y flujos de checkout); la dirección editorial existente debe validarse con objetivos de marca propios, no sustituirse automáticamente por una receta genérica de ecommerce.

La búsqueda UX de POS refuerza la necesidad de recuperación clara de errores, errores de formulario junto al campo y navegables desde un resumen, anuncios accesibles y teclado completo. La búsqueda de tablas resalta overflow oculto y tablas anchas como riesgo responsive. Estos puntos se reflejan arriba como criterios de revisión, no como fallos de runtime ya reproducidos.

### Ajustes aplicados a la versión anterior

- Se precisó la carga de fuentes: DM Sans, IBM Plex Mono, Inter y JetBrains Mono aparecen en fuentes distintas; Inter/JetBrains se declaran dos veces.
- Se elevó el menú colapsado con flyout por hover y la ausencia de garantía global de foco visible a hallazgos concretos para validar.
- Se añadió validación específica del foco inicial/retorno y contención de foco en drawers.
- Se corrigió “costos” por “precio total” en la lista de prioridades comerciales.
- Se acotó la recomendación de estilo de la skill al panel operativo; se descartaron elementos de landing/marketing que no corresponden a un ERP.

Las búsquedas son heurísticas de la skill, no una auditoría automatizada ni evidencia de conformidad WCAG. No se ejecutó el sitio ni se inspeccionó el resultado en navegador en esta revalidación.

## Referencias de código

- Rutas y guards: `frontend/src/App.tsx`, `frontend/src/rbac/`, `frontend/src/navigation/`.
- Shell admin: `frontend/src/components/layout/AdminLayout.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `MobileNav.tsx`.
- Sistema global: `frontend/src/styles/tokens.css`, `frontend/src/index.css`.
- Operación: `frontend/src/pages/pos/POSPage.tsx`, `frontend/src/pages/admin/ReportsPage.tsx`, `CatalogPage.tsx`.
- Tienda: `frontend/src/layouts/StorefrontLayout.tsx`, `frontend/src/pages/storefront/`.
- Offline/PWA: `frontend/src/hooks/useSyncEngine.ts`, `frontend/src/features/offline/`, `frontend/vite.config.ts`.

---

Este documento sirve como base de planificación del rediseño; no es una certificación de accesibilidad, rendimiento ni funcionamiento end-to-end.
