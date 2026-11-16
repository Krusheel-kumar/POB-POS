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
        {(['DINE_IN', 'TAKEAWAY', 'COUNTER'] as OrderType[]).map((type) => (
          <button
            key={type}
            type="button"
            className={`order-tab-btn ${orderType === type ? 'active' : ''}`}
            onClick={() => onOrderTypeChange(type)}
          >
            <span className="tab-title">
              {type === 'DINE_IN' && '🪑 Dine In'}
              {type === 'TAKEAWAY' && '🛍️ Parcel'}
              {type === 'COUNTER' && '⚡ Quick Counter'}
            </span>
            <span className="tab-sub">
              {type === 'DINE_IN' ? 'Pay Later' : 'Pay First'}
            </span>
          </button>
        ))}
      </div>

      {/* Cashier Order Flow Guide Indicator */}
      <div className={`order-flow-indicator ${orderType === 'DINE_IN' ? 'pay-later' : 'pay-first'}`}>
        {orderType === 'DINE_IN' ? (
          <>
            <span>🔵</span>
            <span><strong>Sit & Order:</strong> KOT dispatched to kitchen first → Bill paid after dining</span>
          </>
        ) : (
          <>
            <span>🟢</span>
            <span><strong>Pay First:</strong> Immediate settlement at counter → Bill & KOT issued together</span>
          </>
        )}
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
            <div className="terminal-active-tag">
              <span className="active-green-dot">●</span> Scanner gun & terminal active
            </div>
          </div>
        ) : (
          <div className="retail-items-list">
            {items.map((item) => (
              <div key={item.id} className="retail-item-row">
                <div className="item-details">
                  <span className="item-name">
                    {item.product.name}
                    {item.selectedVariant && (
                      <span className="item-variant"> ({item.selectedVariant.name})</span>
                    )}
                  </span>
                  {item.selectedAddOns.length > 0 && (
                    <span className="item-addons">
                      + {item.selectedAddOns.map((a) => a.name).join(', ')}
                    </span>
                  )}
                  {item.itemNotes && (
                    <span className="item-instructions">Note: {item.itemNotes}</span>
                  )}
                  <span className="item-rate-calc">
                    ₹{item.unitPrice.toFixed(0)} × {item.quantity} = ₹{item.lineTotal.toFixed(0)}
                  </span>
                </div>

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
                  >
                    ✕
                  </button>
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

        {/* Calculations */}
        <div className="billing-calc-box">
          <div className="calc-line">
            <span>Subtotal (Taxable)</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="calc-line discount">
              <span>Special Discount</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="calc-line">
            <span>GST (5% F&B)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="calc-line grand-payable">
            <span>Total Payable</span>
            <span className="total-payable-amount">₹{total.toFixed(2)}</span>
          </div>
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

        {/* Main Big Checkout Button */}
        <button
          type="button"
          className="retail-checkout-btn"
          onClick={onReviewOrder}
          disabled={items.length === 0}
        >
          {items.length === 0 ? (
            <span>Checkout (Select Items)</span>
          ) : runningOrderId ? (
            <span>✓ Review & Place Order (Add Items) • ₹{total.toFixed(2)}</span>
          ) : orderType === 'DINE_IN' ? (
            <span>🪑 Review & Place Order (Sit & Dine) • ₹{total.toFixed(2)}</span>
          ) : (
            <span>⚡ Review & Place Order (Pay First) • ₹{total.toFixed(2)}</span>
          )}
        </button>
      </div>
    </aside>
  );
};
