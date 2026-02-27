import {
  CATEGORIES,
  DEFAULT_CATEGORY_TABS,
  FALLBACK_IMAGE,
  HOME_CATEGORY_KEYS,
  PRODUCTS,
} from '../data/catalog-data';

/**
 * Capa de dominio del frontend.
 * Este modulo centraliza modelos/servicios de la app y devuelve un contenedor
 * `APP` con APIs estables usadas por las vistas React.
 */

/** Modelo de catalogo con soporte para personalizaciones admin persistidas localmente. */
class CatalogModel {
  constructor({ categories, products, homeCategoryKeys, defaultCategoryTabs }) {
    this.categories = categories;
    this.products = products;
    this.homeCategoryKeys = homeCategoryKeys;
    this.defaultCategoryTabs = defaultCategoryTabs;

    this.productOverridesStorageKey = 'hunnab_product_overrides';
    this.hiddenProductsStorageKey = 'hunnab_hidden_products';
    this.customProductsStorageKey = 'hunnab_custom_products';
    this.customCategoryProductsStorageKey = 'hunnab_custom_category_products';
    this.categoryAssignmentsStorageKey = 'hunnab_product_category_assignments';

    this.productOverrides = this.readObjectFromStorage(this.productOverridesStorageKey);
    this.hiddenProductIds = new Set(this.readArrayFromStorage(this.hiddenProductsStorageKey));
    this.customProducts = this.readObjectFromStorage(this.customProductsStorageKey);
    this.customCategoryProducts = this.readObjectFromStorage(this.customCategoryProductsStorageKey);
    this.categoryAssignments = this.readObjectFromStorage(this.categoryAssignmentsStorageKey);
  }

