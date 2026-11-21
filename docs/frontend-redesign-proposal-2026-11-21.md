# Propuesta de rediseño y evolución funcional del frontend Vestix

**Fecha:** 21 de noviembre de 2026  
**Base:** [Auditoría del frontend](frontend-audit-2026-11-21.md), rutas actuales de `frontend/src/App.tsx` y recomendaciones pertinentes de `ui-ux-pro-max`.  
**Estado:** propuesta para priorización y prototipado; no implica cambios de código ni redefine contratos backend.

## 1. Visión

Convertir Vestix en una herramienta de trabajo rápida y confiable para el comercio minorista de indumentaria: cada rol ve primero lo que necesita resolver, los datos se entienden en contexto y las operaciones críticas guían al usuario antes de confirmar cambios.

La renovación abarca cuatro superficies relacionadas, con densidad y prioridades propias:

- **Backoffice:** control y administración de la operación, optimizado para escritorio y tablet.
- **POS:** venta continua con teclado, scanner y touch; tolerante a interrupciones de red.
- **Storefront:** experiencia editorial móvil para descubrir y comprar.
- **Conductor y seguimiento público:** pasos claros y utilizables en teléfono, con captura de evidencia cuando corresponda.

La recomendación de la skill para un **Data-Dense Dashboard** encaja con el ERP. La plantilla de portal empresarial con hero, logos y CTA de ventas no aplica al panel interno. La tienda conserva una dirección editorial propia; debe compartir reglas de calidad y accesibilidad, no necesariamente la misma composición que el backoffice.

## 2. Resultados que buscamos

1. **Menos tiempo por tarea frecuente:** encontrar un producto, cobrar una venta, ajustar stock, recepcionar una compra o ubicar una entrega.
2. **Menos errores operativos:** explicar consecuencias, validar temprano, pedir confirmación cuando el impacto lo justifica y facilitar recuperación.
3. **Más contexto, menos navegación:** mostrar sucursal, depósito, turno, estado, fecha de actualización y acciones siguientes en el lugar de trabajo.
4. **Comportamiento consistente:** compartir patrones para tablas, filtros, formularios, estados y overlays en los módulos de administración.
5. **Uso accesible y adaptable:** navegación por teclado, foco visible, touch targets razonables, responsive y soporte de movimiento reducido.
6. **Continuidad durante cortes:** comunicar conectividad, cola pendiente y resultado de sincronización sin poner en riesgo una venta.

## 3. Principios de diseño

- **Acción antes que decoración.** Cada pantalla destaca una tarea primaria; las acciones peligrosas requieren contexto explícito.
- **Densidad controlada.** Alta densidad para listados, reportes y caja; más espacio para edición y compra pública.
- **La variante es central.** Talle, color, SKU, depósito y sucursal no se esconden dentro de un modelo genérico de producto.
- **Estado siempre visible.** Carga, vacío, error, falta de permiso, guardado, desconexión y sincronización tienen respuestas distinguibles.
- **Sin sorpresas de navegación.** Enlace directo, breadcrumbs claros, volver predecible y overlays que conservan el contexto.
- **Accesibilidad por patrón.** Los componentes nacen con nombre accesible, teclado, foco, errores asociados y estados semánticos.
- **Progresivo y medible.** Migración por superficie, conservando capacidades y verificando cada flujo antes de extender patrones.

## 4. Dirección visual propuesta

### Backoffice y POS

Usar una estética de consola operativa sobria, basada en superficies neutras, tablas legibles, jerarquía tipográfica contenida y color reservado para estados y acciones. Como hipótesis inicial a validar con marca y usuarios:

