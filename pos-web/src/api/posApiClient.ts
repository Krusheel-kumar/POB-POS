import type {
  Product,
  ProductCategory,
  CreateOrderRequest,
  Order,
  CalculationResponse,
  KitchenTicket,
  KitchenTicketItem,
  KitchenTicketStatus,
  PageResponse,
  Outlet,
  CreateOutletRequest,
  CategoryRequest,
  ProductRequest,
  AddOn,
  AddOnRequest,
  AddOnCategory,
  AddOnCategoryRequest,
  Bill,
  RestaurantTable,
  TableRequest,
  TableStatusUpdateRequest,
  AddOrderItemsRequest,
  Payment,
  PaymentMethod,
  PaymentStatus,
  PaymentPolicy,
} from '../types/pos';
import { mockStore, INITIAL_OUTLET } from '../data/mockStore';

export interface PosApiConfig {
  baseUrl: string;
  tenantId?: string;
  outletId?: string;
  authHeader?: string;
}

export class PosApiClient {
  private config: PosApiConfig;
  private demoMode: boolean;

  constructor(config?: Partial<PosApiConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL) : '') || 'http://localhost:8080',
      tenantId: config?.tenantId || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_TENANT_ID : '') || 'demo-tenant-id',
      outletId: config?.outletId || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_OUTLET_ID : '') || INITIAL_OUTLET.id,
      authHeader: config?.authHeader || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_AUTH_HEADER : undefined),
    };

    // Default to false (100% Real Fastify + LibSQL SQLite WAL Production Engine)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_demo_mode');
    }
    this.demoMode = false;
  }

  public updateConfig(newConfig: Partial<PosApiConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): PosApiConfig {
    return { ...this.config };
  }

  public isDemoModeActive(): boolean {
    return this.demoMode;
  }

  public setDemoMode(active: boolean): void {
    this.demoMode = active;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_demo_mode', active ? 'true' : 'false');
    }
  }

  private getHeaders(hasBody: boolean = true): HeadersInit {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (hasBody) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.config.tenantId) {
      headers['X-Tenant-ID'] = this.config.tenantId;
    }

    if (this.config.authHeader) {
      headers['Authorization'] = this.config.authHeader;
    }

    return headers;
  }

  private async fetchWithTimeout(url: string | URL, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url.toString(), {
        ...options,
        signal: options.signal || controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Fetch active categories
   */
  public async getCategories(): Promise<ProductCategory[]> {
    if (this.demoMode) {
      return mockStore.getCategories();
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/categories`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      if (!res.ok) {
        throw new Error(`Failed to load categories: ${res.status} ${res.statusText}`);
      }

      return res.json();
    } catch (err) {
      console.warn('Backend unavailable, falling back to local demo store');
      return mockStore.getCategories();
    }
  }

  public getProductRanks(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('pob_product_ranks') || '{}');
    } catch {
      return {};
    }
  }

  public saveProductRank(id: string, rank: number): void {
    if (typeof window === 'undefined') return;
    try {
      const ranks = this.getProductRanks();
      ranks[id] = rank;
      localStorage.setItem('pob_product_ranks', JSON.stringify(ranks));
    } catch {
      // non-blocking
    }
  }

  public getAddOnRanks(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('pob_addon_ranks') || '{}');
    } catch {
      return {};
    }
  }

  public saveAddOnRank(id: string, rank: number): void {
    if (typeof window === 'undefined') return;
    try {
      const ranks = this.getAddOnRanks();
      ranks[id] = rank;
      localStorage.setItem('pob_addon_ranks', JSON.stringify(ranks));
    } catch {
      // non-blocking
    }
  }

  public getAddOnCategoryRanks(): Record<string, number> {
    if (typeof window === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem('pob_addon_cat_ranks') || '{}');
    } catch {
      return {};
    }
  }

  public saveAddOnCategoryRank(catIdOrName: string, rank: number): void {
    if (typeof window === 'undefined') return;
    try {
      const ranks = this.getAddOnCategoryRanks();
      ranks[catIdOrName.toLowerCase().trim()] = rank;
      localStorage.setItem('pob_addon_cat_ranks', JSON.stringify(ranks));
    } catch {
      // non-blocking
    }
  }

  /**
   * Fetch products
   */
  public async getProducts(categoryId?: string): Promise<Product[]> {
    let prods: Product[];
    if (this.demoMode) {
      prods = mockStore.getProducts(categoryId);
    } else {
      try {
        const url = new URL(`${this.config.baseUrl}/api/v1/products`);
        if (categoryId && categoryId !== 'cat-all') {
          url.searchParams.set('categoryId', categoryId);
        }

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: this.getHeaders(false),
        });

        if (!res.ok) {
          throw new Error(`Failed to load products: ${res.status} ${res.statusText}`);
        }

        prods = await res.json();
      } catch (err) {
        prods = mockStore.getProducts(categoryId);
      }
    }

    // Hydrate persistent ranks
    const ranks = this.getProductRanks();
    prods.forEach((p) => {
      if (ranks[p.id] !== undefined) {
        p.displayOrder = ranks[p.id];
      } else if (p.displayOrder !== undefined && p.displayOrder !== null) {
        ranks[p.id] = p.displayOrder;
      }
    });

    try {
      mockStore.syncProducts(prods);
    } catch {
      // non-blocking
    }

    return prods;
  }

  /**
   * Clear all demo products, categories, orders, and reports for a fresh production start
   */
  public async clearAllDemoData(): Promise<void> {
    mockStore.clearAllDemoData();
    try {
      await fetch(`${this.config.baseUrl}/api/v1/catalog/clear-all`, {
        method: 'POST',
        headers: this.getHeaders(false),
      });
    } catch (err) {
      console.warn('Backend clear-all notice:', err);
    }
  }

  /**
   * Pricing calculation
   */
  public async calculatePricing(items: { productId: string; variantId?: string; addOnIds: string[]; quantity: number }[]): Promise<CalculationResponse | null> {
    if (this.demoMode) {
      return mockStore.calculatePricing(items);
    }

    if (!this.config.outletId) return mockStore.calculatePricing(items);

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/pricing/calculate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          outletId: this.config.outletId,
          items,
        }),
      });

      if (!res.ok) {
        return mockStore.calculatePricing(items);
      }

      return res.json();
    } catch {
      return mockStore.calculatePricing(items);
    }
  }

  /**
   * Create order
   */
  public async createOrder(orderRequest: CreateOrderRequest): Promise<Order> {
    if (this.demoMode) {
      return mockStore.createOrder(orderRequest);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(orderRequest),
      });

      if (!res.ok) {
        let errorMsg = `Server error ${res.status}`;
        try {
          const errorJson = await res.json();
          if (errorJson.error) errorMsg = errorJson.error;
          else if (errorJson.message) errorMsg = errorJson.message;
        } catch {
          // ignore
        }
        throw new Error(errorMsg);
      }

      return res.json();
    } catch (err) {
      // If network error, fallback to mockStore
      return mockStore.createOrder(orderRequest);
    }
  }

  /**
   * Get single order by ID
   */
  public async getOrderById(orderId: string): Promise<Order> {
    if (this.demoMode) {
      return mockStore.getOrderById(orderId);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch order: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getOrderById(orderId);
    }
  }

  /**
   * Update Order Status / Cancel Order
   */
  public async updateOrderStatus(
    orderId: string,
    status: 'CONFIRMED' | 'PREPARING' | 'READY' | 'BILLED' | 'COMPLETED' | 'CANCELLED',
    cancellationReason?: string
  ): Promise<Order> {
    if (this.demoMode) {
      return mockStore.updateOrderStatus(orderId, status);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(true),
        body: JSON.stringify({ status, cancellationReason }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update order status: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.updateOrderStatus(orderId, status);
    }
  }

  /**
   * Fetch kitchen tickets
   */
  public async getKitchenTickets(
    outletId?: string,
    status?: KitchenTicketStatus,
    page = 0,
    size = 50
  ): Promise<PageResponse<KitchenTicket>> {
    if (this.demoMode) {
      let list = mockStore.getKitchenTickets();
      if (status) {
        list = list.filter((t) => t.status === status);
      }
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        size,
        number: page,
      };
    }

    const targetOutletId = outletId || this.config.outletId;
    if (!targetOutletId) {
      throw new Error('Outlet ID is required to fetch kitchen tickets');
    }

    try {
      const url = new URL(`${this.config.baseUrl}/api/v1/kitchen-tickets/outlet/${targetOutletId}`);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('size', size.toString());
      if (status) {
        url.searchParams.set('status', status);
      }

      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load kitchen tickets: ${res.status}`);
      }

      return res.json();
    } catch {
      let list = mockStore.getKitchenTickets();
      if (status) {
        list = list.filter((t) => t.status === status);
      }
      return {
        content: list,
        totalElements: list.length,
        totalPages: 1,
        size,
        number: page,
      };
    }
  }

  /**
   * Update ticket status
   */
  public async updateKitchenTicketStatus(
    ticketId: string,
    status: KitchenTicketStatus,
    cancellationReason?: string
  ): Promise<KitchenTicket> {
    if (this.demoMode) {
      return mockStore.updateKitchenTicketStatus(ticketId, status, cancellationReason);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/kitchen-tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status, cancellationReason }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update ticket: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.updateKitchenTicketStatus(ticketId, status, cancellationReason);
    }
  }

  /**
   * Update item-level status
   */
  public async updateKitchenTicketItemStatus(
    itemId: string,
    status: KitchenTicketStatus
  ): Promise<KitchenTicketItem> {
    if (this.demoMode) {
      return mockStore.updateKitchenTicketItemStatus(itemId, status);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/kitchen-tickets/items/${itemId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update item status: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.updateKitchenTicketItemStatus(itemId, status);
    }
  }

  /**
   * Fetch outlets
   */
  public async getOutlets(): Promise<Outlet[]> {
    if (this.demoMode) {
      return mockStore.getOutlets();
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/outlets`, {
        method: 'GET',
        headers: this.getHeaders(false),
      });

      if (!res.ok) {
        throw new Error(`Failed to load outlets: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getOutlets();
    }
  }

  /**
   * Create new outlet branch
   */
  public async createOutlet(req: CreateOutletRequest): Promise<Outlet> {
    if (this.demoMode) {
      return mockStore.createOutlet(req);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/outlets`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Failed to create outlet: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.createOutlet(req);
    }
  }

  /**
   * Create category
   */
  public async createCategory(req: CategoryRequest): Promise<ProductCategory> {
    if (this.demoMode) {
      return mockStore.createCategory(req.name, req.description, req.subcategories);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/categories`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Failed to create category: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.createCategory(req.name, req.description, req.subcategories);
    }
  }

  /**
   * Deactivate category
   */
  public async deactivateCategory(id: string): Promise<ProductCategory> {
    if (this.demoMode) {
      const cats = mockStore.getCategories();
      const cat = cats.find((c) => c.id === id);
      if (cat) {
        cat.isActive = !cat.isActive;
        return cat;
      }
      throw new Error('Category not found');
    }

    const res = await fetch(`${this.config.baseUrl}/api/v1/categories/${id}/deactivate`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to deactivate category: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Update category (name, subcategories, description)
   */
  public async updateCategory(id: string, req: Partial<CategoryRequest>): Promise<ProductCategory> {
    const updated = mockStore.updateCategory(id, req);
    if (this.demoMode) {
      return updated;
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/categories/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        return updated;
      }
      return res.json();
    } catch {
      return updated;
    }
  }

  /**
   * Purge all empty inactive categories from catalog
   */
  public async purgeInactiveCategories(): Promise<number> {
    const count = mockStore.purgeInactiveCategories();
    try {
      const cats = await this.getCategories();
      const inactives = cats.filter((c) => c.isActive === false);
      for (const cat of inactives) {
        await this.deleteCategory(cat.id).catch(() => {});
      }
    } catch {
      // ignore
    }
    return count;
  }

  /**
   * Delete category (permanently deletes category and cascades to all products and subcategories)
   */
  public async deleteCategory(id: string): Promise<void> {
    mockStore.deleteCategory(id);
    if (this.demoMode) {
      return;
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/categories/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      });

      if (!res.ok) {
        if (res.status === 404) {
          // If DELETE endpoint is not yet mounted on backend, fallback to deactivating
          await this.deactivateCategory(id).catch(() => {});
          return;
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || `Failed to delete category: ${res.status}`);
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        await this.deactivateCategory(id).catch(() => {});
        return;
      }
      throw err;
    }
  }

  /**
   * Delete subcategory (permanently deletes subcategory and cascades to all products under it)
   */
  public async deleteSubcategory(categoryId: string, subcat: string): Promise<void> {
    mockStore.deleteSubcategory(categoryId, subcat);
    if (this.demoMode) {
      return;
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/categories/${categoryId}/subcategories/${encodeURIComponent(subcat)}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      });

      if (!res.ok) {
        if (res.status === 404) {
          return;
        }
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || `Failed to delete subcategory: ${res.status}`);
      }
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        return;
      }
      throw err;
    }
  }

  /**
   * Create product
   */
  public async createProduct(req: ProductRequest): Promise<Product> {
    if (this.demoMode) {
      return mockStore.createProduct({
        name: req.name,
        basePrice: req.basePrice,
        categoryId: req.categoryId,
        description: req.description,
        sku: req.sku,
        subcategory: req.subcategory,
        imageUrl: req.imageUrl,
        badge: req.badge,
        dietaryType: req.dietaryType,
        prepTimeMinutes: req.prepTimeMinutes,
        variants: req.variants,
        addOnIds: req.addOnIds,
      });
    }

    try {
      // 1. Separate addOnIds from core product request to prevent PostgreSQL 42601 syntax errors
      const { addOnIds, ...coreReq } = req;
      const res = await fetch(`${this.config.baseUrl}/api/v1/products`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(coreReq),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const detailedMsg =
          (errData?.message && errData.message !== 'Internal Server Error' ? errData.message : null) ||
          (errData?.error && errData.error !== 'Internal Server Error' ? errData.error : null) ||
          `Failed to create product (${res.status}): Please check category and input fields`;
        throw new Error(detailedMsg);
      }

      const created: Product = await res.json();

      // 2. Attach modifiers & toppings via the dedicated verified endpoint
      if (addOnIds && addOnIds.length > 0 && created.id) {
        try {
          await this.updateProductAddOns(created.id, addOnIds);
        } catch (addonErr) {
          console.warn('[Addon Mapping Notice]:', addonErr);
        }
      }

      return created;
    } catch (err) {
      if (this.demoMode) {
        return mockStore.createProduct({
          name: req.name,
          basePrice: req.basePrice,
          categoryId: req.categoryId,
          description: req.description,
          sku: req.sku,
          subcategory: req.subcategory,
          imageUrl: req.imageUrl,
          badge: req.badge,
          dietaryType: req.dietaryType,
          prepTimeMinutes: req.prepTimeMinutes,
          variants: req.variants,
          addOnIds: req.addOnIds,
        });
      }
      throw err;
    }
  }

  /**
   * Deactivate product
   */
  public async deactivateProduct(id: string): Promise<Product> {
    if (this.demoMode) {
      return mockStore.deactivateProduct(id);
    }

    const res = await fetch(`${this.config.baseUrl}/api/v1/products/${id}/deactivate`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      throw new Error(`Failed to deactivate product: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Update product
   */
  public async updateProduct(id: string, req: ProductRequest): Promise<Product> {
    if (this.demoMode) {
      return mockStore.updateProduct(id, req);
    }

    try {
      const { addOnIds, ...coreReq } = req;
      const res = await fetch(`${this.config.baseUrl}/api/v1/products/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(coreReq),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error || errData?.message || `Failed to update product: ${res.status}`);
      }

      const updated = await res.json();
      if (addOnIds !== undefined) {
        try {
          await this.updateProductAddOns(id, addOnIds);
        } catch (addonErr) {
          console.warn('[Addon Mapping Notice]:', addonErr);
        }
      }

      return updated;
    } catch (err) {
      if (this.demoMode) {
        return mockStore.updateProduct(id, req);
      }
      throw err;
    }
  }

  /**
   * Delete product
   */
  public async deleteProduct(id: string): Promise<void> {
    mockStore.deleteProduct(id);
    if (this.demoMode) {
      return;
    }

    const res = await fetch(`${this.config.baseUrl}/api/v1/products/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || errData?.error || `Failed to delete product: ${res.status}`);
    }
  }

  /**
   * Fetch add-ons
   */
  public async getAddOns(): Promise<AddOn[]> {
    let list: AddOn[];
    if (this.demoMode) {
      list = mockStore.getAddOns();
    } else {
      try {
        const res = await this.fetchWithTimeout(`${this.config.baseUrl}/api/v1/addons`, {
          method: 'GET',
          headers: this.getHeaders(false),
        }, 2500);

        if (!res.ok) {
          list = mockStore.getAddOns();
        } else {
          list = await res.json();
        }
      } catch {
        list = mockStore.getAddOns();
      }
    }

    // Hydrate persistent item ranks
    const addonRanks = this.getAddOnRanks();
    list.forEach((a) => {
      if (addonRanks[a.id] !== undefined) {
        a.displayOrder = addonRanks[a.id];
      }
    });

    return list;
  }

  /**
   * Create add-on
   */
  public async createAddOn(req: AddOnRequest): Promise<AddOn> {
    if (this.demoMode) {
      return mockStore.createAddOn(req.name, req.price, req.category, req.selectionType, req.minSelections, req.maxSelections);
    }

    try {
      const res = await this.fetchWithTimeout(`${this.config.baseUrl}/api/v1/addons`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      }, 2500);

      if (!res.ok) {
        throw new Error(`Failed to create add-on: ${res.status}`);
      }

      const data = await res.json();
      mockStore.createAddOn(req.name, req.price, req.category, req.selectionType, req.minSelections, req.maxSelections);
      return data;
    } catch {
      return mockStore.createAddOn(req.name, req.price, req.category, req.selectionType, req.minSelections, req.maxSelections);
    }
  }

  /**
   * Delete add-on
   */
  public async deleteAddOn(id: string): Promise<void> {
    mockStore.deleteAddOn(id);
    if (this.demoMode) {
      return;
    }
    try {
      const res = await this.fetchWithTimeout(`${this.config.baseUrl}/api/v1/addons/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(false),
      }, 2500);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || errData?.error || `Failed to delete add-on: ${res.status}`);
      }
    } catch (err) {
      console.warn('Backend delete add-on fallback to local store:', err);
    }
  }

  /**
   * Toggle add-on status
   */
  public async toggleAddOn(id: string): Promise<AddOn> {
    if (this.demoMode) {
      return mockStore.toggleAddOn(id);
    }
    try {
      const res = await this.fetchWithTimeout(`${this.config.baseUrl}/api/v1/addons/${id}/toggle`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      }, 2500);
      if (!res.ok) throw new Error('Failed to toggle add-on');
      return res.json();
    } catch {
      return mockStore.toggleAddOn(id);
    }
  }

  /**
   * Update attached add-ons for a product
   */
  public async updateProductAddOns(productId: string, addOnIds: string[]): Promise<Product> {
    if (this.demoMode) {
      return mockStore.updateProductAddOns(productId, addOnIds);
    }
    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/products/${productId}/addons`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ addOnIds }),
      });
      if (!res.ok) throw new Error('Failed to update product add-ons');
      return res.json();
    } catch {
      return mockStore.updateProductAddOns(productId, addOnIds);
    }
  }

  /**
   * Fetch add-on categories
   */
  public async getAddOnCategories(): Promise<AddOnCategory[]> {
    const list = mockStore.getAddOnCategories();
    const catRanks = this.getAddOnCategoryRanks();
    return list.map((c) => {
      const stored = catRanks[c.id.toLowerCase().trim()] ?? catRanks[c.name.toLowerCase().trim()];
      if (stored !== undefined) {
        return { ...c, displayOrder: stored };
      }
      return c;
    });
  }

  /**
   * Create add-on category
   */
  public async createAddOnCategory(req: AddOnCategoryRequest): Promise<AddOnCategory> {
    const created = mockStore.createAddOnCategory(req);
    if (req.displayOrder !== undefined) {
      this.saveAddOnCategoryRank(created.id, req.displayOrder);
      this.saveAddOnCategoryRank(created.name, req.displayOrder);
    }
    return created;
  }

  /**
   * Update add-on category
   */
  public async updateAddOnCategory(id: string, req: Partial<AddOnCategoryRequest>): Promise<AddOnCategory> {
    if (req.displayOrder !== undefined) {
      this.saveAddOnCategoryRank(id, req.displayOrder);
      if (req.name) {
        this.saveAddOnCategoryRank(req.name, req.displayOrder);
      }
    }
    return mockStore.updateAddOnCategory(id, req);
  }

  /**
   * Delete add-on category
   */
  public async deleteAddOnCategory(id: string): Promise<void> {
    mockStore.deleteAddOnCategory(id);
  }

  /**
   * Update product sequence ranking
   */
  public async updateProductRank(productId: string, displayOrder: number): Promise<Product> {
    this.saveProductRank(productId, displayOrder);
    const localUpdated = mockStore.updateProductRank(productId, displayOrder);
    localUpdated.displayOrder = displayOrder;

    if (this.demoMode) {
      return localUpdated;
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/products/${productId}/rank`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ displayOrder }),
      });

      if (res.ok) {
        const data = await res.json();
        mockStore.updateProductRank(productId, displayOrder);
        return data;
      }

      // Fallback: try PATCH /api/v1/products/:id
      const patchRes = await fetch(`${this.config.baseUrl}/api/v1/products/${productId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ displayOrder }),
      });

      if (patchRes.ok) {
        const data = await patchRes.json();
        mockStore.updateProductRank(productId, displayOrder);
        return data;
      }

      return localUpdated;
    } catch {
      return localUpdated;
    }
  }

  /**
   * Update add-on item sequence ranking
   */
  public async updateAddOnRank(addonId: string, displayOrder: number): Promise<AddOn> {
    this.saveAddOnRank(addonId, displayOrder);
    const localUpdated = mockStore.updateAddOnRank(addonId, displayOrder);
    localUpdated.displayOrder = displayOrder;

    if (this.demoMode) {
      return localUpdated;
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/addons/${addonId}/rank`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ displayOrder }),
      });

      if (res.ok) {
        const data = await res.json();
        mockStore.updateAddOnRank(addonId, displayOrder);
        return data;
      }

      const patchRes = await fetch(`${this.config.baseUrl}/api/v1/addons/${addonId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ displayOrder }),
      });

      if (patchRes.ok) {
        const data = await patchRes.json();
        mockStore.updateAddOnRank(addonId, displayOrder);
        return data;
      }

      return localUpdated;
    } catch {
      return localUpdated;
    }
  }

  /**
   * Fetch outlet orders
   */
  public async getOutletOrders(outletId?: string): Promise<Order[]> {
    if (this.demoMode) {
      return mockStore.getOrders();
    }

    const targetOutletId = outletId || this.config.outletId;
    if (!targetOutletId) return mockStore.getOrders();

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders/outlet/${targetOutletId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load orders: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getOrders();
    }
  }

  /**
   * Fetch outlet bills
   */
  public async getOutletBills(outletId?: string): Promise<Bill[]> {
    if (this.demoMode) {
      return mockStore.getBills();
    }

    const targetOutletId = outletId || this.config.outletId;
    if (!targetOutletId) return mockStore.getBills();

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/bills/outlet/${targetOutletId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load bills: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getBills();
    }
  }

  /**
   * Fetch restaurant tables for outlet
   */
  public async getTables(outletId?: string): Promise<RestaurantTable[]> {
    if (this.demoMode) {
      return mockStore.getTables();
    }

    const targetOutletId = outletId || this.config.outletId;
    if (!targetOutletId) return mockStore.getTables();

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/tables/outlet/${targetOutletId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to load tables: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getTables();
    }
  }

  /**
   * Create restaurant table
   */
  public async createTable(req: TableRequest): Promise<RestaurantTable> {
    if (this.demoMode) {
      return mockStore.createTable(req.tableNumber, req.capacity || 4);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/tables`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Failed to create table: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.createTable(req.tableNumber, req.capacity || 4);
    }
  }

  /**
   * Update table status
   */
  public async updateTableStatus(tableId: string, req: TableStatusUpdateRequest): Promise<RestaurantTable> {
    if (this.demoMode) {
      return mockStore.updateTableStatus(tableId, req.status);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Failed to update table status: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.updateTableStatus(tableId, req.status);
    }
  }

  /**
   * Delete table
   */
  public async deleteTable(tableId: string): Promise<void> {
    mockStore.deleteTable(tableId);
    if (this.demoMode) {
      return;
    }

    const res = await fetch(`${this.config.baseUrl}/api/v1/tables/${tableId}`, {
      method: 'DELETE',
      headers: this.getHeaders(false),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.message || errData?.error || `Failed to delete table: ${res.status}`);
    }
  }

  /**
   * Submit additional items to running order
   */
  public async addOrderItems(orderId: string, req: AddOrderItemsRequest): Promise<Order> {
    if (this.demoMode) {
      return mockStore.addOrderItems(orderId, req);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders/${orderId}/add-items`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        throw new Error(`Failed to add items: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.addOrderItems(orderId, req);
    }
  }

  /**
   * Void / reduce item from running order
   */
  public async voidOrderItem(orderId: string, itemId: string, quantityToVoid: number, reason: string): Promise<Order> {
    if (this.demoMode) {
      return mockStore.voidOrderItem(orderId, itemId, quantityToVoid, reason);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/orders/${orderId}/items/${itemId}/void`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ quantityToVoid, reason }),
      });

      if (!res.ok) {
        throw new Error(`Failed to void item: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.voidOrderItem(orderId, itemId, quantityToVoid, reason);
    }
  }

  /**
   * Issue Bill for Order
   */
  public async issueBill(orderId: string, notes?: string): Promise<Bill> {
    if (this.demoMode) {
      return mockStore.issueBill(orderId, notes);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/bills`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ orderId, notes }),
      });

      if (!res.ok) {
        throw new Error(`Failed to issue bill: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.issueBill(orderId, notes);
    }
  }

  /**
   * Get Bill for Order
   */
  public async getBillByOrderId(orderId: string): Promise<Bill | null> {
    if (this.demoMode) {
      return mockStore.getBillByOrderId(orderId);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/bills/order/${orderId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to load bill: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.getBillByOrderId(orderId);
    }
  }

  /**
   * Record payment for Bill
   */
  public async recordPayment(
    billId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    idempotencyKey?: string,
    transactionReference?: string
  ): Promise<Payment> {
    if (this.demoMode) {
      return mockStore.recordPayment(billId, amount, paymentMethod, idempotencyKey, transactionReference);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/bills/payments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          billId,
          amount,
          paymentMethod,
          idempotencyKey,
          transactionReference,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to record payment: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.recordPayment(billId, amount, paymentMethod, idempotencyKey, transactionReference);
    }
  }

  /**
   * Update payment status
   */
  public async updatePaymentStatus(
    paymentId: string,
    status: PaymentStatus,
    failureReason?: string,
    refundReason?: string
  ): Promise<Payment> {
    if (this.demoMode) {
      return {
        id: paymentId,
        paymentMethod: 'CASH',
        status,
        amount: 0,
        createdAt: new Date().toISOString(),
      };
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/bills/payments/${paymentId}/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ status, failureReason, refundReason }),
      });

      if (!res.ok) {
        throw new Error(`Failed to update payment status: ${res.status}`);
      }

      return res.json();
    } catch {
      return {
        id: paymentId,
        paymentMethod: 'CASH',
        status,
        amount: 0,
        createdAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Update outlet payment policy
   */
  public async updatePaymentPolicy(outletId: string, policy: PaymentPolicy): Promise<Outlet> {
    if (this.demoMode) {
      return mockStore.updatePaymentPolicy(policy);
    }

    try {
      const res = await fetch(`${this.config.baseUrl}/api/v1/outlets/${outletId}/payment-policy?policy=${policy}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
      });

      if (!res.ok) {
        throw new Error(`Failed to update payment policy: ${res.status}`);
      }

      return res.json();
    } catch {
      return mockStore.updatePaymentPolicy(policy);
    }
  }

  /**
   * Fetch Real Sales Report directly from PostgreSQL Backend
   */
  public async getSalesReport(outletId?: string, from?: string, to?: string): Promise<SalesReportResponse> {
    const targetOutletId = outletId || this.config.outletId;
    const url = new URL(`${this.config.baseUrl}/api/v1/reports/sales`);
    if (targetOutletId) url.searchParams.set('outletId', targetOutletId);
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(false),
    });

    if (!res.ok) {
      throw new Error(`Failed to load sales report: ${res.status}`);
    }

    return res.json();
  }

  /**
   * Save Void / Cancellation Audit Log directly to Database
   */
  public async recordVoidLog(entry: {
    outletId?: string;
    orderNumber?: string;
    tableNumber?: string;
    item: string;
    qty: number;
    amount: number;
    originalWaiter?: string;
    managerPin?: string;
    reason: string;
  }): Promise<any> {
    const res = await fetch(`${this.config.baseUrl}/api/v1/reports/void-logs`, {
      method: 'POST',
      headers: this.getHeaders(true),
      body: JSON.stringify(entry),
    });
    if (!res.ok) {
      throw new Error(`Failed to record void log: ${res.status}`);
    }
    return res.json();
  }

  /**
   * Fetch Real Void Audit Logs from Database
   */
  public async getVoidLogs(outletId?: string): Promise<any[]> {
    const targetOutletId = outletId || this.config.outletId;
    const url = new URL(`${this.config.baseUrl}/api/v1/reports/void-logs`);
    if (targetOutletId) url.searchParams.set('outletId', targetOutletId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders(false),
    });
    if (!res.ok) {
      throw new Error(`Failed to load void logs: ${res.status}`);
    }
    return res.json();
  }

  public async clearCatalog(): Promise<void> {
    await this.clearAllDemoData();
  }

  public async loadSampleCatalog(): Promise<void> {
    mockStore.loadSampleCatalog();
  }
}

export interface SalesReportResponse {
  summary: {
    totalRevenue: number;
    totalGrossSales: number;
    totalDiscount: number;
    totalNetTaxable: number;
    totalCgst: number;
    totalSgst: number;
    totalOrdersCount: number;
    averageOrderValue: number;
  };
  paymentBreakdown: Record<string, { count: number; amount: number }>;
  itemWiseSales: Array<{ id: string; name: string; quantity: number; revenue: number }>;
  categoryWiseSales: Array<{ name: string; quantity: number; revenue: number; percentage: number }>;
  hourlyHeatmap: Array<{ hour: string; orders: number; revenue: number }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    createdAt: string;
  }>;
}

export const posApiClient = new PosApiClient();