  // Storage helpers.
  isBrowser() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }

  readObjectFromStorage(key) {
    if (!this.isBrowser()) {
      return {};
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return {};
      }
      return parsed;
    } catch (error) {
      return {};
    }
  }

  readArrayFromStorage(key) {
    if (!this.isBrowser()) {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed;
    } catch (error) {
      return [];
    }
  }

  persistObjectToStorage(key, value) {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  persistArrayToStorage(key, value) {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  // Lecturas del catalogo para paginas y componentes.
  getHomeCategories() {
    return this.homeCategoryKeys
      .map((key) => {
        const category = this.getCategory(key);
        if (!category) {
          return null;
        }
        return { key, ...category };
      })
      .filter(Boolean);
  }

  getCategory(key) {
    return this.categories[key] ?? null;
  }

  getCategoryKeys() {
    return Object.keys(this.categories);
  }

  getRawProduct(id) {
    const key = String(id);
    return this.customProducts[key] ?? this.products[key] ?? null;
  }

  normalizeStockValue(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      return Math.max(0, Number.parseInt(fallback, 10) || 0);
    }
    return Math.max(0, parsed);
  }

  getProductOverrideObject(productId) {
    const key = String(productId);
    const currentOverride = this.productOverrides[key];
    if (currentOverride && !Array.isArray(currentOverride) && typeof currentOverride === 'object') {
      return { ...currentOverride };
    }
    return {};
  }

  getProduct(id, { includeHidden = false } = {}) {
    const key = String(id);
    const rawProduct = this.getRawProduct(key);
    if (!rawProduct) {
      return null;
    }

    const hidden = this.hiddenProductIds.has(key);
    if (hidden && !includeHidden) {
      return null;
    }

    const override = this.productOverrides[key];
    const normalizedOverride =
      override && !Array.isArray(override) && typeof override === 'object'
        ? override
        : typeof override === 'string'
          ? { title: override }
          : {};
    const mergedProduct = {
      ...rawProduct,
      ...normalizedOverride,
    };
    const fallbackStock = this.normalizeStockValue(rawProduct.stock, 0);

    return {
      ...mergedProduct,
      stock: this.normalizeStockValue(mergedProduct.stock, fallbackStock),
      _isHidden: hidden,
      _isCustom: Boolean(this.customProducts[key]),
    };
  }

  getMergedProductIds() {
    const baseIds = Object.keys(this.products);
    const customIds = Object.keys(this.customProducts);
    return [...new Set([...baseIds, ...customIds])];
  }

  getAllProducts({ includeHidden = false } = {}) {
    return this.getMergedProductIds()
      .map((id) => {
        const product = this.getProduct(id, { includeHidden });
        if (!product) {
          return null;
        }
        return { id, product };
      })
      .filter(Boolean);
  }

  getCategoryProducts(categoryKey, { includeHidden = false } = {}) {
    const category = this.getCategory(categoryKey);
    if (!category) {
      return [];
    }

    return this.getMergedProductIds()
      .map((id) => {
        const categories = this.getProductCategories(id);
        if (!categories.includes(categoryKey)) {
          return null;
        }
        const product = this.getProduct(id, { includeHidden });
        if (!product) {
          return null;
        }
        return { id, product };
      })
      .filter(Boolean);
  }

  getDefaultProductCategories(productId) {
    const id = String(productId);
    const categories = [];

    Object.keys(this.categories).forEach((categoryKey) => {
      const category = this.categories[categoryKey];
      if (Array.isArray(category?.products) && category.products.includes(id)) {
        categories.push(categoryKey);
      }
    });

    Object.keys(this.customCategoryProducts).forEach((categoryKey) => {
      const ids = this.customCategoryProducts[categoryKey];
      if (Array.isArray(ids) && ids.includes(id) && !categories.includes(categoryKey)) {
        categories.push(categoryKey);
      }
    });

    return categories;
  }

  normalizeCategoryList(value) {
    const validCategorySet = new Set(this.getCategoryKeys());
    const source = Array.isArray(value) ? value : [];
    return [...new Set(source.map((item) => String(item || '').trim()).filter((item) => validCategorySet.has(item)))];
  }

  areCategoryListsEqual(first, second) {
    const left = this.normalizeCategoryList(first).sort();
    const right = this.normalizeCategoryList(second).sort();
    if (left.length !== right.length) {
      return false;
    }
    return left.every((value, idx) => value === right[idx]);
  }

  getProductCategories(productId) {
    const key = String(productId);
    const assignedCategories = this.normalizeCategoryList(this.categoryAssignments[key]);
    if (assignedCategories.length > 0) {
      return assignedCategories;
    }
    return this.getDefaultProductCategories(key);
  }

  getAdminProducts() {
    return this.getMergedProductIds()
      .map((id) => {
        const product = this.getProduct(id, { includeHidden: true });
        if (!product) {
          return null;
        }
        return {
          id,
          product,
          categories: this.getProductCategories(id),
        };
      })
      .filter(Boolean);
  }

  // Operaciones CRUD visual usadas por el panel de super usuario.
  generateProductId(title) {
    const normalized = String(title || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const baseId = normalized || 'producto';
    let candidate = baseId;
    let counter = 1;
    while (this.getRawProduct(candidate)) {
      counter += 1;
      candidate = `${baseId}-${counter}`;
    }
    return candidate;
  }

  adminCreateProduct({ title, price, stock, img, imgHover = '', categoryKey }) {
    const safeTitle = String(title || '').trim();
    const safeImg = String(img || '').trim();
    const safeImgHover = String(imgHover || '').trim();
    const safeCategory = String(categoryKey || '').trim();
    const numericPrice = Number.parseFloat(price);
    const numericStock = Number.parseInt(stock, 10);

    if (
      !safeTitle
      || !safeImg
      || !safeCategory
      || Number.isNaN(numericPrice)
      || Number.isNaN(numericStock)
      || numericStock < 0
    ) {
      return { ok: false, error: 'Completa nombre, precio, stock, imagen y categoria.' };
    }
    if (!this.getCategory(safeCategory)) {
      return { ok: false, error: 'Categoria invalida.' };
    }

    const id = this.generateProductId(safeTitle);
    this.customProducts[id] = {
      title: safeTitle,
      price: numericPrice,
      stock: numericStock,
      img: safeImg,
      ...(safeImgHover ? { imgHover: safeImgHover } : {}),
    };

    const existingCategoryProducts = Array.isArray(this.customCategoryProducts[safeCategory])
      ? this.customCategoryProducts[safeCategory]
      : [];
    this.customCategoryProducts[safeCategory] = [...new Set([...existingCategoryProducts, id])];
    this.categoryAssignments[id] = [safeCategory];

    this.persistObjectToStorage(this.customProductsStorageKey, this.customProducts);
    this.persistObjectToStorage(this.customCategoryProductsStorageKey, this.customCategoryProducts);
    this.persistObjectToStorage(this.categoryAssignmentsStorageKey, this.categoryAssignments);

    return { ok: true, id };
  }

  adminUpdateProductVisualName({ id, title }) {
    const key = String(id);
    const rawProduct = this.getRawProduct(key);
    if (!rawProduct) {
      return { ok: false, error: 'Producto no encontrado.' };
    }

    const nextTitle = String(title || '').trim();
    if (!nextTitle) {
      return { ok: false, error: 'El nombre visual es obligatorio.' };
    }

    const baseTitle = String(rawProduct.title || '').trim();
    const currentOverride = this.productOverrides[key];
    const overrideObject =
      currentOverride && !Array.isArray(currentOverride) && typeof currentOverride === 'object'
        ? { ...currentOverride }
        : {};

    if (nextTitle === baseTitle) {
      delete overrideObject.title;
    } else {
      overrideObject.title = nextTitle;
    }

    if (Object.keys(overrideObject).length === 0) {
      delete this.productOverrides[key];
    } else {
      this.productOverrides[key] = overrideObject;
    }
    this.persistObjectToStorage(this.productOverridesStorageKey, this.productOverrides);
    return { ok: true };
  }

  adminUpdateProduct({ id, title, price, stock, img, imgHover = '', categories }) {
    const key = String(id);
    const rawProduct = this.getRawProduct(key);
    if (!rawProduct) {
      return { ok: false, error: 'Producto no encontrado.' };
    }

    const safeTitle = String(title || '').trim();
    const safeImg = String(img || '').trim();
    const safeImgHover = String(imgHover || '').trim();
    const numericPrice = Number.parseFloat(price);
    const numericStock = Number.parseInt(stock, 10);
    const normalizedCategories = this.normalizeCategoryList(categories);

    if (!safeTitle || !safeImg || Number.isNaN(numericPrice) || Number.isNaN(numericStock) || numericStock < 0) {
      return { ok: false, error: 'Nombre, precio, stock e imagen principal son obligatorios.' };
    }
    if (normalizedCategories.length === 0) {
      return { ok: false, error: 'Selecciona al menos una categoria.' };
    }

    const baseTitle = String(rawProduct.title || '').trim();
    const basePrice = Number.isFinite(Number(rawProduct.price)) ? Number(rawProduct.price) : 0;
    const baseStock = this.normalizeStockValue(rawProduct.stock, 0);
    const baseImg = String(rawProduct.img || '').trim();
    const baseImgHover = String(rawProduct.imgHover || '').trim();

    const nextOverride = this.getProductOverrideObject(key);
    if (safeTitle !== baseTitle) {
      nextOverride.title = safeTitle;
    } else {
      delete nextOverride.title;
    }
    if (numericPrice !== basePrice) {
      nextOverride.price = numericPrice;
    } else {
      delete nextOverride.price;
    }
    if (numericStock !== baseStock) {
      nextOverride.stock = numericStock;
    } else {
      delete nextOverride.stock;
    }
    if (safeImg !== baseImg) {
      nextOverride.img = safeImg;
    } else {
      delete nextOverride.img;
    }
    if (safeImgHover !== baseImgHover) {
      nextOverride.imgHover = safeImgHover;
    } else {
      delete nextOverride.imgHover;
    }

    if (Object.keys(nextOverride).length === 0) {
      delete this.productOverrides[key];
    } else {
      this.productOverrides[key] = nextOverride;
    }

    const defaultCategories = this.getDefaultProductCategories(key);
    if (this.areCategoryListsEqual(normalizedCategories, defaultCategories)) {
      delete this.categoryAssignments[key];
    } else {
      this.categoryAssignments[key] = normalizedCategories;
    }

    this.persistObjectToStorage(this.productOverridesStorageKey, this.productOverrides);
    this.persistObjectToStorage(this.categoryAssignmentsStorageKey, this.categoryAssignments);

    return { ok: true };
  }

  adminHideProduct(id) {
    const key = String(id);
    if (!this.getRawProduct(key)) {
      return { ok: false, error: 'Producto no encontrado.' };
    }
    this.hiddenProductIds.add(key);
    this.persistArrayToStorage(this.hiddenProductsStorageKey, Array.from(this.hiddenProductIds));
    return { ok: true };
  }

  adminRestoreProduct(id) {
    const key = String(id);
    this.hiddenProductIds.delete(key);
    this.persistArrayToStorage(this.hiddenProductsStorageKey, Array.from(this.hiddenProductIds));
    return { ok: true };
  }

  consumeStockForOrder(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, error: 'No hay productos para descontar stock.' };
    }

    const normalizedItems = items
      .map((item) => ({
        productId: String(item?.productId || ''),
        quantity: Number.parseInt(item?.quantity, 10),
      }))
      .filter((item) => item.productId && Number.isInteger(item.quantity) && item.quantity > 0);

    if (normalizedItems.length === 0) {
      return { ok: false, error: 'No hay cantidades validas para descontar stock.' };
    }

    const groupedByProduct = normalizedItems.reduce((acc, item) => {
      const key = String(item.productId);
      const currentQty = acc.get(key) || 0;
      acc.set(key, currentQty + item.quantity);
      return acc;
    }, new Map());

    const insufficient = [];
    groupedByProduct.forEach((quantity, productId) => {
      const product = this.getProduct(productId, { includeHidden: true });
      if (!product) {
        insufficient.push(`Producto ${productId} no disponible`);
        return;
      }
      const available = this.normalizeStockValue(product.stock, 0);
      if (quantity > available) {
        insufficient.push(`${product.title} (solicitado ${quantity}, disponible ${available})`);
      }
    });

    if (insufficient.length > 0) {
      return {
        ok: false,
        error: `Stock insuficiente: ${insufficient.join('; ')}`,
      };
    }

    groupedByProduct.forEach((quantity, productId) => {
      const product = this.getProduct(productId, { includeHidden: true });
      if (!product) {
        return;
      }

      const key = String(productId);
      const nextStock = this.normalizeStockValue(product.stock, 0) - quantity;
      const rawProduct = this.getRawProduct(key);
      if (!rawProduct) {
        return;
      }
      const baseStock = this.normalizeStockValue(rawProduct.stock, 0);
      const overrideObject = this.getProductOverrideObject(key);

      if (nextStock === baseStock) {
        delete overrideObject.stock;
      } else {
        overrideObject.stock = nextStock;
      }

      if (Object.keys(overrideObject).length === 0) {
        delete this.productOverrides[key];
      } else {
        this.productOverrides[key] = overrideObject;
      }
    });

    this.persistObjectToStorage(this.productOverridesStorageKey, this.productOverrides);
    return { ok: true };
  }

  // Metadatos auxiliares de UI.
  getCategoryInfoTabs(category) {
    return this.defaultCategoryTabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      content: typeof tab.content === 'function' ? tab.content(category) : tab.content,
    }));
  }

  getSearchItems() {
    return [
      { label: 'Inicio', route: '#/' },
      { label: 'Quienes Somos', route: '#/quienes-somos' },
      ...Object.keys(this.categories).map((key) => ({
        label: this.categories[key].title,
        route: `#/${key}`,
      })),
    ];
  }
}