- Primario azul profundo cercano a `#1E40AF` para navegación/acción principal.
- Azul medio para estados informativos y selección.
- Ámbar para avisos y acciones que merecen atención, sin usarlo como color de texto pequeño sobre fondo blanco.
- Rojo solo para error/destructivo; verde para resultado confirmado. Siempre acompañar color con etiqueta o icono.
- Modo claro y oscuro definidos como pares semánticos, comprobados por contraste en ambos.
- Variación visual baja y movimiento sutil. Usar transiciones para mostrar apertura, selección o progreso; no animar para decorar.
- Escala de densidad alta en tablas/dashboard, estándar en formularios y generosa en checkout público.

Los valores son un punto de partida, no una identidad aprobada. Antes de fijarlos, revisar logo, colores existentes, preferencias de clientes y legibilidad en monitores de tienda.

### Storefront

Conservar la base editorial actual y mejorar legibilidad de precios, jerarquía de imagen, selección de variantes, envío y checkout. Aplicar tokens específicos de tienda desde configuración, contrastados sobre cada color primario permitido. No mezclar adornos del storefront dentro de POS o reportes.

### Sistema compartido

Definir tokens semánticos para fondo, superficie, texto, borde, foco, acción, selección, éxito, aviso y error; además de escalas de espacio, tipografía, tamaño de control, radios, elevación, movimiento y breakpoints. Los componentes deben usar tokens en lugar de colores aislados. Consolidar la carga actual de DM Sans/IBM Plex Mono/Inter/JetBrains Mono y servir una sola familia efectiva por rol tipográfico, con fallback local.

## 5. Experiencia objetivo por superficie

### A. Shell del backoffice

**Estructura propuesta**

- Sidebar agrupado por trabajo: **Inicio**, **Ventas**, **Catálogo**, **Inventario**, **Compras**, **Finanzas**, **Reportes**, **Administración**.
- Entrada visible al POS, con estado del turno si existe.
- Topbar con breadcrumb, selector/indicador de sucursal cuando aplique, búsqueda global, sincronización/conectividad y menú de perfil.
- Contenido con título, resumen breve, acción primaria, filtros y área de resultados.
- Navegación móvil mediante drawer accesible y una barra inferior pequeña con destinos de uso frecuente según permiso.

**Cambios de interacción**

- Reemplazar el flyout que depende de hover en sidebar contraído por disclosure accesible a click, Enter/Espacio y foco; conservar etiquetas y subrutas disponibles en touch.
- Añadir búsqueda global con `Ctrl/Cmd + K`, foco inicial, resultados agrupados por entidad y rutas, últimos destinos y cierre/retorno de foco correctos.
- Mantener filtros importantes en URL para compartir enlaces y recuperar vistas tras refresh.
- Incorporar ayuda contextual y atajos cerca de la acción; evitar que la navegación dependa de conocer códigos internos.

### B. Inicio: “Mi jornada”

Reemplazar una portada genérica por un panel configurable por rol, con filtros visibles de sucursal y período.

- Resumen superior: ventas, pedidos, caja/turno y stock crítico relevantes al rol.
- Cola de trabajo accionable: preparar pedidos, recepcionar, reponer, revisar pagos o resolver sincronización.
- Paneles de tendencia con período, unidades, comparación y fecha de actualización.
- Accesos directos a tareas frecuentes, respetando permisos.
- Estados vacíos que sugieren el siguiente paso (por ejemplo, completar configuración) solo si el backend confirma que aplica.

**Funcionalidad a evaluar:** reordenar/ocultar paneles y guardar rango/sucursal por usuario. Validar costo y disponibilidad antes de sumar personalización persistida.

### C. Catálogo y variantes

Convertir el catálogo en un espacio de gestión único, manteniendo vista de tabla y tarjetas donde aporten valor.

- Barra de búsqueda por nombre, SKU o código de barras, filtros combinables y chips removibles.
- Columnas configurables de uso frecuente: producto, estado, variantes, stock total, precio, categoría y última actualización.
- Selección múltiple con barra contextual para activar/publicar, actualizar precio, exportar o archivar según permisos.
- Fila expandible o detalle lateral para lectura rápida; página dedicada para edición compleja.
- Matriz de variantes por talle/color con SKU, barcode, precio y stock por depósito; los campos no aplicables deben quedar claros.
- En edición: secciones ordenadas (identidad, media, variantes, precio, canales y estado), validación por campo, guardado con cambios pendientes y salida protegida.

