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
  const themeToggle = $('#themeToggle');
  const themeStorageKey = 'vestix-redesign-theme';
  let savedTheme = 'light';
  try { savedTheme = localStorage.getItem(themeStorageKey) === 'dark' ? 'dark' : 'light'; } catch { /* Storage may be disabled in private browsing. */ }
  function applyTheme(theme, persist = true) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Activar modo claro' : 'Activar modo oscuro');
    themeToggle.title = isDark ? 'Activar modo claro' : 'Activar modo oscuro';
    if (persist) { try { localStorage.setItem(themeStorageKey, isDark ? 'dark' : 'light'); } catch { /* Theme remains active for this session. */ } }
  }
  applyTheme(savedTheme, false);
  themeToggle.addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  let currentScreen = 'home';
  let activeMetric = 'revenue';
  let activeCategory = 'all';
  let cart = [];
  let activeProduct = null;
  let generatedVariants = [];
  let comboRecipe = [];
  let activeStockProduct = null;
  const priceOverrides = { minorista: {}, mayorista: {} };
  const variantPriceOverrides = { minorista: {}, mayorista: {} };

  const announce = (message) => { liveRegion.textContent = ''; requestAnimationFrame(() => { liveRegion.textContent = message; }); };
  const sum = (values) => values.reduce((total, value) => total + value, 0);

  let taxonomyKind = 'categories';
  let taxonomyEditId = null;
  let taxonomyDraftValues = [];
  let supplierEditId = null;
  let priceListEditId = null;
  let productPriceConfigs = [];
  let pendingPriceListDeleteId = null;
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const categoryName = (product) => data.taxonomy.categories.find((item) => item.id === product.categoryId)?.name || product.category || 'Sin categoría';
  const brandName = (product) => data.taxonomy.brands.find((item) => item.id === product.brandId)?.name || product.brand || 'Sin marca';
  const taxonomyItems = () => data.taxonomy[taxonomyKind];
  function populateTaxonomySelects() {
    const options = (items, empty, selected = '') => `<option value="">${empty}</option>` + items.map((item) => { const linkedSupplier = items === data.taxonomy.brands ? data.taxonomy.suppliers.find((supplier) => supplier.id === item.supplierId)?.companyName : ''; const label = item.name + (linkedSupplier ? ` · ${linkedSupplier}` : ''); return `<option value="${escapeHTML(item.id)}" ${item.id === selected ? 'selected' : ''}>${escapeHTML(label)}</option>`; }).join('');
    const categoryOptions = `<option value="all">Todas las categorías</option>` + data.taxonomy.categories.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join('');
    const brandOptions = `<option value="all">Todas las marcas</option>` + data.taxonomy.brands.map((item) => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.name)}</option>`).join('');
    $('#catalogCategory').innerHTML = categoryOptions; $('#bulkCategory').innerHTML = categoryOptions;
    $('#catalogBrand').innerHTML = brandOptions; $('#bulkBrand').innerHTML = brandOptions;
    $('#productForm').elements.category.innerHTML = options(data.taxonomy.categories, 'Seleccioná categoría', activeProduct?.categoryId || '');
    $('#productForm').elements.brand.innerHTML = options(data.taxonomy.brands, 'Sin marca', activeProduct?.brandId || '');
    $('#inventoryCategory').innerHTML = categoryOptions;
    $('.pos-category-row').innerHTML = '<button type="button" class="category-button is-selected" data-pos-category="all">Todo</button>' + data.taxonomy.categories.filter((category) => !data.taxonomy.categories.some((child) => child.parentId === category.id)).map((category) => `<button type="button" class="category-button" data-pos-category="${escapeHTML(category.id)}">${escapeHTML(category.name)}</button>`).join('');
  }
  function renderTaxonomy() {
    const configs = { categories: ['Categoría','Categorías','Categoría superior'], brands: ['Marca','Marcas','Proveedor'], attributes: ['Atributo','Atributos','Valores disponibles'] };
    const [singular, plural, third] = configs[taxonomyKind];
    const query = $('#taxonomySearch').value.trim().toLocaleLowerCase('es-AR');
    const items = taxonomyItems().filter((item) => `${item.name} ${(item.values || []).join(' ')} ${item.parentId ? data.taxonomy.categories.find((c) => c.id === item.parentId)?.name || '' : ''} ${taxonomyKind === 'brands' ? data.taxonomy.suppliers.find((supplier) => supplier.id === item.supplierId)?.companyName || '' : ''}`.toLocaleLowerCase('es-AR').includes(query));
    const headers = taxonomyKind === 'categories' ? [singular, third, 'Productos', ''] : taxonomyKind === 'brands' ? [singular, 'Proveedor asociado', 'Productos', ''] : [singular, third, 'Variantes vinculadas', ''];
    $('#taxonomyHead').innerHTML = `<tr>${headers.map((item) => `<th>${item}</th>`).join('')}</tr>`;
    $('#taxonomyRows').innerHTML = items.map((item) => {
      const parent = item.parentId ? data.taxonomy.categories.find((c) => c.id === item.parentId)?.name || 'Sin categoría superior' : (taxonomyKind === 'categories' ? 'Principal' : 'Sin dato');
      const count = taxonomyKind === 'categories' ? data.products.filter((p) => p.categoryId === item.id).length : taxonomyKind === 'brands' ? data.products.filter((p) => p.brandId === item.id).length : data.products.reduce((n,p) => n + (p.variantDetails || []).filter((v) => Object.hasOwn(v.attributes || {}, item.name)).length,0);
      const countUnit = taxonomyKind === 'attributes' ? (count === 1 ? 'variante' : 'variantes') : (count === 1 ? 'producto' : 'productos');
      const detail = taxonomyKind === 'attributes' ? (item.values || []).map(escapeHTML).join(', ') : taxonomyKind === 'brands' ? escapeHTML(data.taxonomy.suppliers.find((supplier) => supplier.id === item.supplierId)?.companyName || 'Sin proveedor') : escapeHTML(parent);
      return `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${detail || 'Sin dato'}</td><td>${count} ${countUnit}</td><td><div class="product-row-actions"><button type="button" data-edit-taxonomy="${escapeHTML(item.id)}">Editar</button><button type="button" data-delete-taxonomy="${escapeHTML(item.id)}">Eliminar</button></div></td></tr>`;
    }).join('');
    $('#taxonomyEmpty').hidden = items.length > 0; $('#taxonomySummary').textContent = `${items.length} ${items.length === 1 ? singular.toLowerCase() : plural.toLowerCase()}`;
    $('#categoryCount').textContent = data.taxonomy.categories.length; $('#brandCount').textContent = data.taxonomy.brands.length; $('#attributeCount').textContent = data.taxonomy.attributes.length;
    $$('[data-taxonomy-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.taxonomyTab === taxonomyKind)));
  }
  function setTaxonomyTab(kind) { taxonomyKind = kind; $('#taxonomySearch').value = ''; $('#taxonomyTitle').textContent = 'Datos del catálogo'; $('#newTaxonomy').innerHTML = `${kind === 'categories' ? 'Nueva categoría' : kind === 'brands' ? 'Nueva marca' : 'Nuevo atributo'} <span aria-hidden="true">+</span>`; renderTaxonomy(); if (currentScreen === 'taxonomy') $('#crumbCurrent').textContent = 'Datos del catálogo'; }
  function renderSuppliers() {
    const query = $('#supplierSearch').value.trim().toLocaleLowerCase('es-AR');
    const suppliers = data.taxonomy.suppliers.filter((supplier) => `${supplier.companyName} ${supplier.contactName || ''} ${supplier.taxId || ''} ${supplier.email || ''} ${data.taxonomy.brands.filter((brand) => brand.supplierId === supplier.id).map((brand) => brand.name).join(' ')}`.toLocaleLowerCase('es-AR').includes(query));
    const brandCount = data.taxonomy.brands.filter((brand) => brand.supplierId).length;
    $('#supplierCount').textContent = data.taxonomy.suppliers.length; $('#supplierBrandCount').textContent = brandCount; $('#supplierSummary').textContent = `${suppliers.length} ${suppliers.length === 1 ? 'proveedor' : 'proveedores'}`; $('#supplierEmpty').hidden = suppliers.length > 0;
    $('#supplierRows').innerHTML = suppliers.map((supplier) => { const brands = data.taxonomy.brands.filter((brand) => brand.supplierId === supplier.id); return `<tr><td><strong>${escapeHTML(supplier.companyName)}</strong></td><td>${escapeHTML(supplier.contactName || 'Sin contacto')}</td><td>${escapeHTML(supplier.taxId || 'Sin CUIT')}</td><td>${brands.length ? brands.map((brand) => `<span class="status-label status-ok"><i></i>${escapeHTML(brand.name)}</span>`).join(' ') : 'Sin marca asociada'}</td><td>${escapeHTML(supplier.email || 'Sin correo')}</td><td><div class="product-row-actions"><button type="button" data-supplier-edit="${escapeHTML(supplier.id)}">Editar</button><button type="button" data-supplier-delete="${escapeHTML(supplier.id)}">Eliminar</button></div></td></tr>`; }).join('');
  }
  function openTaxonomyForm(item = null) {
    taxonomyEditId = item?.id || null; taxonomyDraftValues = [...(item?.values || [])]; const form = $('#taxonomyForm'); form.reset();
    $('#taxonomyFormTitle').textContent = `${item ? 'Editar' : 'Nueva'} ${taxonomyKind === 'categories' ? 'categoría' : taxonomyKind === 'brands' ? 'marca' : 'atributo'}`; form.elements.name.value = item?.name || '';
    $('#taxonomyParentWrap').hidden = taxonomyKind !== 'categories'; $('#taxonomyValuesWrap').hidden = taxonomyKind !== 'attributes'; $('#brandSupplierWrap').hidden = taxonomyKind !== 'brands';
    form.elements.parentId.innerHTML = '<option value="">Sin categoría superior</option>' + data.taxonomy.categories.filter((c) => c.id !== item?.id).map((c) => `<option value="${escapeHTML(c.id)}" ${c.id === item?.parentId ? 'selected' : ''}>${escapeHTML(c.name)}</option>`).join('');
    form.elements.supplierId.innerHTML = '<option value="">Sin proveedor asociado</option>' + data.taxonomy.suppliers.map((supplier) => `<option value="${escapeHTML(supplier.id)}" ${supplier.id === item?.supplierId ? 'selected' : ''}>${escapeHTML(supplier.companyName)}</option>`).join('');
    renderTaxonomyValueChips(); $('#taxonomyFormDialog').showModal(); form.elements.name.focus();
  }
  function renderTaxonomyValueChips() { $('#taxonomyValueChips').innerHTML = taxonomyDraftValues.map((value,index) => `<button type="button" class="taxonomy-value-chip" data-remove-value="${index}" aria-label="Quitar ${escapeHTML(value)}">${escapeHTML(value)} <span aria-hidden="true">×</span></button>`).join('') || '<span class="meta">Agregá al menos un valor para este atributo.</span>'; }
  function renderVariantAttributeFields(product) {
    const axes = $('#variantAttributeFields');
    axes.innerHTML = data.taxonomy.attributes.map((attribute) => {
      const selected = [...new Set((product?.variantDetails || []).map((v) => v.attributes?.[attribute.name]).filter(Boolean))];
      const values = attribute.values || []; const listId = `attribute-values-${attribute.id}`;
      return `<label>${escapeHTML(attribute.name)}<input data-attribute-axis="${escapeHTML(attribute.id)}" list="${listId}" placeholder="${values.slice(0,4).map(escapeHTML).join(', ')}" value="${escapeHTML(selected.join(', '))}"><datalist id="${listId}">${values.map((value) => `<option value="${escapeHTML(value)}"></option>`).join('')}</datalist><small>${values.length} valores en catálogo</small></label>`;
    }).join('') || '<p class="empty-inline">Creá atributos antes de generar variantes.</p>';
  }

  function formatListPrice(amount, code = 'ARS') {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(Number(amount) || 0);
  }
  function populatePriceListSelects() {
    const activeLists = data.priceLists.filter((list) => list.isActive);
    $('#catalogPriceList').innerHTML = '<option value="base">Precio base</option>' + activeLists.map((list) => `<option value="${escapeHTML(list.id)}">${escapeHTML(list.name)}</option>`).join('');
    $('#bulkPriceList').innerHTML = '<option value="base">Precio base del catálogo</option>' + data.priceLists.map((list) => `<option value="${escapeHTML(list.id)}">${escapeHTML(list.name)}${list.isDefault ? ' · por defecto' : ''}</option>`).join('');
  }
  function renderPriceLists() {
    const active = data.priceLists.filter((list) => list.isActive);
    const defaultList = data.priceLists.find((list) => list.isDefault);
    $('#priceListCount').textContent = active.length;
    $('#defaultPriceListLabel').textContent = defaultList?.name || 'Sin lista por defecto';
    $('#priceListEmpty').hidden = data.priceLists.length > 0;
    $('#priceListRows').innerHTML = data.priceLists.map((list) => `<tr><td><div class="product-name-cell"><span><strong>${escapeHTML(list.name)}</strong><small>${escapeHTML(list.code)}</small></span></div></td><td>${list.type === 'MODIFIER' ? `Modificadora · ${Number(list.modifierPercentage) > 0 ? '+' : ''}${Number(list.modifierPercentage) || 0}%` : 'Base'}</td><td>${escapeHTML(list.currency)}</td><td><span class="status-label ${list.isActive ? 'status-ok' : 'status-draft'}"><i></i>${list.isActive ? 'Activa' : 'Inactiva'}</span></td><td>${list.isDefault ? '<span class="status-label status-ok"><i></i>Predeterminada</span>' : 'No'}</td><td><div class="product-row-actions"><button type="button" data-price-list-edit="${escapeHTML(list.id)}">Editar</button><button type="button" data-price-list-toggle="${escapeHTML(list.id)}">${list.isActive ? 'Desactivar' : 'Activar'}</button><button type="button" data-price-list-delete="${escapeHTML(list.id)}">Eliminar</button></div></td></tr>`).join('');
    populatePriceListSelects();
  }
  function openPriceListForm(list = null) {
    priceListEditId = list?.id || null;
    const form = $('#priceListForm'); form.reset();
    form.elements.name.value = list?.name || ''; form.elements.code.value = list?.code || ''; form.elements.currency.value = list?.currency || 'ARS';
    form.elements.type.value = list?.type || 'BASE'; form.elements.modifierPercentage.value = list?.modifierPercentage || '';
    form.elements.isActive.checked = list?.isActive ?? true; form.elements.isDefault.checked = list?.isDefault ?? false;
    $('#priceListFormTitle').textContent = list ? 'Editar lista de precios' : 'Nueva lista de precios';
    $('#priceListForm').querySelector('[type="submit"]').textContent = list ? 'Guardar cambios' : 'Crear lista';
    $('#modifierPercentageWrap').hidden = form.elements.type.value !== 'MODIFIER'; form.elements.modifierPercentage.required = form.elements.type.value === 'MODIFIER';
    form.elements.isDefault.disabled = form.elements.type.value === 'MODIFIER' || !form.elements.isActive.checked;
    $('#priceListFormDialog').showModal(); form.elements.name.focus();
  }
  function syncProductPrice() {
    const defaultConfig = productPriceConfigs.find((config) => config.isDefault) || productPriceConfigs[0];
    const value = defaultConfig?.finalPrice || 0;
    $('#productForm').elements.price.value = value ? String(Math.round(value)) : '';
    const form = $('#productForm');
    const basePrice = Number(form.elements.price.value || 0);
  }
  function renderProductPriceCards() {
    const cost = Number($('#productForm').elements.cost.value || 0);
    $('#productPriceListCards').innerHTML = productPriceConfigs.map((config) => {
      const currencyFmt = formatListPrice(config.finalPrice, config.currency);
      const hint = config.mode === 'PERCENTAGE' ? `Costo ${formatListPrice(cost, config.currency)} + ${config.markupValue}%` : config.mode === 'FIXED' ? `Costo ${formatListPrice(cost, config.currency)} + ${formatListPrice(config.markupValue, config.currency)}` : 'Precio ingresado manualmente';
      return `<article class="product-price-card" data-price-card="${escapeHTML(config.priceListId)}"><header><div><strong>${escapeHTML(config.priceListName)}</strong><small>${escapeHTML(config.code || '')} · ${escapeHTML(config.currency)} ${config.isDefault ? '· Por defecto' : ''}</small></div><strong data-price-result>${currencyFmt}</strong></header><div class="price-mode-selector"><button type="button" data-price-mode="PERCENTAGE" aria-pressed="${config.mode === 'PERCENTAGE'}">Porcentaje</button><button type="button" data-price-mode="FIXED" aria-pressed="${config.mode === 'FIXED'}">Fijo (+ $)</button><button type="button" data-price-mode="MANUAL" aria-pressed="${config.mode === 'MANUAL'}">Manual</button></div><div class="price-rule-input">${config.mode === 'PERCENTAGE' ? `<label>Porcentaje sobre costo (%)<input type="number" step="1" data-price-markup value="${config.markupValue}" placeholder="100"></label>` : config.mode === 'FIXED' ? `<label>Recargo fijo sobre costo (${escapeHTML(config.currency)})<input type="number" step="50" data-price-markup value="${config.markupValue}" placeholder="5000"></label>` : `<label>Precio final (${escapeHTML(config.currency)})<input type="number" min="0" data-price-manual value="${config.finalPrice || ''}" placeholder="0"></label>`}<small data-price-hint>${hint}</small></div><footer><span>Ganancia</span><strong data-price-profit>${formatListPrice(config.finalPrice - cost, config.currency)}</strong></footer></article>`;
    }).join('') || '<p class="empty-inline">Todavía no hay listas activas. Creá una desde “Listas de precios”.</p>';
    syncProductPrice();
  }
  function configureProductPrices(product) {
    const cost = Number($('#productForm').elements.cost.value || 0);
    const activeLists = data.priceLists.filter((list) => list.isActive);
    productPriceConfigs = activeLists.map((list) => {
      const saved = product?.priceListPrices?.find((entry) => entry.priceListId === list.id)?.price;
      const initial = saved ?? (list.isDefault ? product?.price ?? 0 : 0);
      let mode = 'PERCENTAGE'; let markupValue = 100; let finalPrice = cost > 0 ? Math.round(cost * 2) : Number(initial) || 0;
      if (initial > 0) {
        finalPrice = Number(initial);
        if (cost > 0 && finalPrice > cost) {
          const pct = Math.round(((finalPrice - cost) / cost) * 100);
          if (Math.round(cost * (1 + pct / 100)) === finalPrice) { mode = 'PERCENTAGE'; markupValue = pct; }
          else { mode = 'MANUAL'; markupValue = finalPrice; }
        } else { mode = 'MANUAL'; markupValue = finalPrice; }
      }
      return { priceListId: list.id, priceListName: list.name, code: list.code, currency: list.currency || 'ARS', isDefault: list.isDefault, type: list.type, modifierPercentage: list.modifierPercentage || 0, mode, markupValue, finalPrice };
    });
    renderProductPriceCards();
  }
  function updatePriceConfig(id, update) {
    const config = productPriceConfigs.find((item) => item.priceListId === id); if (!config) return;
    const cost = Number($('#productForm').elements.cost.value || 0);
    if (update.mode) {
      config.mode = update.mode;
      if (update.mode === 'PERCENTAGE') { config.markupValue = cost > 0 && config.finalPrice > cost ? Math.round((config.finalPrice / cost - 1) * 100) : 100; if (cost > 0) config.finalPrice = Math.round(cost * (1 + config.markupValue / 100)); }
      if (update.mode === 'FIXED') { config.markupValue = cost > 0 && config.finalPrice > cost ? Math.round(config.finalPrice - cost) : 0; if (cost > 0) config.finalPrice = Math.round(cost + config.markupValue); }
      if (update.mode === 'MANUAL') config.markupValue = config.finalPrice;
    }
    if (update.markupValue != null) { config.markupValue = Number(update.markupValue) || 0; config.finalPrice = config.mode === 'PERCENTAGE' ? (cost > 0 ? Math.round(cost * (1 + config.markupValue / 100)) : 0) : cost > 0 ? Math.round(cost + config.markupValue) : 0; }
    if (update.finalPrice != null) { config.mode = 'MANUAL'; config.markupValue = Number(update.finalPrice) || 0; config.finalPrice = config.markupValue; }
    const card = $(`[data-price-card="${id}"]`);
    card?.querySelectorAll('[data-price-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.priceMode === config.mode)));
    card?.querySelector('[data-price-result]') && (card.querySelector('[data-price-result]').textContent = formatListPrice(config.finalPrice, config.currency));
    card?.querySelector('[data-price-profit]') && (card.querySelector('[data-price-profit]').textContent = formatListPrice(config.finalPrice - cost, config.currency));
    const hint = config.mode === 'PERCENTAGE' ? `Costo ${formatListPrice(cost, config.currency)} + ${config.markupValue}%` : config.mode === 'FIXED' ? `Costo ${formatListPrice(cost, config.currency)} + ${formatListPrice(config.markupValue, config.currency)}` : 'Precio ingresado manualmente';
    card?.querySelector('[data-price-hint]') && (card.querySelector('[data-price-hint]').textContent = hint);
    syncProductPrice();
  }
  function applyAllPriceRules(mode, value) {
    const cost = Number($('#productForm').elements.cost.value || 0);
    productPriceConfigs.forEach((config) => { config.mode = mode; config.markupValue = value; config.finalPrice = mode === 'PERCENTAGE' ? (cost > 0 ? Math.round(cost * (1 + value / 100)) : 0) : mode === 'FIXED' ? (cost > 0 ? Math.round(cost + value) : 0) : value; });
    renderProductPriceCards();
  }
  function roundProductPriceRules(step = 100) { productPriceConfigs.forEach((config) => { config.mode = 'MANUAL'; config.markupValue = Math.ceil(config.finalPrice / step) * step; config.finalPrice = config.markupValue; }); renderProductPriceCards(); }

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
    const brand = $('#catalogBrand').value;
    const stock = $('#catalogStock').value;
    const visible = data.products.filter((product) => {
      const matchesText = [product.name, product.id, categoryName(product), brandName(product), product.color].join(' ').toLocaleLowerCase('es-AR').includes(query);
      const matchesStock = stock === 'all' || (stock === 'available' && product.available > 0) || (stock === 'low' && product.lowSizes > 0) || (stock === 'empty' && product.available === 0);
      return matchesText && (status === 'all' || product.status === status) && (category === 'all' || product.categoryId === category) && (brand === 'all' || product.brandId === brand) && matchesStock;
    });
    $('#productCount').textContent = integer.format(visible.length);
    $('#variantCount').textContent = integer.format(visible.reduce((n, product) => n + product.variants, 0));
    $('#catalogRange').textContent = `${visible.length ? 1 : 0}–${visible.length} de ${visible.length} productos`;
    $('#catalogEmpty').hidden = visible.length > 0;
    $('#catalogTable').hidden = visible.length === 0;
    $('#catalogRows').innerHTML = visible.map((product) => `
      <tr data-product-row="${product.id}" tabindex="0" aria-selected="false">
        <td><div class="product-name-cell"><span class="swatch" style="--swatch:${product.swatch}"></span><span><button class="row-name" type="button" data-view-product="${product.id}">${product.name}</button><small>${product.id} · ${product.color}</small></span></div></td>
        <td>${escapeHTML(categoryName(product))}</td><td>${product.variants}</td><td>${integer.format(product.available)} <span class="table-unit">unid.</span></td>
        <td class="numeric">${currency.format(getBulkPrice(product, $('#catalogPriceList').value)).replace(',00', '')}</td><td><span class="status-label ${product.status === 'Publicado' ? 'status-ok' : 'status-draft'}"><i></i>${product.status}</span></td><td><div class="product-row-actions"><button type="button" data-edit-product="${product.id}">Editar</button><button class="row-more" type="button" aria-label="Más acciones para ${product.name}" data-product-menu="${product.id}">···</button></div></td>
      </tr>`).join('');
  }

  function renderInventory() {
    const category = $('#inventoryCategory').value;
    const visible = data.products.filter((product) => category === 'all' || product.categoryId === category);
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
    product.variants = product.variantDetails?.length || product.sizes.length;
    product.available = product.stock.reduce((total, value) => total + Number(value || 0), 0);
    product.lowSizes = product.stock.filter((value) => value <= data.lowStockThreshold).length;
    data.variantCount = data.products.reduce((total, item) => total + item.variants, 0);
  }

  function showProductDetail(id) {
    activeProduct = productById.get(id);
    if (!activeProduct) return;
    $('#detailName').textContent = activeProduct.name;
    $('#detailContent').innerHTML = `<div class="detail-product-line"><span class="swatch" style="--swatch:${activeProduct.swatch}"></span><div><strong>${activeProduct.id}</strong><small>${escapeHTML(categoryName(activeProduct))} · ${escapeHTML(brandName(activeProduct))} · ${escapeHTML(activeProduct.color)}</small></div><span class="status-label ${activeProduct.status === 'Publicado' ? 'status-ok' : 'status-draft'}"><i></i>${activeProduct.status}</span></div><div class="detail-facts"><div><small>Precio base</small><strong>${currency.format(activeProduct.price)}</strong></div><div><small>Stock disponible</small><strong>${integer.format(activeProduct.available)} unid.</strong></div><div><small>SKUs / variantes</small><strong>${activeProduct.variants}</strong></div></div><h3>Disponibilidad por talle</h3><div class="detail-size-grid">${activeProduct.sizes.map((size, index) => `<button type="button" data-stock-open="${activeProduct.id}" data-stock-size="${size}"><small>${size}</small><strong>${activeProduct.stock[index]}</strong><span>${activeProduct.stock[index] <= data.lowStockThreshold ? 'Revisar' : 'disponibles'}</span></button>`).join('')}</div><p class="prototype-note">Ficha consolidada: identificadores, estado, precio y disponibilidad por variante.</p>`;
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
    populateTaxonomySelects(); form.elements.category.value = product?.categoryId || '';
    form.elements.brand.value = product?.brandId || '';
    form.elements.color.value = product?.color || '';
    form.elements.variantSku.value = product?.id || '';
    renderVariantAttributeFields(product);
    form.elements.cost.value = product?.cost || ''; form.elements.cost.readOnly = Boolean(product);
    configureProductPrices(product);
    form.elements.price.readOnly = true;
    form.elements.published.checked = (product?.status || 'Publicado') === 'Publicado';
    form.elements.active.checked = true;
    $('#editorVariantRows').innerHTML = product ? (product.variantDetails || []).map((variant, index) => `<tr><td>${escapeHTML(Object.values(variant.attributes || {}).join(' / '))}</td><td class="mono">${escapeHTML(variant.sku)}</td><td>Auto</td><td><input type="number" min="0" value="${variant.stock}" data-edit-stock="${index}"></td></tr>`).join('') : '<tr><td colspan="4" class="empty-inline">Ingresá talles y generá la matriz.</td></tr>';
    $('#variantBuildCount').textContent = product ? `${product.variantDetails?.length || product.variants} variantes existentes` : 'Sin variantes nuevas';
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
    $('#variantRows').innerHTML = (product.variantDetails || product.sizes.map((size,index) => ({ sku: `${product.id}-${size}`, color: product.color, size, stock: product.stock[index], isActive: true, attributes: { Talle: size, Color: product.color } }))).map((variant) => { const values = Object.values(variant.attributes || {}).join(' / ') || variant.size || 'Único'; const size = variant.size || 'Único'; return `<tr><td class="mono">${escapeHTML(variant.sku)}</td><td>${escapeHTML(variant.color || variant.attributes?.Color || 'Sin color')}</td><td>${escapeHTML(values)}</td><td class="mono">${escapeHTML(variant.barcode || 'Auto')}</td><td class="numeric">${currency.format(Math.round(product.price * .48))}</td><td><span class="status-label ${variant.isActive === false ? 'status-draft' : 'status-ok'}"><i></i>${variant.isActive === false ? 'Inactiva' : 'Activa'}</span></td><td><button type="button" class="text-link" data-stock-open="${product.id}" data-stock-size="${size}">Stock</button></td></tr>`; }).join('');
    switchScreen('variants');
  }

  function getBulkPrice(product, list) {
    if (priceOverrides[list]?.[product.id] != null) return priceOverrides[list][product.id];
    if (list === 'base') return product.price;
    const priceList = data.priceLists.find((item) => item.id === list);
    const saved = product.priceListPrices?.find((entry) => entry.priceListId === list)?.price;
    if (saved != null) return saved;
    if (priceList?.type === 'MODIFIER') return product.price * (1 + (Number(priceList.modifierPercentage) || 0) / 100);
    if (list === 'mayorista') return product.price * 0.85;
    return product.price;
  }

  function roundBulkPrice(value, mode) {
    if (mode === 'ceil') return Math.ceil(value);
    if (mode === 'floor') return Math.floor(value);
    if (mode === 'none') return Math.round(value * 100) / 100;
    return Math.round(value);
  }

  function renderBulkPreview() {
    const category = $('#bulkCategory').value;
    const brand = $('#bulkBrand').value;
    const list = $('#bulkPriceList').value;
    const percentage = Number($('#bulkPercentage').value);
    const rounding = $('#bulkRounding').value;
    const affected = data.products.filter((product) => (category === 'all' || product.categoryId === category) && (brand === 'all' || product.brandId === brand));
    const listName = list === 'base' ? 'Precio base del catálogo' : data.priceLists.find((item) => item.id === list)?.name || 'Lista seleccionada';
    $('#bulkScopeSummary').textContent = `${category === 'all' ? 'Todas las categorías' : data.taxonomy.categories.find((c) => c.id === category)?.name} · ${brand === 'all' ? 'Todas las marcas' : data.taxonomy.brands.find((b) => b.id === brand)?.name} · ${listName}`;
    $('#bulkAffectedCount').textContent = `${affected.length} productos · ${affected.reduce((sum, product) => sum + product.variants, 0)} variantes`;
    const allProducts = category === 'all' && brand === 'all';
    $('#bulkWarning').hidden = !allProducts;
    $('.bulk-confirm-line').hidden = !allProducts;
    $('#bulkPreviewRows').innerHTML = affected.slice(0, 6).map((product) => {
      const before = getBulkPrice(product, list);
      const after = Number.isFinite(percentage) && percentage !== 0 ? roundBulkPrice(before * (1 + percentage / 100), rounding) : before;
      const change = after - before;
      const fmt = (amount) => currency.format(amount).replace(',00', '');
      return `<tr><td><div class="product-name-cell"><span class="swatch" style="--swatch:${product.swatch}"></span><span><strong>${product.name}</strong><small>${product.id} · ${escapeHTML(brandName(product))}</small></span></div></td><td>${fmt(before)}</td><td class="numeric"><strong>${fmt(after)}</strong></td><td class="numeric ${change < 0 ? 'bulk-negative' : 'bulk-positive'}">${change > 0 ? '+' : ''}${fmt(change)}</td></tr>`;
    }).join('') || '<tr><td colspan="4" class="empty-inline">Ningún producto coincide con los filtros.</td></tr>';
    const hiddenCount = Math.max(0, affected.length - 6);
    $('#bulkOverflowNote').hidden = hiddenCount === 0;
    $('#bulkOverflowNote').textContent = hiddenCount ? `Se muestran 6 de ${affected.length} productos. ${hiddenCount} más incluidos en el cálculo.` : '';
    const invalidDiscount = Number.isFinite(percentage) && percentage <= -100;
    $('#bulkValidation').hidden = !invalidDiscount;
    $('#bulkApply').disabled = !Number.isFinite(percentage) || percentage === 0 || invalidDiscount || affected.length === 0 || (allProducts && !$('#bulkConfirmAll').checked);
  }

  function openBulkPriceDialog() {
    $('#bulkPriceList').value = 'base'; $('#bulkCategory').value = 'all'; $('#bulkBrand').value = 'all';
    $('#bulkPercentage').value = ''; $('#bulkRounding').value = 'round'; $('#bulkConfirmAll').checked = false;
    renderBulkPreview(); $('#bulkPriceDialog').showModal();
  }

  function renderProducts() {
    const query = $('#posSearch').value.trim().toLocaleLowerCase('es-AR');
    const products = data.products.filter((product) => product.status === 'Publicado' && (activeCategory === 'all' || product.categoryId === activeCategory) && [product.name, product.id, categoryName(product), product.color].join(' ').toLocaleLowerCase('es-AR').includes(query));
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
      const active = item.dataset.screen === name && (!item.dataset.taxonomyTab || item.dataset.taxonomyTab === taxonomyKind);
      item.classList.toggle('is-active', active);
      if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
    });
    const label = name === 'taxonomy' ? 'Datos del catálogo' : ($('.nav-item[data-screen="' + name + '"] span')?.textContent || (name === 'variants' ? 'Variantes' : 'Inicio'));
    $('#crumbCurrent').textContent = label;
    $('#sidebar').classList.remove('open');
    $('#mobileBackdrop').hidden = true;
    $('#openNav').setAttribute('aria-expanded', 'false');
    $('#screenContent').scrollTop = 0;
    if (name === 'taxonomy') renderTaxonomy();
    if (name === 'suppliers') renderSuppliers();
    if (name === 'price-lists') renderPriceLists();
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
    if (target.dataset.taxonomyTab) { setTaxonomyTab(target.dataset.taxonomyTab); if (target.dataset.screen === 'taxonomy') switchScreen('taxonomy'); return; }
    if (target.id === 'newTaxonomy') { openTaxonomyForm(); return; }
    if (target.id === 'newSupplier') { openSupplierForm(); return; }
    if (target.dataset.supplierEdit) { openSupplierForm(data.taxonomy.suppliers.find((supplier) => supplier.id === target.dataset.supplierEdit)); return; }
    if (target.dataset.supplierDelete) { const supplier = data.taxonomy.suppliers.find((item) => item.id === target.dataset.supplierDelete); if (!supplier) return; if (data.taxonomy.brands.some((brand) => brand.supplierId === supplier.id)) { $('#confirmTitle').textContent = 'Proveedor con marcas asociadas'; $('#confirmMessage').textContent = 'Primero reasigná o desvinculá las marcas asociadas para poder eliminar este proveedor.'; } else { data.taxonomy.suppliers = data.taxonomy.suppliers.filter((item) => item.id !== supplier.id); $('#confirmTitle').textContent = 'Proveedor eliminado de la maqueta'; $('#confirmMessage').textContent = `${supplier.companyName} se quitó del catálogo local.`; renderSuppliers(); } $('#productConfirmDialog').showModal(); return; }
    if (target.id === 'newPriceList') { openPriceListForm(); return; }
    if (target.dataset.priceListEdit) { openPriceListForm(data.priceLists.find((list) => list.id === target.dataset.priceListEdit)); return; }
    if (target.dataset.priceListToggle) { const list = data.priceLists.find((item) => item.id === target.dataset.priceListToggle); if (list) { list.isActive = !list.isActive; if (!list.isActive) list.isDefault = false; renderPriceLists(); renderCatalog(); } return; }
    if (target.dataset.priceListDelete) { const list = data.priceLists.find((item) => item.id === target.dataset.priceListDelete); if (!list) return; pendingPriceListDeleteId = list.id; $('#confirmTitle').textContent = `Eliminar lista ${list.name}`; $('#confirmMessage').textContent = 'La lista se quitará de los productos y selectores de la maqueta. Los precios base se conservarán.'; $('#productConfirmDialog').showModal(); return; }
    if (target.id === 'confirmPriceListDelete' && pendingPriceListDeleteId) { const id = pendingPriceListDeleteId; data.priceLists = data.priceLists.filter((list) => list.id !== id); data.products.forEach((product) => { product.priceListPrices = (product.priceListPrices || []).filter((entry) => entry.priceListId !== id); }); delete priceOverrides[id]; delete variantPriceOverrides[id]; pendingPriceListDeleteId = null; renderPriceLists(); renderCatalog(); return; }
    if (target.dataset.priceMode) { const card = target.closest('[data-price-card]'); updatePriceConfig(card.dataset.priceCard, { mode: target.dataset.priceMode }); renderProductPriceCards(); return; }
    if (target.id === 'roundProductPrices') { roundProductPriceRules(100); return; }
    if (target.dataset.editTaxonomy) { openTaxonomyForm(taxonomyItems().find((entry) => entry.id === target.dataset.editTaxonomy)); return; }
    if (target.dataset.deleteTaxonomy) { const item = taxonomyItems().find((entry) => entry.id === target.dataset.deleteTaxonomy); if (!item) return; const used = taxonomyKind === 'categories' ? data.products.some((product) => product.categoryId === item.id) || data.taxonomy.categories.some((category) => category.parentId === item.id) : taxonomyKind === 'brands' ? data.products.some((product) => product.brandId === item.id) : data.products.some((product) => (product.variantDetails || []).some((variant) => Object.hasOwn(variant.attributes || {}, item.name))); if (used) { $('#confirmTitle').textContent = 'Registro en uso'; $('#confirmMessage').textContent = 'Este dato está asociado a productos, subcategorías o variantes. Reasigná esos vínculos antes de eliminarlo.'; } else { data.taxonomy[taxonomyKind] = taxonomyItems().filter((entry) => entry !== item); populateTaxonomySelects(); renderTaxonomy(); $('#confirmTitle').textContent = 'Registro eliminado de la maqueta'; $('#confirmMessage').textContent = `${item.name} se quitó del catálogo local.`; } $('#productConfirmDialog').showModal(); return; }
    if (target.dataset.removeValue != null) { taxonomyDraftValues.splice(Number(target.dataset.removeValue), 1); renderTaxonomyValueChips(); return; }
    if (target.id === 'addTaxonomyValue') { addTaxonomyValue(); return; }
    if (target.dataset.viewProduct) { showProductDetail(target.dataset.viewProduct); return; }
    if (target.dataset.editProduct) { openProductEditor(productById.get(target.dataset.editProduct)); return; }
    if (target.dataset.productMenu) { showProductDetail(target.dataset.productMenu); return; }
    if (target.dataset.stockOpen) { showStockAction(target.dataset.stockOpen, target.dataset.stockSize); return; }
    if (target.dataset.editorTab) {
      $$('[data-editor-tab]').forEach((tab) => tab.setAttribute('aria-selected', String(tab === target)));
      $$('[data-editor-pane]').forEach((pane) => { pane.hidden = pane.dataset.editorPane !== target.dataset.editorTab; }); return;
    }
    if (target.dataset.markup) { applyAllPriceRules('PERCENTAGE', Number(target.dataset.markup)); return; }
    if (target.id === 'chooseImages') { $('#imageFiles').click(); return; }
    if (target.id === 'buildVariantMatrix') {
      const form = $('#productForm');
      const axes = data.taxonomy.attributes.map((attribute) => ({ attribute, values: ($(`[data-attribute-axis="${attribute.id}"]`)?.value || '').split(',').map((value) => value.trim()).filter(Boolean) })).filter((axis) => axis.values.length);
      const baseSku = form.elements.variantSku.value.trim() || form.elements.id.value.trim() || 'SKU';
      const invalidAxis = axes.find(({ attribute, values }) => values.some((value) => !(attribute.values || []).some((allowed) => allowed.toLocaleLowerCase('es-AR') === value.toLocaleLowerCase('es-AR'))));
      if (invalidAxis) { $('#variantBuildCount').textContent = `Revisá los valores de ${invalidAxis.attribute.name}`; announce(`Usá valores definidos en el catálogo de ${invalidAxis.attribute.name}.`); return; }
      generatedVariants = [];
      if (!axes.length) { $('#variantBuildCount').textContent = 'Seleccioná al menos un atributo'; announce('Seleccioná valores de al menos un atributo para generar variantes.'); return; }
      const combinations = axes.reduce((rows, axis) => rows.flatMap((row) => axis.values.map((value) => ({ ...row, [axis.attribute.name]: value }))), [{}]);
      generatedVariants = combinations.map((attributes, index) => {
        const previous = activeProduct?.variantDetails?.find((variant) => Object.entries(attributes).every(([key, value]) => variant.attributes?.[key] === value));
        const size = attributes.Talle || attributes.Size || attributes.Tamaño || Object.values(attributes)[0] || 'Único';
        const color = attributes.Color || 'Sin color';
        return { attributes, size, color, sku: previous?.sku || `${baseSku}-${index + 1}`, barcode: previous?.barcode || '', stock: previous?.stock || 0, isActive: previous?.isActive ?? true };
      });
      $('#variantBuildCount').textContent = `${generatedVariants.length} variantes generadas`;
      $('#editorVariantRows').innerHTML = generatedVariants.map((variant, index) => `<tr><td>${escapeHTML(Object.values(variant.attributes).join(' / '))}</td><td><input value="${escapeHTML(variant.sku)}" data-generated-sku="${index}"></td><td><input value="${escapeHTML(variant.barcode)}" placeholder="Autogenerar" aria-label="Código de barras para ${escapeHTML(variant.sku)}"></td><td><input type="number" min="0" value="${variant.stock}" data-generated-stock="${index}"></td></tr>`).join('');
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
    if (target.id === 'bulkPrices') { openBulkPriceDialog(); return; }
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
    if (target.id === 'resetCatalog') { $('#productSearch').value = ''; $('#catalogStatus').value = 'all'; $('#catalogCategory').value = 'all'; $('#catalogBrand').value = 'all'; $('#catalogStock').value = 'all'; renderCatalog(); return; }
    if (target.dataset.selectProduct) { showProductDetail(target.dataset.selectProduct); return; }
    if (target.id === 'exportProducts') { exportVisibleProducts(); return; }
    if (target.dataset.bulkPct) { $('#bulkPercentage').value = target.dataset.bulkPct; renderBulkPreview(); return; }
    if (target.id === 'bulkApply') {
      const category = $('#bulkCategory').value; const brand = $('#bulkBrand').value; const list = $('#bulkPriceList').value;
      const percentage = Number($('#bulkPercentage').value); const rounding = $('#bulkRounding').value;
      const affected = data.products.filter((product) => (category === 'all' || product.categoryId === category) && (brand === 'all' || product.brandId === brand));
      affected.forEach((product) => {
        const before = getBulkPrice(product, list);
        const nextPrice = roundBulkPrice(before * (1 + percentage / 100), rounding);
        const factor = 1 + percentage / 100;
        if (list === 'base') {
          product.price = nextPrice;
          const defaultList = data.priceLists.find((priceList) => priceList.isDefault);
          if (defaultList) { product.priceListPrices ||= []; const entry = product.priceListPrices.find((item) => item.priceListId === defaultList.id); if (entry) entry.price = nextPrice; else product.priceListPrices.push({ priceListId: defaultList.id, price: nextPrice }); }
          product.variantPrices = product.sizes.map((_, index) => roundBulkPrice((product.variantPrices?.[index] ?? before) * factor, rounding));
        } else {
          priceOverrides[list] ||= {}; variantPriceOverrides[list] ||= {}; priceOverrides[list][product.id] = nextPrice;
          variantPriceOverrides[list][product.id] = product.sizes.map((_, index) => roundBulkPrice((variantPriceOverrides[list][product.id]?.[index] ?? before) * factor, rounding));
        }
      });
      const variantCount = affected.reduce((sum, product) => sum + product.variants, 0);
      $('#catalogPriceList').value = list; $('#bulkPriceDialog').close(); renderCatalog(); renderHome();
      $('#confirmTitle').textContent = 'Actualización aplicada a la maqueta';
      $('#confirmMessage').textContent = `Se actualizaron ${affected.length} productos y ${variantCount} variantes en ${list === 'base' ? 'Precio base del catálogo' : data.priceLists.find((item) => item.id === list)?.name || 'la lista seleccionada' }. El costo de compra no se modificó. Los cambios son temporales y no se enviaron al ERP.`;
      $('#productConfirmDialog').showModal();
      announce(`${affected.length} precios actualizados en memoria local.`); return;
    }
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
      return [product.name, product.id, categoryName(product), product.variants, product.available, product.price, product.status];
    })].map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); link.download = 'vestix-productos-demo.csv'; link.click(); URL.revokeObjectURL(link.href);
    announce(`${rows.length} productos de muestra exportados.`);
  }

  function openSupplierForm(supplier = null) {
    supplierEditId = supplier?.id || null; const form = $('#supplierForm'); form.reset();
    form.elements.companyName.value = supplier?.companyName || ''; form.elements.taxId.value = supplier?.taxId || ''; form.elements.contactName.value = supplier?.contactName || ''; form.elements.email.value = supplier?.email || '';
    form.elements.createBrand.checked = !supplier; form.elements.brandName.required = !supplier; $('#supplierBrandToggle').hidden = Boolean(supplier); $('#supplierBrandNameWrap').hidden = Boolean(supplier);
    $('#supplierFormTitle').textContent = supplier ? 'Editar proveedor' : 'Nuevo proveedor'; $('#supplierSaveLabel').textContent = supplier ? 'Guardar proveedor' : 'Crear proveedor y marca'; $('#supplierFormDialog').showModal(); form.elements.companyName.focus();
  }
  $('#supplierForm').elements.createBrand.addEventListener('change', (event) => { $('#supplierBrandNameWrap').hidden = !event.target.checked; $('#supplierForm').elements.brandName.required = event.target.checked; $('#supplierSaveLabel').textContent = event.target.checked ? 'Crear proveedor y marca' : 'Crear proveedor'; });
  $('#supplierForm').addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.currentTarget; const companyName = form.elements.companyName.value.trim(); const createBrand = form.elements.createBrand.checked; const brandName = form.elements.brandName.value.trim();
    if (createBrand && data.taxonomy.brands.some((brand) => brand.name.toLocaleLowerCase('es-AR') === brandName.toLocaleLowerCase('es-AR'))) { announce(`Ya existe una marca llamada ${brandName}.`); form.elements.brandName.focus(); return; }
    const fields = { companyName, taxId: form.elements.taxId.value.trim(), contactName: form.elements.contactName.value.trim(), email: form.elements.email.value.trim() };
    if (supplierEditId) Object.assign(data.taxonomy.suppliers.find((item) => item.id === supplierEditId), fields);
    else { const supplier = { id: `sup-${Date.now()}`, ...fields }; data.taxonomy.suppliers.push(supplier); if (createBrand) data.taxonomy.brands.push({ id: `brand-${Date.now()}`, name: brandName, supplierId: supplier.id }); }
    $('#supplierFormDialog').close(); populateTaxonomySelects(); renderTaxonomy(); renderSuppliers(); announce(supplierEditId ? `Proveedor ${companyName} actualizado.` : createBrand ? `Proveedor ${companyName} y marca ${brandName} creados y vinculados.` : `Proveedor ${companyName} creado.`); supplierEditId = null;
  });
  populateTaxonomySelects();
  populatePriceListSelects();
  $('#taxonomySearch').addEventListener('input', renderTaxonomy);
  $('#supplierSearch').addEventListener('input', renderSuppliers);
  $('#priceListSearch')?.addEventListener('input', renderPriceLists);
  $('#taxonomyForm').addEventListener('submit', (event) => { event.preventDefault(); const form = event.currentTarget; const name = form.elements.name.value.trim(); if (!name) return; const values = [...new Set(taxonomyDraftValues.map((value) => value.trim()).filter(Boolean))]; if (taxonomyItems().some((entry) => entry.id !== taxonomyEditId && entry.name.toLocaleLowerCase('es-AR') === name.toLocaleLowerCase('es-AR'))) { announce(`Ya existe un registro llamado ${name}.`); form.elements.name.focus(); return; } if (taxonomyKind === 'attributes' && !values.length) { announce('Agregá al menos un valor al atributo.'); $('#taxonomyValueDraft').focus(); return; } let item = taxonomyEditId ? taxonomyItems().find((entry) => entry.id === taxonomyEditId) : null; const oldName = item?.name; if (!item) { item = { id: `${taxonomyKind.slice(0,-1)}-${Date.now()}` }; taxonomyItems().push(item); } item.name = name; if (taxonomyKind === 'categories') item.parentId = form.elements.parentId.value; if (taxonomyKind === 'brands') item.supplierId = form.elements.supplierId.value; if (taxonomyKind === 'attributes') { const inUseValue = oldName && data.products.some((product) => (product.variantDetails || []).some((variant) => variant.attributes?.[oldName] && !values.includes(variant.attributes[oldName]))); if (inUseValue) { announce('No quites valores que ya usan variantes; reasignalos antes de editar el catálogo.'); $('#taxonomyValueDraft').focus(); return; } item.values = values; if (oldName && oldName !== name) data.products.forEach((product) => (product.variantDetails || []).forEach((variant) => { if (Object.hasOwn(variant.attributes || {}, oldName)) { variant.attributes[name] = variant.attributes[oldName]; delete variant.attributes[oldName]; } })); } if (taxonomyKind === 'categories') data.products.forEach((product) => { if (product.categoryId === item.id) product.category = name; }); if (taxonomyKind === 'brands') data.products.forEach((product) => { if (product.brandId === item.id) product.brand = name; }); $('#taxonomyFormDialog').close(); populateTaxonomySelects(); renderTaxonomy(); renderCatalog(); renderInventory(); renderProducts(); announce(`${name} guardado en el catálogo local.`); });
  function addTaxonomyValue() { const input = $('#taxonomyValueDraft'); const value = input.value.trim(); if (value && !taxonomyDraftValues.some((item) => item.toLocaleLowerCase('es-AR') === value.toLocaleLowerCase('es-AR'))) taxonomyDraftValues.push(value); input.value = ''; renderTaxonomyValueChips(); input.focus(); }
  $('#taxonomyValueDraft').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); addTaxonomyValue(); } });
  $('#comboComponent').innerHTML = data.products.map((product) => `<option value="${product.id}">${product.name} · ${product.id}</option>`).join('');
  $('#productSearch').addEventListener('input', renderCatalog);
  $('#catalogStatus').addEventListener('change', renderCatalog);
  $('#catalogCategory').addEventListener('change', renderCatalog);
  $('#catalogBrand').addEventListener('change', renderCatalog);
  $('#catalogStock').addEventListener('change', renderCatalog);
  $('#catalogPriceList').addEventListener('change', renderCatalog);
  $('#inventoryCategory').addEventListener('change', renderInventory);
  $('#bulkCategory').innerHTML = '<option value="all">Todas las categorías</option>' + data.taxonomy.categories.map((category) => `<option value="${category.id}">${escapeHTML(category.name)}</option>`).join('');
  $('#bulkBrand').innerHTML = '<option value="all">Todas las marcas</option>' + data.taxonomy.brands.map((brand) => `<option value="${brand.id}">${escapeHTML(brand.name)}</option>`).join('');
  ['bulkPriceList', 'bulkCategory', 'bulkBrand', 'bulkRounding'].forEach((id) => $('#' + id).addEventListener('change', renderBulkPreview));
  $('#bulkPercentage').addEventListener('input', renderBulkPreview);
  $('#bulkConfirmAll').addEventListener('change', renderBulkPreview);
  $('#productForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const get = (name) => form.elements.namedItem(name);
    const wasNew = !activeProduct;
    const id = get('id').value.trim();
    const type = get('type').value;
    if (type === 'VARIABLE' && !generatedVariants.length && !activeProduct) { announce('Generá la matriz de variantes antes de guardar el producto.'); $('[data-editor-tab="variantes"]').click(); return; }
    if (!productPriceConfigs.length || !Number(get('price').value || 0)) { announce('Definí un precio mayor a cero en la lista por defecto antes de guardar.'); $('[data-editor-tab="precios"]').click(); return; }
    const variantDetails = generatedVariants.length ? generatedVariants.map((variant, index) => ({ ...variant, sku: $(`[data-generated-sku="${index}"]`)?.value || variant.sku, barcode: $(`[data-editor-pane="variantes"] tbody tr:nth-child(${index + 1}) input[aria-label]`)?.value || '', stock: Number($(`[data-generated-stock="${index}"]`)?.value || 0) })) : [];
    const priorVariantSizes = [...new Set((activeProduct?.variantDetails || []).map((variant) => variant.size).filter(Boolean))];
    const sizes = generatedVariants.length ? [...new Set(generatedVariants.map((variant) => variant.size))] : (type === 'SINGLE' ? ['Único'] : priorVariantSizes.length ? priorVariantSizes : activeProduct?.sizes || ['Único']);
    const stock = generatedVariants.length
      ? sizes.map((size) => generatedVariants.filter((variant) => variant.size === size).reduce((total, variant, index) => total + Number($(`[data-generated-stock="${generatedVariants.indexOf(variant)}"]`)?.value ?? variant.stock ?? 0), 0))
      : activeProduct
        ? sizes.map((size) => (activeProduct.variantDetails || []).filter((variant) => variant.size === size).reduce((total, variant) => { const variantIndex = activeProduct.variantDetails.indexOf(variant); return total + Number($(`[data-edit-stock="${variantIndex}"]`)?.value ?? variant.stock ?? 0); }, 0))
        : sizes.map(() => 0);
    const product = activeProduct || { id, name: '', category: '', categoryId: '', brandId: '', color: '', sizes: [], stock: [], price: 0, variants: 0, status: 'Borrador', swatch: '#28636b' };
    const oldId = product.id;
    product.id = id; product.name = get('name').value.trim(); product.categoryId = get('category').value; product.category = data.taxonomy.categories.find((item) => item.id === product.categoryId)?.name || ''; product.brandId = get('brand').value; product.brand = data.taxonomy.brands.find((item) => item.id === product.brandId)?.name || ''; product.type = type;
    product.color = get('color').value.trim() || generatedVariants[0]?.color || 'Sin color';
    product.sizes = sizes.length ? sizes : ['Único'];
    product.stock = type === 'SINGLE' ? [Number(get('initialStock').value || 0)] : (stock.length ? stock : [0]);
    product.price = Number(get('price').value || 0); product.cost = Number(get('cost').value || 0); product.priceListPrices = productPriceConfigs.map((config) => ({ priceListId: config.priceListId, price: Math.round(config.finalPrice) }));
    product.status = get('published').checked && get('active').checked ? 'Publicado' : 'Borrador'; product.recipe = comboRecipe;
    if (generatedVariants.length) product.variantDetails = variantDetails; else if (type === 'SINGLE') product.variantDetails = [{ sku: id, barcode: '', size: 'Único', color: product.color, attributes: {}, stock: Number(get('initialStock').value || 0), isActive: true }]; else if (activeProduct) product.variantDetails = (activeProduct.variantDetails || []).map((variant, index) => ({ ...variant, stock: Number($(`[data-edit-stock="${index}"]`)?.value ?? variant.stock ?? 0) }));
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
  $('#productForm').elements.cost.addEventListener('input', () => {
    const cost = Number($('#productForm').elements.cost.value || 0);
    productPriceConfigs.forEach((config) => { if (config.mode === 'PERCENTAGE') config.finalPrice = cost > 0 ? Math.round(cost * (1 + config.markupValue / 100)) : 0; if (config.mode === 'FIXED') config.finalPrice = cost > 0 ? Math.round(cost + config.markupValue) : 0; });
    renderProductPriceCards();
  });
  $('#productPriceListCards').addEventListener('input', (event) => {
    const card = event.target.closest('[data-price-card]'); if (!card) return;
    if (event.target.matches('[data-price-markup]')) updatePriceConfig(card.dataset.priceCard, { markupValue: event.target.value });
    if (event.target.matches('[data-price-manual]')) updatePriceConfig(card.dataset.priceCard, { finalPrice: event.target.value });
  });
  $('#priceListForm').elements.type.addEventListener('change', (event) => { const modifier = event.target.value === 'MODIFIER'; $('#modifierPercentageWrap').hidden = !modifier; $('#priceListForm').elements.modifierPercentage.required = modifier; const isDefault = $('#priceListForm').elements.isDefault; if (modifier) isDefault.checked = false; isDefault.disabled = modifier || !$('#priceListForm').elements.isActive.checked; });
  $('#priceListForm').elements.isActive.addEventListener('change', (event) => { const isDefault = $('#priceListForm').elements.isDefault; isDefault.disabled = !event.target.checked || $('#priceListForm').elements.type.value === 'MODIFIER'; if (isDefault.disabled) isDefault.checked = false; });
  $('#priceListForm').addEventListener('submit', (event) => {
    event.preventDefault(); const form = event.currentTarget; const name = form.elements.name.value.trim(); const code = form.elements.code.value.trim().toUpperCase();
    const duplicate = data.priceLists.some((list) => list.id !== priceListEditId && (list.name.toLocaleLowerCase('es-AR') === name.toLocaleLowerCase('es-AR') || list.code.toLocaleUpperCase('es-AR') === code));
    if (duplicate) { announce('Ya existe una lista con ese nombre o código.'); form.elements.name.focus(); return; }
    if (form.elements.type.value === 'MODIFIER' && form.elements.modifierPercentage.value.trim() === '') { announce('Ingresá el porcentaje para la lista modificadora.'); form.elements.modifierPercentage.focus(); return; }
    const type = form.elements.type.value; const isActive = form.elements.isActive.checked; const isDefault = isActive && type === 'BASE' && form.elements.isDefault.checked;
    if (priceListEditId) { const list = data.priceLists.find((item) => item.id === priceListEditId); Object.assign(list, { name, code, currency: form.elements.currency.value, type, isActive, isDefault, modifierPercentage: type === 'MODIFIER' ? Number(form.elements.modifierPercentage.value || 0) : 0 }); }
    else data.priceLists.push({ id: `list-${Date.now()}`, name, code, currency: form.elements.currency.value, type, isActive, isDefault, modifierPercentage: type === 'MODIFIER' ? Number(form.elements.modifierPercentage.value || 0) : 0 });
    const saved = priceListEditId ? data.priceLists.find((list) => list.id === priceListEditId) : data.priceLists[data.priceLists.length - 1];
    if (saved?.isDefault) data.priceLists.forEach((list) => { if (list.id !== saved.id) list.isDefault = false; });
    $('#priceListFormDialog').close(); renderPriceLists(); renderCatalog(); announce(`${name} quedó ${isActive ? 'activa' : 'inactiva'} en las listas de precios.`); priceListEditId = null;
  });
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

  setTaxonomyTab(taxonomyKind);
  renderPriceLists();
  renderHome(); renderCatalog(); renderInventory(); renderSales(); renderProducts(); renderCart();
  const demoScreen = new URLSearchParams(window.location.search).get('demo');
  if (demoScreen === 'price-lists') switchScreen('price-lists');
  if (demoScreen === 'taxonomy') { setTaxonomyTab(new URLSearchParams(window.location.search).get('tab') || 'categories'); switchScreen('taxonomy'); }
  if (demoScreen === 'suppliers') switchScreen('suppliers');
  if (demoScreen === 'new-product') openProductEditor();
  if (demoScreen === 'bulk-prices') { openBulkPriceDialog(); $('#bulkPercentage').value = '10'; $('#bulkConfirmAll').checked = true; renderBulkPreview(); }
})();