/** Normaliza rutas de imagen para que siempre sean renderizables por el frontend. */
class ImageManager {
  constructor(fallbackImage) {
    this.fallbackImage = fallbackImage;
  }

  normalize(path) {
    if (!path) {
      return this.fallbackImage;
    }

    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
      return path;
    }

    return `/${path}`;
  }

  getFallbackImage() {
    return this.fallbackImage;
  }
}

/** Formateador central de moneda para consistencia visual. */
class CurrencyManager {
  formatMXN(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return safeValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}

/** Router hash minimalista (sin libreria externa). */
class RouteManager {
  parseHash(hashValue) {
    const value = (hashValue || '').replace(/^#\/?/, '');

    if (!value) {
      return { kind: 'home' };
    }

    if (value === 'quienes-somos') {
      return { kind: 'about' };
    }

    if (value === 'carrito') {
      return { kind: 'cart' };
    }

    if (value === 'checkout') {
      return { kind: 'checkout' };
    }

    if (value === 'cuenta') {
      return { kind: 'account' };
    }

    if (value.startsWith('p/')) {
      return { kind: 'product', id: value.slice(2) };
    }

    return { kind: 'category', key: value };
  }

  getCurrentRoute() {
    if (typeof window === 'undefined') {
      return { kind: 'home' };
    }

    return this.parseHash(window.location.hash);
  }
}

/** Carrito en localStorage con patron de suscripcion para reactividad. */
class CartManager {
  constructor({ storageKey = 'hunnab_cart' } = {}) {
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.items = this.readFromStorage();
  }

  readFromStorage() {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const normalizedItems = parsed
        .map((item) => this.normalizeItem(item))
        .filter(Boolean);

      // Compatibilidad con carritos antiguos que separaban por color.
      const mergedByProduct = new Map();
      normalizedItems.forEach((item) => {
        const existing = mergedByProduct.get(item.productId);
        if (!existing) {
          mergedByProduct.set(item.productId, { ...item });
          return;
        }
        mergedByProduct.set(item.productId, {
          ...existing,
          quantity: Math.min(99, existing.quantity + item.quantity),
        });
      });
      return Array.from(mergedByProduct.values());
    } catch (error) {
      return [];
    }
  }

  persist() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(this.storageKey, JSON.stringify(this.items));
  }

  emit() {
    this.listeners.forEach((listener) => listener());
  }

  // Normaliza y valida cada item antes de persistir.
  normalizeItem(item) {
    if (!item || !item.productId) {
      return null;
    }

    const quantity = Number.parseInt(item.quantity, 10);
    if (Number.isNaN(quantity) || quantity <= 0) {
      return null;
    }

    return {
      productId: String(item.productId),
      quantity: Math.max(1, Math.min(99, quantity)),
    };
  }

  findItemIndex(productId) {
    return this.items.findIndex((item) => item.productId === productId);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getItemQuantity(productId) {
    const idx = this.findItemIndex(String(productId));
    if (idx < 0) {
      return 0;
    }
    return this.items[idx].quantity;
  }

  addItem({ productId, quantity = 1 }) {
    const normalized = this.normalizeItem({ productId, quantity });
    if (!normalized) {
      return;
    }

    const idx = this.findItemIndex(normalized.productId);
    if (idx >= 0) {
      this.items[idx] = {
        ...this.items[idx],
        quantity: Math.min(99, this.items[idx].quantity + normalized.quantity),
      };
    } else {
      this.items.push(normalized);
    }

    this.persist();
    this.emit();
  }

  updateItemQuantity({ productId, quantity }) {
    const normalizedQty = Number.parseInt(quantity, 10);
    if (Number.isNaN(normalizedQty)) {
      return;
    }

    if (normalizedQty <= 0) {
      this.removeItem({ productId });
      return;
    }

    const idx = this.findItemIndex(String(productId));
    if (idx < 0) {
      return;
    }

    this.items[idx] = {
      ...this.items[idx],
      quantity: Math.min(99, normalizedQty),
    };

    this.persist();
    this.emit();
  }

  removeItem({ productId }) {
    const idx = this.findItemIndex(String(productId));
    if (idx < 0) {
      return;
    }

    this.items.splice(idx, 1);
    this.persist();
    this.emit();
  }

  clear() {
    this.items = [];
    this.persist();
    this.emit();
  }

  // Enriquece el carrito con datos de catalogo para render.
  getDetailedItems(catalogModel, imageManager) {
    return this.items
      .map((item) => {
        const product = catalogModel.getProduct(item.productId);
        if (!product) {
          return null;
        }

        const unitPrice = Number.isFinite(product.price) ? product.price : 0;
        return {
          ...item,
          title: product.title,
          image: imageManager.normalize(product.img),
          stock: Number.isFinite(product.stock) ? Math.max(0, Number.parseInt(product.stock, 10) || 0) : 0,
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      })
      .filter(Boolean);
  }
}

/** Cliente de pedidos contra API MySQL. */
class OrderManager {
  constructor({
    apiBase = process.env.REACT_APP_API_BASE || '',
    authTokenStorageKey = 'hunnab_auth_token',
  } = {}) {
    this.apiBase = apiBase;
    this.authTokenStorageKey = authTokenStorageKey;
  }

  buildApiUrl(path) {
    if (!this.apiBase) {
      return path;
    }
    return `${this.apiBase}${path}`;
  }

  readAuthToken() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return '';
    }
    return String(window.localStorage.getItem(this.authTokenStorageKey) || '').trim();
  }