**Funcionalidad nueva a validar:** presets de columnas/filtros por rol y guardado de vistas. Confirmar APIs de filtros, selección masiva y mutaciones antes de prometer disponibilidad.

### D. Inventario y movimientos

- Vista resumen por sucursal/depósito con umbral de reposición, reservado, disponible y en tránsito separados.
- Filtros por producto/variante, ubicación, estado y movimiento.
- Flujo guiado para ajuste, transferencia, recepción y conteo: origen/destino, líneas, revisión final y confirmación.
- Mostrar historial y relación entre movimiento, documento y usuario; la reversión debe depender de reglas del dominio y permisos, no de un botón genérico.
- Permitir escaneo desde móvil cuando el dispositivo lo soporte y proveer alternativa de búsqueda manual.

**Funcionalidad a validar en API:** conteo cíclico con borrador, carga/importación de conteo y sugerencias de reposición basadas en ventas/plazo del proveedor.

### E. Ventas, pedidos y devoluciones

- Centro de ventas con búsqueda por número, cliente, fecha y estado; filtros guardables.
- Detalle con total, pagos, ítems/variantes, cliente, sucursal, estado fiscal y una cronología unificada de eventos.
- Acciones disponibles junto a cada paso permitido: cobrar saldo, emitir factura, preparar, despachar, cancelar o devolver.
- Devolución guiada por líneas y cantidades, condición del producto, motivo y destino del reembolso/crédito; resumen previo a confirmar.
- Para fulfillment: separar pedidos por preparar, listos, enviados y con incidencia; exponer transportista y seguimiento.

**Funcionalidad nueva a evaluar:** bandeja común de excepciones (pago pendiente, error fiscal, stock insuficiente, entrega demorada), con acceso a la acción correctiva. Reutilizar estados backend; no duplicar máquinas de estado solo en UI.

### F. Compras y recepción

- Lista de órdenes con proveedor, total, estado de recepción y pagos.
- Crear compra como pasos breves: proveedor, productos, cantidades/precios, costos adicionales si corresponden, revisión y envío.
- Recepcionar contra orden, permitir cantidades parciales, mostrar diferencias y mantener trazabilidad de lo recibido.
- Mostrar deuda, pagos y documentos del proveedor en el mismo contexto sin mezclar acciones financieras incompatibles.

**Funcionalidad a validar:** sugerencia de reposición a partir de stock mínimo, ventas y plazo. Mantener explícita la aprobación humana antes de generar o enviar órdenes.

### G. Finanzas y caja

- Vista de trabajo por cuenta/turno: saldo, movimientos recientes, ingresos/egresos y filtros.
- Cierre de turno en revisión previa con diferencias, totales por medio de pago y observaciones antes de confirmar.
- Estado de factura claramente separado del estado de venta, con próximo paso y error fiscal legible.
- Formularios cortos para gasto/pago con beneficiario, cuenta, importe, fecha y comprobante asociados.
- Fechas y moneda ARS uniformes; indicar zona horaria cuando una operación dependa de hora exacta.

La propuesta no altera contabilidad ni circuitos de autorización. Cada pantalla debe representar los estados y permisos vigentes del backend.

### H. POS

El POS se diseña como herramienta de uso repetitivo, con una mano o teclado, en monitor/touch de tienda.

- **Cabecera compacta:** sucursal, cajero, caja/turno y estado de red/sincronización.
- **Área de venta:** búsqueda con foco recuperable, lectura de código, resultados con variantes/stock y favoritos configurables.
- **Carrito persistente:** ítems, variante, cantidad, precio, descuento autorizado, subtotal y total; edición/remoción comprensible.
- **Cobro:** métodos claros, pago mixto, monto recibido/cambio, QR cuando corresponda, validación y confirmación final.
- **Después del cobro:** resultado inequívoco, opción de imprimir/compartir comprobante y acceso a la venta recién creada.
- **Offline:** distinguir disponible para vender, esperando sincronización, conflicto y error; ID/referencia local visible para soporte. No borrar la cola por actualización o cierre accidental.
- **Teclado:** atajos visibles y configurables, con alternativa de botones y sin robar atajos del navegador/sistema.

