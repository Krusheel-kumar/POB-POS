import React, { useState, useEffect, useMemo, useRef } from 'react';
import type {
  Product,
  ProductCategory,
  DietaryType,
  ProductRequest,
  CategoryRequest,
  AddOn,
  AddOnRequest,
} from '../types/pos';
import './AddProductModal.css';

export interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  products?: Product[];
  addOns?: AddOn[];
  editingProduct?: Product | null;
  onProductCreated: (req: ProductRequest) => Promise<void>;
  onProductUpdated?: (id: string, req: ProductRequest) => Promise<void>;
  onProductDeleted?: (id: string) => Promise<void>;
  onCategoryCreated: (req: CategoryRequest) => Promise<ProductCategory>;
  onCreateAddOn?: (req: AddOnRequest) => Promise<AddOn>;
  onDeleteAddOn?: (id: string) => Promise<void>;
  onClearCatalog?: () => Promise<void>;
  onLoadSampleCatalog?: () => Promise<void>;
  initialTab?: 'catalog' | 'category' | 'addons' | 'product';
  initialCategoryId?: string;
}

const DEFAULT_MODIFIER_GROUPS = [
  'Choice Of Size',
  'Choice Of Boba & Toppings',
  'Choice Of Sweetness',
  'Choice Of Ice Level',
];