  getAuthorizationHeaders(baseHeaders = {}) {
    const token = this.readAuthToken();
    if (!token) {
      return { ...baseHeaders };
    }
    return {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  async parseResponse(response, defaultError) {
    const responseStatus = Number(response?.status || 0);
    const rawBody = await response.text().catch(() => '');
    const bodyText = String(rawBody || '');
    const trimmedBody = bodyText.trim();

    const isHtmlResponse = /^<!doctype html>/i.test(trimmedBody) || /^<html/i.test(trimmedBody);
    const isMissingRoute = /Cannot (GET|POST|PUT|PATCH|DELETE)\s+\/api\//i.test(bodyText);
    const isProxyConnectionError =
      /Error occurred while trying to proxy/i.test(bodyText) ||
      /ECONNREFUSED/i.test(bodyText);

    // A veces el frontend recibe HTML (index/fallback) con HTTP 200 cuando la API
    // no esta enrutada correctamente. Se trata como error de backend ausente.
    if (response.ok && (isMissingRoute || isHtmlResponse)) {
      return {
        ok: false,
        error: 'La API no respondio JSON valido. Verifica que el backend este activo con "npm run api".',
      };
    }

    if (!response.ok && (isMissingRoute || isHtmlResponse || isProxyConnectionError)) {
      if (isMissingRoute || responseStatus === 404) {
        return {
          ok: false,
          error: 'La API no tiene activa esta ruta. Reinicia el backend con "npm run api".',
        };
      }
      if (isProxyConnectionError || responseStatus === 502 || responseStatus === 503 || responseStatus === 504) {
        return {
          ok: false,
          error: 'No hay conexion con la API (puerto 4000). Inicia el backend con "npm run api".',
        };
      }
    }

    if (!response.ok && (responseStatus === 401 || responseStatus === 403)) {
      return {
        ok: false,
        error: 'Tu sesion expiro o no tiene permisos. Cierra sesion e inicia de nuevo.',
      };
    }

    try {
      const data = bodyText ? JSON.parse(bodyText) : {};
      if (!response.ok) {
        return { ok: false, error: data?.error || defaultError };
      }
      return { ok: true, data };
    } catch (error) {
      if (!response.ok) {
        return { ok: false, error: defaultError };
      }
      return { ok: true, data: {} };
    }
  }

  async createFromCart({ user, items, total }) {
    if (!user || !Array.isArray(items) || items.length === 0) {
      return { ok: false, error: 'No hay datos suficientes para crear el pedido.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/orders/create'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          user: {
            id: user.id ?? null,
            usuario: user.usuario ?? '',
            nombre: user.nombre ?? user.usuario ?? '',
          },
          items: items.map((item) => ({
            productId: item.productId,
            title: item.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          total,
        }),
      });

      const result = await this.parseResponse(response, 'No se pudo guardar el pedido en MySQL.');
      if (!result.ok || !result.data?.order) {
        return { ok: false, error: result.error || 'No se pudo guardar el pedido en MySQL.' };
      }
      return { ok: true, order: result.data.order };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async createPayPalOrder({ total }) {
    const safeTotal = Number(total);
    if (!Number.isFinite(safeTotal) || safeTotal <= 0) {
      return { ok: false, error: 'Total invalido para crear orden PayPal.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/paypal/create-order'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ total: Number(safeTotal.toFixed(2)) }),
      });
      const result = await this.parseResponse(response, 'No se pudo crear la orden de PayPal.');
      if (!result.ok || !result.data?.approvalUrl || !result.data?.id) {
        return { ok: false, error: result.error || 'No se pudo crear la orden de PayPal.' };
      }
      return {
        ok: true,
        id: String(result.data.id),
        approvalUrl: String(result.data.approvalUrl),
      };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async capturePayPalOrder({ orderId }) {
    const safeOrderId = String(orderId || '').trim();
    if (!safeOrderId) {
      return { ok: false, error: 'orderId es obligatorio para capturar PayPal.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/paypal/capture-order'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ orderId: safeOrderId }),
      });
      const result = await this.parseResponse(response, 'No se pudo capturar la orden de PayPal.');
      if (!result.ok) {
        return { ok: false, error: result.error || 'No se pudo capturar la orden de PayPal.' };
      }
      return { ok: true, capture: result.data?.capture || null };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async getUserOrders(user) {
    const userId = Number.parseInt(user?.id, 10);
    const username = String(user?.usuario || '').trim();
    if ((!Number.isInteger(userId) || userId <= 0) && !username) {
      return { ok: false, orders: [], error: 'No hay sesion valida para consultar pedidos.' };
    }

    try {
      const query = new URLSearchParams();
      if (Number.isInteger(userId) && userId > 0) {
        query.set('userId', String(userId));
      }
      if (username) {
        query.set('usuario', username);
      }
      const response = await fetch(this.buildApiUrl(`/api/orders/user-orders?${query.toString()}`), {
        headers: this.getAuthorizationHeaders(),
      });
      const result = await this.parseResponse(response, 'No se pudieron cargar tus pedidos.');
      if (!result.ok) {
        return { ok: false, orders: [], error: result.error || 'No se pudieron cargar tus pedidos.' };
      }
      return {
        ok: true,
        orders: Array.isArray(result.data?.orders) ? result.data.orders : [],
        error: '',
      };
    } catch (error) {
      return { ok: false, orders: [], error: 'No hay conexion con el servidor API.' };
    }
  }

  async getAdminOrders(user) {
    const userId = Number.parseInt(user?.id, 10);
    const username = String(user?.usuario || '').trim();
    if (!Number.isInteger(userId) || userId <= 0 || !username) {
      return { ok: false, orders: [], error: 'No hay sesion valida para consultar pedidos de administrador.' };
    }

    try {
      const query = new URLSearchParams({
        userId: String(userId),
        usuario: username,
      });
      const response = await fetch(this.buildApiUrl(`/api/orders/admin-orders?${query.toString()}`), {
        headers: this.getAuthorizationHeaders(),
      });
      const result = await this.parseResponse(response, 'No se pudieron cargar los pedidos del panel admin.');
      if (!result.ok) {
        return { ok: false, orders: [], error: result.error || 'No se pudieron cargar los pedidos del panel admin.' };
      }
      return {
        ok: true,
        orders: Array.isArray(result.data?.orders) ? result.data.orders : [],
        error: '',
      };
    } catch (error) {
      return { ok: false, orders: [], error: 'No hay conexion con el servidor API.' };
    }
  }

  async updateOrderStatus({ adminUser, orderId, status }) {
    const adminUserId = Number.parseInt(adminUser?.id, 10);
    const hasValidAdminUserId = Number.isInteger(adminUserId) && adminUserId > 0;
    const adminUsername = String(adminUser?.usuario || '').trim();
    const parsedOrderId = Number.parseInt(orderId, 10);
    const normalizedStatus = String(status || '').trim().toUpperCase().replace(/\s+/g, ' ');
    const allowedStatuses = ['PENDIENTE', 'EN PREPARACION', 'ENVIADO'];

    if (!adminUsername || !Number.isInteger(parsedOrderId) || parsedOrderId <= 0) {
      return { ok: false, error: 'Datos incompletos para actualizar el pedido.' };
    }
    if (!allowedStatuses.includes(normalizedStatus)) {
      return { ok: false, error: 'Estado de pedido no permitido.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/orders/admin-update-status'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          adminUserId: hasValidAdminUserId ? adminUserId : null,
          adminUsername,
          orderId: parsedOrderId,
          status: normalizedStatus,
        }),
      });
      const result = await this.parseResponse(response, 'No se pudo actualizar el estado del pedido.');
      if (!result.ok) {
        return { ok: false, error: result.error || 'No se pudo actualizar el estado del pedido.' };
      }
      return { ok: true, order: result.data?.order || null };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }
}

