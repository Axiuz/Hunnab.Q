import {
  CATEGORIES,
  DEFAULT_CATEGORY_TABS,
  DEFAULT_PRODUCT_COLORS,
  FALLBACK_IMAGE,
  HOME_CATEGORY_KEYS,
  PRODUCTS,
} from '../data/catalog-data';

class CatalogModel {
  constructor({ categories, products, homeCategoryKeys, defaultCategoryTabs, defaultProductColors }) {
    this.categories = categories;
    this.products = products;
    this.homeCategoryKeys = homeCategoryKeys;
    this.defaultCategoryTabs = defaultCategoryTabs;
    this.defaultProductColors = defaultProductColors;
  }

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

  getProduct(id) {
    return this.products[id] ?? null;
  }

  getAllProducts() {
    return Object.entries(this.products).map(([id, product]) => ({ id, product }));
  }

  getCategoryProducts(categoryKey) {
    const category = this.getCategory(categoryKey);
    if (!category) {
      return [];
    }

    return category.products
      .map((id) => {
        const product = this.getProduct(id);
        if (!product) {
          return null;
        }
        return { id, product };
      })
      .filter(Boolean);
  }

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

class CurrencyManager {
  formatMXN(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    return safeValue.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }
}

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

class AuthManager {
  constructor({
    apiBase = process.env.REACT_APP_API_BASE || '',
    sessionStorageKey = 'sesionActiva',
    sessionUserStorageKey = 'usuarioSesion',
  } = {}) {
    this.apiBase = apiBase;
    this.sessionStorageKey = sessionStorageKey;
    this.sessionUserStorageKey = sessionUserStorageKey;
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
      return {
        id: parsed.id ? Number(parsed.id) : null,
        nombre: parsed.nombre ? String(parsed.nombre) : String(parsed.usuario),
        usuario: String(parsed.usuario),
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

export function main() {
  const appMain = new ApplicationMain();
  return appMain.run();
}