export const SAMPLE_BOBA_IMAGES = [
  { label: '🧋 Brown Sugar Boba', url: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&auto=format&fit=crop&q=80' },
  { label: '🍵 Matcha Latte', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80' },
  { label: '🍓 Berry Fruit Tea', url: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80' },
  { label: '🥭 Mango Slush', url: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80' },
  { label: '🍠 Taro Milk Tea', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  products = [],
  addOns = [],
  editingProduct = null,
  onProductCreated,
  onProductUpdated,
  onProductDeleted,
  onCategoryCreated,
  onCreateAddOn,
  onDeleteAddOn,
  onClearCatalog,
  onLoadSampleCatalog,
  initialTab = 'product',
  initialCategoryId,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'product' | 'category' | 'addons'>(
    categories.length === 0 ? 'category' : initialTab
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Petpooja view states inside modal
  const [selectedModalCatId, setSelectedModalCatId] = useState<string>(
    initialCategoryId || (categories[0]?.id || 'ALL')
  );
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [selectedModalSubcat, setSelectedModalSubcat] = useState<string>('ALL');

  // --- Product Form State ---
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [selectedCatId, setSelectedCatId] = useState(
    initialCategoryId || categories[0]?.id || ''
  );
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [customSubcatInput, setCustomSubcatInput] = useState('');
  const [isAddingCustomSubcat, setIsAddingCustomSubcat] = useState(false);
  const [dietaryType, setDietaryType] = useState<DietaryType>('BEVERAGE');
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [prodBadge, setProdBadge] = useState('');
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([
    'Choice Of Size',
    'Choice Of Boba & Toppings',
  ]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (.png, .jpg, .jpeg, .webp, .svg)');
      return;
    }

    setUploadedFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setProdImageUrl(compressedDataUrl);
        } else {
          setProdImageUrl(result);
        }
      };
      img.onerror = () => {
        setProdImageUrl(result);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Synchronize when editingProduct changes or modal opens
  useEffect(() => {
    if (editingProduct) {
      setProdName(editingProduct.name);
      setProdPrice(editingProduct.basePrice);
      setSelectedCatId(editingProduct.category?.id || categories[0]?.id || '');
      setSelectedSubcat(editingProduct.subcategory || '');
      setCustomSubcatInput('');
      setIsAddingCustomSubcat(false);
      setDietaryType(editingProduct.dietaryType || 'BEVERAGE');
      setProdImageUrl(editingProduct.imageUrl || '');
      setProdBadge(editingProduct.badge || '');

      const mappedGroups: string[] = Array.from(
        new Set<string>(editingProduct.addOns?.map((a: AddOn) => a.category || 'Choice Of Size') || [])
      );
      setSelectedGroupNames(
        mappedGroups.length > 0
          ? mappedGroups
          : ['Choice Of Size', 'Choice Of Boba & Toppings', 'Choice Of Sweetness', 'Choice Of Ice Level']
      );
      setActiveTab('product');
    } else {
      setProdName('');
      setProdPrice('');
      if (initialCategoryId && categories.some((c) => c.id === initialCategoryId)) {
        setSelectedCatId(initialCategoryId);
      } else if (categories.length > 0) {
        setSelectedCatId(categories[0].id);
      }
      setCustomSubcatInput('');
      setIsAddingCustomSubcat(false);
      setProdImageUrl('');
      setUploadedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setProdBadge('');
      if (addOns.length > 0) {
        const allGroups = Array.from(new Set(addOns.map((a) => a.category || 'Choice Of Boba & Toppings')));
        setSelectedGroupNames(allGroups);
      }
    }
  }, [editingProduct, isOpen, initialCategoryId]);

  // --- Category Form State ---
  const [catName, setCatName] = useState('');
  const [catSubcatsInput, setCatSubcatsInput] = useState('Milk Teas, Fruit Teas, Cheese Foam');

  // --- Modifier/Add-on Form State ---
  const [modGroupName, setModGroupName] = useState('Choice Of Size');
  const [customModGroup, setCustomModGroup] = useState('');
  const [modChoiceName, setModChoiceName] = useState('');
  const [modChoicePrice, setModChoicePrice] = useState<number | ''>(0);
  const [modSelectionType, setModSelectionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [modMinSelections, setModMinSelections] = useState<number>(1);
  const [modMaxSelections, setModMaxSelections] = useState<number>(1);

  // Auto-sync selected category if not set or invalid
  useEffect(() => {
    if ((!selectedCatId || !categories.some((c) => c.id === selectedCatId)) && categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  // Auto-sync subcategory options
  const activeCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const activeSubcats = activeCategory?.subcategories || [];

  useEffect(() => {
    if (!editingProduct && activeSubcats.length > 0) {
      if (!selectedSubcat || !activeSubcats.includes(selectedSubcat)) {
        setSelectedSubcat(activeSubcats[0]);
      }
    }
  }, [selectedCatId, activeSubcats, selectedSubcat, editingProduct]);

  // Items in the currently selected form category
  const currentCategoryItems = useMemo(() => {
    if (!products || !selectedCatId) return [];
    return products.filter((p) => p.category?.id === selectedCatId);
  }, [products, selectedCatId]);

  // Items per category count
  const catItemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (products || []).forEach((p) => {
      const cid = p.category?.id || 'uncategorized';
      counts[cid] = (counts[cid] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Catalog filtered items for Petpooja view
  const modalFilteredProducts = useMemo(() => {
    return (products || []).filter((p) => {
      if (selectedModalCatId !== 'ALL' && p.category?.id !== selectedModalCatId) {
        return false;
      }
      if (selectedModalSubcat !== 'ALL' && p.subcategory !== selectedModalSubcat) {
        return false;
      }
      if (modalSearchQuery.trim()) {
        const q = modalSearchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedModalCatId, selectedModalSubcat, modalSearchQuery]);

  // Active category object in Petpooja view
  const activeModalCatObj = useMemo(() => {
    if (selectedModalCatId === 'ALL') return null;
    return categories.find((c) => c.id === selectedModalCatId) || null;
  }, [categories, selectedModalCatId]);

  // Subcategories available in active modal category
  const activeModalSubcategories = useMemo(() => {
    if (!activeModalCatObj) return [];
    const fromCat = activeModalCatObj.subcategories || [];
    const fromProds = (products || [])
      .filter((p) => p.category?.id === activeModalCatObj.id && p.subcategory)
      .map((p) => p.subcategory!);
    return Array.from(new Set([...fromCat, ...fromProds]));
  }, [activeModalCatObj, products]);

  if (!isOpen) return null;

  // Available modifier groups
  const allModifierGroups = Array.from(
    new Set([
      ...DEFAULT_MODIFIER_GROUPS,
      ...addOns.map((a) => a.category || 'Choice Of Size'),
    ])
  );

  const addOnsByGroup: Record<string, AddOn[]> = {};
  allModifierGroups.forEach((grp) => {
    addOnsByGroup[grp] = addOns.filter((a) => a.category === grp);
  });

  // Handlers
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!prodName.trim()) {
      setErrorMsg('Item name is required');
      return;
    }
    if (!prodPrice || Number(prodPrice) <= 0) {
      setErrorMsg('Please enter a valid price');
      return;
    }
    if (!selectedCatId) {
      setErrorMsg('Please select a category');
      return;
    }

    const subcat = isAddingCustomSubcat
      ? customSubcatInput.trim() || undefined
      : selectedSubcat || undefined;

    // Collect add-on IDs for checked modifier groups
    let mappedAddOnIds = addOns
      .filter((a) => a.category && selectedGroupNames.includes(a.category))
      .map((a) => a.id);
    if (mappedAddOnIds.length === 0 && addOns.length > 0) {
      mappedAddOnIds = addOns.map((a) => a.id);
    }

    setIsSubmitting(true);
    try {
      const payload: ProductRequest = {
        name: prodName.trim(),
        basePrice: Number(prodPrice),
        categoryId: selectedCatId,
        subcategory: subcat,
        dietaryType,
        imageUrl: prodImageUrl.trim() || undefined,
        badge: prodBadge.trim() || undefined,
        addOnIds: mappedAddOnIds,
        prepTimeMinutes: 5,
      };

      if (editingProduct && onProductUpdated) {
        await onProductUpdated(editingProduct.id, payload);
        setSuccessMsg(`✓ Updated "${prodName.trim()}"`);
      } else {
        await onProductCreated(payload);
        setSuccessMsg(`✓ "${prodName.trim()}" added to menu`);
      }

      setProdName('');
      setProdPrice('');
      setCustomSubcatInput('');
      setIsAddingCustomSubcat(false);
      setProdImageUrl('');
      setUploadedFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setProdBadge('');

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!catName.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    const parsedSubcats = catSubcatsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    setIsSubmitting(true);
    try {
      const created = await onCategoryCreated({
        name: catName.trim(),
        subcategories: parsedSubcats.length > 0 ? parsedSubcats : undefined,
      });

      setSelectedCatId(created.id);
      setSuccessMsg(`✓ Category "${created.name}" created`);
      setCatName('');
      setActiveTab('product'); // return to product creation
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddModifierChoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const group = customModGroup.trim() || modGroupName;
    if (!group) {
      setErrorMsg('Modifier group name is required');
      return;
    }
    if (!modChoiceName.trim()) {
      setErrorMsg('Choice name is required (e.g. Regular 300ml, Boba Pearls)');
      return;
    }
    if (!onCreateAddOn) return;

    setIsSubmitting(true);
    try {
      await onCreateAddOn({
        name: modChoiceName.trim(),
        price: Number(modChoicePrice) || 0,
        category: group,
        selectionType: modSelectionType,
        minSelections: modSelectionType === 'SINGLE' ? 1 : modMinSelections,
        maxSelections: modSelectionType === 'SINGLE' ? 1 : modMaxSelections,
      });

      if (!selectedGroupNames.includes(group)) {
        setSelectedGroupNames([...selectedGroupNames, group]);
      }

      setSuccessMsg(`✓ Added "${modChoiceName}" to ${group}`);
      setModChoiceName('');
      setModChoicePrice(0);
      setCustomModGroup('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add choice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGroup = (grp: string) => {
    setSelectedGroupNames((prev) =>
      prev.includes(grp) ? prev.filter((g) => g !== grp) : [...prev, grp]
    );
  };

  return (
    <div className="min-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="min-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Minimal Header */}
        <div className="min-modal-header">
          <div className="min-tabs-nav">
            <button
              type="button"
              className={`min-tab-pill ${activeTab === 'catalog' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('catalog');
                setErrorMsg(null);
              }}
            >
              📋 Categories & Items ({(products || []).length})
            </button>
            <button
              type="button"
              className={`min-tab-pill ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('product');
                setErrorMsg(null);
              }}
            >
              {editingProduct ? `✏️ Edit: ${editingProduct.name.slice(0, 20)}` : '+ Add Menu Item'}
            </button>
            <button
              type="button"
              className={`min-tab-pill ${activeTab === 'category' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('category');
                setErrorMsg(null);
              }}
            >
              Categories ({categories.length})
            </button>
            <button
              type="button"
              className={`min-tab-pill ${activeTab === 'addons' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('addons');
                setErrorMsg(null);
              }}
            >
              Modifiers & Sizes ({addOns.length})
            </button>
          </div>

          <div className="min-header-actions">
            {onClearCatalog && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Wipe menu catalog to start fresh?')) {
                    await onClearCatalog();
                    setActiveTab('category');
                  }
                }}
                className="min-link-danger"
                title="Wipe catalog to start fresh"
              >
                Clear All
              </button>
            )}
            {onLoadSampleCatalog && (
              <button
                type="button"
                onClick={onLoadSampleCatalog}
                className="min-link-btn"
                title="Load sample menu"
              >
                Reset Demo
              </button>
            )}
            <button className="min-close-btn" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
        </div>

        {/* Status Banners */}
        {errorMsg && <div className="min-banner-error">{errorMsg}</div>}
        {successMsg && <div className="min-banner-success">{successMsg}</div>}

        {/* TAB 0: PETPOOJA TWO-COLUMN CATEGORIES & ITEMS VIEW */}
        {activeTab === 'catalog' && (
          <div className="min-petpooja-view">
            {/* Left: Category Sidebar */}
            <div className="min-petpooja-sidebar">
              <div className="min-petpooja-sidebar-header">
                <span>Categories ({categories.length})</span>
                <button
                  type="button"
                  className="btn-add-category-mini"
                  onClick={() => setActiveTab('category')}
                  title="Create new category"
                >
                  + New
                </button>
              </div>
              <div className="min-petpooja-sidebar-list">
                <div
                  className={`min-petpooja-cat-row ${selectedModalCatId === 'ALL' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedModalCatId('ALL');
                    setSelectedModalSubcat('ALL');
                  }}
                >
                  <span className="category-item-name">All Categories</span>
                  <span className="min-petpooja-cat-badge">{(products || []).length}</span>
                </div>
                {categories.map((c) => {
                  const count = catItemCounts[c.id] || 0;
                  const isSelected = selectedModalCatId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`min-petpooja-cat-row ${isSelected ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedModalCatId(c.id);
                        setSelectedModalSubcat('ALL');
                      }}
                      title={c.name}
                    >
                      <span className="category-item-name">{c.name}</span>
                      <span className="min-petpooja-cat-badge">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Items Table */}
            <div className="min-petpooja-main">
              <div className="min-petpooja-toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div className="petpooja-search-box" style={{ width: '200px' }}>
                    <span>🔍</span>
                    <input
                      type="text"
                      placeholder="Search items, SKU..."
                      value={modalSearchQuery}
                      onChange={(e) => setModalSearchQuery(e.target.value)}
                    />
                    {modalSearchQuery && (
                      <button
                        type="button"
                        className="btn-clear-search"
                        onClick={() => setModalSearchQuery('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  {activeModalSubcategories.length > 0 && (
                    <div className="petpooja-subcat-pills">
                      <button
                        type="button"
                        className={`subcat-pill ${selectedModalSubcat === 'ALL' ? 'active' : ''}`}
                        onClick={() => setSelectedModalSubcat('ALL')}
                      >
                        All
                      </button>
                      {activeModalSubcategories.map((subcat: string) => (
                        <button
                          key={subcat}
                          type="button"
                          className={`subcat-pill ${selectedModalSubcat === subcat ? 'active' : ''}`}
                          onClick={() => setSelectedModalSubcat(subcat)}
                        >
                          {subcat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-sm petpooja-add-btn"
                  onClick={() => {
                    if (selectedModalCatId !== 'ALL') {
                      setSelectedCatId(selectedModalCatId);
                    }
                    setActiveTab('product');
                  }}
                  title="Create new menu item in this category"
                >
                  + Add Item
                </button>
              </div>

              <div className="min-petpooja-table-wrapper">
                {modalFilteredProducts.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>
                      {selectedModalCatId === 'ALL'
                        ? 'No products created yet. Click "+ Add Item" to add your first menu item!'
                        : `No items in "${activeModalCatObj?.name || 'this category'}". Click "+ Add Item" to add an item here.`}
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm petpooja-add-btn"
                      style={{ marginTop: '0.75rem', display: 'inline-flex' }}
                      onClick={() => {
                        if (selectedModalCatId !== 'ALL') {
                          setSelectedCatId(selectedModalCatId);
                        }
                        setActiveTab('product');
                      }}
                    >
                      + Add Item to {activeModalCatObj?.name || 'Category'}
                    </button>
                  </div>
                ) : (
                  <table className="petpooja-table">
                    <thead>
                      <tr>
                        <th>Name *</th>
                        <th>Short Code</th>
                        <th>Price *</th>
                        <th>Description</th>
                        <th>Image</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalFilteredProducts.map((p: Product) => {
                        const isVeg = p.dietaryType === 'VEG' || p.dietaryType === 'VEGAN';
                        const isNonVeg = p.dietaryType === 'NON_VEG';
                        return (
                          <tr key={p.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  className={
                                    isVeg ? 'diet-dot-veg' : isNonVeg ? 'diet-dot-nonveg' : 'diet-dot-beverage'
                                  }
                                  title={p.dietaryType || 'BEVERAGE'}
                                />
                                <div>
                                  <strong>{p.name}</strong>
                                  {p.subcategory && (
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                      {p.subcategory}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: '0.78rem', color: '#64748b' }}>
                              {p.sku || '-'}
                            </td>
                            <td>
                              <strong style={{ color: '#0f172a' }}>₹{p.basePrice.toFixed(2)}</strong>
                            </td>
                            <td style={{ maxWidth: '180px', fontSize: '0.78rem', color: '#64748b' }}>
                              {p.description || '-'}
                            </td>
                            <td>
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '6px',
                                    objectFit: 'cover',
                                    border: '1px solid #e2e8f0',
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span style={{ fontSize: '1.1rem' }}>🧋</span>
                              )}
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ padding: '2px 7px', fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setProdName(p.name);
                                    setProdPrice(p.basePrice);
                                    setSelectedCatId(p.category?.id || '');
                                    setSelectedSubcat(p.subcategory || '');
                                    setDietaryType(p.dietaryType || 'BEVERAGE');
                                    setProdImageUrl(p.imageUrl || '');
                                    setProdBadge(p.badge || '');
                                    setActiveTab('product');
                                  }}
                                  title="Edit item"
                                >
                                  ✏️ Edit
                                </button>
                                {onProductDeleted && (
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm"
                                    style={{ padding: '2px 7px', fontSize: '0.75rem' }}
                                    onClick={async () => {
                                      if (window.confirm(`Delete "${p.name}"?`)) {
                                        await onProductDeleted(p.id);
                                      }
                                    }}
                                  >
                                    🗑️
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

              <div className="petpooja-legend-footer">
                <span>
                  Showing {modalFilteredProducts.length} item(s) in{' '}
                  <strong>{activeModalCatObj ? activeModalCatObj.name : 'All Categories'}</strong>
                </span>
                <button
                  type="button"
                  className="min-btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: ADD / EDIT MENU ITEM */}
        {activeTab === 'product' && (
          <form onSubmit={handleSaveProduct} className="min-modal-body">
            {/* Image Preview & Local Folder Upload Row */}
            <div
              className={`min-image-upload-section ${isDragging ? 'dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {/* Hidden Native File Input for Folder Selection */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              <div
                className="min-image-preview-box clickable"
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose a photo from your laptop or system folder"
              >
                {prodImageUrl ? (
                  <img
                    src={prodImageUrl}
                    alt="Preview"
                    className="min-image-preview-img"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="min-preview-inner-empty">
                    <span className="min-image-preview-placeholder">🧋</span>
                    <span className="min-preview-hint">Choose File</span>
                  </div>
                )}
                <div className="min-preview-hover-overlay">
                  <span>📷 Browse</span>
                </div>
              </div>

              <div className="min-image-inputs">
                <div className="min-label-row">
                  <label className="min-label">Item Photo / Image</label>
                  {prodImageUrl && (
                    <button
                      type="button"
                      className="min-field-action-link"
                      onClick={() => {
                        setProdImageUrl('');
                        setUploadedFileName(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Primary Button: Browse Folder from Laptop / System */}
                <div className="min-image-actions-row">
                  <button
                    type="button"
                    className="min-btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                    title="Open file picker to select a photo from your laptop folders"
                  >
                    <span className="min-upload-icon">📁</span>
                    <span>Choose from Folder / Computer</span>
                  </button>

                  {uploadedFileName ? (
                    <span className="min-upload-filename-pill" title={uploadedFileName}>
                      <span>📷 {uploadedFileName}</span>
                      <button
                        type="button"
                        className="min-pill-clear-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFileName(null);
                          setProdImageUrl('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        ✕
                      </button>
                    </span>
                  ) : (
                    <span className="min-drag-hint-text">or drag and drop photo here</span>
                  )}
                </div>

                {/* Secondary Option: Paste URL */}
                <input
                  type="url"
                  className="min-input min-url-input"
                  placeholder="...or paste photo web link (https://...)"
                  value={prodImageUrl.startsWith('data:') ? '' : prodImageUrl}
                  onChange={(e) => {
                    setUploadedFileName(null);
                    setProdImageUrl(e.target.value);
                  }}
                />

                <div className="min-image-chips">
                  <span style={{ fontSize: '0.72rem', color: '#64748b', marginRight: '4px' }}>Sample Photos:</span>
                  {SAMPLE_BOBA_IMAGES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      className="min-image-chip"
                      onClick={() => {
                        setUploadedFileName(null);
                        setProdImageUrl(sample.url);
                      }}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 1: Category & Subcategory */}
            <div className="min-form-row-2">
              <div className="min-field-group">
                <div className="min-label-row">
                  <label className="min-label">Category *</label>
                  <button
                    type="button"
                    onClick={() => setActiveTab('category')}
                    className="min-field-action-link"
                  >
                    + New
                  </button>
                </div>
                {categories.length === 0 ? (
                  <div className="min-inline-empty">
                    <span>No categories.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('category')}
                      className="min-btn-inline"
                    >
                      Create Category
                    </button>
                  </div>
                ) : (
                  <select
                    className="min-select"
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value);
                      setIsAddingCustomSubcat(false);
                    }}
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
                {activeCategory && (
                  <div className="min-category-items-preview">
                    <div className="min-category-items-title">
                      <span>
                        Items already in <strong>{activeCategory.name}</strong> ({currentCategoryItems.length}):
                      </span>
                      <button
                        type="button"
                        className="min-field-action-link"
                        onClick={() => {
                          setSelectedModalCatId(activeCategory.id);
                          setActiveTab('catalog');
                        }}
                      >
                        Petpooja Grid →
                      </button>
                    </div>
                    {currentCategoryItems.length === 0 ? (
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
                        No items in this category yet. Fill the form below to add the first item!
                      </span>
                    ) : (
                      <div className="min-category-items-chips">
                        {currentCategoryItems.map((p: Product) => (
                          <span key={p.id} className="min-item-badge-pill" title={p.name}>
                            {p.dietaryType === 'VEG' || p.dietaryType === 'VEGAN' ? '🟢' : p.dietaryType === 'NON_VEG' ? '🔴' : '🧋'}
                            <strong>{p.name}</strong> (₹{p.basePrice})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="min-field-group">
                <div className="min-label-row">
                  <label className="min-label">Subcategory</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomSubcat(!isAddingCustomSubcat)}
                    className="min-field-action-link"
                  >
                    {isAddingCustomSubcat ? 'Select Existing' : '+ Custom'}
                  </button>
                </div>
                {isAddingCustomSubcat ? (
                  <input
                    type="text"
                    className="min-input"
                    placeholder="e.g. Milk Teas, Specialty..."
                    value={customSubcatInput}
                    onChange={(e) => setCustomSubcatInput(e.target.value)}
                    autoFocus
                  />
                ) : activeSubcats.length > 0 ? (
                  <select
                    className="min-select"
                    value={selectedSubcat}
                    onChange={(e) => setSelectedSubcat(e.target.value)}
                  >
                    {activeSubcats.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    className="min-input"
                    placeholder="e.g. Regular, Special..."
                    value={customSubcatInput}
                    onChange={(e) => {
                      setIsAddingCustomSubcat(true);
                      setCustomSubcatInput(e.target.value);
                    }}
                  />
                )}
              </div>
            </div>

            {/* Row 2: Item Name & Price */}
            <div className="min-form-row-2">
              <div className="min-field-group">
                <label className="min-label">Item Name *</label>
                <input
                  type="text"
                  className="min-input font-medium"
                  placeholder="e.g. Authentic Brown Sugar Boba Tea"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </div>

              <div className="min-field-group">
                <label className="min-label">Price (₹) *</label>
                <div className="min-currency-wrapper">
                  <span className="min-currency-symbol">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="min-input min-currency-input"
                    placeholder="240"
                    value={prodPrice}
                    onChange={(e) =>
                      setProdPrice(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Dietary Selection & Badge */}
            <div className="min-form-row-2">
              <div className="min-field-group">
                <label className="min-label">Type</label>
                <div className="min-segmented-control">
                  {(['BEVERAGE', 'VEG', 'NON_VEG', 'VEGAN'] as DietaryType[]).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      className={`min-segment-btn ${dietaryType === dt ? 'active' : ''}`}
                      onClick={() => setDietaryType(dt)}
                    >
                      {dt === 'BEVERAGE'
                        ? '🧋 Beverage'
                        : dt === 'VEG'
                        ? '🟢 Veg'
                        : dt === 'NON_VEG'
                        ? '🔴 Non-Veg'
                        : '🌱 Vegan'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-field-group">
                <label className="min-label">Tag / Badge</label>
                <input
                  type="text"
                  className="min-input"
                  placeholder="e.g. Bestseller, Must Try, Chef Special"
                  value={prodBadge}
                  onChange={(e) => setProdBadge(e.target.value)}
                />
              </div>
            </div>

            {/* Row 4: Customization & Modifier Groups */}
            <div className="min-modifiers-box">
              <div className="min-label-row mb-1">
                <div>
                  <label className="min-label" style={{ margin: 0 }}>
                    Linked Customization Choices & Toppings ({selectedGroupNames.length} groups selected)
                  </label>
                  <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: '#64748b' }}>
                    Check or uncheck groups to map which sizes, sweetness levels, and toppings are allowed for this item.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('addons')}
                  className="min-field-action-link"
                >
                  + Add New Topping
                </button>
              </div>

              <div className="min-checkbox-list">
                {allModifierGroups.map((grp) => {
                  const items = addOnsByGroup[grp] || [];
                  const isChecked = selectedGroupNames.includes(grp);
                  return (
                    <label
                      key={grp}
                      className={`min-check-card ${isChecked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGroup(grp)}
                      />
                      <div className="min-check-card-text">
                        <span className="min-check-title">{grp}</span>
                        <span className="min-check-sub">
                          {items.length > 0
                            ? items
                                .map((i) => `${i.name}${i.price > 0 ? ` (+₹${i.price})` : ''}`)
                                .slice(0, 3)
                                .join(', ') + (items.length > 3 ? ` +${items.length - 3} more` : '')
                            : '0 choices (Add in Modifiers tab)'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="min-modal-footer">
              {editingProduct && onProductDeleted && (
                <button
                  type="button"
                  className="min-btn-danger-outline"
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete "${editingProduct.name}" from catalog?`)) {
                      await onProductDeleted(editingProduct.id);
                      onClose();
                    }
                  }}
                >
                  🗑️ Delete Product
                </button>
              )}
              <button type="button" onClick={onClose} className="min-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !prodName.trim() || !prodPrice}
                className="min-btn-primary"
              >
                {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Save & Add to POS'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'category' && (
          <div className="min-modal-body">
            <form onSubmit={handleCreateCategory} className="min-subform">
              <div className="min-form-row-2">
                <div className="min-field-group">
                  <label className="min-label">Category Name *</label>
                  <input
                    type="text"
                    className="min-input"
                    placeholder="e.g. 🧋 Boba Teas, 🍔 Burgers..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>
                <div className="min-field-group">
                  <label className="min-label">Subcategories (Comma separated)</label>
                  <input
                    type="text"
                    className="min-input"
                    placeholder="e.g. Milk Teas, Fruit Teas, Cheese Foam"
                    value={catSubcatsInput}
                    onChange={(e) => setCatSubcatsInput(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !catName.trim()}
                  className="min-btn-primary"
                >
                  {isSubmitting ? 'Saving...' : '+ Save Category'}
                </button>
              </div>
            </form>

            {/* Existing Categories Table with Created Items Mapping */}
            <div className="min-table-wrapper">
              <table className="min-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Subcategories</th>
                    <th>Items in this Category</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => {
                    const catItems = (products || []).filter((p) => p.category?.id === c.id);
                    return (
                      <tr key={c.id}>
                        <td className="font-semibold" style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{c.name}</span>
                            <span className="min-petpooja-cat-badge">
                              {catItems.length} items
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {(c.subcategories || []).map((sc) => (
                              <span key={sc} className="min-tag">
                                {sc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
                            {catItems.length === 0 ? (
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                                No items yet
                              </span>
                            ) : (
                              catItems.map((item) => (
                                <span
                                  key={item.id}
                                  className="min-item-badge-pill"
                                  title={item.name}
                                >
                                  {item.dietaryType === 'VEG' || item.dietaryType === 'VEGAN' ? '🟢' : item.dietaryType === 'NON_VEG' ? '🔴' : '🧋'}
                                  <strong>{item.name}</strong> (₹{item.basePrice})
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn-add-category-mini"
                            style={{ marginRight: '6px' }}
                            onClick={() => {
                              setSelectedCatId(c.id);
                              setActiveTab('product');
                            }}
                            title={`Add item to ${c.name}`}
                          >
                            + Add Item
                          </button>
                          {catItems.length > 0 && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setSelectedModalCatId(c.id);
                                setActiveTab('catalog');
                              }}
                              title="View in Petpooja Grid"
                            >
                              View ({catItems.length})
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center text-muted">
                        No categories created yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="min-modal-footer">
              <button
                type="button"
                onClick={() => setActiveTab('product')}
                className="min-btn-primary"
              >
                Done (Back to Items)
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: MODIFIERS & SIZES */}
        {activeTab === 'addons' && (
          <div className="min-modal-body">
            <form onSubmit={handleAddModifierChoice} className="min-subform">
              <div className="min-form-row-3">
                <div className="min-field-group">
                  <label className="min-label">Modifier Group *</label>
                  <select
                    className="min-select"
                    value={modGroupName}
                    onChange={(e) => {
                      setModGroupName(e.target.value);
                      if (
                        e.target.value.toLowerCase().includes('size') ||
                        e.target.value.toLowerCase().includes('sweetness')
                      ) {
                        setModSelectionType('SINGLE');
                      } else {
                        setModSelectionType('MULTI');
                      }
                    }}
                  >
                    {allModifierGroups.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    <option value="CUSTOM">+ New Group Name</option>
                  </select>
                  {modGroupName === 'CUSTOM' && (
                    <input
                      type="text"
                      className="min-input mt-1"
                      placeholder="Type group name..."
                      value={customModGroup}
                      onChange={(e) => setCustomModGroup(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="min-field-group">
                  <label className="min-label">Option Name *</label>
                  <input
                    type="text"
                    className="min-input"
                    placeholder="e.g. Regular (300ml), Boba Pearls"
                    value={modChoiceName}
                    onChange={(e) => setModChoiceName(e.target.value)}
                    required
                  />
                </div>

                <div className="min-field-group">
                  <label className="min-label">Extra Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="min-input"
                    placeholder="0"
                    value={modChoicePrice}
                    onChange={(e) =>
                      setModChoicePrice(
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontSize: '0.8rem', color: '#475569', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modSelType"
                      checked={modSelectionType === 'SINGLE'}
                      onChange={() => {
                        setModSelectionType('SINGLE');
                        setModMinSelections(1);
                        setModMaxSelections(1);
                      }}
                    />
                    Single Select (1 choice, e.g. Size)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="modSelType"
                      checked={modSelectionType === 'MULTI'}
                      onChange={() => {
                        setModSelectionType('MULTI');
                        setModMinSelections(0);
                        setModMaxSelections(3);
                      }}
                    />
                    Multi Select (Checkboxes, e.g. Toppings)
                  </label>

                  {modSelectionType === 'MULTI' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        Min:
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={modMinSelections}
                          onChange={(e) => setModMinSelections(Math.max(0, Number(e.target.value) || 0))}
                          style={{ width: '42px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid #94a3b8', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: '#334155' }}>
                        Max:
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={modMaxSelections}
                          onChange={(e) => setModMaxSelections(Math.max(1, Number(e.target.value) || 1))}
                          style={{ width: '42px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid #94a3b8', borderRadius: '4px', textAlign: 'center' }}
                        />
                      </label>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !modChoiceName.trim()}
                  className="min-btn-primary"
                >
                  {isSubmitting ? 'Adding...' : '+ Add Option'}
                </button>
              </div>
            </form>

            {/* Modifier Groups List */}
            <div className="min-table-wrapper">
              <table className="min-table">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Options & Prices</th>
                  </tr>
                </thead>
                <tbody>
                  {allModifierGroups.map((grp) => {
                    const items = addOnsByGroup[grp] || [];
                    const isSingle = items[0]?.selectionType === 'SINGLE' || (!items[0] && (grp.toLowerCase().includes('size') || grp.toLowerCase().includes('sweetness') || grp.toLowerCase().includes('ice')));
                    const min = items[0]?.minSelections ?? (isSingle ? 1 : 0);
                    const max = items[0]?.maxSelections ?? (isSingle ? 1 : 3);
                    return (
                      <tr key={grp}>
                        <td className="font-semibold" style={{ width: '220px' }}>
                          <div>{grp}</div>
                          <div style={{ fontSize: '0.7rem', color: isSingle ? '#64748b' : '#0369a1', fontWeight: 500, marginTop: '2px' }}>
                            {isSingle ? '● Single Choice (Pick 1)' : `✦ Multi Choice (Min ${min}, Max ${max})`}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {items.length === 0 ? (
                              <span className="text-muted text-xs">No options added yet</span>
                            ) : (
                              items.map((it) => (
                                <span key={it.id} className="min-addon-pill">
                                  <span>{it.name}</span>
                                  <span className="min-addon-price">
                                    {it.price > 0 ? `+₹${it.price}` : 'Free'}
                                  </span>
                                  {onDeleteAddOn && (
                                    <button
                                      type="button"
                                      onClick={() => onDeleteAddOn(it.id)}
                                      className="min-del-x"
                                    >
                                      ×
                                    </button>
                                  )}
                                </span>
                              ))
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="min-modal-footer">
              <button
                type="button"
                onClick={() => setActiveTab('product')}
                className="min-btn-primary"
              >
                Done (Back to Items)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
