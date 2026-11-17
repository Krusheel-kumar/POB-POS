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

const DEFAULT_MODIFIER_GROUPS = [
  'Choice Of Size',
  'Choice Of Boba & Toppings',
  'Choice Of Sweetness',
  'Choice Of Ice Level',
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
  const [activeTab, setActiveTab] = useState<'product' | 'category' | 'addons'>(
    categories.length === 0 ? 'category' : initialTab
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // --- Product Form State ---
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [customSubcatInput, setCustomSubcatInput] = useState('');
  const [isAddingCustomSubcat, setIsAddingCustomSubcat] = useState(false);
  const [dietaryType, setDietaryType] = useState<DietaryType>('BEVERAGE');
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([
    'Choice Of Size',
    'Choice Of Boba & Toppings',
  ]);

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

  // Auto-sync all modifier groups by default so newly added topping groups are pre-checked
  useEffect(() => {
    if (addOns.length > 0) {
      const allGroups = Array.from(new Set(addOns.map((a) => a.category || 'Choice Of Boba & Toppings')));
      setSelectedGroupNames((prev) => Array.from(new Set([...prev, ...allGroups])));
    }
  }, [addOns]);

  useEffect(() => {
    if (activeSubcats.length > 0) {
      if (!selectedSubcat || !activeSubcats.includes(selectedSubcat)) {
        setSelectedSubcat(activeSubcats[0]);
      }
    } else {
      setSelectedSubcat('');
    }
  }, [selectedCatId, activeSubcats, selectedSubcat]);

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
  const handleCreateProduct = async (e: React.FormEvent) => {
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

    // Collect add-on IDs for checked modifier groups (falls back to all available if none explicitly selected)
    let mappedAddOnIds = addOns
      .filter((a) => a.category && selectedGroupNames.includes(a.category))
      .map((a) => a.id);
    if (mappedAddOnIds.length === 0 && addOns.length > 0) {
      mappedAddOnIds = addOns.map((a) => a.id);
    }

    setIsSubmitting(true);
    try {
      await onProductCreated({
        name: prodName.trim(),
        basePrice: Number(prodPrice),
        categoryId: selectedCatId,
        subcategory: subcat,
        dietaryType,
        addOnIds: mappedAddOnIds,
        prepTimeMinutes: 5,
      });

      setSuccessMsg(`✓ "${prodName.trim()}" added to menu`);
      setProdName('');
      setProdPrice('');
      setCustomSubcatInput('');
      setIsAddingCustomSubcat(false);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create product');
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
              className={`min-tab-pill ${activeTab === 'product' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('product');
                setErrorMsg(null);
              }}
            >
              + Add Menu Item
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

        {/* TAB 1: ADD MENU ITEM */}
        {activeTab === 'product' && (
          <form onSubmit={handleCreateProduct} className="min-modal-body">
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

            {/* Row 3: Dietary Selection */}
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

            {/* Row 4: Customization & Modifier Groups */}
            <div className="min-modifiers-box">
              <div className="min-label-row mb-1">
                <label className="min-label" style={{ margin: 0 }}>
                  Modifier Groups (Sizes & Add-ons)
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('addons')}
                  className="min-field-action-link"
                >
                  + Manage Modifiers
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
                            ? items.map((i) => i.name).slice(0, 3).join(', ') +
                              (items.length > 3 ? '...' : '')
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
              <button type="button" onClick={onClose} className="min-btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !prodName.trim() || !prodPrice}
                className="min-btn-primary"
              >
                {isSubmitting ? 'Saving...' : 'Save & Add to POS'}
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

            {/* Existing Categories Table */}
            <div className="min-table-wrapper">
              <table className="min-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Subcategories</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(c.subcategories || []).map((sc) => (
                            <span key={sc} className="min-tag">
                              {sc}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {categories.length === 0 && (
                    <tr>
                      <td colSpan={2} className="text-center text-muted">
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
