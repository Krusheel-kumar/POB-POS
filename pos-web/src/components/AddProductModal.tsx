import React, { useState, useEffect } from 'react';
import type {
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
  addOns?: AddOn[];
  onProductCreated: (req: ProductRequest) => Promise<void>;
  onCategoryCreated: (req: CategoryRequest) => Promise<ProductCategory>;
  onCreateAddOn?: (req: AddOnRequest) => Promise<AddOn>;
  onDeleteAddOn?: (id: string) => Promise<void>;
  onClearCatalog?: () => Promise<void>;
  onLoadSampleCatalog?: () => Promise<void>;
  initialTab?: 'category' | 'addons' | 'product';
}

const PRESET_IMAGES = [
  { label: '🧋 Boba Milk Tea', url: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&auto=format&fit=crop&q=80' },
  { label: '🧋 Taro Pearl Tea', url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80' },
  { label: '🍔 Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { label: '🍕 Wood Pizza', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80' },
  { label: '☕ Cold Coffee', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
  { label: '🍟 Loaded Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80' },
  { label: '🍗 Spicy Wings', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80' },
  { label: '🧇 Belgian Waffle', url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80' },
  { label: '🍰 Cheesecake', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80' },
];

const PRESET_BADGES = ['Bestseller', 'Chef Special', 'Festive', 'New Launch', 'Signature', 'Handcrafted', 'Popular'];

const DEFAULT_TOPPING_GROUPS = [
  'Choice Of Size',
  'Choice Of Boba & Toppings',
  'Choice Of Sweetness',
  'Choice Of Ice Level',
  'Choice Of Milk Base',
  'Choice Of Dips & Cheeses',
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  addOns = [],
  onProductCreated,
  onCategoryCreated,
  onCreateAddOn,
  onDeleteAddOn,
  onClearCatalog,
  onLoadSampleCatalog,
  initialTab = 'product',
}) => {
  const [activeTab, setActiveTab] = useState<'category' | 'addons' | 'product'>(
    categories.length === 0 ? 'category' : initialTab
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // --- Step 1: Category State ---
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [subcatList, setSubcatList] = useState<string[]>(['Milk Teas', 'Fruit Teas', 'Cheese Foam']);
  const [newSubcatInput, setNewSubcatInput] = useState('');

  // --- Step 2: Topping Groups & Choices State ---
  const [groupNameInput, setGroupNameInput] = useState('Choice Of Size');
  const [customGroupName, setCustomGroupName] = useState('');
  const [groupSelectionType, setGroupSelectionType] = useState<'SINGLE' | 'MULTI'>('SINGLE');
  const [choiceName, setChoiceName] = useState('');
  const [choicePrice, setChoicePrice] = useState<number | ''>(0);

  // --- Step 3: Product Form State ---
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [customSubcat, setCustomSubcat] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('BEVERAGE');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [badge, setBadge] = useState('Bestseller');
  const [prepTime, setPrepTime] = useState(5);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  // Group selection mapping: which topping groups are mapped to this product
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>(['Choice Of Size', 'Choice Of Boba & Toppings']);

  // Sync selectedCatId when categories prop changes or is created
  useEffect(() => {
    if ((!selectedCatId || !categories.some((c) => c.id === selectedCatId)) && categories.length > 0) {
      setSelectedCatId(categories[0].id);
    }
  }, [categories, selectedCatId]);

  // Sync default subcategory when selectedCatId changes
  useEffect(() => {
    const current = categories.find((c) => c.id === selectedCatId);
    if (current && current.subcategories && current.subcategories.length > 0) {
      if (!selectedSubcat || !current.subcategories.includes(selectedSubcat)) {
        setSelectedSubcat(current.subcategories[0]);
      }
    }
  }, [selectedCatId, categories, selectedSubcat]);

  if (!isOpen) return null;

  // Group add-ons by their category name
  const existingGroupNames = Array.from(
    new Set([
      ...DEFAULT_TOPPING_GROUPS,
      ...addOns.map((a) => a.category || 'Choice Of Size'),
    ])
  );

  const addOnsByGroup: Record<string, AddOn[]> = {};
  existingGroupNames.forEach((grp) => {
    addOnsByGroup[grp] = addOns.filter((a) => a.category === grp);
  });

  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const availableSubcategories = currentCategory?.subcategories || [];

  // Add subcategory tag
  const handleAddSubcatTag = () => {
    const trimmed = newSubcatInput.trim();
    if (trimmed && !subcatList.includes(trimmed)) {
      setSubcatList([...subcatList, trimmed]);
      setNewSubcatInput('');
    }
  };

  const handleRemoveSubcatTag = (tag: string) => {
    setSubcatList(subcatList.filter((s) => s !== tag));
  };

  // Submit Category
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!catName.trim()) {
      setErrorMsg('Category name is required (e.g. 🧋 Boba Teas, 🍔 Burgers)');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await onCategoryCreated({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        subcategories: subcatList.length > 0 ? subcatList : undefined,
      });

      setSelectedCatId(created.id);
      setSuccessNotice(`✅ Category "${created.name}" created with ${subcatList.length} subcategories!`);
      setCatName('');
      setCatDesc('');
      setSubcatList(['Classic', 'Specialty']);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Choice into a Topping Group
  const handleAddChoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    const targetGroup = customGroupName.trim() || groupNameInput.trim();
    if (!targetGroup) {
      setErrorMsg('Please specify a Topping / Add-on Category name');
      return;
    }
    if (!choiceName.trim()) {
      setErrorMsg('Choice name is required (e.g. Regular 300ml, Large 500ml, Tapioca Pearls)');
      return;
    }

    if (!onCreateAddOn) {
      setErrorMsg('Add-on creation is not supported in this view');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onCreateAddOn({
        name: choiceName.trim(),
        price: Number(choicePrice) || 0,
        category: targetGroup,
        selectionType: groupSelectionType,
      });

      // Auto-include in mapped groups for step 3
      if (!selectedGroupNames.includes(targetGroup)) {
        setSelectedGroupNames([...selectedGroupNames, targetGroup]);
      }

      setSuccessNotice(`✅ Added choice "${res.name}" (+₹${res.price}) to group "${targetGroup}"!`);
      setChoiceName('');
      setChoicePrice(0);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to add choice');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Topping Group mapping for Product
  const toggleGroupMapping = (group: string) => {
    if (selectedGroupNames.includes(group)) {
      setSelectedGroupNames(selectedGroupNames.filter((g) => g !== group));
    } else {
      setSelectedGroupNames([...selectedGroupNames, group]);
    }
  };

  // Submit Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessNotice(null);

    if (!prodName.trim()) {
      setErrorMsg('Item name is required');
      return;
    }
    if (!prodPrice || Number(prodPrice) <= 0) {
      setErrorMsg('Please specify a valid base price');
      return;
    }
    if (!selectedCatId) {
      setErrorMsg('Please select a Category from Step 1');
      return;
    }

    // Resolve all addOn IDs from mapped groups
    const resolvedAddOnIds = addOns
      .filter((a) => a.category && selectedGroupNames.includes(a.category))
      .map((a) => a.id);

    const subcat = customSubcat.trim() || selectedSubcat || undefined;

    setIsSubmitting(true);
    try {
      await onProductCreated({
        name: prodName.trim(),
        basePrice: Number(prodPrice),
        categoryId: selectedCatId,
        subcategory: subcat,
        description: prodDesc.trim() || undefined,
        sku: prodSku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        dietaryType,
        imageUrl: imageUrl.trim() || undefined,
        badge: badge.trim() || undefined,
        prepTimeMinutes: Number(prepTime) || 5,
        addOnIds: resolvedAddOnIds,
      });

      setSuccessNotice(`🎉 Item "${prodName.trim()}" successfully created and ready in POS!`);
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdSku('');
      setCustomSubcat('');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="add-modal-content wide-wizard-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-modal-header">
          <div className="add-modal-title-area">
            <div className="add-modal-icon-badge">✨</div>
            <div>
              <h3 className="add-modal-title">Live Menu & Catalog Wizard</h3>
              <p className="add-modal-subtitle">
                3-Step Setup: <strong>1. Categories</strong> ➔ <strong>2. Topping Groups</strong> ➔ <strong>3. Item Mapping</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {onClearCatalog && (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Wipe entire catalog to start with a fresh clean slate for the demo?')) {
                    await onClearCatalog();
                    setActiveTab('category');
                    setSuccessNotice('🧹 Catalog cleared! Ready to add fresh categories, toppings & items.');
                  }
                }}
                className="wizard-btn-ghost text-red-600"
                title="Wipe mock catalog to start completely fresh"
              >
                🧹 Clean Slate
              </button>
            )}
            {onLoadSampleCatalog && (
              <button
                type="button"
                onClick={async () => {
                  await onLoadSampleCatalog();
                  setSuccessNotice('📥 Sample catalog restored successfully!');
                }}
                className="wizard-btn-ghost text-indigo-600"
                title="Restore default sample menu"
              >
                📥 Load Demo Menu
              </button>
            )}
            <button className="add-modal-close-btn" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        </div>

        {/* Wizard Step Navigation */}
        <div className="add-modal-tabs wizard-tabs">
          <button
            type="button"
            className={`add-modal-tab ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('category');
              setErrorMsg(null);
            }}
          >
            <span className="step-num-pill">1</span>
            📁 Category & Subcategories
            <span className="tab-count-tag">{categories.length}</span>
          </button>
          <button
            type="button"
            className={`add-modal-tab ${activeTab === 'addons' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('addons');
              setErrorMsg(null);
            }}
          >
            <span className="step-num-pill">2</span>
            🍬 Topping Groups & Choices
            <span className="tab-count-tag">{addOns.length}</span>
          </button>
          <button
            type="button"
            className={`add-modal-tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('product');
              setErrorMsg(null);
            }}
          >
            <span className="step-num-pill">3</span>
            🍔 Add Item & Map Toppings
          </button>
        </div>

        {/* Global Notices */}
        {errorMsg && (
          <div className="wizard-alert-error">
            ⚠️ {errorMsg}
          </div>
        )}
        {successNotice && (
          <div className="wizard-alert-success">
            {successNotice}
          </div>
        )}

        {/* ================= STEP 1: CATEGORY & SUBCATEGORIES ================= */}
        {activeTab === 'category' && (
          <div className="add-modal-body">
            <div className="wizard-step-info-card">
              <h4>Step 1: Set Up Your Menu Categories & Subcategories</h4>
              <p>
                Categories group your POS items (e.g., <strong>🧋 Boba Teas</strong>, <strong>🍔 Gourmet Burgers</strong>, <strong>☕ Coffee & Brews</strong>). Subcategories divide each category into fast navigation tabs (e.g. <em>Milk Teas, Fruit Teas, Cheese Foam</em>).
              </p>
            </div>

            <form onSubmit={handleCategorySubmit} className="wizard-form-box">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input font-semibold"
                    placeholder="e.g. 🧋 Boba Teas, 🍔 Burgers, 🍕 Wood Pizza..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                  <span className="form-hint">Tip: Use an emoji prefix to make buttons pop on the POS touch display</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Fresh brewed tea leaves with tapioca pearls"
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                  />
                </div>
              </div>

              {/* Subcategories Tags Input */}
              <div className="form-group" style={{ marginTop: '0.75rem' }}>
                <label className="form-label">
                  Subcategories (Fast Filter Tabs)
                </label>
                <div className="tag-input-wrapper">
                  <div className="tags-container">
                    {subcatList.map((tag) => (
                      <span key={tag} className="subcat-chip">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubcatTag(tag)}
                          className="chip-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add subcategory tag (e.g. Milk Teas, Fruit Teas)..."
                      value={newSubcatInput}
                      onChange={(e) => setNewSubcatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSubcatTag();
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={handleAddSubcatTag}
                      className="wizard-btn-secondary"
                    >
                      + Add Tag
                    </button>
                  </div>
                </div>
              </div>

              <div className="wizard-actions-row">
                <button
                  type="submit"
                  disabled={isSubmitting || !catName.trim()}
                  className="wizard-btn-primary"
                >
                  {isSubmitting ? 'Saving...' : '✨ Save Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('addons')}
                  className="wizard-btn-next"
                >
                  Continue to Step 2: Toppings & Sizes ➔
                </button>
              </div>
            </form>

            {/* Existing Categories List */}
            <div className="existing-items-section">
              <h5 className="section-title">Active Categories ({categories.length})</h5>
              {categories.length === 0 ? (
                <div className="empty-catalog-callout">
                  No categories created yet. Fill the form above and click <strong>"Save Category"</strong> to start fresh!
                </div>
              ) : (
                <div className="categories-grid-preview">
                  {categories.map((c) => (
                    <div key={c.id} className="category-card-preview">
                      <div className="cat-card-header">
                        <span className="cat-card-title">{c.name}</span>
                        <span className="cat-card-badge">{c.subcategories?.length || 0} Subcats</span>
                      </div>
                      {c.description && <p className="cat-card-desc">{c.description}</p>}
                      <div className="cat-chips-list">
                        {(c.subcategories || []).map((sc) => (
                          <span key={sc} className="mini-subcat-chip">{sc}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: TOPPING GROUPS & CHOICES ================= */}
        {activeTab === 'addons' && (
          <div className="add-modal-body">
            <div className="wizard-step-info-card">
              <h4>Step 2: Create Topping Groups (e.g., Choice Of Size, Choice Of Boba)</h4>
              <p>
                Each <strong>Topping Category</strong> groups customizable options. For example, <strong>Choice Of Size</strong> (Single selection: <em>Regular 300ml, Large 500ml</em>) or <strong>Choice Of Boba & Toppings</strong> (Multi selection: <em>Mango Popping Boba +₹40, Tapioca Pearls +₹35</em>).
              </p>
            </div>

            {/* Add Choice Form */}
            <form onSubmit={handleAddChoice} className="wizard-form-box">
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">
                    Topping Group / Category <span className="req">*</span>
                  </label>
                  <select
                    className="form-select font-semibold"
                    value={groupNameInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGroupNameInput(val);
                      if (val.toLowerCase().includes('size') || val.toLowerCase().includes('sweetness') || val.toLowerCase().includes('ice')) {
                        setGroupSelectionType('SINGLE');
                      } else {
                        setGroupSelectionType('MULTI');
                      }
                    }}
                  >
                    {existingGroupNames.map((grp) => (
                      <option key={grp} value={grp}>
                        {grp}
                      </option>
                    ))}
                    <option value="CUSTOM">-- + New Custom Group Name --</option>
                  </select>
                  {groupNameInput === 'CUSTOM' && (
                    <input
                      type="text"
                      className="form-input mt-1"
                      placeholder="e.g. Choice Of Flavour, Crust Type..."
                      value={customGroupName}
                      onChange={(e) => setCustomGroupName(e.target.value)}
                      required
                    />
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Choice / Item Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input font-medium"
                    placeholder="e.g. Regular (300ml), Large (500ml), Mango Popping..."
                    value={choiceName}
                    onChange={(e) => setChoiceName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Extra Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    placeholder="0"
                    value={choicePrice}
                    onChange={(e) => setChoicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                  <span className="form-hint">Set ₹0 for base sizes/sweetness</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '0.75rem' }}>
                <span className="form-label" style={{ marginBottom: 0 }}>Selection Mode:</span>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="groupSelectionType"
                    value="SINGLE"
                    checked={groupSelectionType === 'SINGLE'}
                    onChange={() => setGroupSelectionType('SINGLE')}
                  />
                  <span>Single Choice (Radio, e.g. Size, Sweetness)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="groupSelectionType"
                    value="MULTI"
                    checked={groupSelectionType === 'MULTI'}
                    onChange={() => setGroupSelectionType('MULTI')}
                  />
                  <span>Multiple Choices (Checkbox, e.g. Toppings)</span>
                </label>
              </div>

              <div className="wizard-actions-row">
                <button
                  type="submit"
                  disabled={isSubmitting || !choiceName.trim()}
                  className="wizard-btn-primary"
                >
                  {isSubmitting ? 'Adding...' : '➕ Add Choice to Group'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('product')}
                  className="wizard-btn-next"
                >
                  Continue to Step 3: Add Food Item & Map Toppings ➔
                </button>
              </div>
            </form>

            {/* Visual Overview of Created Groups */}
            <div className="existing-items-section">
              <h5 className="section-title">Defined Topping Groups ({existingGroupNames.filter((g) => addOnsByGroup[g]?.length > 0).length})</h5>
              <div className="topping-groups-grid">
                {existingGroupNames.map((grp) => {
                  const items = addOnsByGroup[grp] || [];
                  const isSingle = items[0]?.selectionType === 'SINGLE' || grp.toLowerCase().includes('size');
                  return (
                    <div key={grp} className={`topping-group-card ${items.length > 0 ? 'has-items' : 'empty-group'}`}>
                      <div className="tg-card-header">
                        <div>
                          <span className="tg-group-name">{grp}</span>
                          <span className={`tg-type-badge ${isSingle ? 'badge-single' : 'badge-multi'}`}>
                            {isSingle ? 'Single Select (1)' : 'Multi Select'}
                          </span>
                        </div>
                        <span className="tg-count-badge">{items.length} choices</span>
                      </div>

                      <div className="tg-choices-container">
                        {items.length === 0 ? (
                          <span className="text-muted text-xs italic">No choices yet. Add one above!</span>
                        ) : (
                          items.map((item) => (
                            <span key={item.id} className="tg-choice-pill">
                              <span className="choice-name">{item.name}</span>
                              <span className="choice-price">
                                {item.price > 0 ? `+₹${item.price}` : 'Free'}
                              </span>
                              {onDeleteAddOn && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onDeleteAddOn(item.id);
                                  }}
                                  className="choice-del-btn"
                                  title="Delete choice"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: ADD ITEM & MAP TOPPINGS ================= */}
        {activeTab === 'product' && (
          <form onSubmit={handleProductSubmit} className="add-modal-body">
            <div className="wizard-step-info-card">
              <h4>Step 3: Add Food / Drink Item & Map Topping Groups</h4>
              <p>
                Name your dish, select the Category & Subcategory, set the Base Price, and simply check which <strong>Topping Groups</strong> (Size, Boba Toppings, Sweetness) should appear when cashiers ring up this item!
              </p>
            </div>

            {/* STEP 3 - FIELD 1 & 2: CATEGORY & SUBCATEGORY SELECTION (PROMINENT TOP CARD) */}
            <div className="item-category-selection-card">
              <div className="item-cat-header">
                <div>
                  <label className="form-label font-bold" style={{ fontSize: '0.92rem', color: '#0f172a', margin: 0 }}>
                    📁 Menu Category & Subcategory <span className="req">*</span>
                  </label>
                  <span className="form-hint">
                    Select which Category and Subcategory section this dish belongs to
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('category')}
                  className="wizard-btn-ghost text-xs"
                  title="Create or manage categories"
                >
                  + Add / Edit Categories
                </button>
              </div>

              {/* 1. Category Selector */}
              <div style={{ marginTop: '0.65rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  1. Select Category:
                </span>
                {categories.length === 0 ? (
                  <div className="empty-category-inline-warning">
                    <span>⚠️ No menu categories created yet.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('category')}
                      className="wizard-btn-primary"
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      + Create Category in Step 1
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="category-chips-selector">
                      {categories.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`cat-select-chip ${selectedCatId === c.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedCatId(c.id);
                            if (c.subcategories && c.subcategories.length > 0) {
                              setSelectedSubcat(c.subcategories[0]);
                            } else {
                              setSelectedSubcat('');
                            }
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                    <select
                      className="form-select font-semibold"
                      value={selectedCatId}
                      onChange={(e) => {
                        setSelectedCatId(e.target.value);
                        const c = categories.find((cat) => cat.id === e.target.value);
                        if (c?.subcategories && c.subcategories.length > 0) {
                          setSelectedSubcat(c.subcategories[0]);
                        } else {
                          setSelectedSubcat('');
                        }
                      }}
                      style={{ maxWidth: '200px', padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                      required
                      aria-label="Select Category Dropdown"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* 2. Subcategory Selector */}
              <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                  2. Select Subcategory (Menu Section):
                </span>
                {availableSubcategories.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    <div className="subcat-chips-selector">
                      {availableSubcategories.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          className={`subcat-select-chip ${selectedSubcat === sc && !customSubcat ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedSubcat(sc);
                            setCustomSubcat('');
                          }}
                        >
                          🏷️ {sc}
                        </button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Or type custom section:</span>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Special Reserve, Chef Selection..."
                        value={customSubcat}
                        onChange={(e) => setCustomSubcat(e.target.value)}
                        style={{ maxWidth: '260px', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Milk Teas, Fruit Teas, Classic..."
                      value={customSubcat}
                      onChange={(e) => setCustomSubcat(e.target.value)}
                      style={{ maxWidth: '300px' }}
                    />
                    <span className="form-hint">Type a subcategory for this category</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Item / Beverage Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input font-bold"
                  placeholder="e.g. Authentic Brown Sugar Boba Tea, Truffle Burger..."
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Base Price (₹) <span className="req">*</span>
                </label>
                <div className="currency-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="form-input"
                    placeholder="240"
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dietary Type & Badge */}
            <div className="form-grid-3">
              <div className="form-group">
                <label className="form-label">Dietary Type</label>
                <div className="dietary-selector">
                  {(['VEG', 'NON_VEG', 'VEGAN', 'BEVERAGE'] as DietaryType[]).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      className={`dietary-btn ${dietaryType === dt ? 'selected ' + dt.toLowerCase() : ''}`}
                      onClick={() => setDietaryType(dt)}
                    >
                      {dt === 'VEG' ? '🟢 Veg' : dt === 'NON_VEG' ? '🔴 Non-Veg' : dt === 'VEGAN' ? '🌱 Vegan' : '🧋 Drink'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Promotional Badge</label>
                <select
                  className="form-select"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                >
                  <option value="">None</option>
                  {PRESET_BADGES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Prep Time (Mins)</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Item Image Presets */}
            <div className="form-group">
              <label className="form-label">Visual Card Image</label>
              <div className="image-preset-scroll">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    className={`image-preset-pill ${imageUrl === img.url ? 'active' : ''}`}
                    onClick={() => setImageUrl(img.url)}
                  >
                    <img src={img.url} alt={img.label} className="preset-thumb" />
                    <span>{img.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ================= CRUCIAL: TOPPING GROUPS MAPPING SECTION ================= */}
            <div className="toppings-mapping-section">
              <div className="toppings-mapping-header">
                <div>
                  <h5 className="mapping-title">🍬 Map Customization & Topping Groups</h5>
                  <p className="mapping-subtitle">
                    Select which groups apply to this dish. Cashiers will see these size choices and add-ons during billing!
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="wizard-btn-ghost text-xs"
                    onClick={() => setSelectedGroupNames(existingGroupNames)}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="wizard-btn-ghost text-xs"
                    onClick={() => setSelectedGroupNames([])}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="mapping-checkbox-grid">
                {existingGroupNames.map((grp) => {
                  const items = addOnsByGroup[grp] || [];
                  const isChecked = selectedGroupNames.includes(grp);
                  return (
                    <label
                      key={grp}
                      className={`mapping-checkbox-card ${isChecked ? 'checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleGroupMapping(grp)}
                      />
                      <div className="mapping-card-content">
                        <span className="mapping-grp-name">{grp}</span>
                        <span className="mapping-grp-desc">
                          {items.length > 0
                            ? items.map((i) => i.name).slice(0, 3).join(', ') + (items.length > 3 ? '...' : '')
                            : 'No choices added yet'}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="wizard-submit-bar">
              <button
                type="button"
                onClick={() => setActiveTab('addons')}
                className="wizard-btn-secondary"
              >
                ⬅ Back to Toppings
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !prodName.trim() || !prodPrice || categories.length === 0}
                className="wizard-btn-save-final"
              >
                {isSubmitting ? '✨ Creating...' : '✨ Create Item & Add to Live POS Menu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
