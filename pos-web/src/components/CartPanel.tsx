import React, { useState } from 'react';
import type { CartItem, OrderType, CalculationResponse, PaymentMethod } from '../types/pos';

interface CartPanelProps {
  items: CartItem[];
  orderType: OrderType;
  onOrderTypeChange: (type: OrderType) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  customerPhone?: string;
  onCustomerPhoneChange?: (phone: string) => void;
  customerNotes: string;
  onCustomerNotesChange: (notes: string) => void;
  backendCalculation: CalculationResponse | null;
  onReviewOrder: () => void;
  selectedTableNumber?: string | null;
  runningOrderId?: string | null;
  onCancelRunningOrder?: () => void;
  onPrintBill?: () => void;
  onPrintKot?: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  items,
  orderType,
  onOrderTypeChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  customerName,
  onCustomerNameChange,
  customerPhone,
  onCustomerPhoneChange,
  customerNotes,
  onCustomerNotesChange,
  backendCalculation,
  onReviewOrder,
  selectedTableNumber,
  runningOrderId,
  onCancelRunningOrder,
  onPrintBill,
  onPrintKot,
}) => {
  const [localCustomerName, setLocalCustomerName] = useState('');
  const [localCustomerPhone, setLocalCustomerPhone] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('UPI');
  const [autoPrint, setAutoPrint] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const activeCustomerName = customerName !== undefined ? customerName : localCustomerName;
  const handleNameChange = (val: string) => {
    setLocalCustomerName(val);
    onCustomerNameChange?.(val);
  };

  const activeCustomerPhone = customerPhone !== undefined ? customerPhone : localCustomerPhone;
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    setLocalCustomerPhone(cleaned);
    onCustomerPhoneChange?.(cleaned);
  };

  // Estimates
  const estimatedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = backendCalculation?.subtotal ?? estimatedSubtotal;
  const discount = backendCalculation?.discountAmount ?? 0;
  const tax = backendCalculation?.taxAmount ?? (subtotal * 0.05);
  const total = backendCalculation?.totalAmount ?? (subtotal - discount + tax);

  return (
    <aside className="retail-cart-panel" aria-label="Current Order Cart">
      {/* Top Header */}
      <div className="retail-cart-header">
        <div className="cart-header-top">
          <div className="cart-header-title">
            <span className="cart-icon">🧾</span>
            <strong>
              {orderType === 'DINE_IN' && selectedTableNumber
                ? `Table ${selectedTableNumber}`
                : 'Counter Bill'}
            </strong>
            <span className="counter-status-pill">
              {orderType === 'DINE_IN' ? '● Table Active' : '● Counter #01'}
            </span>
          </div>
          {items.length > 0 && (
            <button type="button" className="cart-clear-btn" onClick={onClearCart}>
              Clear
            </button>
          )}
        </div>
        <div className="cart-header-sub">
          <span className="invoice-preview-tag">#INV-2026-3332</span>
          <span className="cashier-name-tag">Staff: Cashier JD</span>
        </div>
      </div>

      {/* Customer Name & Mobile Number Card */}
      <div className="customer-phone-card">
        <div className="customer-inputs-grid">
          {/* Customer Name */}
          <div className="customer-field-box">
            <div className="phone-card-label">
              <span>👤 Customer Name</span>
            </div>
            <div className="single-input-wrapper">
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={activeCustomerName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="customer-name-input"
                aria-label="Customer Name"
              />
            </div>
          </div>

          {/* Customer Mobile */}
          <div className="customer-field-box">
            <div className="phone-card-label">
              <span>📱 Mobile / WhatsApp</span>
              <span className="digits-hint">10 Digits</span>
            </div>
            <div className="phone-input-group">
              <span className="country-code">+91</span>
              <input
                type="tel"
                maxLength={10}
                placeholder="98765 43210"
                value={activeCustomerPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className="phone-input"
                aria-label="Customer Mobile"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Order Type Tabs */}
      <div className="order-type-tabs" role="group" aria-label="Order Type">
        {(['DINE_IN', 'TAKEAWAY', 'COUNTER'] as OrderType[]).map((type) => {
          const typeClass = type.toLowerCase().replace('_', '-');
          const label =
            type === 'DINE_IN' ? 'Dine In' :
            type === 'TAKEAWAY' ? 'Takeaway' :
            'Counter';
          const icon =
            type === 'DINE_IN' ? '🪑' :
            type === 'TAKEAWAY' ? '🛍️' :
            '⚡';

          return (
            <button
              key={type}
              type="button"
              className={`order-tab-btn tab-${typeClass} ${orderType === type ? 'active' : ''}`}
              onClick={() => onOrderTypeChange(type)}
            >
              <span className="tab-icon">{icon}</span>
              <span className="tab-title">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected Table or Running Order Banner */}
      {selectedTableNumber && (
        <div className="table-status-strip">
          <div>
            <strong>Table: {selectedTableNumber}</strong>
            {runningOrderId && (
              <span className="running-order-subtext"> (Adding to active order)</span>
            )}
          </div>
          {runningOrderId && onCancelRunningOrder && (
            <button
              type="button"
              onClick={onCancelRunningOrder}
              className="cancel-running-btn"
            >
              Cancel Add-on
            </button>
          )}
        </div>
      )}

      {/* Cart Items Area */}
      <div className="retail-cart-body">
        {items.length === 0 ? (
          <div className="retail-empty-state">
            <div className="empty-bag-circle">
              <span>🛍️</span>
            </div>
            <h4 className="empty-state-title">Your cart is empty.</h4>
            <p className="empty-state-sub">
              Tap menu items on the catalog to add to this order
            </p>
          </div>
        ) : (
          <div className="retail-items-list">
            {items.map((item) => (
              <div key={item.id} className="retail-item-row">
                <div className="item-details">
                  <div className="item-title-row">
                    <span className="item-name">{item.product.name}</span>
                    <span className="item-line-total">₹{item.lineTotal.toFixed(2)}</span>
                  </div>

                  {(item.selectedVariant || (item.selectedAddOns && item.selectedAddOns.length > 0)) && (
                    <div className="item-addons-wrap">
                      {item.selectedVariant && (
                        <span className="cart-badge-variant">
                          {item.selectedVariant.name}
                        </span>
                      )}
                      {item.selectedAddOns.map((addon) => (
                        <span key={addon.id} className="cart-badge-addon">
                          +{addon.name} {addon.price > 0 ? `(₹${addon.price})` : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  {item.itemNotes && (
                    <span className="item-instructions">📝 {item.itemNotes}</span>
                  )}

                  <div className="item-footer-row">
                    <span className="item-rate-calc">
                      ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                    </span>

                    <div className="item-qty-controls">
                      <button
                        type="button"
                        className="qty-circle-btn"
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        aria-label={`Decrease ${item.product.name} quantity`}
                      >
                        −
                      </button>
                      <span className="qty-number">{item.quantity}</span>
                      <button
                        type="button"
                        className="qty-circle-btn"
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        aria-label={`Increase ${item.product.name} quantity`}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="item-delete-btn"
                        onClick={() => onRemoveItem(item.id)}
                        aria-label={`Remove ${item.product.name} from cart`}
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Summary & Actions */}
      <div className="retail-cart-footer">
        {items.length > 0 && (
          <div className="cart-instructions-input">
            <input
              type="text"
              placeholder="Add kitchen/cooking instruction..."
              value={customerNotes}
              onChange={(e) => onCustomerNotesChange(e.target.value)}
              className="kitchen-note-input"
              aria-label="Customer / Kitchen Instructions:"
            />
          </div>
        )}

        {/* Calculations Summary Card - Collapsible Tax & Subtotal Breakdown */}
        <div className={`billing-calc-card ${showBreakdown ? 'expanded' : ''}`}>
          {/* Main Total Row (Always Visible) */}
          <div className="calc-total-row">
            <div className="total-label-wrap">
              <span className="total-label">Total Payable</span>
              <button
                type="button"
                className="breakdown-toggle-btn"
                onClick={() => setShowBreakdown((prev) => !prev)}
                title={showBreakdown ? 'Hide Tax & Subtotal details' : 'Show Tax & Subtotal details'}
                aria-expanded={showBreakdown}
              >
                <span>{showBreakdown ? 'Hide details' : 'Tax & breakdown'}</span>
                <span className="direction-arrow">{showBreakdown ? '▲' : '▼'}</span>
              </button>
            </div>
            <span className="total-amount">₹{total.toFixed(2)}</span>
          </div>

          {/* Hidden Breakdown: Subtotal, Discount & Tax (Revealed by direction button) */}
          {showBreakdown && (
            <div className="calc-breakdown-row expanded-details">
              <span className="calc-mini-item">
                <span className="mini-label">Subtotal:</span>
                <span className="mini-val">₹{subtotal.toFixed(2)}</span>
              </span>
              {discount > 0 && (
                <span className="calc-mini-item discount">
                  <span className="mini-label">Disc:</span>
                  <span className="mini-val">-₹{discount.toFixed(2)}</span>
                </span>
              )}
              <span className="calc-mini-item">
                <span className="mini-label">GST (5%):</span>
                <span className="mini-val">₹{tax.toFixed(2)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="payment-method-bar">
          <button
            type="button"
            className={`pmt-pill ${selectedPaymentMethod === 'UPI' ? 'active' : ''}`}
            onClick={() => setSelectedPaymentMethod('UPI')}
          >
            📱 UPI QR
          </button>
          <button
            type="button"
            className={`pmt-pill ${selectedPaymentMethod === 'CASH' ? 'active' : ''}`}
            onClick={() => setSelectedPaymentMethod('CASH')}
          >
            💵 Cash
          </button>
          <button
            type="button"
            className={`pmt-pill ${selectedPaymentMethod === 'CARD' ? 'active' : ''}`}
            onClick={() => setSelectedPaymentMethod('CARD')}
          >
            💳 Card
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="cart-secondary-actions">
          <button
            type="button"
            className="btn-secondary-tool"
            onClick={onPrintKot || onReviewOrder}
            title="Preview / Print Kitchen Order Ticket"
          >
            👨‍🍳 Print KOT
          </button>
          <button
            type="button"
            className="btn-secondary-tool"
            onClick={onPrintBill || onReviewOrder}
            title="Preview / Print Tax Invoice Receipt"
          >
            🖨️ Print Bill
          </button>
        </div>

        {/* Auto Print Checkbox */}
        <div className="auto-print-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoPrint}
              onChange={(e) => setAutoPrint(e.target.checked)}
            />
            <span>Auto-Print Receipt on Settle</span>
          </label>
          <span className="auto-print-status">⚡ Auto-Print Enabled</span>
        </div>

        {/* Main Checkout Button */}
        <button
          type="button"
          className="retail-checkout-btn"
          onClick={onReviewOrder}
          disabled={items.length === 0}
        >
          {items.length === 0 ? (
            <span>Checkout (Select Items)</span>
          ) : (
            <span>Review & Place Order • ₹{total.toFixed(2)}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