**Prototipo prioritario:** venta simple, venta con variante, pago mixto, QR, error/timeout, modo sin conexión y reintento idempotente. El rediseño debe respetar el turno abierto y permisos existentes.

### I. Storefront

- Catálogo móvil con búsqueda, categorías/filtros claros y estado de resultados; conservar posición al volver de detalle.
- Ficha de producto enfocada en imagen, precio/promoción, guía de talles, disponibilidad y selección de variante antes de agregar.
- Carrito editable y resumen con precio, descuentos, envío y total a pagar.
- Checkout por bloques: contacto, entrega, pago y confirmación, reutilizando datos ya ingresados y conservando errores inline.
- Estados de pago aprobado/pendiente/rechazado con próximos pasos y navegación segura a pedido/seguimiento.
- Formularios con `autocomplete`, `inputmode` adecuado, ayudas para direcciones/teléfono y botones de 44 px o más cuando sea posible.

**Funcionalidad a validar:** filtros combinados persistidos en URL, guía de talles por marca/categoría, estimación de envío previa al checkout y wishlist. Priorizar según impacto comercial y APIs disponibles.

### J. Conductor y seguimiento

- Vista móvil de tareas por parada, estado actual, dirección y datos mínimos del pedido.
- Acciones grandes: iniciar navegación, marcar estado, registrar incidencia y adjuntar comprobante/foto si está permitido.
- Guardado local explícito cuando no hay red y confirmación posterior de sincronización.
- Tracking público con progreso entendible y privacidad de datos del cliente.

## 6. Patrones transversales

### Listados

- Encabezado con propósito, conteo, acción primaria y filtros activos.
- Filtros aplicables/resetables, búsqueda con debounce, paginación explícita y estado vacío orientado a acción.
- Tablas con cabeceras semánticas, columnas esenciales primero, selección masiva y alternativa móvil. No esconder información crítica con `overflow: hidden`.
- Skeleton solo cuando la espera lo justifique; conservar el layout para evitar saltos.

### Formularios

- Etiqueta persistente, tipo de campo/inputmode correcto, ayuda y requerido explícitos.
- Error específico junto al campo y `aria-describedby`; ante submit fallido, resumen enfocabe con enlaces a campos inválidos cuando el formulario lo amerite.
- Botón muestra progreso y evita doble envío; error recuperable explica qué hacer y conserva los datos.
- Confirmar cambios destructivos o financieros con una síntesis clara, no una alerta genérica.
- Distinguir modal (decisión breve), drawer (edición contextual) y página (proceso largo).

### Diálogos y foco

- Nombre/rol accesible, Escape cuando no haya una operación irreversible en progreso, foco inicial intencional, contención de tabulación y foco devuelto al disparador.
- Overlay no debe ocultar el control enfocado ni recortar contenido en ventana baja.

### Métricas, gráficos y estados

- KPIs incluyen unidad/período/comparación cuando corresponda.
- Gráficos con título, ejes/unidad, leyenda y resumen textual; color no es la única señal.
- Error de datos con reintento; vacío con explicación; timestamp visible en información que cambia durante la jornada.

## 7. Funcionalidad: priorizar frente a mantener

