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

  run() {
    const catalogModel = this.buildCatalogModel();
    const imageManager = this.buildImageManager();
    const currencyManager = this.buildCurrencyManager();
    const routeManager = this.buildRouteManager();
    const searchManager = this.buildSearchManager(catalogModel);
    const cartManager = this.buildCartManager();

    return Object.freeze({
      catalog: catalogModel,
      images: imageManager,
      currency: currencyManager,
      router: routeManager,
      search: searchManager,
      cart: cartManager,
    });
  }
}

export function main() {
  const appMain = new ApplicationMain();
  return appMain.run();
}
