(() => {
  const data = window.VESTIX_DEMO;
  const productById = new Map(data.products.map((product) => [product.id, product]));
  const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const integer = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const appRoot = $('#appRoot');
  const posScreen = $('#posScreen');
  const liveRegion = $('#liveRegion');
  let currentScreen = 'home';
  let activeMetric = 'revenue';
  let activeCategory = 'all';
  let cart = [];
  let activeProduct = null;
  let generatedVariants = [];
  let comboRecipe = [];
  let activeStockProduct = null;

  const announce = (message) => { liveRegion.textContent = ''; requestAnimationFrame(() => { liveRegion.textContent = message; }); };
  const sum = (values) => values.reduce((total, value) => total + value, 0);

  function aggregateByHour(metric) {
    const labels = ['09', '10', '11', '12', '13', '14']; // taste-skill-ignore: these are clock hours, not decorative sequence numbers.
    const values = labels.map(() => 0);
    data.sales.forEach((sale) => {
      const index = Math.max(0, Math.min(labels.length - 1, Number(sale.at.slice(0, 2)) - 9));
      values[index] += metric === 'revenue' ? sale.total : metric === 'orders' ? 1 : sale.units;
    });
    return { labels: labels.map((hour) => `${hour}:00`), values };
  }

  function renderHome() {
    $('#tabRevenue').textContent = currency.format(data.todayRevenue);
    $('#tabOrders').textContent = integer.format(data.todayOrders);
    $('#tabUnits').textContent = integer.format(data.todayUnits);
    $('#queueCount').textContent = `${integer.format(data.queueCount)} abiertas`;
    $('#queueList').innerHTML = data.queue.map((task) => `
      <li>
        <button class="queue-row" type="button" data-screen="${task.screen}">
          <span class="queue-indicator ${task.tone === 'warn' ? 'queue-indicator-warn' : ''}"></span>
          <span class="queue-copy"><strong>${task.count} ${task.noun}</strong><small>${task.context}</small></span>
          <span class="queue-arrow" aria-hidden="true">→</span>
        </button>
      </li>`).join('');
    renderChart('revenue');
    const product = productById.get(data.sizeRunProductId);
    $('#homeSizeRun').innerHTML = product.sizes.map((size, index) => {
      const quantity = product.stock[index];
      const low = quantity <= data.lowStockThreshold;
      return `<div class="size-cell ${low ? 'is-low' : ''}"><span>${size}</span><strong class="num">${integer.format(quantity)}</strong><small>${low ? 'Revisar' : 'unid.'}</small></div>`;
    }).join('');
  }

  function renderChart(metric) {
    const points = aggregateByHour(metric);
    const labels = { revenue: 'Ventas', orders: 'Operaciones', units: 'Unidades' };
    $('#chartSubline').textContent = metric === 'revenue' ? 'Importe de ventas por hora · ARS' : `${labels[metric]} registradas por hora`;
    $('#salesChart').setAttribute('aria-label', `${labels[metric]} por hora, desde las 09:00 hasta las 16:00`);
    const format = metric === 'revenue' ? (value) => currency.format(value).replace(',00', '') : integer.format;
    window.Charts.line($('#salesChart'), {
      labels: points.labels,
      series: [{ name: labels[metric], values: points.values }],
      format,
      height: 164,
      min: 0,
    });
  }

  function renderCatalog() {
    const query = $('#productSearch').value.trim().toLocaleLowerCase('es-AR');
    const status = $('#catalogStatus').value;
    const category = $('#catalogCategory').value;
    const stock = $('#catalogStock').value;
    const visible = data.products.filter((product) => {
      const matchesText = [product.name, product.id, product.category, product.color].join(' ').toLocaleLowerCase('es-AR').includes(query);
      const matchesStock = stock === 'all' || (stock === 'available' && product.available > 0) || (stock === 'low' && product.lowSizes > 0) || (stock === 'empty' && product.available === 0);
      return matchesText && (status === 'all' || product.status === status) && (category === 'all' || product.category === category) && matchesStock;
    });
    $('#productCount').textContent = integer.format(visible.length);
    $('#variantCount').textContent = integer.format(visible.reduce((n, product) => n + product.variants, 0));
    $('#catalogRange').textContent = `${visible.length ? 1 : 0}–${visible.length} de ${visible.length} productos`;
    $('#catalogEmpty').hidden = visible.length > 0;
    $('#catalogTable').hidden = visible.length === 0;
    $('#catalogRows').innerHTML = visible.map((product) => `
      <tr data-product-row="${product.id}" tabindex="0" aria-selected="false">
        <td><div class="product-name-cell"><span class="swatch" style="--swatch:${product.swatch}"></span><span><button class="row-name" type="button" data-view-product="${product.id}">${product.name}</button><small>${product.id} · ${product.color}</small></span></div></td>
        <td>${product.category}</td><td>${product.variants}</td><td>${integer.format(product.available)} <span class="table-unit">unid.</span></td>
        <td class="numeric">${currency.format(product.price)}</td><td><span class="status-label ${product.status === 'Publicado' ? 'status-ok' : 'status-draft'}"><i></i>${product.status}</span></td><td><div class="product-row-actions"><button type="button" data-edit-product="${product.id}">Editar</button><button class="row-more" type="button" aria-label="Más acciones para ${product.name}" data-product-menu="${product.id}">···</button></div></td>
      </tr>`).join('');
  }

  function renderInventory() {
    const category = $('#inventoryCategory').value;
    const visible = data.products.filter((product) => category === 'all' || product.category === category);
    const lowCount = visible.reduce((count, product) => count + product.lowSizes, 0);
    $('#lowStockCount').textContent = integer.format(lowCount);
    $('#inventoryRows').innerHTML = visible.map((product) => {
      const sizes = ['XS', 'S', 'M', 'L', 'XL'];
      const cells = sizes.map((size) => {
        const index = product.sizes.indexOf(size);
        if (index < 0) return '<td class="unavailable" aria-label="No aplica">n/a</td>';
        const units = product.stock[index];
        const low = units <= data.lowStockThreshold;
        return `<td class="${low ? 'low-cell' : ''}"><button class="stock-cell-action" type="button" data-stock-open="${product.id}" data-stock-size="${size}" aria-label="Ver stock ${product.name} talle ${size}: ${units}"><span class="stock-value num">${integer.format(units)}</span>${low ? '<span class="low-label">Revisar</span>' : ''}</button></td>`;
      }).join('');
      return `<tr><th scope="row"><div class="product-name-cell"><span class="swatch" style="--swatch:${product.swatch}"></span><span><button class="row-name" type="button" data-view-product="${product.id}">${product.name}</button><small>${product.color}</small></span></div></th><td class="mono sku-cell">${product.id}</td>${cells}<td class="numeric total-cell">${integer.format(product.available)}</td></tr>`;
    }).join('');
  }

  function renderSales() {
    $('#salesRows').innerHTML = data.sales.map((sale) => `<tr><td class="mono">${sale.at}</td><td class="mono">${sale.id}</td><td>${sale.customer}</td><td>${sale.units} <span class="table-unit">unid.</span></td><td class="numeric">${currency.format(sale.total)}</td><td>${sale.method}</td><td><span class="status-label status-ok"><i></i>Confirmada</span></td></tr>`).join('');
  }

  function refreshDerivedProduct(product) {
    product.variants = product.sizes.length;
    product.available = product.stock.reduce((total, value) => total + Number(value || 0), 0);
    product.lowSizes = product.stock.filter((value) => value <= data.lowStockThreshold).length;
    data.variantCount = data.products.reduce((total, item) => total + item.variants, 0);
  }

  function showProductDetail(id) {
    activeProduct = productById.get(id);
    if (!activeProduct) return;
    $('#detailName').textContent = activeProduct.name;
    $('#detailContent').innerHTML = `<div class="detail-product-line"><span class="swatch" style="--swatch:${activeProduct.swatch}"></span><div><strong>${activeProduct.id}</strong><small>${activeProduct.category} · ${activeProduct.color}</small></div><span class="status-label ${activeProduct.status === 'Publicado' ? 'status-ok' : 'status-draft'}"><i></i>${activeProduct.status}</span></div><div class="detail-facts"><div><small>Precio base</small><strong>${currency.format(activeProduct.price)}</strong></div><div><small>Stock disponible</small><strong>${integer.format(activeProduct.available)} unid.</strong></div><div><small>SKUs / variantes</small><strong>${activeProduct.variants}</strong></div></div><h3>Disponibilidad por talle</h3><div class="detail-size-grid">${activeProduct.sizes.map((size, index) => `<button type="button" data-stock-open="${activeProduct.id}" data-stock-size="${size}"><small>${size}</small><strong>${activeProduct.stock[index]}</strong><span>${activeProduct.stock[index] <= data.lowStockThreshold ? 'Revisar' : 'disponibles'}</span></button>`).join('')}</div><p class="prototype-note">Ficha consolidada: identificadores, estado, precio y disponibilidad por variante.</p>`;
    $('#productDetailDialog').showModal();
  }

  function openProductEditor(product = null) {
    activeProduct = product;
    generatedVariants = [];
    comboRecipe = product?.recipe ? [...product.recipe] : [];
    const form = $('#productForm'); form.reset();
    $('#editorTitle').textContent = product ? `Editar · ${product.name}` : 'Nuevo producto';
    form.elements.name.value = product?.name || '';
    form.elements.namedItem('type').value = product?.type || 'VARIABLE';
    form.elements.id.value = product?.id || '';
    form.elements.category.value = product?.category || 'Remeras';
    form.elements.color.value = product?.color || '';
    form.elements.variantColor.value = product?.color || '';
    form.elements.variantSku.value = product?.id || '';
    form.elements.sizes.value = product?.sizes.join(', ') || '';
    form.elements.price.value = product?.price || '';
    form.elements.cost.value = product?.cost || '';
    form.elements.published.checked = (product?.status || 'Publicado') === 'Publicado';
    form.elements.active.checked = true;
    $('#editorVariantRows').innerHTML = product ? product.sizes.map((size, index) => `<tr><td>${product.color} / ${size}</td><td class="mono">${product.id}-${size}</td><td>Auto</td><td><input type="number" min="0" value="${product.stock[index]}" data-edit-stock="${index}"></td></tr>`).join('') : '<tr><td colspan="4" class="empty-inline">Ingresá talles y generá la matriz.</td></tr>';
    $('#variantBuildCount').textContent = product ? `${product.variants} variantes existentes` : 'Sin variantes nuevas';
    $('#comboRecipe').hidden = form.elements.namedItem('type').value !== 'COMBO';
    $('#initialStockWrap').hidden = form.elements.namedItem('type').value !== 'SINGLE';
    $('#comboLines').innerHTML = comboRecipe.map((line) => `<li>${line.qty} × ${line.name}</li>`).join('');
    $('#comboRecipe').hidden = form.elements.namedItem('type').value !== 'COMBO';
    $('#comboLines').innerHTML = comboRecipe.map((line) => `<li>${line.qty} × ${line.name}</li>`).join('');
    $$('[data-editor-tab]').forEach((tab, index) => { tab.setAttribute('aria-selected', String(index === 0)); });
    $$('[data-editor-pane]').forEach((pane) => { pane.hidden = pane.dataset.editorPane !== 'general'; });
    $('#productDetailDialog').close();
    $('#productEditorDialog').showModal();
  }

  function showStockAction(productId, size) {
    activeStockProduct = productById.get(productId);
    if (!activeStockProduct) return;
    const index = activeStockProduct.sizes.indexOf(size);
    const current = activeStockProduct.stock[index] || 0;
    $('#stockDialogSku').textContent = `${productId} · talle ${size}`;
    $('#stockDialogTitle').textContent = activeStockProduct.name;
    $('#stockActionContent').innerHTML = `<div class="detail-facts"><div><small>Depósito</small><strong>${data.warehouse}</strong></div><div><small>Físico</small><strong>${current} unid.</strong></div><div><small>Reservado</small><strong>0 unid.</strong></div><div><small>Disponible</small><strong>${current} unid.</strong></div></div><h3>Últimos movimientos de muestra</h3><div class="movement-list"><p><span>Venta POS · hoy 14:06</span><strong>−1</strong></p><p><span>Recepción · 19 nov.</span><strong>+6</strong></p></div>`;
    $('#stockActionForm').elements.quantity.value = current;
    $('#stockActionDialog').showModal();
  }

  function renderVariantManager(product) {
    activeProduct = product;
    $('#variantsTitle').textContent = `Variantes: ${product.name}`;
    $('#variantsSubtitle').textContent = `SKUs físicos · ${product.color} · ${product.variants} combinaciones`;
    $('#variantRows').innerHTML = product.sizes.map((size, index) => `<tr><td class="mono">${product.id}-${size}</td><td>${product.color}</td><td>${size}</td><td class="mono">Auto</td><td class="numeric">${currency.format(Math.round(product.price * .48))}</td><td><span class="status-label status-ok"><i></i>Activa</span></td><td><button type="button" class="text-link" data-stock-open="${product.id}" data-stock-size="${size}">Stock</button></td></tr>`).join('');
    switchScreen('variants');
  }

  function renderProducts() {
    const query = $('#posSearch').value.trim().toLocaleLowerCase('es-AR');
    const products = data.products.filter((product) => product.status === 'Publicado' && (activeCategory === 'all' || product.category === activeCategory) && [product.name, product.id, product.category, product.color].join(' ').toLocaleLowerCase('es-AR').includes(query));
    $('#posProductList').innerHTML = products.map((product) => {
      const sizeOptions = product.sizes.map((size, index) => `<option value="${size}" ${product.stock[index] <= 0 ? 'disabled' : ''}>${size}${product.stock[index] <= 0 ? ' · sin stock' : ''}</option>`).join('');
      return `<article class="pos-product"><div class="pos-product-swatch" style="--swatch:${product.swatch}"></div><div class="pos-product-copy"><strong>${product.name}</strong><span>${product.id} · ${product.color}</span><small>${currency.format(product.price)}</small></div><label class="size-select"><span class="sr-only">Talle para ${product.name}</span><select data-pos-size="${product.id}">${sizeOptions}</select></label><button class="add-product" type="button" data-add-product="${product.id}" aria-label="Agregar ${product.name}">+</button></article>`;
    }).join('');
    if (!products.length) $('#posProductList').innerHTML = '<p class="empty-inline">No encontramos productos con stock que coincidan.</p>';
  }

  function renderCart() {
    const count = sum(cart.map((item) => item.qty));
    const total = sum(cart.map((item) => productById.get(item.productId).price * item.qty));
    $('#cartItems').innerHTML = cart.map((item) => {
      const product = productById.get(item.productId);
      return `<div class="cart-line"><div class="cart-line-main"><strong>${product.name}</strong><span>${product.color} · Talle ${item.size}</span><small>${currency.format(product.price)} c/u</small></div><div class="quantity-control" aria-label="Cantidad de ${product.name}"><button type="button" data-qty-change="-1" data-product-id="${item.productId}" data-size="${item.size}" aria-label="Quitar una unidad">−</button><span class="num">${item.qty}</span><button type="button" data-qty-change="1" data-product-id="${item.productId}" data-size="${item.size}" aria-label="Agregar una unidad">+</button></div><strong class="cart-line-total num">${currency.format(product.price * item.qty)}</strong></div>`;
    }).join('');
    $('#cartEmpty').hidden = cart.length > 0;
    $('#cartItems').hidden = cart.length === 0;
    $('#cartSubtotal').textContent = currency.format(total);
    $('#cartTotal').textContent = currency.format(total);
    $('#reviewSale').disabled = cart.length === 0;
    $('#cartTitle').textContent = count ? `Carrito · ${count}` : 'Carrito';
  }

  function openPos() {
    if ($('#searchDialog').open) $('#searchDialog').close();
    appRoot.hidden = true;
    posScreen.hidden = false;
    document.body.classList.add('in-pos');
    renderProducts();
    $('#posSearch').focus({ preventScroll: true });
    announce('Terminal de venta abierta. Escribí para buscar o elegí un producto.');
  }

  function exitPos() {
    posScreen.hidden = true;
    appRoot.hidden = false;
    document.body.classList.remove('in-pos');
    switchScreen('home');
    $('#openNav').focus({ preventScroll: true });
  }

  function switchScreen(name) {
    if (name === 'pos') { openPos(); return; }
    if ($('#searchDialog').open) $('#searchDialog').close();
    currentScreen = name;
    posScreen.hidden = true;
    appRoot.hidden = false;
    document.body.classList.remove('in-pos');
    $$('.screen-view').forEach((view) => { view.hidden = view.dataset.view !== name; });
    $$('.nav-item').forEach((item) => {
      const active = item.dataset.screen === name;
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
    const label = $('.nav-item[data-screen="' + name + '"] span')?.textContent || (name === 'variants' ? 'Variantes' : 'Inicio');
    $('#crumbCurrent').textContent = label;
    $('#sidebar').classList.remove('open');
    $('#mobileBackdrop').hidden = true;
    $('#openNav').setAttribute('aria-expanded', 'false');
    $('#screenContent').scrollTop = 0;
    if (name === 'catalog') renderCatalog();
    if (name === 'inventory') renderInventory();
    if (name === 'sales') renderSales();
  }

  function updateReview() {
    const lines = cart.map((item) => {
      const product = productById.get(item.productId);
      return `<div><span>${item.qty} × ${product.name} · ${item.size}</span><strong class="num">${currency.format(item.qty * product.price)}</strong></div>`;
    }).join('');
    $('#saleReviewLines').innerHTML = lines || '<p class="empty-inline">No hay prendas en el carrito.</p>';
    $('#reviewTotal').textContent = currency.format(sum(cart.map((item) => productById.get(item.productId).price * item.qty)));
  }

  function addToCart(productId, size) {
    const product = productById.get(productId);
    if (!product || product.status !== 'Publicado') return;
    const stockIndex = product.sizes.indexOf(size);
    if (stockIndex < 0 || product.stock[stockIndex] <= 0) { announce(`No hay unidades disponibles de ${product.name}, talle ${size}.`); return; }
    const existing = cart.find((item) => item.productId === productId && item.size === size);
    if (existing) existing.qty += 1; else cart.push({ productId, size, qty: 1 });
    renderCart();
    announce(`${product.name}, talle ${size}, agregado al carrito.`);
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button');
    if (!target) return;
    if (target.dataset.close) { $('#' + target.dataset.close).close(); return; }
    if (target.dataset.viewProduct) { showProductDetail(target.dataset.viewProduct); return; }
    if (target.dataset.editProduct) { openProductEditor(productById.get(target.dataset.editProduct)); return; }
    if (target.dataset.productMenu) { showProductDetail(target.dataset.productMenu); return; }
    if (target.dataset.stockOpen) { showStockAction(target.dataset.stockOpen, target.dataset.stockSize); return; }
    if (target.dataset.editorTab) {
      $$('[data-editor-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === target)));
      $$('[data-editor-pane]').forEach((pane) => { pane.hidden = pane.dataset.editorPane !== target.dataset.editorTab; }); return;
    }
    if (target.dataset.markup) {
      const price = Number($('#productForm').elements.cost.value || 0) * (1 + Number(target.dataset.markup) / 100);
      if (price > 0) $('#productForm').elements.price.value = Math.ceil(price / 100) * 100;
      return;
    }
    if (target.id === 'chooseImages') { $('#imageFiles').click(); return; }
    if (target.id === 'buildVariantMatrix') {
      const form = $('#productForm');
      const sizes = form.elements.sizes.value.split(',').map((size) => size.trim()).filter(Boolean);
      const baseSku = form.elements.variantSku.value.trim() || form.elements.id.value.trim() || 'SKU';
      const color = form.elements.variantColor.value.trim() || 'Color';
      generatedVariants = sizes.map((size, index) => { const oldIndex = activeProduct?.sizes.indexOf(size) ?? -1; return { size, color, sku: `${baseSku}-${index + 1}`, stock: oldIndex >= 0 ? activeProduct.stock[oldIndex] : 0 }; });
      $('#variantBuildCount').textContent = `${generatedVariants.length} variantes generadas`;
      $('#editorVariantRows').innerHTML = generatedVariants.length ? generatedVariants.map((variant, index) => `<tr><td>${variant.color} / ${variant.size}</td><td><input value="${variant.sku}" data-generated-sku="${index}"></td><td><input placeholder="Autogenerar" aria-label="Código de barras para ${variant.sku}"></td><td><input type="number" min="0" value="${variant.stock}" data-generated-stock="${index}"></td></tr>`).join('') : '<tr><td colspan="4" class="empty-inline">Ingresá al menos un talle.</td></tr>';
      return;
    }
    if (target.id === 'addComboComponent') {
      const component = productById.get($('#comboComponent').value);
      if (component) comboRecipe.push({ productId: component.id, name: component.name, qty: Math.max(1, Number($('#comboQuantity').value || 1)) });
      $('#comboLines').innerHTML = comboRecipe.map((line) => `<li>${line.qty} × ${line.name}</li>`).join(''); return;
    }
    if (target.id === 'detailEdit' && activeProduct) { openProductEditor(activeProduct); return; }
    if (target.id === 'detailVariants' && activeProduct) { $('#productDetailDialog').close(); renderVariantManager(activeProduct); return; }
    if (target.id === 'detailDuplicate' && activeProduct) {
      const copy = { ...activeProduct, id: `${activeProduct.id}-COPIA`, name: `${activeProduct.name} · copia`, sizes: [...activeProduct.sizes], stock: [...activeProduct.stock], status: 'Borrador' };
      data.products.push(copy); productById.set(copy.id, copy); refreshDerivedProduct(copy); $('#productDetailDialog').close(); renderCatalog(); announce('Se creó una copia de muestra en borrador.'); return;
    }
    if (target.id === 'detailDelete' && activeProduct) {
      const removed = activeProduct; data.products = data.products.filter((product) => product !== removed); productById.delete(removed.id); $('#productDetailDialog').close(); renderCatalog(); announce('Producto archivado solo en esta maqueta.'); return;
    }
    if (target.id === 'detailPublish' && activeProduct) { activeProduct.status = activeProduct.status === 'Publicado' ? 'Borrador' : 'Publicado'; $('#productDetailDialog').close(); renderCatalog(); announce(`Estado de muestra: ${activeProduct.status}.`); return; }
    if (target.id === 'importProducts') { $('#csvImportInput').click(); return; }
    if (target.id === 'bulkPrices') { $('#confirmTitle').textContent = 'Actualización masiva de precios'; $('#confirmMessage').textContent = 'El flujo actual permite elegir una lista, filtrar productos, revisar una vista previa y confirmar. Esta maqueta muestra el punto de entrada; la simulación no modifica productos.'; $('#productConfirmDialog').showModal(); return; }
    if (target.id === 'publishAll') { $('#confirmTitle').textContent = 'Publicar productos'; $('#confirmMessage').textContent = 'El flujo vigente permite revisar y confirmar la publicación masiva al ecommerce. Esta maqueta solo presenta la confirmación; no cambia el estado de ningún producto.'; $('#productConfirmDialog').showModal(); return; }
    if ((target.id === 'generateVariants' || target.id === 'addVariant') && activeProduct) {
      openProductEditor(activeProduct);
      $('[data-editor-tab="variantes"]').click();
      announce(target.id === 'generateVariants' ? 'Generador de variantes abierto. Definí talles, SKU y stock inicial.' : 'Editor de variantes abierto para sumar una combinación.'); return;
    }
    if (target.dataset.screen) { switchScreen(target.dataset.screen); return; }
    if (target.dataset.go === 'pos') { openPos(); return; }
    if (target.id === 'exitPos') { exitPos(); return; }
    if (target.id === 'openNav') {
      $('#sidebar').classList.add('open'); $('#mobileBackdrop').hidden = false; target.setAttribute('aria-expanded', 'true'); $('#closeNav').focus(); return;
    }
    if (target.id === 'closeNav' || target.id === 'mobileBackdrop') {
      $('#sidebar').classList.remove('open'); $('#mobileBackdrop').hidden = true; $('#openNav').setAttribute('aria-expanded', 'false'); $('#openNav').focus(); return;
    }
    if (target.id === 'globalSearchOpen') { const dialog = $('#searchDialog'); dialog.showModal(); $('#globalSearchInput').focus(); return; }
    if (target.dataset.metric) {
      activeMetric = target.dataset.metric;
      $$('[data-metric]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === target)));
      renderChart(activeMetric); return;
    }
    if (target.dataset.posCategory) {
      activeCategory = target.dataset.posCategory;
      $$('[data-pos-category]').forEach((button) => button.classList.toggle('is-selected', button === target));
      renderProducts(); return;
    }
    if (target.dataset.addProduct) {
      const size = $(`[data-pos-size="${target.dataset.addProduct}"]`).value;
      addToCart(target.dataset.addProduct, size); return;
    }
    if (target.dataset.qtyChange) {
      const item = cart.find((entry) => entry.productId === target.dataset.productId && entry.size === target.dataset.size);
      if (item) { item.qty += Number(target.dataset.qtyChange); if (item.qty <= 0) cart = cart.filter((entry) => entry !== item); renderCart(); }
      return;
    }
    if (target.id === 'clearCart') { cart = []; renderCart(); announce('Carrito vacío.'); return; }
    if (target.id === 'reviewSale') { updateReview(); $('#saleDialog').showModal(); return; }
    if (target.id === 'simulateSale') { $('#saleDialog').close(); $('#resultDialog').showModal(); announce('Vista previa de confirmación. No se registró una venta.'); return; }
    if (target.id === 'resetCatalog') { $('#productSearch').value = ''; $('#catalogStatus').value = 'all'; $('#catalogCategory').value = 'all'; $('#catalogStock').value = 'all'; renderCatalog(); return; }
    if (target.dataset.selectProduct) { showProductDetail(target.dataset.selectProduct); return; }
    if (target.id === 'exportProducts') { exportVisibleProducts(); return; }
    if (target.id === 'newProduct') { openProductEditor(); return; }
    if (['movementButton', 'adjustButton', 'replenishButton', 'stockHelp'].includes(target.id)) { $('#confirmTitle').textContent = target.textContent.trim(); $('#confirmMessage').textContent = target.id === 'movementButton' ? 'Kardex por variante con recepción, venta, reserva y ajuste; desde cada fila se puede revisar el detalle.' : target.id === 'adjustButton' ? 'Elegí una variante desde la matriz para registrar cantidad, motivo y previsualizar el ajuste.' : 'Reglas de reposición y auditoría masiva se mantienen como acciones separadas del conteo disponible.'; $('#productConfirmDialog').showModal(); return; }
    if (target.dataset.rowAction || ['customerButton', 'discountButton'].includes(target.id)) {
      announce('Esta acción se muestra como parte de la maqueta; todavía no está conectada a datos.');
    }
  });

  function exportVisibleProducts() {
    const rows = $$('#catalogRows tr');
    const csv = [['Producto', 'SKU', 'Categoría', 'Variantes', 'Stock disponible', 'Precio ARS', 'Estado'], ...rows.map((row) => {
      const product = productById.get(row.dataset.productRow);
      return [product.name, product.id, product.category, product.variants, product.available, product.price, product.status];
    })].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'vestix-productos-demo.csv'; link.click(); URL.revokeObjectURL(link.href);
    announce(`${rows.length} productos de muestra exportados.`);
  }

  $('#catalogCategory').innerHTML = '<option value="all">Todas las categorías</option>' + [...new Set(data.products.map((product) => product.category))].map((category) => `<option value="${category}">${category}</option>`).join('');
  $('#comboComponent').innerHTML = data.products.map((product) => `<option value="${product.id}">${product.name} · ${product.id}</option>`).join('');
  $('#productSearch').addEventListener('input', renderCatalog);
  $('#catalogStatus').addEventListener('change', renderCatalog);
  $('#catalogCategory').addEventListener('change', renderCatalog);
  $('#catalogStock').addEventListener('change', renderCatalog);
  $('#inventoryCategory').addEventListener('change', renderInventory);
  $('#productForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const get = (name) => form.elements.namedItem(name);
    const wasNew = !activeProduct;
    const id = get('id').value.trim();
    const sizes = generatedVariants.length ? generatedVariants.map((variant) => variant.size) : (get('sizes').value.split(',').map((size) => size.trim()).filter(Boolean));
    const stock = generatedVariants.length
      ? generatedVariants.map((variant, index) => Number($(`[data-generated-stock="${index}"]`)?.value || 0))
      : activeProduct
        ? sizes.map((size) => { const index = activeProduct.sizes.indexOf(size); return index >= 0 ? Number($(`[data-edit-stock="${index}"]`)?.value ?? activeProduct.stock[index]) : 0; })
        : sizes.map(() => 0);
    const product = activeProduct || { id, name: '', category: 'Remeras', color: '', sizes: [], stock: [], price: 0, variants: 0, status: 'Borrador', swatch: '#28636b' };
    const oldId = product.id;
    product.id = id; product.name = get('name').value.trim(); product.category = get('category').value; product.type = get('type').value;
    product.color = get('color').value.trim() || get('variantColor').value.trim() || 'Sin color';
    product.sizes = sizes.length ? sizes : ['Único'];
    product.stock = stock.length ? stock : [Number(get('initialStock').value || 0)];
    product.price = Number(get('price').value || 0); product.cost = Number(get('cost').value || 0);
    product.status = get('published').checked && get('active').checked ? 'Publicado' : 'Borrador'; product.recipe = comboRecipe;
    if (generatedVariants.length) product.variantDetails = generatedVariants.map((variant, index) => ({ ...variant, sku: $(`[data-generated-sku="${index}"]`)?.value || variant.sku, barcode: $(`[data-editor-pane="variantes"] tbody tr:nth-child(${index + 1}) input[aria-label]`)?.value || '', stock: product.stock[index] }));
    if (wasNew) data.products.push(product); else if (oldId !== id) productById.delete(oldId);
    productById.set(id, product); refreshDerivedProduct(product);
    $('#productEditorDialog').close(); renderCatalog(); renderInventory(); renderHome();
    announce(wasNew ? 'Producto de muestra creado.' : 'Ficha de muestra actualizada.');
  });
  $('#stockActionForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget; const size = $('#stockDialogSku').textContent.split('talle ')[1];
    const index = activeStockProduct.sizes.indexOf(size); activeStockProduct.stock[index] = Number(form.elements.namedItem('quantity').value);
    refreshDerivedProduct(activeStockProduct); $('#stockActionDialog').close(); renderCatalog(); renderInventory(); renderHome();
    announce('Ajuste de inventario aplicado solo en memoria local.');
  });
  $('#csvImportInput').addEventListener('change', (event) => {
    const file = event.target.files?.[0]; if (!file) return;
    $('#confirmTitle').textContent = 'Importar catálogo CSV';
    $('#confirmMessage').textContent = `Archivo seleccionado: ${file.name}. En el sistema actual primero se valida el archivo y se revisan errores antes de importar. La maqueta no procesa el contenido.`;
    $('#productConfirmDialog').showModal(); event.target.value = '';
  });
  $('#productForm').elements.price.addEventListener('input', (event) => { const value = Number(event.target.value || 0); $('#retailPreview').textContent = value ? currency.format(value) : 'Sin definir'; $('#wholesalePreview').textContent = value ? currency.format(Math.round(value * .85)) : 'Sin definir'; });
  $('#productForm').elements.namedItem('type').addEventListener('change', (event) => {
    $('#comboRecipe').hidden = event.target.value !== 'COMBO';
    $('#initialStockWrap').hidden = event.target.value !== 'SINGLE';
  });
  $('#posSearch').addEventListener('input', renderProducts);
  $('#posSearch').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') { const first = $('[data-add-product]'); if (first) first.click(); }
  });
  document.addEventListener('keydown', (event) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');
    if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); $('#searchDialog').showModal(); $('#globalSearchInput').focus(); }
    if (event.key === 'F9') { event.preventDefault(); openPos(); }
    if (event.key === 'F2' && !posScreen.hidden) { event.preventDefault(); $('#posSearch').focus(); }
    if (event.key === 'Escape' && !posScreen.hidden && !$('#saleDialog').open && !$('#resultDialog').open) exitPos();
  });
  $('#searchDialog').addEventListener('close', () => $('#globalSearchOpen').focus({ preventScroll: true }));
  $('#mobileBackdrop').addEventListener('click', () => {
    $('#sidebar').classList.remove('open'); $('#mobileBackdrop').hidden = true; $('#openNav').setAttribute('aria-expanded', 'false'); $('#openNav').focus();
  });

  renderHome(); renderCatalog(); renderInventory(); renderSales(); renderProducts(); renderCart();
})();
