import {
  CATEGORIES,
  DEFAULT_CATEGORY_TABS,
  DEFAULT_PRODUCT_COLORS,
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
  constructor({ categories, products, homeCategoryKeys, defaultCategoryTabs, defaultProductColors }) {
    this.categories = categories;
    this.products = products;
    this.homeCategoryKeys = homeCategoryKeys;
    this.defaultCategoryTabs = defaultCategoryTabs;
    this.defaultProductColors = defaultProductColors;

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

    return {
      ...rawProduct,
      ...normalizedOverride,
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

  adminCreateProduct({ title, price, img, imgHover = '', categoryKey }) {
    const safeTitle = String(title || '').trim();
    const safeImg = String(img || '').trim();
    const safeImgHover = String(imgHover || '').trim();
    const safeCategory = String(categoryKey || '').trim();
    const numericPrice = Number.parseFloat(price);

    if (!safeTitle || !safeImg || !safeCategory || Number.isNaN(numericPrice)) {
      return { ok: false, error: 'Completa nombre, precio, imagen y categoria.' };
    }
    if (!this.getCategory(safeCategory)) {
      return { ok: false, error: 'Categoria invalida.' };
    }

    const id = this.generateProductId(safeTitle);
    this.customProducts[id] = {
      title: safeTitle,
      price: numericPrice,
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

  adminUpdateProduct({ id, title, price, img, imgHover = '', categories }) {
    const key = String(id);
    const rawProduct = this.getRawProduct(key);
    if (!rawProduct) {
      return { ok: false, error: 'Producto no encontrado.' };
    }

    const safeTitle = String(title || '').trim();
    const safeImg = String(img || '').trim();
    const safeImgHover = String(imgHover || '').trim();
    const numericPrice = Number.parseFloat(price);
    const normalizedCategories = this.normalizeCategoryList(categories);

    if (!safeTitle || !safeImg || Number.isNaN(numericPrice)) {
      return { ok: false, error: 'Nombre, precio e imagen principal son obligatorios.' };
    }
    if (normalizedCategories.length === 0) {
      return { ok: false, error: 'Selecciona al menos una categoria.' };
    }

    const baseTitle = String(rawProduct.title || '').trim();
    const basePrice = Number.isFinite(Number(rawProduct.price)) ? Number(rawProduct.price) : 0;
    const baseImg = String(rawProduct.img || '').trim();
    const baseImgHover = String(rawProduct.imgHover || '').trim();

    const nextOverride = {};
    if (safeTitle !== baseTitle) {
      nextOverride.title = safeTitle;
    }
    if (numericPrice !== basePrice) {
      nextOverride.price = numericPrice;
    }
    if (safeImg !== baseImg) {
      nextOverride.img = safeImg;
    }
    if (safeImgHover !== baseImgHover) {
      nextOverride.imgHover = safeImgHover;
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

  // Metadatos auxiliares de UI.
  getCategoryInfoTabs(category) {
    return this.defaultCategoryTabs.map((tab) => ({
      id: tab.id,
      label: tab.label,
      content: typeof tab.content === 'function' ? tab.content(category) : tab.content,
    }));
  }

  getDefaultProductColors() {
    return this.defaultProductColors;
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

      return parsed
        .map((item) => this.normalizeItem(item))
        .filter(Boolean);
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
      color: item.color ? String(item.color) : 'Unico',
      quantity: Math.max(1, Math.min(99, quantity)),
    };
  }

  findItemIndex(productId, color) {
    return this.items.findIndex((item) => item.productId === productId && item.color === color);
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  addItem({ productId, quantity = 1, color = 'Unico' }) {
    const normalized = this.normalizeItem({ productId, quantity, color });
    if (!normalized) {
      return;
    }

    const idx = this.findItemIndex(normalized.productId, normalized.color);
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

  updateItemQuantity({ productId, color = 'Unico', quantity }) {
    const normalizedQty = Number.parseInt(quantity, 10);
    if (Number.isNaN(normalizedQty)) {
      return;
    }

    if (normalizedQty <= 0) {
      this.removeItem({ productId, color });
      return;
    }

    const idx = this.findItemIndex(String(productId), String(color));
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

  removeItem({ productId, color = 'Unico' }) {
    const idx = this.findItemIndex(String(productId), String(color));
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
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      })
      .filter(Boolean);
  }
}

/** Historial simple de pedidos generado desde el carrito y guardado en localStorage. */
class OrderManager {
  constructor({ storageKey = 'hunnab_orders' } = {}) {
    this.storageKey = storageKey;
    this.orders = this.readFromStorage();
  }

  isBrowser() {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  }

  readFromStorage() {
    if (!this.isBrowser()) {
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
      return parsed.filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  persist() {
    if (!this.isBrowser()) {
      return;
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(this.orders));
  }

  createFromCart({ user, items, total }) {
    if (!user || !Array.isArray(items) || items.length === 0) {
      return null;
    }

    const order = {
      id: `PED-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Confirmado',
      user: {
        id: user.id ?? null,
        usuario: user.usuario ?? '',
        nombre: user.nombre ?? user.usuario ?? '',
      },
      total: Number.isFinite(total) ? total : 0,
      items: items.map((item) => ({
        productId: item.productId,
        title: item.title,
        quantity: item.quantity,
        color: item.color,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      })),
    };

    this.orders.unshift(order);
    this.persist();
    return order;
  }

  getUserOrders(user) {
    if (!user) {
      return [];
    }

    const userId = user.id ?? null;
    const username = String(user.usuario || '').trim();

    return this.orders.filter((order) => {
      if (!order?.user) {
        return false;
      }
      if (userId !== null && order.user.id !== null) {
        return Number(order.user.id) === Number(userId);
      }
      return String(order.user.usuario || '').trim() === username;
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
    accountSettingsStorageKey = 'hunnab_account_settings',
  } = {}) {
    this.apiBase = apiBase;
    this.sessionStorageKey = sessionStorageKey;
    this.sessionUserStorageKey = sessionUserStorageKey;
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
      if (!response.ok || !data?.user) {
        return { ok: false, error: data.error || 'Usuario o contrasena incorrectos.' };
      }

      const sessionUser = {
        id: data.user.id ?? null,
        nombre: data.user.nombre ?? data.user.usuario,
        usuario: data.user.usuario,
        tipoUsuario: data.user.tipoUsuario ?? 'CUENTA',
      };
      this.writeSessionUser(sessionUser);
      this.setSessionActive(true);
      return { ok: true, user: sessionUser };
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
      defaultProductColors: DEFAULT_PRODUCT_COLORS,
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
    const authManager = this.buildAuthManager();

    return Object.freeze({
      catalog: catalogModel,
      images: imageManager,
      currency: currencyManager,
      router: routeManager,
      search: searchManager,
      cart: cartManager,
      orders: orderManager,
      auth: authManager,
    });
  }
}

/** Factory publica usada por `src/App.js`. */
export function main() {
  const appMain = new ApplicationMain();
  return appMain.run();
}