/** Flujo de pago/checkout con simulacion y persistencia local del resumen. */
class CheckoutManager {
  constructor({
    cartManager,
    catalogModel,
    imageManager,
    orderManager,
    storageKey = 'hunnab_checkout',
  }) {
    this.cartManager = cartManager;
    this.catalogModel = catalogModel;
    this.imageManager = imageManager;
    this.orderManager = orderManager;
    this.storageKey = storageKey;
    this.state = this.readState();
  }

  isBrowser() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }

  readState() {
    if (!this.isBrowser()) {
      return { draft: null, receipt: null, pendingPayPal: null };
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return { draft: null, receipt: null, pendingPayPal: null };
      }
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return { draft: null, receipt: null, pendingPayPal: null };
      }
      return {
        draft: parsed.draft && typeof parsed.draft === 'object' ? parsed.draft : null,
        receipt: parsed.receipt && typeof parsed.receipt === 'object' ? parsed.receipt : null,
        pendingPayPal:
          parsed.pendingPayPal && typeof parsed.pendingPayPal === 'object' ? parsed.pendingPayPal : null,
      };
    } catch (error) {
      return { draft: null, receipt: null, pendingPayPal: null };
    }
  }

  persist() {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.state));
  }

  getDraft() {
    return this.state.draft;
  }

  getReceipt() {
    return this.state.receipt;
  }

  clear() {
    this.state = { draft: null, receipt: null, pendingPayPal: null };
    this.persist();
  }

  prepareFromCart({ user }) {
    if (!user || !user.usuario) {
      return { ok: false, error: 'Inicia sesion para continuar al checkout.' };
    }

    const items = this.cartManager.getDetailedItems(this.catalogModel, this.imageManager);
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, error: 'Tu carrito esta vacio.' };
    }

    const hasStockConflict = items.some((item) => item.stock <= 0 || item.quantity > item.stock);
    if (hasStockConflict) {
      return { ok: false, error: 'Hay productos con stock insuficiente.' };
    }

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    this.state = {
      draft: {
        createdAt: new Date().toISOString(),
        user: {
          id: user.id ?? null,
          usuario: user.usuario ?? '',
          nombre: user.nombre ?? user.usuario ?? '',
        },
        items: items.map((item) => ({
          productId: item.productId,
          title: item.title,
          image: item.image,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          subtotal: item.subtotal,
          stock: item.stock,
        })),
        total,
      },
      receipt: null,
      pendingPayPal: null,
    };
    this.persist();
    return { ok: true, draft: this.state.draft };
  }

  normalizeShippingPayload(shipping = {}) {
    return {
      fullName: String(shipping.fullName || '').trim(),
      email: String(shipping.email || '').trim(),
      phone: String(shipping.phone || '').trim(),
      address: String(shipping.address || '').trim(),
      city: String(shipping.city || '').trim(),
      state: String(shipping.state || '').trim(),
      postalCode: String(shipping.postalCode || '').trim(),
      shippingMethod: String(shipping.shippingMethod || 'estandar').trim(),
    };
  }

  normalizePaymentPayload(payment = {}) {
    return {
      method: String(payment.method || '').trim(),
    };
  }

  async completeCheckoutAfterPaid({ draft, shipping, payment, paypalCapture = null }) {
    const orderResult = await this.orderManager.createFromCart({
      user: draft.user,
      items: draft.items,
      total: draft.total,
    });
    if (!orderResult?.ok || !orderResult.order) {
      return { ok: false, error: orderResult?.error || 'No se pudo crear el pedido.' };
    }

    const stockResult = this.catalogModel.consumeStockForOrder(draft.items);
    if (!stockResult?.ok) {
      return { ok: false, error: stockResult?.error || 'No se pudo actualizar el stock.' };
    }

    this.cartManager.clear();
    this.state = {
      draft: null,
      receipt: {
        paidAt: new Date().toISOString(),
        shipping: this.normalizeShippingPayload(shipping),
        payment: this.normalizePaymentPayload(payment),
        order: orderResult.order,
        paypalCapture: paypalCapture || null,
      },
      pendingPayPal: null,
    };
    this.persist();
    return { ok: true, receipt: this.state.receipt };
  }

  validateCheckoutPayload({ shipping, payment }) {
    const fullName = String(shipping?.fullName || '').trim();
    const email = String(shipping?.email || '').trim();
    const phone = String(shipping?.phone || '').replace(/\D+/g, '').trim();
    const address = String(shipping?.address || '').trim();
    const city = String(shipping?.city || '').trim();
    const state = String(shipping?.state || '').trim();
    const postalCode = String(shipping?.postalCode || '').replace(/\D+/g, '').trim();
    const method = String(payment?.method || '').trim();

    if (!fullName || !email || !address || !city || !state || !postalCode) {
      return { ok: false, error: 'Completa todos los datos de envio.' };
    }
    if (phone && phone.length !== 10) {
      return { ok: false, error: 'El telefono debe tener 10 digitos.' };
    }
    if (postalCode.length !== 5) {
      return { ok: false, error: 'El codigo postal debe tener 5 digitos.' };
    }
    if (!method) {
      return { ok: false, error: 'Selecciona un metodo de pago.' };
    }

    if (method === 'tarjeta') {
      const cardNumber = String(payment?.cardNumber || '').replace(/\s+/g, '');
      const cardHolder = String(payment?.cardHolder || '').trim();
      const cardExpiry = String(payment?.cardExpiry || '').trim();
      const cardCvv = String(payment?.cardCvv || '').trim();
      const expiryMatch = /^(\d{2})\/(\d{2})$/.exec(cardExpiry);
      const expiryMonth = expiryMatch ? Number(expiryMatch[1]) : 0;
      if (
        cardNumber.length !== 16 ||
        !cardHolder ||
        !expiryMatch ||
        !Number.isInteger(expiryMonth) ||
        expiryMonth < 1 ||
        expiryMonth > 12 ||
        cardCvv.length !== 3
      ) {
        return { ok: false, error: 'Completa los datos de la tarjeta para simular el pago.' };
      }
    }

    return { ok: true };
  }

  async processSimulatedPayment({ shipping, payment }) {
    const draft = this.getDraft();
    if (!draft || !Array.isArray(draft.items) || draft.items.length === 0) {
      return { ok: false, error: 'No hay un checkout activo para procesar.' };
    }

    const validation = this.validateCheckoutPayload({ shipping, payment });
    if (!validation.ok) {
      return validation;
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
    return this.completeCheckoutAfterPaid({
      draft,
      shipping,
      payment,
      paypalCapture: null,
    });
  }

  async startPayPalPayment({ shipping, payment }) {
    const draft = this.getDraft();
    if (!draft || !Array.isArray(draft.items) || draft.items.length === 0) {
      return { ok: false, error: 'No hay un checkout activo para procesar.' };
    }

    const validation = this.validateCheckoutPayload({ shipping, payment: { ...payment, method: 'paypal' } });
    if (!validation.ok) {
      return validation;
    }

    const createResult = await this.orderManager.createPayPalOrder({ total: draft.total });
    if (!createResult?.ok || !createResult.approvalUrl || !createResult.id) {
      return { ok: false, error: createResult?.error || 'No se pudo crear la orden de PayPal.' };
    }

    this.state = {
      ...this.state,
      pendingPayPal: {
        orderId: createResult.id,
        shipping: this.normalizeShippingPayload(shipping),
        payment: this.normalizePaymentPayload({ ...payment, method: 'paypal' }),
        createdAt: new Date().toISOString(),
      },
    };
    this.persist();
    return { ok: true, orderId: createResult.id, approvalUrl: createResult.approvalUrl };
  }

  async capturePayPalPayment({ orderId }) {
    const draft = this.getDraft();
    if (!draft || !Array.isArray(draft.items) || draft.items.length === 0) {
      return { ok: false, error: 'No hay un checkout activo para procesar.' };
    }

    const safeOrderId = String(orderId || '').trim();
    if (!safeOrderId) {
      return { ok: false, error: 'No se recibio el identificador de orden de PayPal.' };
    }

    const captureResult = await this.orderManager.capturePayPalOrder({ orderId: safeOrderId });
    if (!captureResult?.ok) {
      return { ok: false, error: captureResult?.error || 'No se pudo capturar la orden de PayPal.' };
    }

    const pendingShipping = this.state.pendingPayPal?.shipping || {};
    const pendingPayment = this.state.pendingPayPal?.payment || { method: 'paypal' };
    return this.completeCheckoutAfterPaid({
      draft,
      shipping: pendingShipping,
      payment: { ...pendingPayment, method: 'paypal' },
      paypalCapture: captureResult.capture,
    });
  }
}

