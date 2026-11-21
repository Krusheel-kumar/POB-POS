import React, { useState, useMemo } from 'react';
import type { ProductCategory, Product, AddOn, CategoryRequest, ProductRequest, AddOnRequest } from '../../types/pos';
import { AddProductModal } from '../AddProductModal';
import './AdminMenuManagement.css';

interface AdminMenuManagementProps {
  categories: ProductCategory[];
  products: Product[];
  addOns: AddOn[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateCategory: (req: CategoryRequest) => Promise<void>;
  onDeactivateCategory: (id: string) => Promise<void>;
  onDeleteCategory?: (id: string) => Promise<void>;
  onDeleteSubcategory?: (categoryId: string, subcat: string) => Promise<void>;
  onCreateProduct: (req: ProductRequest) => Promise<void>;
  onUpdateProduct?: (id: string, req: ProductRequest) => Promise<void>;
  onDeleteProduct?: (id: string) => Promise<void>;
  onDeactivateProduct: (id: string) => Promise<void>;
  onCreateAddOn: (req: AddOnRequest) => Promise<void>;
  onUpdateProductAddOns?: (productId: string, addOnIds: string[]) => Promise<void>;
  onToggleAddOn?: (id: string) => Promise<void>;
  onDeleteAddOn?: (id: string) => Promise<void>;
}

export const AdminMenuManagement: React.FC<AdminMenuManagementProps> = ({
  categories,
  products,
  addOns,
  isLoading,
  onRefresh,
  onCreateCategory,
  onDeactivateCategory,
  onDeleteCategory,
  onDeleteSubcategory,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onDeactivateProduct,
  onCreateAddOn,
  onUpdateProductAddOns,
  onToggleAddOn,
  onDeleteAddOn,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'addons'>('products');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Petpooja 2-column menu layout states
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);

  // Selected item for Edit modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // New Category State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // Product Modal State
  const [showProductModal, setShowProductModal] = useState(false);

  // Product Add-on Assignment Modal
  const [editingAddOnsProduct, setEditingAddOnsProduct] = useState<Product | null>(null);
  const [assignedAddOnIds, setAssignedAddOnIds] = useState<string[]>([]);

  // New Add-On Item State
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [addOnName, setAddOnName] = useState('');
  const [addOnPrice, setAddOnPrice] = useState('0');
  const [addOnCategory, setAddOnCategory] = useState('Choice Of Size');
  const [addOnSelectionType, setAddOnSelectionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  // New Add-On Category Modal State
  const [showNewCategoryGroupModal, setShowNewCategoryGroupModal] = useState(false);
  const [newGroupCatName, setNewGroupCatName] = useState('');
  const [newGroupSelectionType, setNewGroupSelectionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');

  // Add-on Category Filter
  const [filterAddOnCat, setFilterAddOnCat] = useState<string>('ALL');

  // Single Add-on bulk product assignment modal
  const [bulkAssignAddOn, setBulkAssignAddOn] = useState<AddOn | null>(null);
  const [bulkSelectedProductIds, setBulkSelectedProductIds] = useState<string[]>([]);

  // Unique categories of Add-ons
  const uniqueAddOnCategories = useMemo(() => {
    const defaultCats = [
      'Choice Of Size',
      'Choice Of Sweetness',
      'Choice Of Ice Level',
      'Choice Of Boba & Toppings',
      'Choice Of Milk Base',
      'Choice Of Dips & Cheeses',
    ];
    const fromList = addOns.map((a) => a.category || 'Choice Of Size');
    return Array.from(new Set([...defaultCats, ...fromList]));
  }, [addOns]);

  // Group add-ons by category
  const groupedAddOns = useMemo(() => {
    const groups: Record<string, AddOn[]> = {};
    uniqueAddOnCategories.forEach((cat) => {
      groups[cat] = [];
    });
    addOns.forEach((a) => {
      const cat = a.category || 'Choice Of Size';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(a);
    });
    return groups;
  }, [addOns, uniqueAddOnCategories]);

  // Filtered add-ons list
  const filteredAddOns = useMemo(() => {
    if (filterAddOnCat === 'ALL') return addOns;
    return addOns.filter((a) => (a.category || 'Choice Of Size') === filterAddOnCat);
  }, [addOns, filterAddOnCat]);

  // Petpooja: Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const catId = p.category?.id || 'uncategorized';
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Petpooja: Filtered categories respecting hideEmptyCategories
  const visibleCategories = useMemo(() => {
    if (!hideEmptyCategories) return categories;
    return categories.filter((c) => (categoryCounts[c.id] || 0) > 0);
  }, [categories, hideEmptyCategories, categoryCounts]);

  // Petpooja: Active category object
  const activeCategoryObj = useMemo(() => {
    if (selectedCategoryId === 'ALL') return null;
    return categories.find((c) => c.id === selectedCategoryId) || null;
  }, [categories, selectedCategoryId]);

  // Petpooja: Subcategories available in active category
  const activeSubcategories = useMemo(() => {
    if (!activeCategoryObj) {
      const allSubcats = products
        .map((p) => p.subcategory)
        .filter((s): s is string => !!s);
      return Array.from(new Set(allSubcats));
    }
    const fromCat = activeCategoryObj.subcategories || [];
    const fromProds = products
      .filter((p) => p.category?.id === activeCategoryObj.id && p.subcategory)
      .map((p) => p.subcategory!);
    return Array.from(new Set([...fromCat, ...fromProds]));
  }, [activeCategoryObj, products]);

  // Petpooja: Filtered products list for table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategoryId !== 'ALL' && p.category?.id !== selectedCategoryId) {
        return false;
      }
      if (selectedSubcategory !== 'ALL' && p.subcategory !== selectedSubcategory) {
        return false;
      }
      if (menuSearchQuery.trim()) {
        const q = menuSearchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchSubcat = p.subcategory?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc && !matchSubcat) {
          return false;
        }
      }
      return true;
    });
  }, [products, selectedCategoryId, selectedSubcategory, menuSearchQuery]);

  // Handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await onCreateCategory({
        name: categoryName,
        description: categoryDesc,
        displayOrder: categories.length + 1,
        isActive: true,
      });
      setCategoryName('');
      setCategoryDesc('');
      setShowCategoryModal(false);
      setSuccessMsg('Category created successfully');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create category');
    }
  };

  const handleCreateAddOn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const finalCat = isCustomCategory ? customCategoryInput.trim() || 'Choice Of Size' : addOnCategory;
      await onCreateAddOn({
        name: addOnName,
        price: parseFloat(addOnPrice) || 0,
        category: finalCat,
        selectionType: addOnSelectionType,
        isActive: true,
      });
      setAddOnName('');
      setAddOnPrice('0');
      setCustomCategoryInput('');
      setIsCustomCategory(false);
      setShowAddOnModal(false);
      setSuccessMsg(`Item "${addOnName}" added to [${finalCat}]!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create add-on');
    }
  };

  const handleCreateNewAddOnCategoryGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupCatName.trim()) return;
    setAddOnCategory(newGroupCatName.trim());
    setAddOnSelectionType(newGroupSelectionType);
    setShowNewCategoryGroupModal(false);
    // Directly open Add-on item modal with this category selected
    setAddOnName('');
    setAddOnPrice('0');
    setIsCustomCategory(false);
    setShowAddOnModal(true);
    setSuccessMsg(`Add-on Category "${newGroupCatName.trim()}" created! Now add items like Regular(300ml) under it.`);
    setNewGroupCatName('');
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Open manage add-ons modal for a product
  const handleOpenProductAddOns = (prod: Product) => {
    setEditingAddOnsProduct(prod);
    setAssignedAddOnIds(prod.addOns?.map((a) => a.id) || []);
  };

  // Save product add-ons
  const handleSaveProductAddOns = async () => {
    if (!editingAddOnsProduct || !onUpdateProductAddOns) return;
    try {
      await onUpdateProductAddOns(editingAddOnsProduct.id, assignedAddOnIds);
      setSuccessMsg(`Customization choices updated for ${editingAddOnsProduct.name}!`);
      setEditingAddOnsProduct(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update add-ons');
    }
  };

  // Toggle add-on selection in product creation or assignment modal
  const toggleAddOnInList = (id: string, currentList: string[], setter: (val: string[]) => void) => {
    if (currentList.includes(id)) {
      setter(currentList.filter((x) => x !== id));
    } else {
      setter([...currentList, id]);
    }
  };

  // Bulk assign single add-on across products
  const handleOpenBulkAssign = (addon: AddOn) => {
    setBulkAssignAddOn(addon);
    const linkedProductIds = products
      .filter((p) => p.addOns?.some((a) => a.id === addon.id))
      .map((p) => p.id);
    setBulkSelectedProductIds(linkedProductIds);
  };

  const handleSaveBulkAssign = async () => {
    if (!bulkAssignAddOn || !onUpdateProductAddOns) return;
    try {
      for (const prod of products) {
        const currentlyHas = prod.addOns?.some((a) => a.id === bulkAssignAddOn.id) || false;
        const shouldHave = bulkSelectedProductIds.includes(prod.id);

        if (currentlyHas !== shouldHave) {
          const currentIds = prod.addOns?.map((a) => a.id) || [];
          const updatedIds = shouldHave
            ? [...currentIds, bulkAssignAddOn.id]
            : currentIds.filter((id) => id !== bulkAssignAddOn.id);
          await onUpdateProductAddOns(prod.id, updatedIds);
        }
      }
      setSuccessMsg(`Add-on "${bulkAssignAddOn.name}" assigned to ${bulkSelectedProductIds.length} products!`);
      setBulkAssignAddOn(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update products');
    }
  };

  return (
    <div>
      <div className="tabs-header">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Catalog Products ({products.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'addons' ? 'active' : ''}`}
          onClick={() => setActiveTab('addons')}
        >
          Add-ons & Choices ({addOns.length})
        </button>
      </div>

      {errorMsg && <div className="error-banner">{errorMsg}</div>}
      {successMsg && <div className="success-banner">{successMsg}</div>}

      {/* ========================================================
          PRODUCTS TAB
         ======================================================== */}
      {/* ========================================================
          PRODUCTS TAB (PETPOOJA 2-COLUMN CATEGORY & ITEM LAYOUT)
         ======================================================== */}
      {activeTab === 'products' && (
        <div className="admin-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Catalog Products</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Select a category on the left to view or add items. Modifiers, toppings, and gapless billing are instantly synchronized.
              </p>
            </div>
            <div className="admin-header-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingProduct(null);
                  setShowProductModal(true);
                }}
              >
                + Add Product
              </button>
            </div>
          </div>

          <div className="petpooja-menu-layout">
            {/* LEFT: Categories Sidebar */}
            <div className="petpooja-category-sidebar">
              <div className="category-sidebar-header">
                <div className="category-sidebar-title">
                  <span>Categories</span>
                  <span className="category-sidebar-count">{categories.length}</span>
                </div>
                <button
                  type="button"
                  className="btn-add-category-mini"
                  onClick={() => setShowCategoryModal(true)}
                  title="Create a new Category"
                >
                  + Add Category
                </button>
              </div>

              <div className="category-sidebar-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={hideEmptyCategories}
                    onChange={(e) => setHideEmptyCategories(e.target.checked)}
                  />
                  <span>Hide empty categories</span>
                </label>
              </div>

              <div className="category-sidebar-list">
                <div
                  className={`category-item-row ${selectedCategoryId === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategoryId('ALL');
                    setSelectedSubcategory('ALL');
                  }}
                >
                  <span className="category-item-name">All Categories</span>
                  <span className="category-item-badge">{products.length}</span>
                </div>

                {visibleCategories.map((c) => {
                  const count = categoryCounts[c.id] || 0;
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`category-item-row ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCategoryId(c.id);
                        setSelectedSubcategory('ALL');
                      }}
                      title={c.name}
                    >
                      <span className="category-item-name">{c.name}</span>
                      <div className="category-item-actions">
                        <span className="category-item-badge">{count}</span>
                        {onDeleteCategory && (
                          <button
                            type="button"
                            className="btn-cat-row-delete"
                            title={`Delete category "${c.name}"`}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`⚠️ Permanently delete category "${c.name}"?\n\nThis will also cascade delete all its subcategories and all products in this category.`)) {
                                try {
                                  await onDeleteCategory(c.id);
                                  if (selectedCategoryId === c.id) {
                                    setSelectedCategoryId('ALL');
                                  }
                                  setSuccessMsg(`Category "${c.name}" deleted.`);
                                } catch (err: any) {
                                  setErrorMsg(err.message || 'Failed to delete category');
                                }
                              }
                            }}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Items & Actions Panel */}
            <div className="petpooja-items-panel">
              {/* Toolbar */}
              <div className="petpooja-toolbar">
                <div className="petpooja-toolbar-left">
                  <div className="petpooja-search-box">
                    <span>🔍</span>
                    <input
                      type="text"
                      placeholder="Search items, SKU..."
                      value={menuSearchQuery}
                      onChange={(e) => setMenuSearchQuery(e.target.value)}
                    />
                    {menuSearchQuery && (
                      <button
                        type="button"
                        className="btn-clear-search"
                        onClick={() => setMenuSearchQuery('')}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {activeSubcategories.length > 0 && (
                    <div className="petpooja-subcat-pills">
                      <button
                        type="button"
                        className={`subcat-pill ${selectedSubcategory === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSelectedSubcategory('ALL')}
                      >
                        All
                      </button>
                      {activeSubcategories.map((subcat) => (
                        <div
                          key={subcat}
                          className={`subcat-pill-wrapper ${selectedSubcategory === subcat ? 'active' : ''}`}
                        >
                          <button
                            type="button"
                            className="subcat-pill-label"
                            onClick={() => setSelectedSubcategory(subcat)}
                          >
                            {subcat}
                          </button>
                          {onDeleteSubcategory && activeCategoryObj && (
                            <button
                              type="button"
                              className="subcat-pill-delete"
                              title={`Delete subcategory "${subcat}" and all its items`}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (window.confirm(`⚠️ Delete subcategory "${subcat}"?\n\nAll items under "${subcat}" will also be permanently deleted.`)) {
                                  try {
                                    await onDeleteSubcategory(activeCategoryObj.id, subcat);
                                    if (selectedSubcategory === subcat) {
                                      setSelectedSubcategory('ALL');
                                    }
                                    setSuccessMsg(`Subcategory "${subcat}" and its items deleted.`);
                                  } catch (err: any) {
                                    setErrorMsg(err.message || 'Failed to delete subcategory');
                                  }
                                }
                              }}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="petpooja-toolbar-right">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm petpooja-add-btn"
                    onClick={() => {
                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                  >
                    + Add Items
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="petpooja-table-wrapper">
                {isLoading ? (
                  <div className="loading-spinner">Loading items...</div>
                ) : filteredProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '3rem 1rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>
                      {selectedCategoryId === 'ALL'
                        ? 'No products found. Click "+ Add Items" to add your first menu item!'
                        : `No items in "${activeCategoryObj?.name || 'this category'}". Click "+ Add Items" to add items here.`}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm petpooja-add-btn"
                      style={{ marginTop: '1rem', display: 'inline-flex' }}
                      onClick={() => {
                        setEditingProduct(null);
                        setShowProductModal(true);
                      }}
                    >
                      + Add Item to {activeCategoryObj?.name || 'Menu'}
                    </button>
                  </div>
                ) : (
                  <table className="petpooja-table">
                    <thead>
                      <tr>
                        <th>Name *</th>
                        <th>Short Code *</th>
                        <th>Price *</th>
                        <th>Description</th>
                        <th>Image</th>
                        <th>Attached Choices</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p) => {
                        const isVeg = p.dietaryType === 'VEG' || p.dietaryType === 'VEGAN';
                        const isNonVeg = p.dietaryType === 'NON_VEG';
                        const hasVariants = (p.variants?.length || 0) > 0;
                        const hasAddons = (p.addOns?.length || 0) > 0;

                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span
                                  className={
                                    isVeg ? 'diet-dot-veg' : isNonVeg ? 'diet-dot-nonveg' : 'diet-dot-beverage'
                                  }
                                  title={p.dietaryType || 'BEVERAGE'}
                                />
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <strong>{p.name}</strong>
                                    {p.badge && (
                                      <span
                                        className="product-addon-mini-tag"
                                        style={{ background: '#fef3c7', color: '#b45309', fontWeight: 600, fontSize: '0.7rem' }}
                                      >
                                        {p.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="petpooja-tags-row">
                                    {hasVariants && <span className="petpooja-tag petpooja-tag-v" title="Item has size/sugar/ice variations">V+</span>}
                                    {hasAddons && <span className="petpooja-tag petpooja-tag-a" title="Item has customizable add-on toppings">A</span>}
                                    <span className="petpooja-tag petpooja-tag-o" title="Exposed in online ordering & POS">O</span>
                                    {p.subcategory && (
                                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>• {p.subcategory}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                {p.sku ? `SKU: ${p.sku}` : '-'}
                              </span>
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>
                                ₹{p.basePrice.toFixed(2)}
                              </strong>
                            </td>
                            <td style={{ maxWidth: '220px' }}>
                              <span
                                style={{
                                  fontSize: '0.8rem',
                                  color: '#64748b',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                                title={p.description || ''}
                              >
                                {p.description || '-'}
                              </span>
                            </td>
                            <td>
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    border: '1px solid #e2e8f0',
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '6px',
                                    background: '#f1f5f9',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    border: '1px solid #e2e8f0',
                                  }}
                                >
                                  🧋
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div className="product-addon-badges">
                                  {p.addOns && p.addOns.length > 0 ? (
                                    p.addOns.slice(0, 2).map((a) => (
                                      <span key={a.id} className="product-addon-mini-tag" title={a.name}>
                                        {a.name} ({a.price > 0 ? `+₹${a.price}` : '₹0'})
                                      </span>
                                    ))
                                  ) : (
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>None linked</span>
                                  )}
                                  {p.addOns && p.addOns.length > 2 && (
                                    <span
                                      className="product-addon-mini-tag"
                                      style={{ background: '#e0e7ff', color: '#3730a3' }}
                                    >
                                      +{p.addOns.length - 2} more
                                    </span>
                                  )}
                                </div>
                                {onUpdateProductAddOns && (
                                  <button
                                    type="button"
                                    className="btn-manage-addons"
                                    onClick={() => handleOpenProductAddOns(p)}
                                    title="Assign or remove size & add-on choices for this item"
                                  >
                                    ⚙️ Add-ons ({p.addOns?.length || 0})
                                  </button>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${p.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                {p.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ fontWeight: 600, padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setShowProductModal(true);
                                  }}
                                  title="Edit product name, price, toppings, and photo"
                                >
                                  ✏️ Edit
                                </button>
                                {p.isActive && (
                                  <button
                                    type="button"
                                    className="btn btn-warning btn-sm"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                                    onClick={() => onDeactivateProduct(p.id)}
                                  >
                                    Deactivate
                                  </button>
                                )}
                                {onDeleteProduct && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem' }}
                                    onClick={async () => {
                                      if (window.confirm(`Permanently delete "${p.name}" from catalog?`)) {
                                        await onDeleteProduct(p.id);
                                      }
                                    }}
                                    title="Permanently delete item"
                                  >
                                    🗑️ Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Petpooja Footer & Legend */}
              <div className="petpooja-legend-footer">
                <div className="petpooja-legend-items">
                  <span style={{ fontWeight: 600, color: '#475569' }}>Legend:</span>
                  <div className="petpooja-legend-item">
                    <span className="petpooja-tag petpooja-tag-o">O</span>
                    <span>Online & POS</span>
                  </div>
                  <div className="petpooja-legend-item">
                    <span className="petpooja-tag petpooja-tag-v">V</span>
                    <span>Variations</span>
                  </div>
                  <div className="petpooja-legend-item">
                    <span className="petpooja-tag petpooja-tag-a">A</span>
                    <span>Add-on Details</span>
                  </div>
                  <div className="petpooja-legend-item">
                    <span className="diet-dot-veg" style={{ width: '10px', height: '10px' }} />
                    <span>Veg</span>
                  </div>
                  <div className="petpooja-legend-item">
                    <span className="diet-dot-nonveg" style={{ width: '10px', height: '10px' }} />
                    <span>Non-Veg</span>
                  </div>
                </div>
                <div>
                  Showing {filteredProducts.length > 0 ? 1 : 0} to {filteredProducts.length} of {filteredProducts.length} records
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CATEGORIES TAB
         ======================================================== */}
      {activeTab === 'categories' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Menu Categories</h3>
            <div className="admin-header-actions">
              <button type="button" className="btn btn-secondary btn-sm" onClick={onRefresh}>
                Refresh
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowCategoryModal(true)}
              >
                + Add Category
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="loading-spinner">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">No categories configured.</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th>Display Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.description || '-'}</td>
                      <td>{c.displayOrder ?? 0}</td>
                      <td>
                        <span className={`badge ${c.isActive !== false ? 'badge-success' : 'badge-neutral'}`}>
                          {c.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          {c.isActive !== false && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => onDeactivateCategory(c.id)}
                            >
                              Deactivate
                            </button>
                          )}
                          {onDeleteCategory && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={async () => {
                                if (window.confirm(`⚠️ Permanently delete category "${c.name}"?\n\nThis will also cascade delete all its subcategories and all products under this category.`)) {
                                  try {
                                    await onDeleteCategory(c.id);
                                    if (selectedCategoryId === c.id) {
                                      setSelectedCategoryId('ALL');
                                    }
                                    setSuccessMsg(`Category "${c.name}" and all its items deleted.`);
                                  } catch (err: any) {
                                    setErrorMsg(err.message || 'Failed to delete category');
                                  }
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          ADD-ONS TAB (CATEGORY GROUPS & ITEMS AS REQUESTED)
         ======================================================== */}
      {activeTab === 'addons' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>Add-on Categories & Modifier Choices</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                Create Add-on Categories like <strong>Choice Of Size</strong>, <strong>Choice Of Sweetness</strong>, <strong>Choice Of Boba</strong>, and add items like <em>Regular(300ml)</em>, <em>Large(700ml)</em> under each category.
              </p>
            </div>
            <div className="admin-header-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowNewCategoryGroupModal(true)}
                style={{ background: '#f1f5f9', fontWeight: 600 }}
              >
                📁 + New Add-on Category
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setAddOnCategory('Choice Of Size');
                  setAddOnSelectionType('SINGLE');
                  setIsCustomCategory(false);
                  setShowAddOnModal(true);
                }}
              >
                + Add Item / Size
              </button>
            </div>
          </div>

          {/* Add-on Category Filter Bar */}
          <div className="addon-category-filter">
            <button
              type="button"
              className={`category-filter-pill ${filterAddOnCat === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterAddOnCat('ALL')}
            >
              All Categories & Items ({addOns.length})
            </button>
            {uniqueAddOnCategories.map((cat) => {
              const count = addOns.filter((a) => (a.category || 'Choice Of Size') === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-filter-pill ${filterAddOnCat === cat ? 'active' : ''}`}
                  onClick={() => setFilterAddOnCat(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="loading-spinner">Loading add-ons...</div>
          ) : filteredAddOns.length === 0 ? (
            <div className="empty-state">
              No items in this category yet. Click "+ Add Item / Size" to add options like Regular(300ml).
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item / Choice Name</th>
                    <th>Add-on Category Name</th>
                    <th>Selection Type</th>
                    <th>Extra Price</th>
                    <th>Assigned in Products</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAddOns.map((a) => {
                    const linkedProducts = products.filter((p) => p.addOns?.some((item) => item.id === a.id));
                    const isSingle = a.selectionType === 'SINGLE' || a.category?.toLowerCase().includes('size') || a.category?.toLowerCase().includes('sweetness');
                    return (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.name}</strong>
                        </td>
                        <td>
                          <span className="addon-badge-cat">
                            {a.category || 'Choice Of Size'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isSingle ? '#1d4ed8' : '#15803d' }}>
                            {isSingle ? '● Single Choice (Select 1)' : '☑️ Multi Choice (Optional)'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: a.price > 0 ? '#059669' : '#64748b' }}>
                            {a.price > 0 ? `+₹${a.price.toFixed(2)}` : '₹0.00 (Included)'}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: linkedProducts.length > 0 ? '#1e293b' : '#94a3b8' }}>
                            {linkedProducts.length > 0
                              ? `Linked to ${linkedProducts.length} item(s)`
                              : 'Not attached yet'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${a.isActive ? 'badge-success' : 'badge-neutral'}`}>
                            {a.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {onToggleAddOn && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => onToggleAddOn(a.id)}
                              >
                                {a.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                            {onUpdateProductAddOns && (
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenBulkAssign(a)}
                                title="Attach this item across menu products"
                              >
                                🔗 Assign
                              </button>
                            )}
                            {onDeleteAddOn && (
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => onDeleteAddOn(a.id)}
                                title="Delete this add-on choice"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CREATE NEW ADD-ON CATEGORY GROUP MODAL
         ======================================================== */}
      {showNewCategoryGroupModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '420px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>📁 Create Add-on Category Name</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '-0.5rem' }}>
              e.g. <strong>Choice Of Size</strong>, <strong>Choice Of Crust</strong>, <strong>Choice Of Sweetness</strong>
            </p>
            <form onSubmit={handleCreateNewAddOnCategoryGroup}>
              <div className="form-group">
                <label className="form-label">Add-on Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={newGroupCatName}
                  onChange={(e) => setNewGroupCatName(e.target.value)}
                  placeholder="e.g. Choice Of Size"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Selection Mode for Customers</label>
                <select
                  className="form-select"
                  value={newGroupSelectionType}
                  onChange={(e) => setNewGroupSelectionType(e.target.value as 'SINGLE' | 'MULTI')}
                >
                  <option value="SINGLE">Single Choice (Customer must pick 1, e.g. Size, Sugar Level)</option>
                  <option value="MULTI">Multiple Choice (Customer can pick multiple extras, e.g. Boba, Toppings)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewCategoryGroupModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Category & Add Items →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE ADD-ON ITEM / SIZE MODAL
         ======================================================== */}
      {showAddOnModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '460px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>+ Add Item to Add-on Category</h3>
            <form onSubmit={handleCreateAddOn}>
              <div className="form-group">
                <label className="form-label">Add-on Category Name</label>
                {!isCustomCategory ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <select
                      className="form-select"
                      value={addOnCategory}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAddOnCategory(val);
                        if (val.toLowerCase().includes('size') || val.toLowerCase().includes('sweetness') || val.toLowerCase().includes('ice')) {
                          setAddOnSelectionType('SINGLE');
                        } else {
                          setAddOnSelectionType('MULTI');
                        }
                      }}
                    >
                      {uniqueAddOnCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsCustomCategory(true)}
                      title="Type a custom category name"
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Choice Of Size"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setIsCustomCategory(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Item / Choice Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={addOnName}
                  onChange={(e) => setAddOnName(e.target.value)}
                  placeholder="e.g. Regular(300ml), Large(700ml), Tapioca Boba"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Extra Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    required
                    value={addOnPrice}
                    onChange={(e) => setAddOnPrice(e.target.value)}
                    placeholder="0 for base size, 40 for large"
                  />
                  <small style={{ color: '#64748b' }}>Enter 0 for base size/option</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Selection Type</label>
                  <select
                    className="form-select"
                    value={addOnSelectionType}
                    onChange={(e) => setAddOnSelectionType(e.target.value as 'SINGLE' | 'MULTI')}
                  >
                    <option value="SINGLE">Single Choice (Radio)</option>
                    <option value="MULTI">Multiple Choice (Checkboxes)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddOnModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE CATEGORY MODAL
         ======================================================== */}
      {showCategoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Create Category</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="e.g. Specialty Beverages"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryDesc}
                  onChange={(e) => setCategoryDesc(e.target.value)}
                  placeholder="e.g. Hot and iced artisanal coffees"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          ADD & EDIT PRODUCT MODAL (WITH IMAGE PREVIEWS & MODIFIER MAPPING)
         ======================================================== */}
      <AddProductModal
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(null);
        }}
        categories={categories}
        addOns={addOns}
        editingProduct={editingProduct}
        initialCategoryId={selectedCategoryId !== 'ALL' ? selectedCategoryId : (categories[0]?.id || '')}
        onProductCreated={async (req) => {
          await onCreateProduct(req);
          if (req.categoryId && req.categoryId !== selectedCategoryId && selectedCategoryId !== 'ALL') {
            setSelectedCategoryId(req.categoryId);
          }
          setSuccessMsg(`✓ Added "${req.name}" to menu`);
          setTimeout(() => setSuccessMsg(null), 4000);
        }}
        onProductUpdated={async (id, req) => {
          if (onUpdateProduct) {
            await onUpdateProduct(id, req);
            setSuccessMsg(`✓ Updated "${req.name}"`);
            setTimeout(() => setSuccessMsg(null), 4000);
          }
        }}
        onProductDeleted={async (id) => {
          if (onDeleteProduct) {
            await onDeleteProduct(id);
            setSuccessMsg('✓ Product deleted from catalog');
            setTimeout(() => setSuccessMsg(null), 4000);
          }
        }}
        onCategoryCreated={async (catReq) => {
          await onCreateCategory(catReq);
          return { id: `cat-${Date.now()}`, name: catReq.name };
        }}
        onCreateAddOn={async (addOnReq) => {
          await onCreateAddOn(addOnReq);
          return { id: `add-${Date.now()}`, name: addOnReq.name, price: addOnReq.price, isActive: true };
        }}
      />

      {/* ========================================================
          MANAGE ADD-ONS FOR A SPECIFIC PRODUCT MODAL
         ======================================================== */}
      {editingAddOnsProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '600px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ margin: 0 }}>Manage Add-on Choices for "{editingAddOnsProduct.name}"</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  SKU: {editingAddOnsProduct.sku || '-'} • Base: ₹{editingAddOnsProduct.basePrice.toFixed(2)}
                </span>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setEditingAddOnsProduct(null)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '0.75rem' }}>
              Check which Add-on Categories (Choice Of Size, Choice Of Sweetness, Choice Of Boba, etc.) appear in the Cashier POS modal for this item:
            </p>

            {/* Category grouped selection */}
            {Object.entries(groupedAddOns).map(([category, items]) => {
              if (items.length === 0) return null;
              const catIds = items.map((i) => i.id);
              const allSelected = catIds.every((id) => assignedAddOnIds.includes(id));
              return (
                <div key={category} style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#1e293b' }}>{category}</strong>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '1px 6px' }}
                      onClick={() => {
                        if (allSelected) {
                          setAssignedAddOnIds(assignedAddOnIds.filter((id) => !catIds.includes(id)));
                        } else {
                          setAssignedAddOnIds(Array.from(new Set([...assignedAddOnIds, ...catIds])));
                        }
                      }}
                    >
                      {allSelected ? 'Deselect Category' : 'Select All in Category'}
                    </button>
                  </div>
                  <div className="addon-pill-grid" style={{ maxHeight: '130px' }}>
                    {items.map((item) => {
                      const isSelected = assignedAddOnIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`addon-select-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => toggleAddOnInList(item.id, assignedAddOnIds, setAssignedAddOnIds)}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ pointerEvents: 'none' }}
                          />
                          <div className="addon-card-info">
                            <span className="addon-card-name">{item.name}</span>
                            <span className="addon-card-price">
                              {item.price > 0 ? `+₹${item.price.toFixed(2)}` : '₹0.00'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8' }}>
                ✓ {assignedAddOnIds.length} choice(s) selected
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingAddOnsProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveProductAddOns}
                >
                  Save Choices
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          BULK ASSIGN SINGLE ADD-ON TO MULTIPLE PRODUCTS MODAL
         ======================================================== */}
      {bulkAssignAddOn && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110 }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', width: '540px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>
              Assign "{bulkAssignAddOn.name}" ({bulkAssignAddOn.price > 0 ? `+₹${bulkAssignAddOn.price.toFixed(2)}` : '₹0.00'})
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#475569' }}>
              Check all products where this choice ({bulkAssignAddOn.category}) should be offered:
            </p>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkSelectedProductIds(products.map((p) => p.id))}
              >
                Select All Products
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setBulkSelectedProductIds([])}
              >
                Deselect All
              </button>
            </div>

            <div className="addon-pill-grid" style={{ maxHeight: '280px' }}>
              {products.map((p) => {
                const isSelected = bulkSelectedProductIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`addon-select-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleAddOnInList(p.id, bulkSelectedProductIds, setBulkSelectedProductIds)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ pointerEvents: 'none' }}
                    />
                    <div className="addon-card-info">
                      <span className="addon-card-name">{p.name}</span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        {p.category?.name || 'General'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1d4ed8' }}>
                {bulkSelectedProductIds.length} item(s) selected
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBulkAssignAddOn(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveBulkAssign}
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
