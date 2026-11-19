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
  onChangeTable?: () => void;
  onPrintBill?: () => void;
  onPrintKot?: () => void;
  isKotSent?: boolean;
  isSubmitting?: boolean;
  onQuickSettle?: (method: PaymentMethod, autoPrint: boolean) => Promise<void>;
  onRequireManagerVoid?: (item: {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
  }) => void;
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
  onQuickSettle,
  selectedTableNumber,
  runningOrderId,
  onCancelRunningOrder,
  onChangeTable,
  onPrintBill,
  onPrintKot,
  isKotSent = false,
  isSubmitting = false,
  onRequireManagerVoid,
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

  // Estimates & GST Tax Calculations
  const estimatedSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = backendCalculation?.subtotal ?? estimatedSubtotal;
  const discount = backendCalculation?.discountAmount ?? 0;
  const taxableAmount = backendCalculation?.taxableAmount ?? (subtotal - discount);
  const cgst = backendCalculation?.cgstAmount ?? Number((taxableAmount * 0.025).toFixed(2));
  const sgst = backendCalculation?.sgstAmount ?? Number((taxableAmount * 0.025).toFixed(2));
  const tax = backendCalculation?.taxAmount ?? Number((cgst + sgst).toFixed(2));
  const rawTotal = Number((taxableAmount + tax).toFixed(2));
  const total = backendCalculation?.totalAmount ?? Math.round(rawTotal);
  const roundOff = backendCalculation?.roundOffAmount ?? Number((total - rawTotal).toFixed(2));

  // Strict KOT item removal / reduction guard (Anti-Fraud Manager Approval)
  const isLocked = isKotSent || Boolean(runningOrderId);

  const handleItemMinus = (item: CartItem) => {
    if (isLocked && onRequireManagerVoid) {
      onRequireManagerVoid({
        id: item.id,
        name: item.product.name,
        quantity: 1,
        unitPrice: item.unitPrice,
      });
      return;
    }
    onUpdateQuantity(item.id, -1);
  };

  const handleItemDelete = (item: CartItem) => {
    if (isLocked && onRequireManagerVoid) {
      onRequireManagerVoid({
        id: item.id,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
      return;
    }
    onRemoveItem(item.id);
  };

  const handleCartClear = () => {
    if (isLocked && items.length > 0 && onRequireManagerVoid) {
      onRequireManagerVoid({
        id: 'cart-all',
        name: `All Dispatched Items (${items.length} dishes)`,
        quantity: items.reduce((sum, i) => sum + i.quantity, 0),
        unitPrice: estimatedSubtotal,
      });
      return;
    }
    onClearCart();
  };

  return (
    <aside className="retail-cart-panel" aria-label="Current Order Cart">
      {/* Top Header */}
      <div className="retail-cart-header">
        <div className="cart-header-top">
          <div className="cart-header-title">
            <span className="cart-icon">🧾</span>
            <strong>
              {orderType === 'DINE_IN'
                ? (selectedTableNumber ? `Table ${selectedTableNumber}` : 'Select Table')
                : 'Counter Bill'}
            </strong>
            <span className="counter-status-pill">
              {orderType === 'DINE_IN'
                ? (selectedTableNumber ? '● Table Active' : '● No Table')
                : '● Counter #01'}
            </span>
            {orderType === 'DINE_IN' && onChangeTable && (
              <button
                type="button"
                className="cart-change-table-pill-btn"
                onClick={onChangeTable}
                title="Change or reassign table"
              >
                ⇄ {selectedTableNumber ? 'Change Table' : 'Pick Table'}
              </button>
            )}
            {isLocked && (
              <span className="kot-locked-indicator" title="KOT Dispatched to Kitchen. Modifying items requires Manager PIN.">
                🔒 KOT Active
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button type="button" className="cart-clear-btn" onClick={handleCartClear}>
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
              onClick={() => {
                if (type === 'DINE_IN' && orderType === 'DINE_IN' && onChangeTable) {
                  onChangeTable();
                } else {
                  onOrderTypeChange(type);
                }
              }}
              title={type === 'DINE_IN' && orderType === 'DINE_IN' ? 'Click to change or select table' : undefined}
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
          orderType === 'DINE_IN' && !selectedTableNumber ? (
            <div className="retail-empty-state">
              <div className="empty-bag-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <span>🪑</span>
              </div>
              <h4 className="empty-state-title">No Table Selected</h4>
              <p className="empty-state-sub">
                Please select an available table from the floor layout on the left to start this Dine-In order.
              </p>
              {onChangeTable && (
                <button
                  type="button"
                  className="cart-change-table-pill-btn"
                  onClick={onChangeTable}
                  style={{ marginTop: '10px', padding: '7px 16px', fontSize: '0.85rem' }}
                >
                  🪑 View Tables Floor Plan
                </button>
              )}
            </div>
          ) : (
            <div className="retail-empty-state">
              <div className="empty-bag-circle">
                <span>🛍️</span>
              </div>
              <h4 className="empty-state-title">Your cart is empty.</h4>
              <p className="empty-state-sub">
                Tap menu items on the catalog to add to this order
              </p>
            </div>
          )
        ) : (
          <div className="retail-items-list">
            {items.map((item) => (
              <div key={item.id} className="retail-item-row">
                <div className="item-details">
                  <div className="item-title-row">
                    <span className="item-name">
                      {item.product.name}
                      {isLocked && (
                        <span className="cart-badge-locked" title="Dispatched to Kitchen. Modifying requires Manager PIN.">
                          🔒 Sent
                        </span>
                      )}
                    </span>
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
                        onClick={() => handleItemMinus(item)}
                        aria-label={`Decrease ${item.product.name} quantity`}
                        title={isLocked ? 'Strict KOT: Manager PIN required to reduce quantity' : undefined}
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
                        onClick={() => handleItemDelete(item)}
                        aria-label={`Remove ${item.product.name} from cart`}
                        title={isLocked ? 'Strict KOT: Manager PIN required to void item' : 'Remove item'}
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

        {/* Calculations Summary Card - Clear GST & Tax Breakdown */}
        <div className="billing-calc-card expanded">
          <div className="calc-breakdown-row" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px dashed #cbd5e1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>Items Subtotal (Taxable):</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#16a34a' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: 600 }}>-₹{discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>CGST (2.5%):</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{cgst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
              <span>SGST (2.5%):</span>
              <span style={{ fontWeight: 600, color: '#1e293b' }}>₹{sgst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>
              <span>Total GST (5%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            {roundOff !== 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#64748b' }}>
                <span>Round Off:</span>
                <span style={{ fontWeight: 600, color: roundOff > 0 ? '#16a34a' : '#475569' }}>
                  {roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}
                </span>
              </div>
            )}
          </div>

          {/* Main Total Row (Always Visible) */}
          <div className="calc-total-row">
            <div className="total-label-wrap">
              <span className="total-label">Total Payable</span>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>
                Includes ₹{tax.toFixed(2)} GST{roundOff !== 0 ? ` (Round Off: ${roundOff > 0 ? '+' : ''}₹${roundOff.toFixed(2)})` : ''}
              </span>
            </div>
            <span className="total-amount">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {orderType === 'DINE_IN' ? (
          /* ====================================================
             DINE-IN ORDER ACTIONS: Primary KOT Fire + Settle Check
             ==================================================== */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
            {/* 1. Primary Action: Fire KOT directly to Kitchen */}
            <button
              type="button"
              className="retail-checkout-btn"
              style={{
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                fontWeight: 700,
                fontSize: '0.98rem',
                height: '46px',
              }}
              onClick={onPrintKot || onReviewOrder}
              disabled={isSubmitting || items.length === 0}
              title="Dispatch Kitchen Order Ticket (KOT) to Kitchen Printer / KDS"
            >
              {isSubmitting ? (
                <span>👨‍🍳 Sending to Kitchen...</span>
              ) : items.length === 0 ? (
                <span>👨‍🍳 Send KOT (Add Items)</span>
              ) : Boolean(runningOrderId) ? (
                <span>
                  👨‍🍳 Send Add-on KOT to Kitchen • {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              ) : (
                <span>
                  👨‍🍳 Send KOT to Kitchen • {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              )}
            </button>

            {/* 2. Secondary Settle / Bill Option (When customer is ready for check) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary-tool"
                style={{
                  flex: 1,
                  padding: '9px 10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  background: '#fef3c7',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                }}
                onClick={onPrintBill || onReviewOrder}
                disabled={isSubmitting || items.length === 0}
                title="Print Tax Invoice / Bill for Customer"
              >
                🖨️ Print Bill
              </button>

              <button
                type="button"
                className="btn-secondary-tool"
                style={{
                  flex: 1.2,
                  padding: '9px 10px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                }}
                onClick={onReviewOrder}
                disabled={isSubmitting || items.length === 0}
              >
                📋 Review & Place Order
              </button>
            </div>
          </div>
        ) : (
          /* ====================================================
             COUNTER & TAKEAWAY: Fast Pay First Flow
             ==================================================== */
          <>
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

            {/* Secondary Print Actions */}
            <div className="cart-secondary-actions">
              <button
                type="button"
                className="btn-secondary-tool"
                onClick={onPrintKot || onReviewOrder}
                title="Send ticket to kitchen"
              >
                👨‍🍳 Kitchen KOT
              </button>
              <button
                type="button"
                className="btn-secondary-tool"
                onClick={onPrintBill || onReviewOrder}
                title="Print Bill Receipt"
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
              <span className="auto-print-status">
                {typeof window !== 'undefined' && window.electronAPI?.isElectron
                  ? '⚡ Instant Silent Print'
                  : '⚡ Auto-Print Enabled'}
              </span>
            </div>

            {/* Main Checkout Button Group */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {onQuickSettle && items.length > 0 ? (
                <button
                  type="button"
                  className="retail-checkout-btn"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                  onClick={() => onQuickSettle(selectedPaymentMethod, autoPrint)}
                  disabled={isSubmitting || items.length === 0}
                >
                  {isSubmitting ? (
                    <span>⚡ Processing Settle & Bill...</span>
                  ) : (
                    <span>
                      ⚡ Settle & Bill • ₹{total.toFixed(2)} ({selectedPaymentMethod})
                    </span>
                  )}
                </button>
              ) : null}

              <button
                type="button"
                className="retail-checkout-btn"
                style={{
                  background: onQuickSettle && items.length > 0 ? '#f8fafc' : undefined,
                  color: onQuickSettle && items.length > 0 ? '#334155' : undefined,
                  border: onQuickSettle && items.length > 0 ? '1px solid #cbd5e1' : undefined,
                }}
                onClick={onReviewOrder}
                disabled={isSubmitting || items.length === 0}
              >
                {items.length === 0 ? (
                  <span>Checkout (Select Items)</span>
                ) : (
                  <span>Review & Place Order • ₹{total.toFixed(2)}</span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