/** Buscador local sobre rutas/categorias del catalogo. */
class SearchManager {
  constructor(catalogModel) {
    this.catalogModel = catalogModel;
  }

  filter(query) {
    const items = this.catalogModel.getSearchItems();
    const normalizedQuery = (query || '').trim().toLowerCase();

    if (!normalizedQuery) {
      return items;
    }

    return items.filter((item) => item.label.toLowerCase().includes(normalizedQuery));
  }
}

/**
 * Cliente de autenticacion del frontend.
 * Mantiene sesion en localStorage y conversa con la API (`/api/auth/*`).
 */
class AuthManager {
  constructor({
    apiBase = process.env.REACT_APP_API_BASE || '',
    sessionStorageKey = 'sesionActiva',
    sessionUserStorageKey = 'usuarioSesion',
    authTokenStorageKey = 'hunnab_auth_token',
    accountSettingsStorageKey = 'hunnab_account_settings',
  } = {}) {
    this.apiBase = apiBase;
    this.sessionStorageKey = sessionStorageKey;
    this.sessionUserStorageKey = sessionUserStorageKey;
    this.authTokenStorageKey = authTokenStorageKey;
    this.accountSettingsStorageKey = accountSettingsStorageKey;
  }

  isBrowser() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }

  buildApiUrl(path) {
    if (!this.apiBase) {
      return path;
    }
    return `${this.apiBase}${path}`;
  }

  // Estado de sesion persistido localmente.
  readSessionUser() {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(this.sessionUserStorageKey);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.usuario) {
        return null;
      }
      const parsedRole = parsed.tipoUsuario ?? parsed.tipo_usuario ?? parsed.role ?? '';
      return {
        id: parsed.id ? Number(parsed.id) : null,
        nombre: parsed.nombre ? String(parsed.nombre) : String(parsed.usuario),
        correo: parsed.correo ? String(parsed.correo) : '',
        usuario: String(parsed.usuario),
        tipoUsuario: parsedRole ? String(parsedRole) : 'CUENTA',
      };
    } catch (error) {
      return null;
    }
  }

  writeSessionUser(user) {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.sessionUserStorageKey, JSON.stringify(user));
  }

  readAuthToken() {
    if (!this.isBrowser()) {
      return '';
    }
    return String(window.localStorage.getItem(this.authTokenStorageKey) || '').trim();
  }

  writeAuthToken(token) {
    if (!this.isBrowser()) {
      return;
    }
    const safeToken = String(token || '').trim();
    if (!safeToken) {
      window.localStorage.removeItem(this.authTokenStorageKey);
      return;
    }
    window.localStorage.setItem(this.authTokenStorageKey, safeToken);
  }

  getAuthorizationHeaders(baseHeaders = {}) {
    const token = this.readAuthToken();
    if (!token) {
      return { ...baseHeaders };
    }
    return {
      ...baseHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  isSessionActive() {
    if (!this.isBrowser()) {
      return false;
    }
    return window.localStorage.getItem(this.sessionStorageKey) === 'true';
  }

  setSessionActive(isActive) {
    if (!this.isBrowser()) {
      return;
    }
    if (isActive) {
      window.localStorage.setItem(this.sessionStorageKey, 'true');
      return;
    }
    window.localStorage.removeItem(this.sessionStorageKey);
    window.localStorage.removeItem(this.sessionUserStorageKey);
    window.localStorage.removeItem(this.authTokenStorageKey);
  }

  readAccountSettingsStore() {
    if (!this.isBrowser()) {
      return {};
    }

    try {
      const raw = window.localStorage.getItem(this.accountSettingsStorageKey);
      if (!raw) {
        return {};
      }
      const parsed = JSON.parse(raw);
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        return {};
      }
      return parsed;
    } catch (error) {
      return {};
    }
  }

  writeAccountSettingsStore(store) {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.accountSettingsStorageKey, JSON.stringify(store));
  }

  getUserSettingsKey(user) {
    if (!user) {
      return '';
    }
    if (user.id !== null && user.id !== undefined && `${user.id}`.trim() !== '') {
      return `id:${String(user.id)}`;
    }
    const username = String(user.usuario || '').trim().toLowerCase();
    if (!username) {
      return '';
    }
    return `user:${username}`;
  }

  normalizePaymentMethod(method) {
    if (!method || typeof method !== 'object') {
      return null;
    }

    const type = String(method.type || 'Tarjeta').trim();
    const alias = String(method.alias || '').trim();
    const holder = String(method.holder || '').trim();
    const last4Raw = String(method.last4 || '').trim();
    const expiry = String(method.expiry || '').trim();
    const digitsOnly = last4Raw.replace(/\D/g, '');
    const last4 = digitsOnly.slice(-4);

    if (!alias || !holder || last4.length !== 4 || !expiry) {
      return null;
    }

    return {
      id: String(method.id || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
      type,
      alias,
      holder,
      last4,
      expiry,
    };
  }

  getAccountSettings(user) {
    const key = this.getUserSettingsKey(user);
    const defaultSettings = {
      nombre: String(user?.nombre || user?.usuario || '').trim(),
      correo: String(user?.correo || '').trim(),
      direccionEnvio: '',
      paymentMethods: [],
    };

    if (!key) {
      return defaultSettings;
    }

    const store = this.readAccountSettingsStore();
    const entry = store[key];
    if (!entry || typeof entry !== 'object') {
      return defaultSettings;
    }

    const methods = Array.isArray(entry.paymentMethods)
      ? entry.paymentMethods.map((method) => this.normalizePaymentMethod(method)).filter(Boolean)
      : [];

    return {
      nombre: String(entry.nombre || defaultSettings.nombre).trim(),
      correo: String(entry.correo || defaultSettings.correo).trim(),
      direccionEnvio: String(entry.direccionEnvio || '').trim(),
      paymentMethods: methods,
    };
  }

  saveAccountSettings(user, { nombre, correo, direccionEnvio }) {
    const key = this.getUserSettingsKey(user);
    if (!key) {
      return { ok: false, error: 'No hay sesion activa para guardar datos.' };
    }

    const safeName = String(nombre || '').trim();
    const safeEmail = String(correo || '').trim().toLowerCase();
    const safeAddress = String(direccionEnvio || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!safeName || !safeEmail) {
      return { ok: false, error: 'Nombre y correo son obligatorios.' };
    }
    if (!emailPattern.test(safeEmail)) {
      return { ok: false, error: 'Ingresa un correo electronico valido.' };
    }

    const store = this.readAccountSettingsStore();
    const current = this.getAccountSettings(user);
    const nextSettings = {
      ...current,
      nombre: safeName,
      correo: safeEmail,
      direccionEnvio: safeAddress,
    };

    store[key] = nextSettings;
    this.writeAccountSettingsStore(store);

    const sessionUser = this.getSessionUser();
    if (this.getUserSettingsKey(sessionUser) === key && sessionUser) {
      const nextSessionUser = {
        ...sessionUser,
        nombre: safeName,
        correo: safeEmail,
      };
      this.writeSessionUser(nextSessionUser);
      return { ok: true, settings: nextSettings, user: nextSessionUser };
    }

    return { ok: true, settings: nextSettings, user: null };
  }

  addPaymentMethod(user, methodPayload) {
    const key = this.getUserSettingsKey(user);
    if (!key) {
      return { ok: false, error: 'No hay sesion activa para guardar metodos de pago.' };
    }

    const normalized = this.normalizePaymentMethod(methodPayload);
    if (!normalized) {
      return {
        ok: false,
        error: 'Completa alias, titular, ultimos 4 digitos y fecha de expiracion.',
      };
    }

    const store = this.readAccountSettingsStore();
    const current = this.getAccountSettings(user);
    const nextMethods = [normalized, ...current.paymentMethods];
    store[key] = {
      ...current,
      paymentMethods: nextMethods,
    };
    this.writeAccountSettingsStore(store);

    return { ok: true, paymentMethods: nextMethods };
  }

  removePaymentMethod(user, methodId) {
    const key = this.getUserSettingsKey(user);
    if (!key) {
      return { ok: false, error: 'No hay sesion activa para eliminar metodos.' };
    }

    const store = this.readAccountSettingsStore();
    const current = this.getAccountSettings(user);
    const nextMethods = current.paymentMethods.filter((method) => method.id !== String(methodId));
    store[key] = {
      ...current,
      paymentMethods: nextMethods,
    };
    this.writeAccountSettingsStore(store);

    return { ok: true, paymentMethods: nextMethods };
  }

  clearAccountSettings(user) {
    const key = this.getUserSettingsKey(user);
    if (!key) {
      return;
    }

    const store = this.readAccountSettingsStore();
    if (!Object.prototype.hasOwnProperty.call(store, key)) {
      return;
    }

    delete store[key];
    this.writeAccountSettingsStore(store);
  }

  // Operaciones remotas de autenticacion.
  async register({ nombre, correo, usuario, password }) {
    const normalizedUser = String(usuario || '').trim();
    const normalizedEmail = String(correo || '').trim();
    const normalizedPassword = String(password || '').trim();
    const normalizedName = String(nombre || '').trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedUser || !normalizedPassword || !normalizedName || !normalizedEmail) {
      return { ok: false, error: 'Completa todos los campos para registrarte.' };
    }
    if (!emailPattern.test(normalizedEmail)) {
      return { ok: false, error: 'Ingresa un correo electronico valido.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: normalizedName,
          correo: normalizedEmail,
          usuario: normalizedUser,
          password: normalizedPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return { ok: false, error: data.error || 'No se pudo registrar el usuario.' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async login({ usuario, password }) {
    const normalizedUser = String(usuario || '').trim();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedUser || !normalizedPassword) {
      return { ok: false, error: 'Usuario y contrasena son obligatorios.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: normalizedUser,
          password: normalizedPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.user || !data?.token) {
        return { ok: false, error: data.error || 'Usuario o contrasena incorrectos.' };
      }

      const sessionUser = {
        id: data.user.id ?? null,
        nombre: data.user.nombre ?? data.user.usuario,
        usuario: data.user.usuario,
        tipoUsuario: data.user.tipoUsuario ?? 'CUENTA',
      };
      this.writeSessionUser(sessionUser);
      this.writeAuthToken(data.token);
      this.setSessionActive(true);
      return { ok: true, user: sessionUser };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async changePassword({ user, currentPassword, newPassword }) {
    const userId = Number.parseInt(user?.id, 10);
    const hasValidUserId = Number.isInteger(userId) && userId > 0;
    const username = String(user?.usuario || '').trim();
    const normalizedCurrentPassword = String(currentPassword || '').trim();
    const normalizedNewPassword = String(newPassword || '').trim();
    const passwordPattern = /^(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{6,10}$/;

    if (!username) {
      return { ok: false, error: 'No hay sesion valida para cambiar la contrasena.' };
    }
    if (!normalizedCurrentPassword || !normalizedNewPassword) {
      return { ok: false, error: 'Completa contrasena actual y nueva contrasena.' };
    }
    if (!passwordPattern.test(normalizedNewPassword)) {
      return {
        ok: false,
        error:
          'La contrasena debe tener entre 6 y 10 caracteres, incluir al menos un signo especial (!@#$%^&*) y solo puede contener letras (sin enie ni acentos), numeros y esos signos.',
      };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/auth/change-password'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: hasValidUserId ? userId : null,
          usuario: username,
          currentPassword: normalizedCurrentPassword,
          newPassword: normalizedNewPassword,
        }),
      });

      const rawBody = await response.text();
      let data = {};
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch (parseError) {
          data = {};
        }
      }
      if (!response.ok) {
        if (
          response.status === 404 ||
          /Cannot POST \/api\/auth\/change-password/i.test(rawBody)
        ) {
          return {
            ok: false,
            error: 'La API no tiene activa la ruta para cambiar contrasena. Reinicia el backend con npm run api.',
          };
        }
        return { ok: false, error: data.error || 'No se pudo cambiar la contrasena.' };
      }
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  async deleteAccount({ user, password }) {
    const userId = Number.parseInt(user?.id, 10);
    const hasValidUserId = Number.isInteger(userId) && userId > 0;
    const username = String(user?.usuario || '').trim();
    const normalizedPassword = String(password || '').trim();

    if (!username) {
      return { ok: false, error: 'No hay sesion valida para eliminar la cuenta.' };
    }
    if (!normalizedPassword) {
      return { ok: false, error: 'Ingresa tu contrasena actual para eliminar la cuenta.' };
    }

    try {
      const response = await fetch(this.buildApiUrl('/api/auth/delete-account'), {
        method: 'POST',
        headers: this.getAuthorizationHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          userId: hasValidUserId ? userId : null,
          usuario: username,
          password: normalizedPassword,
        }),
      });

      const rawBody = await response.text();
      let data = {};
      if (rawBody) {
        try {
          data = JSON.parse(rawBody);
        } catch (parseError) {
          data = {};
        }
      }

      if (!response.ok) {
        if (
          response.status === 404 ||
          /Cannot POST \/api\/auth\/delete-account/i.test(rawBody)
        ) {
          return {
            ok: false,
            error: 'La API no tiene activa la ruta para eliminar cuenta. Reinicia el backend con npm run api.',
          };
        }
        return { ok: false, error: data.error || 'No se pudo eliminar la cuenta.' };
      }

      this.clearAccountSettings(user);
      this.logout();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: 'No hay conexion con el servidor API.' };
    }
  }

  logout() {
    this.setSessionActive(false);
  }

  getSessionUser() {
    if (!this.isSessionActive()) {
      return null;
    }
    if (!this.readAuthToken()) {
      this.setSessionActive(false);
      return null;
    }
    return this.readSessionUser();
  }
}

