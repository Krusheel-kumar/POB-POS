import React, { useState, useEffect, useCallback } from 'react';
import type {
  Outlet,
  ProductCategory,
  Product,
  AddOn,
  AddOnCategory,
  AddOnCategoryRequest,
  Order,
  Bill,
  CategoryRequest,
  ProductRequest,
  AddOnRequest,
} from '../../types/pos';
import { posApiClient } from '../../api/posApiClient';
import { AdminDashboard } from './AdminDashboard';
import { AdminMenuManagement } from './AdminMenuManagement';
import { AdminOrdersView } from './AdminOrdersView';
import { AdminBillingView } from './AdminBillingView';
import { ReportsDashboard } from './ReportsDashboard';
import { InventoryModule } from './InventoryModule';
import { CreateOutletModal } from './CreateOutletModal';
import './Admin.css';

type AdminTab = 'dashboard' | 'reports' | 'inventory' | 'menu' | 'orders' | 'billing';

export interface AdminLayoutProps {
  initialTab?: AdminTab;
  onBackToPos?: () => void;
  onNavigateToKitchen?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ initialTab, onBackToPos, onNavigateToKitchen }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab || 'dashboard');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, '');
      if (path === '/admin/reports') setActiveTab('reports');
      else if (path === '/admin/inventory') setActiveTab('inventory');
      else if (path === '/admin/menu') setActiveTab('menu');
      else if (path === '/admin/orders') setActiveTab('orders');
      else if (path === '/admin/billing') setActiveTab('billing');
      else if (path === '/admin') setActiveTab('dashboard');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (tab: AdminTab) => {
    setActiveTab(tab);
    const targetPath = tab === 'dashboard' ? '/admin' : `/admin/${tab}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return posApiClient.getConfig().outletId || '';
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [addOnCategories, setAddOnCategories] = useState<AddOnCategory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [voidLogs, setVoidLogs] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial outlets
  useEffect(() => {
    let isMounted = true;
    const loadOutlets = async () => {
      try {
        const outletList = await posApiClient.getOutlets();
        if (isMounted) {
          setOutlets(outletList);
          if (outletList.length > 0) {
            const currentOutlet = posApiClient.getConfig().outletId;
            const defaultOutlet = outletList.find((o) => o.id === currentOutlet) || outletList[0];
            setSelectedOutletId(defaultOutlet.id);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          // If outlets endpoint fails or returns error, fallback to configured outlet
          const currentOutlet = posApiClient.getConfig().outletId;
          if (currentOutlet) {
            setSelectedOutletId(currentOutlet);
          }
          console.warn('Failed to load outlets list:', err);
        }
      }
    };

    loadOutlets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch all admin data for current outlet
  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cats, prods, adds, addOnCats] = await Promise.all([
        posApiClient.getCategories(),
        posApiClient.getProducts(),
        posApiClient.getAddOns().catch(() => [] as AddOn[]),
        posApiClient.getAddOnCategories().catch(() => [] as AddOnCategory[]),
      ]);
      setCategories(cats);
      setProducts(prods);
      setAddOns(adds);
      setAddOnCategories(addOnCats);

      if (selectedOutletId) {
        const [ordList, billList, voidList] = await Promise.all([
          posApiClient.getOutletOrders(selectedOutletId).catch(() => [] as Order[]),
          posApiClient.getOutletBills(selectedOutletId).catch(() => [] as Bill[]),
          (typeof posApiClient.getVoidLogs === 'function'
            ? posApiClient.getVoidLogs(selectedOutletId)
            : Promise.resolve([])
          ).catch(() => [] as any[]),
        ]);
        setOrders(ordList);
        setBills(billList);
        setVoidLogs(voidList);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId]);

  // Periodic background live sync for real-time dashboard accuracy
  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    const interval = setInterval(() => {
      if (selectedOutletId) {
        Promise.all([
          posApiClient.getOutletOrders(selectedOutletId).catch(() => [] as Order[]),
          posApiClient.getOutletBills(selectedOutletId).catch(() => [] as Bill[]),
          (typeof posApiClient.getVoidLogs === 'function'
            ? posApiClient.getVoidLogs(selectedOutletId)
            : Promise.resolve([])
          ).catch(() => [] as any[]),
        ]).then(([ordList, billList, voidList]) => {
          setOrders(ordList);
          setBills(billList);
          setVoidLogs(voidList);
        });
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTab, selectedOutletId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData, activeTab]);

  // Handlers for menu management
  const handleCreateCategory = async (req: CategoryRequest) => {
    await posApiClient.createCategory(req);
    await loadAdminData();
  };

  const handleDeactivateCategory = async (id: string) => {
    await posApiClient.deactivateCategory(id);
    await loadAdminData();
  };

  const handleDeleteCategory = async (id: string) => {
    await posApiClient.deleteCategory(id);
    await loadAdminData();
  };

  const handleUpdateCategory = async (id: string, req: Partial<CategoryRequest>) => {
    await posApiClient.updateCategory(id, req);
    await loadAdminData();
  };

  const handlePurgeInactiveCategories = async () => {
    await posApiClient.purgeInactiveCategories();
    await loadAdminData();
  };

  const handleDeleteSubcategory = async (categoryId: string, subcat: string) => {
    await posApiClient.deleteSubcategory(categoryId, subcat);
    await loadAdminData();
  };

  const handleCreateProduct = async (req: ProductRequest) => {
    await posApiClient.createProduct(req);
    await loadAdminData();
  };

  const handleUpdateProduct = async (id: string, req: ProductRequest) => {
    await posApiClient.updateProduct(id, req);
    await loadAdminData();
  };

  const handleDeleteProduct = async (id: string) => {
    await posApiClient.deleteProduct(id);
    await loadAdminData();
  };

  const handleDeactivateProduct = async (id: string) => {
    await posApiClient.deactivateProduct(id);
    await loadAdminData();
  };

  const handleCreateAddOn = async (req: AddOnRequest) => {
    const tempId = `addon-${Date.now()}`;
    const optimistic: AddOn = {
      id: tempId,
      name: req.name,
      price: req.price,
      category: req.category,
      selectionType: req.selectionType || 'MULTI',
      minSelections: req.minSelections,
      maxSelections: req.maxSelections,
      isActive: true,
    };
    setAddOns((prev) => [...prev, optimistic]);
    try {
      const created = await posApiClient.createAddOn(req);
      setAddOns((prev) => prev.map((a) => (a.id === tempId ? created : a)));
    } catch {
      // optimistic state retained
    }
  };

  const handleUpdateProductAddOns = async (productId: string, addOnIds: string[]) => {
    await posApiClient.updateProductAddOns(productId, addOnIds);
    await loadAdminData();
  };

  const handleToggleAddOn = async (id: string) => {
    await posApiClient.toggleAddOn(id);
    await loadAdminData();
  };

  const handleDeleteAddOn = async (id: string) => {
    setAddOns((prev) => prev.filter((a) => a.id !== id));
    try {
      await posApiClient.deleteAddOn(id);
    } catch {
      // optimistic state retained
    }
  };

  const handleUpdateProductRank = async (productId: string, rank: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, displayOrder: rank } : p))
    );
    try {
      await posApiClient.updateProductRank(productId, rank);
    } catch (err) {
      console.warn('Rank sync notice:', err);
    }
    await loadAdminData();
  };

  const handleUpdateAddOnRank = async (addonId: string, rank: number) => {
    setAddOns((prev) =>
      prev.map((a) => (a.id === addonId ? { ...a, displayOrder: rank } : a))
    );
    try {
      await posApiClient.updateAddOnRank(addonId, rank);
    } catch (err) {
      console.warn('AddOn rank sync notice:', err);
    }
    await loadAdminData();
  };

  const handleCreateAddOnCategory = async (req: AddOnCategoryRequest) => {
    await posApiClient.createAddOnCategory(req);
    await loadAdminData();
  };

  const handleUpdateAddOnCategory = async (id: string, req: Partial<AddOnCategoryRequest>) => {
    await posApiClient.updateAddOnCategory(id, req);
    await loadAdminData();
  };

  const handleDeleteAddOnCategory = async (id: string) => {
    await posApiClient.deleteAddOnCategory(id);
    await loadAdminData();
  };

  const [showAddOutletModal, setShowAddOutletModal] = useState<boolean>(false);

  const handleOutletChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedOutletId(newId);
    posApiClient.updateConfig({ outletId: newId });
  };

  const handleOutletCreated = (newOutlet: Outlet) => {
    setOutlets((prev) => [...prev, newOutlet]);
    setSelectedOutletId(newOutlet.id);
    posApiClient.updateConfig({ outletId: newOutlet.id });
  };

  return (
    <div className="admin-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-logo">P</div>
          <h2>POP O' BOB</h2>
          <span className="admin-brand-tag">POS & Admin</span>
        </div>

        <nav className="admin-nav">
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => handleTabChange('reports')}
          >
            <span>📈</span> Reports & Analytics
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => handleTabChange('inventory')}
          >
            <span>📦</span> Inventory & Recipes
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => handleTabChange('menu')}
          >
            <span>🍽️</span> Menu Catalog
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => handleTabChange('orders')}
          >
            <span>🧾</span> Orders
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => handleTabChange('billing')}
          >
            <span>💳</span> Billing & Invoices
          </button>
        </nav>

        <div className="admin-sidebar-footer">
          <button
            type="button"
            className="admin-link-btn"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            onClick={() => {
              if (onBackToPos) {
                onBackToPos();
              } else {
                window.history.pushState({}, '', '/');
                window.location.pathname = '/';
              }
            }}
          >
            ← Cashier POS
          </button>
          <button
            type="button"
            className="admin-link-btn"
            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
            onClick={() => {
              if (onNavigateToKitchen) {
                onNavigateToKitchen();
              } else {
                window.history.pushState({}, '', '/kitchen');
                window.location.pathname = '/kitchen';
              }
            }}
          >
            👨‍🍳 Kitchen Display
          </button>
        </div>
      </aside>

      {/* MAIN VIEW */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-title-area">
            <h1>
              {activeTab === 'dashboard' && 'Restaurant Dashboard'}
              {activeTab === 'reports' && 'Reports & Analytics'}
              {activeTab === 'inventory' && 'Inventory, Recipe (BOM) & Warehouse Management'}
              {activeTab === 'menu' && 'Menu & Catalog Management'}
              {activeTab === 'orders' && 'Order Management'}
              {activeTab === 'billing' && 'Billing & Payment Records'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                if (onBackToPos) {
                  onBackToPos();
                } else {
                  window.history.pushState({}, '', '/');
                  window.location.pathname = '/';
                }
              }}
              style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              ← Back to POS
            </button>

            <div className="admin-outlet-selector">
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Outlet:</span>
              {outlets.length > 0 ? (
                <select
                  className="admin-outlet-select"
                  value={selectedOutletId}
                  onChange={handleOutletChange}
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Default Outlet</span>
              )}

              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={() => setShowAddOutletModal(true)}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.35rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1px solid #0284c7',
                  color: '#0284c7',
                  background: '#f0f9ff',
                  cursor: 'pointer',
                }}
                title="Onboard and create a new outlet branch"
              >
                + Add Outlet
              </button>
            </div>
          </div>
        </header>

        <div className="admin-content">
          {error && <div className="error-banner">{error}</div>}

          {activeTab === 'dashboard' && (
            <AdminDashboard
              orders={orders}
              bills={bills}
              voidLogs={voidLogs}
              outletId={selectedOutletId}
              isLoading={loading}
              onRefresh={loadAdminData}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsDashboard
              bills={bills}
              orders={orders}
              outletId={selectedOutletId}
              onRefresh={loadAdminData}
            />
          )}

          {activeTab === 'inventory' && <InventoryModule />}

          {activeTab === 'menu' && (
            <AdminMenuManagement
              categories={categories}
              products={products}
              addOns={addOns}
              addOnCategories={addOnCategories}
              isLoading={loading}
              onRefresh={loadAdminData}
              onCreateCategory={handleCreateCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeactivateCategory={handleDeactivateCategory}
              onDeleteCategory={handleDeleteCategory}
              onPurgeInactiveCategories={handlePurgeInactiveCategories}
              onDeleteSubcategory={handleDeleteSubcategory}
              onCreateProduct={handleCreateProduct}
              onUpdateProduct={handleUpdateProduct}
              onDeleteProduct={handleDeleteProduct}
              onDeactivateProduct={handleDeactivateProduct}
              onCreateAddOn={handleCreateAddOn}
              onUpdateProductAddOns={handleUpdateProductAddOns}
              onToggleAddOn={handleToggleAddOn}
              onDeleteAddOn={handleDeleteAddOn}
              onUpdateProductRank={handleUpdateProductRank}
              onUpdateAddOnRank={handleUpdateAddOnRank}
              onCreateAddOnCategory={handleCreateAddOnCategory}
              onUpdateAddOnCategory={handleUpdateAddOnCategory}
              onDeleteAddOnCategory={handleDeleteAddOnCategory}
            />
          )}

          {activeTab === 'orders' && (
            <AdminOrdersView
              orders={orders}
              isLoading={loading}
              onRefresh={loadAdminData}
            />
          )}

          {activeTab === 'billing' && (
            <AdminBillingView
              bills={bills}
              isLoading={loading}
              onRefresh={loadAdminData}
            />
          )}
        </div>

        <CreateOutletModal
          isOpen={showAddOutletModal}
          onClose={() => setShowAddOutletModal(false)}
          onOutletCreated={handleOutletCreated}
        />
      </main>
    </div>
  );
};
