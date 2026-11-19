import React, { useState } from 'react';
import type { Product } from '../types/pos';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [isStarred, setIsStarred] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [product.imageUrl, product.id]);

  const isAvailable = product.isActive;
  const startingPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => v.price))
    : product.basePrice;

  const renderDietaryIcon = () => {
    switch (product.dietaryType) {
      case 'VEG':
        return (
          <span className="card-dietary veg" title="Vegetarian">
            <span className="dietary-dot"></span>
          </span>
        );
      case 'NON_VEG':
        return (
          <span className="card-dietary non-veg" title="Non-Vegetarian">
            <span className="dietary-dot"></span>
          </span>
        );
      case 'BEVERAGE':
        return <span className="card-dietary beverage" title="Beverage">🥤</span>;
      default:
        return null;
    }
  };

  const getBadgeClass = (badge?: string) => {
    if (!badge) return 'badge-default';
    const b = badge.toLowerCase();
    if (b.includes('best') || b.includes('hot') || b.includes('fav')) return 'badge-amber';
    if (b.includes('chef') || b.includes('wood') || b.includes('special')) return 'badge-iris';
    if (b.includes('festive') || b.includes('reserve') || b.includes('fresh')) return 'badge-emerald';
    return 'badge-slate';
  };

  const getCategoryFallback = () => {
    const text = `${product.name} ${product.category?.name || ''}`.toLowerCase();
    if (text.includes('boba') || text.includes('tea') || text.includes('pearl')) return '🧋';
    if (text.includes('coffee') || text.includes('espresso') || text.includes('latte')) return '☕';
    if (text.includes('shake') || text.includes('smoothie') || text.includes('juice')) return '🥤';
    if (text.includes('cake') || text.includes('pastry') || text.includes('croissant') || text.includes('snack')) return '🥐';
    return '🍽️';
  };

  return (
    <div
      className={`retail-product-card ${!isAvailable ? 'sold-out' : ''}`}
      onClick={() => isAvailable && onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (isAvailable) onSelect(product);
        }
      }}
      aria-label={`Select ${product.name}`}
    >
      {/* Product Image Box */}
      <div className="card-image-wrapper">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="card-image"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="card-image-placeholder">
            <span>{getCategoryFallback()}</span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="card-badge-overlay">
          <div className="badge-group">
            {renderDietaryIcon()}
            {product.badge && (
              <span className={`pill-badge ${getBadgeClass(product.badge)}`}>
                {product.badge}
              </span>
            )}
          </div>
          <button
            type="button"
            className={`star-btn ${isStarred ? 'starred' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setIsStarred(!isStarred);
            }}
            aria-label="Favorite item"
          >
            {isStarred ? '★' : '☆'}
          </button>
        </div>

        {!isAvailable && <div className="card-sold-out-overlay">Unavailable</div>}
      </div>

      {/* Product Details */}
      <div className="card-info">
        <div className="card-text-block">
          <h3 className="card-title" title={product.name}>
            {product.name}
          </h3>
          <p className="card-sub">{product.description || product.sku}</p>
        </div>

        <div className="card-bottom-row">
          <div className="price-box">
            <span className="price-currency">₹</span>
            <span className="price-value">{startingPrice.toFixed(0)}</span>
            {product.variants.length > 1 && <span className="price-plus">+</span>}
          </div>

          {isAvailable && (
            <button
              type="button"
              className="card-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              aria-label={`Add ${product.name}`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
