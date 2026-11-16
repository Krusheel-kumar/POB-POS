import React, { useState } from 'react';
import type { ProductCategory, DietaryType, ProductRequest, CategoryRequest } from '../types/pos';
import './AddProductModal.css';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ProductCategory[];
  onProductCreated: (req: ProductRequest) => Promise<void>;
  onCategoryCreated: (req: CategoryRequest) => Promise<void>;
}

const PRESET_IMAGES = [
  { label: '🍔 Smash Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' },
  { label: '🍕 Wood Pizza', url: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=80' },
  { label: '🧋 Boba Milk Tea', url: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&auto=format&fit=crop&q=80' },
  { label: '☕ Cold Coffee', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
  { label: '🍟 Loaded Fries', url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80' },
  { label: '🍗 Spicy Wings', url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80' },
  { label: '🧇 Belgian Waffle', url: 'https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80' },
  { label: '🍰 Cheesecake', url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500&auto=format&fit=crop&q=80' },
];

const PRESET_BADGES = ['Bestseller', 'Chef Special', 'Festive', 'New Launch', 'Signature', 'Handcrafted', 'Popular'];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onProductCreated,
  onCategoryCreated,
}) => {
  const [activeTab, setActiveTab] = useState<'product' | 'category'>('product');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab 1: Product Form State
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>('');
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || '');
  const [selectedSubcat, setSelectedSubcat] = useState('');
  const [customSubcat, setCustomSubcat] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('VEG');
  const [prodDesc, setProdDesc] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [badge, setBadge] = useState('Bestseller');
  const [prepTime, setPrepTime] = useState(8);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);

  // Tab 2: Category Form State
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [subcatList, setSubcatList] = useState<string[]>(['Signature', 'Classic', 'Specialty']);
  const [newSubcatInput, setNewSubcatInput] = useState('');

  if (!isOpen) return null;

  const currentCategory = categories.find((c) => c.id === selectedCatId) || categories[0];
  const availableSubcategories = currentCategory?.subcategories || [];

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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!prodName.trim()) {
      setErrorMsg('Item name is required');
      return;
    }
    if (!prodPrice || Number(prodPrice) <= 0) {
      setErrorMsg('Please specify a valid base price');
      return;
    }
    if (!selectedCatId) {
      setErrorMsg('Please select a category');
      return;
    }

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
      });

      // Reset product form
      setProdName('');
      setProdPrice('');
      setProdDesc('');
      setProdSku('');
      setCustomSubcat('');
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create product';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!catName.trim()) {
      setErrorMsg('Category name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCategoryCreated({
        name: catName.trim(),
        description: catDesc.trim() || undefined,
        subcategories: subcatList.length > 0 ? subcatList : undefined,
      });

      // Reset category form
      setCatName('');
      setCatDesc('');
      setSubcatList(['Classic', 'Specialty']);
      setActiveTab('product'); // Switch back to item tab to use newly created category
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="add-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="add-modal-header">
          <div className="add-modal-title-area">
            <div className="add-modal-icon-badge">✨</div>
            <div>
              <h3 className="add-modal-title">Menu & Catalog Manager</h3>
              <p className="add-modal-subtitle">Add new food items, categories, or subcategories to your live POS</p>
            </div>
          </div>
          <button className="add-modal-close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="add-modal-tabs">
          <button
            type="button"
            className={`add-modal-tab ${activeTab === 'product' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('product');
              setErrorMsg(null);
            }}
          >
            🍔 ➕ Add Food / Drink Item
          </button>
          <button
            type="button"
            className={`add-modal-tab ${activeTab === 'category' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('category');
              setErrorMsg(null);
            }}
          >
            📁 🏷️ Create Category & Subcategories
          </button>
        </div>

        {errorMsg && (
          <div style={{ margin: '0.75rem 1.5rem 0', padding: '0.6rem 0.9rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.85rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab 1: Product Form */}
        {activeTab === 'product' && (
          <form onSubmit={handleProductSubmit} className="add-modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Select Category <span className="req">*</span>
                </label>
                <select
                  className="form-select"
                  value={selectedCatId}
                  onChange={(e) => {
                    setSelectedCatId(e.target.value);
                    setSelectedSubcat('');
                  }}
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subcategory / Grouping</label>
                {availableSubcategories.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <select
                      className="form-select"
                      value={selectedSubcat}
                      onChange={(e) => setSelectedSubcat(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      <option value="">-- Choose Subcategory --</option>
                      {availableSubcategories.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Or custom..."
                      value={customSubcat}
                      onChange={(e) => setCustomSubcat(e.target.value)}
                      style={{ width: '120px' }}
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sourdough, Iced, Hot..."
                    value={customSubcat}
                    onChange={(e) => setCustomSubcat(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">
                  Item Name <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Truffle Burrata Croissant"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Base Price (₹) <span className="req">*</span>
                </label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 280"
                  min="1"
                  step="0.01"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Dietary Type</label>
                <div className="dietary-selector">
                  <button
                    type="button"
                    className={`dietary-btn ${dietaryType === 'VEG' ? 'active' : ''}`}
                    onClick={() => setDietaryType('VEG')}
                  >
                    🟢 Veg
                  </button>
                  <button
                    type="button"
                    className={`dietary-btn ${dietaryType === 'NON_VEG' ? 'active' : ''}`}
                    onClick={() => setDietaryType('NON_VEG')}
                  >
                    🔴 Non-Veg
                  </button>
                  <button
                    type="button"
                    className={`dietary-btn ${dietaryType === 'BEVERAGE' ? 'active' : ''}`}
                    onClick={() => setDietaryType('BEVERAGE')}
                  >
                    🥤 Beverage
                  </button>
                  <button
                    type="button"
                    className={`dietary-btn ${dietaryType === 'VEGAN' ? 'active' : ''}`}
                    onClick={() => setDietaryType('VEGAN')}
                  >
                    🌱 Vegan
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Prep Time & Code (SKU)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Mins"
                    title="Prep time in minutes"
                    min="1"
                    max="60"
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    style={{ width: '80px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="SKU (e.g. CROIS-01)"
                    value={prodSku}
                    onChange={(e) => setProdSku(e.target.value)}
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>

            {/* Badge Selection */}
            <div className="form-group">
              <label className="form-label">Highlight Tag / Badge</label>
              <div className="badge-chips">
                {PRESET_BADGES.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`badge-chip-opt ${badge === b ? 'active' : ''}`}
                    onClick={() => setBadge(badge === b ? '' : b)}
                  >
                    ★ {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Food Image Selector with Instant Presets */}
            <div className="form-group">
              <label className="form-label">Food Photo / Image URL</label>
              <div className="preset-chips">
                {PRESET_IMAGES.map((img) => (
                  <button
                    key={img.label}
                    type="button"
                    className={`preset-chip ${imageUrl === img.url ? 'active' : ''}`}
                    onClick={() => setImageUrl(img.url)}
                  >
                    {img.label}
                  </button>
                ))}
              </div>
              <div className="image-preview-row">
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  style={{ flex: 1 }}
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="image-preview-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_IMAGES[0].url;
                    }}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Short Description</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Delicious artisanal preparation made fresh to order..."
                value={prodDesc}
                onChange={(e) => setProdDesc(e.target.value)}
              />
            </div>

            <div className="add-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-submit-action" disabled={isSubmitting}>
                {isSubmitting ? 'Saving Item...' : '✨ Add Item to Live Menu'}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Category & Subcategories Form */}
        {activeTab === 'category' && (
          <form onSubmit={handleCategorySubmit} className="add-modal-body">
            <div className="form-group">
              <label className="form-label">
                Category Name <span className="req">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 🥟 Dim Sum & Dumplings or 🍹 Mocktails"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category Description</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Freshly handcrafted dumplings steamed in bamboo baskets"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Subcategories & Groups</label>
              <div className="subcat-chips-list">
                {subcatList.map((tag) => (
                  <span key={tag} className="subcat-tag">
                    🏷️ {tag}
                    <button
                      type="button"
                      className="subcat-remove"
                      onClick={() => handleRemoveSubcatTag(tag)}
                      aria-label={`Remove ${tag}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {subcatList.length === 0 && (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No subcategories added yet.</span>
                )}
              </div>

              <div className="add-subcat-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type subcategory (e.g. Steamed, Fried, Cold Brew...)"
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
                <button type="button" className="btn-add-subcat" onClick={handleAddSubcatTag}>
                  + Add Tag
                </button>
              </div>
            </div>

            <div className="add-modal-footer">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="btn-submit-action" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Category...' : '📁 Save Category & Subcategories'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