| Tipo | Propuesta | Dependencia / decisión |
|---|---|---|
| Mejora de UX | Sidebar accesible, búsqueda/atajos, filtros persistidos, estados claros, mejores flujos de edición | UI; revisar compatibilidad de rutas y permisos |
| Mejora de operación | Acciones por estado, bandeja de excepciones, resumen previo en ajustes/cierres/devoluciones | Confirmar que APIs exponen estados y mutaciones requeridos |
| Mejora de productividad | Columnas/vistas guardadas y dashboard por rol | Decidir persistencia local o backend; validar alcance multiusuario |
| Mejora POS | Atajos, recuperación de error, estado offline visible, checkout más corto | Conservar contratos, idempotencia, caja y cola actual |
| Nueva capacidad | Conteo cíclico, sugerencia de reposición, wishlist o guía de talles configurable | Requiere validar reglas de negocio, API, datos y costo de soporte |
| No cambiar con el rediseño visual | Reglas de precio, stock, contabilización, estados fiscales, permisos del servidor | Mantener backend como autoridad y diseñar contra sus contratos reales |

## 8. Hoja de ruta

### Fase 0 — Descubrimiento y baseline

- Observar tareas en un local y en administración; incluir distintos roles y volumen de trabajo.
- Capturar vistas actuales en escritorio, tablet y móvil; identificar atajos, periféricos, resoluciones y cortes de red habituales.
- Medir tiempo y errores en cinco flujos base: cobro POS, búsqueda/edición de producto, ajuste/transferencia, recepción de compra y devolución/cierre.
- Revisar contratos API y permisos para cada acción propuesta.

**Entregables:** mapa de tareas, baseline cuantitativo, criterios de accesibilidad y prototipo navegable.

### Fase 1 — Fundaciones visuales y shell

- Definir identidad/tokens, escala de densidad, temas, iconografía y capas/z-index.
- Rehacer primitives de formulario, botones, tablas, feedback, modal/drawer, estados y navegación.
- Resolver foco/teclado en shell y navegación contraída.

**Entregables:** librería de componentes, guía de composición y shell piloto con rutas actuales.

### Fase 2 — POS y catálogo/inventario

- Prototipar POS y validar con cajeros antes de migrar.
- Migrar catálogo, variantes, stock y acciones masivas usando el sistema común.
- Validar flujos online/offline y los permisos con la API.

**Entregables:** primeros módulos productivos, lista de regresión por rol y resultados comparados con baseline.

### Fase 3 — Ventas, compras, entregas y caja

- Unificar patrones de detalle, timeline, revisión previa, recepción parcial, devoluciones y cierre.
- Agregar bandeja de excepciones si los estados/backend lo permiten.

### Fase 4 — Storefront y módulos administrativos restantes

- Optimizar catálogo móvil, checkout y seguimiento; luego migrar configuración, integraciones, auditoría y módulos de menor frecuencia.
- Retirar CSS legacy una vez migrados sus consumidores y revisar rendimiento final.

## 9. Medición de éxito

Establecer valor inicial en fase 0 y comparar después de cada lanzamiento piloto:

- Mediana de tiempo y cantidad de pasos por tarea clave.
- Tasa de checkout completado, error de cobro, doble intento y operación offline pendiente/resuelta.
- Errores de picking/variante, diferencias de recepción y correcciones de stock.
- Porcentaje de tareas resueltas desde inicio/bandeja sin búsquedas repetidas.
- Abandono y conversión del storefront por etapa de checkout.
- Tareas completadas solo con teclado y defectos de foco/contraste/responsive.
- Bundle inicial, LCP/INP/CLS medidos en condiciones reales y carga de rutas más utilizadas.

No fijar objetivos numéricos hasta obtener baseline y confirmar instrumentación confiable.

## 10. Próximo paso recomendado

Hacer una sesión de definición visual con dos decisiones concretas: (1) confirmar identidad y densidad del backoffice, usando el azul/ámbar solo como hipótesis; (2) escoger el primer flujo de prototipo entre POS y catálogo/inventario. En paralelo, levantar baseline de tiempos y comprobar las APIs necesarias para las funciones nuevas.

Después, crear prototipos de escritorio POS, dashboard y catálogo móvil; probarlos con usuarios reales antes de convertirlos en componentes productivos.
