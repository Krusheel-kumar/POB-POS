import React, { useState } from 'react';
import type { Product, ProductVariant, AddOn, CartItem } from '../types/pos';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: Omit<CartItem, 'id' | 'lineTotal'>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const defaultVariant = product.variants.length > 0 ? product.variants[0] : undefined;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(defaultVariant);
  const [selectedAddOns, setSelectedAddOns] = useState<AddOn[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentUnitPrice =
    (selectedVariant ? selectedVariant.price : product.basePrice) +
    selectedAddOns.reduce((sum, a) => sum + a.price, 0);

  // Helper to check if a category is single select (like Choice Of Size, Sweetness, Ice, Milk)
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

  // Group product add-ons by category
  const groupedProductAddOns = React.useMemo(() => {
    const map: Record<string, AddOn[]> = {};
    (product.addOns || []).forEach((a) => {
      const cat = a.category || 'Choice Of Add-ons';
      if (!map[cat]) map[cat] = [];
      map[cat].push(a);
    });
    return map;
  }, [product.addOns]);

  const toggleAddOn = (addon: AddOn) => {
    const single = isSingleCategory(addon.category, addon.selectionType);
    if (single) {
      const catKey = addon.category || 'Choice Of Add-ons';
      const withoutCategory = selectedAddOns.filter(
        (a) => (a.category || 'Choice Of Add-ons') !== catKey
      );
      setSelectedAddOns([...withoutCategory, addon]);
    } else {
      if (selectedAddOns.some((a) => a.id === addon.id)) {
        setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
      } else {
        setSelectedAddOns([...selectedAddOns, addon]);
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
    product.category?.id?.includes('boba') ||
    product.category?.id?.includes('coffee') ||
    product.category?.name?.toLowerCase().includes('tea') ||
    product.category?.name?.toLowerCase().includes('boba') ||
    product.category?.name?.toLowerCase().includes('coffee') ||
    product.category?.name?.toLowerCase().includes('beverage') ||
    product.name.toLowerCase().includes('tea') ||
    product.name.toLowerCase().includes('boba') ||
    product.name.toLowerCase().includes('coffee') ||
    product.name.toLowerCase().includes('latte') ||
    product.name.toLowerCase().includes('matcha') ||
    product.name.toLowerCase().includes('brew');

  const quickTags = isBeverage
    ? ['Less Sweet', 'No Sugar', 'Less Ice', 'No Ice', 'Extra Hot', 'Pack in Carrier Bag']
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-container">
        <div className="modal-header">
          <div>
            <h2 id="modal-title">{product.name}</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
              <span className="modal-base-sku">{product.sku}</span>
              {product.prepTimeMinutes && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>• Prep: {product.prepTimeMinutes} mins</span>
              )}
            </div>
          </div>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Variant / Size selection */}
          {product.variants.length > 0 && (
            <div className="option-section">
              <h4>Select Portion / Base Variant</h4>
              <div className="variant-options">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    className={`option-btn ${selectedVariant?.id === variant.id ? 'active' : ''}`}
                    onClick={() => setSelectedVariant(variant)}
                  >
                    <span>{variant.name}</span>
                    <span className="price-tag">₹{variant.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped Add-ons & Modifiers (Choice Of Size, Choice Of Sweetness, Choice Of Boba, etc.) */}
          {Object.entries(groupedProductAddOns).map(([category, items]) => {
            const isSingle = isSingleCategory(category, items[0]?.selectionType);
            return (
              <div key={category} className="option-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0 }}>{category}</h4>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: isSingle ? '#1d4ed8' : '#15803d',
                      background: isSingle ? '#eff6ff' : '#f0fdf4',
                      border: isSingle ? '1px solid #bfdbfe' : '1px solid #bbf7d0',
                      padding: '2px 8px',
                      borderRadius: '10px',
                    }}
                  >
                    {isSingle ? '● Select 1' : '+ Multiple Optional'}
                  </span>
                </div>
                <div className="addon-options">
                  {items.map((addon) => {
                    const isSelected = selectedAddOns.some((a) => a.id === addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        className={`option-btn ${isSelected ? 'active' : ''}`}
                        onClick={() => toggleAddOn(addon)}
                      >
                        <span>
                          {isSingle ? (isSelected ? '● ' : '○ ') : (isSelected ? '✓ ' : '+ ')}
                          {addon.name}
                        </span>
                        <span className="price-tag">
                          {addon.price > 0 ? `+₹${addon.price.toFixed(2)}` : '₹0'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quick Modifier Badges */}
          <div className="option-section">
            <h4>Quick Kitchen Modifiers</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {quickTags.map((tag) => {
                const active = itemNotes.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleQuickTagClick(tag)}
                    style={{
                      background: active ? '#eff6ff' : '#f1f5f9',
                      color: active ? '#1d4ed8' : '#334155',
                      border: active ? '1px solid #3b82f6' : '1px solid #cbd5e1',
                      borderRadius: '16px',
                      padding: '4px 10px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {active ? '✓ ' : '+ '}{tag}
                  </button>
                );
              })}
            </div>

            <label htmlFor="item-notes"><h4 style={{ fontSize: '0.85rem', color: '#64748b' }}>Custom Instructions</h4></label>
            <input
              id="item-notes"
              type="text"
              placeholder="e.g. Medium well, dressing on side..."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              className="notes-input"
            />
          </div>

          {/* Quantity Controls */}
          <div className="quantity-section">
            <h4>Quantity</h4>
            <div className="qty-picker">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity(quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary add-to-cart-btn"
            onClick={handleConfirm}
          >
            Add to Cart — ₹{(currentUnitPrice * quantity).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};
