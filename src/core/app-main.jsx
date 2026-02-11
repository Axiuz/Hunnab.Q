import {
  CATEGORIES,
  DEFAULT_CATEGORY_TABS,
  DEFAULT_PRODUCT_COLORS,
  FALLBACK_IMAGE,
  HOME_CATEGORY_KEYS,
  PRODUCTS,
} from '../data/catalog-data';

const BASE_SEARCH_ITEMS = Object.freeze([
  { label: 'Inicio', route: '#/' },
  { label: 'Quienes Somos', route: '#/quienes-somos' },
  { label: 'Carrito', route: '#/carrito' },
  { label: 'Mi Cuenta', route: '#/cuenta' },
]);

class CatalogModel {
  constructor({ categories, products, homeCategoryKeys, defaultCategoryTabs, defaultProductColors }) {
    this.categories = categories;
    this.products = products;
    this.homeCategoryKeys = homeCategoryKeys;
    this.defaultCategoryTabs = defaultCategoryTabs;
    this.defaultProductColors = defaultProductColors;
  }

  toHomeCategory(key) {
    const category = this.getCategory(key);
    return category ? { key, ...category } : null;
  }

  toCategoryProduct(id) {
    const product = this.getProduct(id);
    return product ? { id, product } : null;
  }

  getHomeCategories() {
    return this.homeCategoryKeys.map((key) => this.toHomeCategory(key)).filter(Boolean);
  }

  getCategory(key) {
    return this.categories[key] ?? null;
  }

  getProduct(id) {
    return this.products[id] ?? null;
  }

  getCategoryProducts(categoryKey) {
    const productIds = this.getCategory(categoryKey)?.products ?? [];
    return productIds.map((id) => this.toCategoryProduct(id)).filter(Boolean);
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
      ...BASE_SEARCH_ITEMS,
      ...Object.keys(this.categories).map((key) => ({
        label: this.categories[key].title,
        route: `#/${key}`,
      })),
    ];
  }
}

class CartManager {
  constructor(storageKey = 'hunnab.q.cart') {
    this.storageKey = storageKey;
    this.listeners = new Set();
    this.items = this.load();
  }

  normalizeColor(color) {
    return typeof color === 'string' && color.trim() ? color : 'Sin color';
  }

  normalizeQuantity(quantity, fallback = 1) {
    return Math.max(1, Number.parseInt(quantity, 10) || fallback);
  }

  isValidItem(item) {
    return !!item && typeof item.productId === 'string';
  }

  parseItem(item) {
    if (!this.isValidItem(item)) {
      return null;
    }

    const quantity = Number.parseInt(item.quantity, 10);
    if (!Number.isFinite(quantity) || quantity < 1) {
      return null;
    }

    return {
      productId: item.productId,
      color: this.normalizeColor(item.color),
      quantity,
    };
  }

  getItemIndex(productId, color) {
    return this.items.findIndex((item) => item.productId === productId && item.color === color);
  }

  load() {
    if (typeof window === 'undefined' || !window.localStorage) {
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

      return parsed.map((item) => this.parseItem(item)).filter(Boolean);
    } catch {
      return [];
    }
  }

  save() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch {
      // Si falla storage (modo privado/limites), el carrito sigue funcionando en memoria.
    }
  }

  notify() {
    const snapshot = this.getItems();
    this.listeners.forEach((listener) => listener(snapshot));
  }

  commit() {
    this.save();
    this.notify();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getItems() {
    return this.items.map((item) => ({ ...item }));
  }

  getCount() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  addItem({ productId, quantity = 1, color = 'Sin color' }) {
    if (!productId) {
      return;
    }

    const safeQuantity = this.normalizeQuantity(quantity);
    const safeColor = this.normalizeColor(color);
    const existingIndex = this.getItemIndex(productId, safeColor);

    if (existingIndex >= 0) {
      this.items[existingIndex].quantity += safeQuantity;
    } else {
      this.items.push({ productId, color: safeColor, quantity: safeQuantity });
    }

    this.commit();
  }

  updateItemQuantity({ productId, color = 'Sin color', quantity }) {
    const safeQuantity = Number.parseInt(quantity, 10);
    const safeColor = this.normalizeColor(color);
    const index = this.getItemIndex(productId, safeColor);

    if (index < 0) {
      return;
    }

    if (!Number.isFinite(safeQuantity) || safeQuantity < 1) {
      this.items.splice(index, 1);
      this.commit();
      return;
    }

    this.items[index].quantity = Math.min(99, safeQuantity);
    this.commit();
  }

  removeItem({ productId, color = 'Sin color' }) {
    const safeColor = this.normalizeColor(color);
    this.items = this.items.filter((item) => !(item.productId === productId && item.color === safeColor));
    this.commit();
  }

  clear() {
    this.items = [];
    this.commit();
  }

  getDetailedItems(catalogModel, imageManager) {
    return this.items
      .map((item) => {
        const product = catalogModel.getProduct(item.productId);
        if (!product) {
          return null;
        }

        return {
          ...item,
          title: product.title,
          unitPrice: product.price,
          subtotal: product.price * item.quantity,
          image: imageManager.normalize(product.img),
        };
      })
      .filter(Boolean);
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

class ApplicationMain {
  constructor() {
    this.catalogData = {
      categories: CATEGORIES,
      products: PRODUCTS,
      homeCategoryKeys: HOME_CATEGORY_KEYS,
      defaultCategoryTabs: DEFAULT_CATEGORY_TABS,
      defaultProductColors: DEFAULT_PRODUCT_COLORS,
    };
  }

  run() {
    const catalogModel = new CatalogModel(this.catalogData);
    const imageManager = new ImageManager(FALLBACK_IMAGE);

    return Object.freeze({
      catalog: catalogModel,
      images: imageManager,
      currency: new CurrencyManager(),
      router: new RouteManager(),
      search: new SearchManager(catalogModel),
      cart: new CartManager(),
    });
  }
}

export function main() {
  const appMain = new ApplicationMain();
  return appMain.run();
}
