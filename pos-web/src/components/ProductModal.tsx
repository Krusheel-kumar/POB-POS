import React, { useState, useEffect, useMemo } from 'react';
import type { Product, ProductVariant, AddOn, AddOnCategory, CartItem } from '../types/pos';
import { mockStore } from '../data/mockStore';
import './ProductModal.css';

interface ProductModalProps {
  product: Product;
  availableAddOns?: AddOn[];
  addOnCategories?: AddOnCategory[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
  editingCartItem?: CartItem | null;
  onUpdateCartItem?: (cartItemId: string, item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
}

// Elegant name formatting helper: fixes stuck parentheses and shouting ALL-CAPS into cafe Title Case
export const formatDisplayName = (name: string): string => {
  if (!name) return '';
  // Fix glued parentheses: "REGULAR(300ML)" -> "REGULAR (300ML)"
  const withSpaces = name.replace(/([^\s])\(/g, '$1 (').replace(/\)([^\s])/g, ') $1');

  // If already mixed case (e.g. "Brown Sugar Pearls"), retain existing human-authored casing
  const isAllCaps = withSpaces === withSpaces.toUpperCase() && /[A-Z]/.test(withSpaces);
  if (!isAllCaps) {
    return withSpaces;
  }

  // Convert screaming ALL-CAPS to elegant Title Case
  return withSpaces
    .split(' ')
    .map((word) => {
      if (word.startsWith('(') && word.endsWith(')')) {
        const inner = word.slice(1, -1);
        return `(${inner.charAt(0).toUpperCase()}${inner.slice(1).toLowerCase()})`;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  availableAddOns,
  addOnCategories,
  isOpen,
  onClose,
  onAddToCart,
  editingCartItem,
  onUpdateCartItem,
}) => {
  const defaultVariant = product.variants.length > 0 ? product.variants[0] : undefined;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [maxWarningGroup, setMaxWarningGroup] = useState<string | null>(null);

  // Helper to determine if category is Single Choice (e.g. Size, Milk, Sweetness, Ice Level)
  const isSingleCategory = (categoryName?: string, selectionType?: 'SINGLE' | 'MULTI') => {
    if (!categoryName) return selectionType === 'SINGLE';
    const lower = categoryName.toLowerCase();
    if (
      lower.includes('size') ||
      lower.includes('portion') ||
      lower.includes('crust') ||
      lower.includes('milk') ||
      lower.includes('sweetness') ||
      lower.includes('sugar') ||
      /\bice\b/.test(lower) ||
      lower.includes('base')
    ) {
      return true;
    }
    return selectionType === 'SINGLE';
  };

  // Group add-ons by category (falls back to store toppings if product has none attached)
  const effectiveAddOns = useMemo(() => {
    const list: AddOn[] = [];
    const seen = new Set<string>();

    const addList = (items?: AddOn[]) => {
      if (!items) return;
      items.forEach((a) => {
        const key = a.id || `${a.name}-${a.category || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push(a);
        }
      });
    };

    if (product.addOns && product.addOns.length > 0) {
      addList(product.addOns);
    }

    // Ensure any previously chosen add-ons in the cart item remain present and selectable
    if (editingCartItem?.selectedAddOns) {
      addList(editingCartItem.selectedAddOns);
    }

    return list;
  }, [product.addOns, availableAddOns, editingCartItem]);

  const groupedProductAddOns = useMemo(() => {
    const map: Record<string, AddOn[]> = {};
    effectiveAddOns.forEach((a) => {
      const cat = a.category || 'Choice Of Add-ons';
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });

    // Sort items within each category group by displayOrder ascending
    Object.keys(map).forEach((cat) => {
      map[cat].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
    });

    // Retrieve active Add-on Category rankings
    const categoriesList = addOnCategories || mockStore.getAddOnCategories();
    const rankMap = new Map<string, number>();
    categoriesList.forEach((c) => {
      rankMap.set(c.name.toLowerCase().trim(), c.displayOrder);
    });

    // Smart default ranking fallback if not explicitly found in categories list:
    // Choice of Milk (1) -> Choice Of Size (2) -> Free Toppings (3) -> Extra Toppings (4) -> etc.
    const getCatRank = (catName: string): number => {
      const lower = catName.toLowerCase().trim();
      if (rankMap.has(lower)) return rankMap.get(lower)!;
      if (lower.includes('milk')) return 1;
      if (lower.includes('size')) return 2;
      if (lower.includes('free topping')) return 3;
      if (lower.includes('extra topping')) return 4;
      if (lower.includes('sweet') || lower.includes('sugar')) return 5;
      if (/\bice\b/.test(lower)) return 6;
      if (lower.includes('boba') || lower.includes('topping')) return 7;
      return 99;
    };

    const sortedEntries = Object.entries(map).sort(
      ([catA], [catB]) => getCatRank(catA) - getCatRank(catB)
    );

    const sortedMap: Record<string, AddOn[]> = {};
    sortedEntries.forEach(([cat, items]) => {
      sortedMap[cat] = items;
    });

    return sortedMap;
  }, [effectiveAddOns, addOnCategories]);

  // Pre-select choices:
  // If editing an existing cart item: pre-populate its exact toppings, variant, notes, and quantity
  // If new item: pre-select first choice for mandatory single-select groups (Size, Milk, Sugar, Ice)
  useEffect(() => {
    if (!isOpen) return;

    if (editingCartItem) {
      // Variant matching
      const matchedVariant = editingCartItem.selectedVariant
        ? product.variants.find(
            (v) =>
              v.id === editingCartItem.selectedVariant?.id ||
              v.name.toLowerCase() === editingCartItem.selectedVariant?.name.toLowerCase()
          ) || editingCartItem.selectedVariant
        : product.variants.length > 0
        ? product.variants[0]
        : undefined;

      setSelectedVariant(matchedVariant);
      setSelectedAddOns(editingCartItem.selectedAddOns ? [...editingCartItem.selectedAddOns] : []);
      setQuantity(editingCartItem.quantity > 0 ? editingCartItem.quantity : 1);
      setItemNotes(editingCartItem.itemNotes || '');
      setMaxWarningGroup(null);
    } else {
      const preselected: AddOn[] = [];
      Object.entries(groupedProductAddOns).forEach(([category, items]) => {
        const isSingle = isSingleCategory(category, items[0]?.selectionType);
        if (isSingle && items.length > 0) {
          preselected.push(items[0]); // pre-select default (e.g. Regular 300ml, Fresh Milk)
        }
      });

      setSelectedAddOns(preselected);
      setQuantity(1);
      setItemNotes('');
      setSelectedVariant(product.variants.length > 0 ? product.variants[0] : undefined);
      setMaxWarningGroup(null);
    }
  }, [product, isOpen, groupedProductAddOns, editingCartItem]);

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
    const itemData = {
      product,
      selectedVariant,
      selectedAddOns,
      quantity,
      itemNotes,
      unitPrice: currentUnitPrice,
    };
    if (editingCartItem && onUpdateCartItem) {
      onUpdateCartItem(editingCartItem.id, itemData);
    } else {
      onAddToCart(itemData);
    }
    onClose();
  };

  return (
    <div className="lux-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="lux-modal-container">
        {/* Luxury Header */}
        <div className="lux-modal-header">
          <div className="lux-header-left">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="lux-product-thumb"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            )}
            <div>
              <h2 id="modal-title" className="lux-item-title">
                {formatDisplayName(product.name)}
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
                {product.sku && <span className="lux-sku-tag">{product.sku}</span>}
                {product.prepTimeMinutes && (
                  <span className="lux-prep-tag">⏱️ {product.prepTimeMinutes} mins</span>
                )}
                <span className="lux-base-price">Base: ₹{product.basePrice.toFixed(2)}</span>
                {editingCartItem && (
                  <span className="lux-editing-cart-badge">
                    ✏️ Editing Item Toppings
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="lux-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            title="Close (Esc)"
          >
            ✕
          </button>
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
                        <span className="lux-option-name">{formatDisplayName(variant.name)}</span>
                      </div>
                      <span className="lux-price-tag">₹{variant.price.toFixed(2)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Grouped Add-ons with Smart Constraints */}
          {Object.entries(groupedProductAddOns).map(([category, items]) => {
            const isSingle = isSingleCategory(category, items[0]?.selectionType);
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
                  <h4 className="lux-section-title">{formatDisplayName(category)}</h4>
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
                    ⚠️ Maximum of {maxChoices} selections allowed in {formatDisplayName(category)}.
                  </div>
                )}

                <div className="lux-options-grid">
                  {items.map((addon) => {
                    const isSelected = selectedAddOns.some((a) => a.id === addon.id);
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
                          <span className="lux-option-name">{formatDisplayName(addon.name)}</span>
                        </div>
                        <span className={`lux-price-tag ${addon.price === 0 ? 'free' : ''}`}>
                          {addon.price > 0 ? `+₹${addon.price.toFixed(2)}` : 'Free'}
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
            <h4 className="lux-section-title">Kitchen Modifiers & Instructions</h4>
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

            <div className="lux-notes-input-wrapper">
              <span className="lux-notes-icon">📝</span>
              <input
                type="text"
                placeholder="Special cooking instructions (e.g. separate packing, extra warm, less ice)..."
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
                className="lux-notes-input"
              />
            </div>
          </div>
        </div>

        {/* Modern High-End Sticky Footer with Docked Quantity Stepper */}
        <div className="lux-modal-footer">
          {/* Left: Tactile Quantity Stepper */}
          <div className="lux-footer-qty-wrap">
            <span className="lux-qty-label-sub">Quantity</span>
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

          {/* Right: Primary High-Contrast Action Button */}
          <button
            type="button"
            className={`lux-add-cart-btn ${editingCartItem ? 'lux-update-cart-btn' : ''}`}
            onClick={handleConfirm}
          >
            <div className="lux-btn-left">
              <span>{editingCartItem ? 'Update Item' : 'Add to Cart'}</span>
              <span>—</span>
              <span className="lux-btn-price">₹{(currentUnitPrice * quantity).toFixed(2)}</span>
            </div>
            <span className="lux-btn-gst">(+5% GST)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