/** Ensambla todos los modelos/servicios en un contenedor unico de aplicacion. */
class ApplicationMain {
  buildCatalogModel() {
    return new CatalogModel({
      categories: CATEGORIES,
      products: PRODUCTS,
      homeCategoryKeys: HOME_CATEGORY_KEYS,
      defaultCategoryTabs: DEFAULT_CATEGORY_TABS,
    });
  }

  buildImageManager() {
    return new ImageManager(FALLBACK_IMAGE);
  }

  buildCurrencyManager() {
    return new CurrencyManager();
  }

  buildRouteManager() {
    return new RouteManager();
  }

  buildSearchManager(catalogModel) {
    return new SearchManager(catalogModel);
  }

  buildCartManager() {
    return new CartManager();
  }

  buildOrderManager() {
    return new OrderManager();
  }

  buildCheckoutManager({ cartManager, catalogModel, imageManager, orderManager }) {
    return new CheckoutManager({
      cartManager,
      catalogModel,
      imageManager,
      orderManager,
    });
  }

  buildAuthManager() {
    return new AuthManager();
  }

  // Punto de composicion principal.
  run() {
    const catalogModel = this.buildCatalogModel();
    const imageManager = this.buildImageManager();
    const currencyManager = this.buildCurrencyManager();
    const routeManager = this.buildRouteManager();
    const searchManager = this.buildSearchManager(catalogModel);
    const cartManager = this.buildCartManager();
    const orderManager = this.buildOrderManager();
    const checkoutManager = this.buildCheckoutManager({
      cartManager,
      catalogModel,
      imageManager,
      orderManager,
    });
    const authManager = this.buildAuthManager();

    return Object.freeze({
      catalog: catalogModel,
      images: imageManager,
      currency: currencyManager,
      router: routeManager,
      search: searchManager,
      cart: cartManager,
      orders: orderManager,
      checkout: checkoutManager,
      auth: authManager,
    });
  }
}

/** Factory publica usada por `src/App.js`. */
export function main() {
  const appMain = new ApplicationMain();
  return appMain.run();
}
