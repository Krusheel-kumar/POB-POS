import React, { useState, useEffect, useMemo } from 'react';
import type { Product, ProductVariant, AddOn, CartItem } from '../types/pos';
import './ProductModal.css';

interface ProductModalProps {
  product: Product;
  availableAddOns?: AddOn[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  availableAddOns,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const defaultVariant = product.variants.length > 0 ? product.variants[0] : undefined;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [maxWarningGroup, setMaxWarningGroup] = useState<string | null>(null);

  // Helper to determine if category is Single Choice (e.g. Size, Sweetness, Ice Level, Milk Base)
  const isSingleCategory = (categoryName?: string, selectionType?: 'SINGLE' | 'MULTI') => {
    if (selectionType === 'SINGLE') return true;
    if (selectionType === 'MULTI') return false;
    if (!categoryName) return false;
    const lower = categoryName.toLowerCase();
    return (
      lower.includes('size') ||
      lower.includes('sweetness') ||
      lower.includes('sugar') ||
      lower.includes('ice') ||
      lower.includes('milk') ||
      lower.includes('crust') ||
      lower.includes('portion')
    );
  };

  // Group add-ons by category (falls back to store toppings if product has none attached)
  const effectiveAddOns = useMemo(() => {
    if (product.addOns && product.addOns.length > 0) {
      return product.addOns;
    }
    return availableAddOns || [];
  }, [product.addOns, availableAddOns]);

  const groupedProductAddOns = useMemo(() => {
    const map: Record<string, AddOn[]> = {};
    effectiveAddOns.forEach((a) => {
      const cat = a.category || 'Choice Of Add-ons';
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });
    return map;
  }, [effectiveAddOns]);

  // Pre-select first choice for mandatory single-select groups (Size, Sugar, Ice, Milk) on open
  useEffect(() => {
    if (!isOpen) return;

    const preselected: AddOn[] = [];
    Object.entries(groupedProductAddOns).forEach(([category, items]) => {
      const isSingle = isSingleCategory(category, items[0]?.selectionType);
      if (isSingle && items.length > 0) {
        preselected.push(items[0]); // pre-select default (e.g. Regular 300ml, 100% Sugar)
      }
    });

    setSelectedAddOns(preselected);
    setQuantity(1);
    setItemNotes('');
    setSelectedVariant(product.variants.length > 0 ? product.variants[0] : undefined);
    setMaxWarningGroup(null);
  }, [product, isOpen, groupedProductAddOns]);

  if (!isOpen) return null;

  const currentUnitPrice =
    (selectedVariant ? selectedVariant.price : product.basePrice) +
    selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  // Toggle selection with Min and Max constraints
  const toggleAddOn = (addon: AddOn, maxAllowed: number, isSingle: boolean) => {
    const catKey = addon.category || 'Choice Of Add-ons';

    if (isSingle) {
      // Single Select: replace previous choice from this category
      const withoutCategory = selectedAddOns.filter(
        (a) => (a.category || 'Choice Of Add-ons') !== catKey
      );
      setSelectedAddOns([...withoutCategory, addon]);
      setMaxWarningGroup(null);
    } else {
      // Multi Select: enforce Min & Max
      const isCurrentlySelected = selectedAddOns.some((a) => a.id === addon.id);
      const currentInGroup = selectedAddOns.filter(
        (a) => (a.category || 'Choice Of Add-ons') === catKey
      );

      if (isCurrentlySelected) {
        // Deselect
        setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
        setMaxWarningGroup(null);
      } else {
        // Check if max reached
        if (currentInGroup.length >= maxAllowed) {
          setMaxWarningGroup(catKey);
          setTimeout(() => setMaxWarningGroup(null), 2500);
          return;
        }
        setSelectedAddOns([...selectedAddOns, addon]);
        setMaxWarningGroup(null);
      }
    }
  };

  const handleQuickTagClick = (tag: string) => {
    if (itemNotes.includes(tag)) {
      setItemNotes(itemNotes.replace(tag, '').replace(/,\s*,/g, ',').trim());
    } else {
      setItemNotes(itemNotes ? `${itemNotes}, ${tag}` : tag);
    }
  };

  const isBeverage =
    product.dietaryType === 'BEVERAGE' ||
    product.category?.name?.toLowerCase().includes('tea') ||
    product.category?.name?.toLowerCase().includes('boba') ||
    product.category?.name?.toLowerCase().includes('coffee') ||
    product.name.toLowerCase().includes('tea') ||
    product.name.toLowerCase().includes('boba') ||
    product.name.toLowerCase().includes('latte');

  const quickTags = isBeverage
    ? ['Less Sweet', 'No Sugar', 'Less Ice', 'No Ice', 'Extra Hot', 'Carry Bag']
    : ['Less Spicy', 'Extra Spicy', 'No Onion/Garlic', 'Extra Crispy', 'Sauce on Side'];

  const handleConfirm = () => {
    onAddToCart({
      product,
      selectedVariant,
      selectedAddOns,
      quantity,
      itemNotes,
      unitPrice: currentUnitPrice,
    });
    onClose();
  };

  return (
    <div className="lux-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="lux-modal-container">
        {/* Luxury Header */}
        <div className="lux-modal-header">
          <div className="lux-header-left" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 id="modal-title" className="lux-item-title">
                {product.name}
              </h2>
              <div className="lux-header-meta">
                {product.dietaryType && (
                  <span className={`lux-dietary-badge ${product.dietaryType.toLowerCase()}`}>
                    {product.dietaryType === 'BEVERAGE'
                      ? '🧋 Drink'
                      : product.dietaryType === 'VEG'
                      ? '🟢 Veg'
                      : product.dietaryType === 'NON_VEG'
                      ? '🔴 Non-Veg'
                      : '🌱 Vegan'}
                  </span>
                )}
                {product.sku && <span>{product.sku}</span>}
                {product.prepTimeMinutes && (
                  <span>• Prep: {product.prepTimeMinutes} mins</span>
                )}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" className="lux-close-btn" onClick={onClose} aria-label="Close dialog">
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Customization Body */}
        <div className="lux-modal-body">
          {/* Base Variant / Portion selection if available */}
          {product.variants.length > 0 && (
            <div className="lux-section">
              <div className="lux-section-header">
                <h4 className="lux-section-title">Portion Size</h4>
                <span className="lux-badge-req">Required • Pick 1</span>
              </div>
              <div className="lux-options-grid">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      className={`lux-option-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <div className="lux-card-left">
                        <div className="lux-radio-circle">
                          {isSelected && <div className="lux-radio-inner-dot" />}
                        </div>
                        <span className="lux-option-name">{variant.name}</span>
                      </div>
                      <span className="lux-price-tag">₹{variant.price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grouped Add-ons with Min & Max Constraints */}
          {Object.entries(groupedProductAddOns).map(([category, items]) => {
            const isSingle = isSingleCategory(category, items[0]?.selectionType);
            // Min & Max selections configuration
            const minChoices = items[0]?.minSelections !== undefined ? items[0].minSelections : (isSingle ? 1 : 0);
            const maxChoices = items[0]?.maxSelections !== undefined ? items[0].maxSelections : (isSingle ? 1 : 3);

            const selectedInThisGroup = selectedAddOns.filter(
              (a) => (a.category || 'Choice Of Add-ons') === category
            );
            const count = selectedInThisGroup.length;
            const isMaxReached = !isSingle && count >= maxChoices;

            return (
              <div key={category} className="lux-section">
                <div className="lux-section-header">
                  <h4 className="lux-section-title">{category}</h4>
                  <div className="lux-badge-group">
                    {isSingle ? (
                      <span className="lux-badge-req">Required • Pick 1</span>
                    ) : (
                      <>
                        <span className="lux-badge-opt">
                          {minChoices > 0 ? `Required (Min ${minChoices})` : 'Optional'} • Max {maxChoices}
                        </span>
                        <span className={isMaxReached ? 'lux-badge-max' : 'lux-badge-count'}>
                          {count}/{maxChoices} selected
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {maxWarningGroup === category && (
                  <div className="lux-max-notice">
                    ⚠️ You can select a maximum of {maxChoices} options in {category}. Uncheck one to change.
                  </div>
                )}

                <div className="lux-options-grid">
                  {items.map((addon) => {
                    const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                    // Disable remaining unselected items when max is reached in multi-select group
                    const isDisabled = !isSingle && isMaxReached && !isSelected;

                    return (
                      <button
                        key={addon.id}
                        type="button"
                        disabled={isDisabled}
                        className={`lux-option-card ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleAddOn(addon, maxChoices, isSingle)}
                      >
                        <div className="lux-card-left">
                          {isSingle ? (
                            <div className="lux-radio-circle">
                              {isSelected && <div className="lux-radio-inner-dot" />}
                            </div>
                          ) : (
                            <div className="lux-check-box">
                              {isSelected ? '✓' : ''}
                            </div>
                          )}
                          <span className="lux-option-name">{addon.name}</span>
                        </div>
                        <span className={`lux-price-tag ${addon.price === 0 ? 'free' : ''}`}>
                          {addon.price > 0 ? `+₹${addon.price.toFixed(2)}` : '₹0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quick Kitchen Notes */}
          <div className="lux-section">
            <h4 className="lux-section-title">Kitchen Modifiers</h4>
            <div className="lux-quick-tags">
              {quickTags.map((tag) => {
                const active = itemNotes.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    className={`lux-tag-btn ${active ? 'active' : ''}`}
                  >
                    {active ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              placeholder="Custom instructions (e.g. packing separate, extra warm)..."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              className="lux-notes-input"
            />
          </div>

          {/* Quantity Stepper */}
          <div className="lux-qty-row">
            <span className="lux-qty-label">Quantity</span>
            <div className="lux-qty-stepper">
              <button
                type="button"
                className="lux-qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="lux-qty-num">{quantity}</span>
              <button
                type="button"
                className="lux-qty-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="lux-modal-footer">
          <button type="button" className="lux-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="lux-add-cart-btn"
            onClick={handleConfirm}
          >
            <span>Add to Cart</span>
            <span>—</span>
            <span>₹{(currentUnitPrice * quantity).toFixed(2)}</span>
            <span style={{ fontSize: '0.85em', opacity: 0.85 }}>(+5% GST)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
