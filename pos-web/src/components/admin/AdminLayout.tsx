import React, { useState, useEffect, useCallback } from 'react';
import type {
  Outlet,
  ProductCategory,
  Product,
  AddOn,
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
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    return posApiClient.getConfig().outletId || '';
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

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
      const [cats, prods, adds] = await Promise.all([
        posApiClient.getCategories(),
        posApiClient.getProducts(),
        posApiClient.getAddOns().catch(() => [] as AddOn[]),
      ]);
      setCategories(cats);
      setProducts(prods);
      setAddOns(adds);

      if (selectedOutletId) {
        const [ordList, billList] = await Promise.all([
          posApiClient.getOutletOrders(selectedOutletId).catch(() => [] as Order[]),
          posApiClient.getOutletBills(selectedOutletId).catch(() => [] as Bill[]),
        ]);
        setOrders(ordList);
        setBills(billList);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Handlers for menu management
  const handleCreateCategory = async (req: CategoryRequest) => {
    await posApiClient.createCategory(req);
    await loadAdminData();
  };

  const handleDeactivateCategory = async (id: string) => {
    await posApiClient.deactivateCategory(id);
    await loadAdminData();
  };

  const handleCreateProduct = async (req: ProductRequest) => {
    await posApiClient.createProduct(req);
    await loadAdminData();
  };

  const handleDeactivateProduct = async (id: string) => {
    await posApiClient.deactivateProduct(id);
    await loadAdminData();
  };

  const handleCreateAddOn = async (req: AddOnRequest) => {
    await posApiClient.createAddOn(req);
    await loadAdminData();
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
    await posApiClient.deleteAddOn(id);
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
            onClick={() => setActiveTab('dashboard')}
          >
            <span>📊</span> Dashboard
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span>📈</span> Reports & Analytics
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span>📦</span> Inventory & Recipes
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <span>🍽️</span> Menu Catalog
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>🧾</span> Orders
          </button>
          <button
            type="button"
            className={`admin-nav-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
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
              isLoading={loading}
              onRefresh={loadAdminData}
            />
          )}

          {activeTab === 'reports' && <ReportsDashboard />}

          {activeTab === 'inventory' && <InventoryModule />}

          {activeTab === 'menu' && (
            <AdminMenuManagement
              categories={categories}
              products={products}
              addOns={addOns}
              isLoading={loading}
              onRefresh={loadAdminData}
              onCreateCategory={handleCreateCategory}
              onDeactivateCategory={handleDeactivateCategory}
              onCreateProduct={handleCreateProduct}
              onDeactivateProduct={handleDeactivateProduct}
              onCreateAddOn={handleCreateAddOn}
              onUpdateProductAddOns={handleUpdateProductAddOns}
              onToggleAddOn={handleToggleAddOn}
              onDeleteAddOn={handleDeleteAddOn}
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
