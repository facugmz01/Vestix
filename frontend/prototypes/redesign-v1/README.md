# Vestix redesign prototype · v1

Prototype navigable de las superficies operativas prioritarias propuestas para el rediseño:

- Inicio / resumen de la jornada
- Catálogo de productos
- Inventario por variante, talle y color
- Ficha, alta y edición de producto
- Gestión de variantes / SKUs
- POS de pantalla completa
- Actividad reciente de ventas

Se construyó como HTML, CSS y JavaScript independiente. No importa React, layouts, componentes, stores ni hojas de estilo de la aplicación existente. La base visual sigue la dirección **Framed Sheet** generada para Vestix: marco gris frío, hoja blanca, bordes finos, IBM Plex Sans y IBM Plex Mono para identificadores y columnas numéricas. La matriz talle/color es el elemento distintivo del dominio.

## Abrir

Abrir `index.html` directamente o iniciar un servidor estático desde esta carpeta:

```powershell
python -m http.server 4178
```

Después visitar `http://localhost:4178`.

## Interacciones incluidas

- Navegar entre inicio, catálogo, inventario, ventas y POS.
- Buscar productos y filtrar estado/categoría.
- Cambiar la métrica del gráfico de ventas.
- Seleccionar talle, agregar artículos, modificar cantidades y vaciar el carrito.
- Revisar un cobro de muestra; no se registra ninguna venta ni se envía ningún pago.
- Abrir búsqueda global con `Ctrl/Cmd + K`, POS con `F9` y foco de búsqueda de POS con `F2`.
- Exportar como CSV la vista de catálogo de demostración.
- Buscar y filtrar catálogo por texto, categoría, estado y nivel de stock; abrir ficha consolidada y cambiar publicación, duplicar o archivar una copia de muestra.
- Crear y editar fichas con secciones General, Precios y Variantes; elegir tipo simple, variable o combo, generar combinaciones de talle/SKU, armar una receta, configurar publicación y stock inicial.
- Abrir la gestión de SKUs desde la ficha, con atributos, código, costo y estado como patrón de tabla.
- Abrir el detalle de stock por talle desde la matriz y previsualizar ajustes locales con motivo y movimientos de ejemplo.
- Importar CSV muestra la etapa de validación previa; la actualización masiva de precios conserva el patrón de filtros y vista previa.

Los importes, personas, operaciones y existencias de `data/demo-data.js` son **datos sintéticos para maqueta**. Los cambios de productos y stock viven solo en memoria del navegador y se descartan al recargar. El archivo deriva totales de las líneas y contiene aserciones de consistencia; reemplazarlos por datos reales antes de conectar una API.

## Alcance visual

Las pantallas de compras, finanzas, reportes y configuración aparecen como destinos siguientes, pero no son maquetas de alta fidelidad en esta versión. El storefront público queda fuera de este prototipo inicial para mantener una dirección editorial separada del ERP.
