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
  onSettleOrder?: () => void;
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
  onSettleOrder,
  isKotSent = false,
  isSubmitting = false,
  onRequireManagerVoid,
}) => {
  const [localCustomerName, setLocalCustomerName] = useState('');
  const [localCustomerPhone, setLocalCustomerPhone] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('UPI');
  const [autoPrint, setAutoPrint] = useState(true);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(false);

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
    const itemIsLocked = item.isDispatched ?? isLocked;
    if (itemIsLocked && onRequireManagerVoid) {
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
    const itemIsLocked = item.isDispatched ?? isLocked;
    if (itemIsLocked && onRequireManagerVoid) {
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
      {/* Top Clean Header */}
      <div className="retail-cart-header">
        <div className="cart-header-top">
          <div className="cart-header-title">
            {orderType === 'DINE_IN' ? (
              <>
                <span className="cart-header-table-name">
                  🪑 {selectedTableNumber ? `Table ${selectedTableNumber}` : 'Select Table'}
                </span>
                {runningOrderId && (
                  items.some((i) => !i.isDispatched) ? (
                    <>
                      <span className="cart-badge-addon-order" title="Drafting new add-on items for running check">
                        + Add-on
                      </span>
                      {onCancelRunningOrder && (
                        <button
                          type="button"
                          className="cart-cancel-addon-link"
                          onClick={onCancelRunningOrder}
                          title="Discard new items and keep existing check"
                        >
                          ✕ Discard
                        </button>
                      )}
                    </>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '2px 7px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        borderRadius: '5px',
                      }}
                      title="Active check running on table"
                    >
                      ● Running Check
                    </span>
                  )
                )}
                {onChangeTable && (
                  <button
                    type="button"
                    className="cart-change-table-pill-btn"
                    onClick={onChangeTable}
                    title="Change or reassign table"
                  >
                    ⇄ {selectedTableNumber ? 'Switch' : 'Pick'}
                  </button>
                )}
              </>
            ) : orderType === 'TAKEAWAY' ? (
              <span className="cart-header-table-name">🛍️ Takeaway</span>
            ) : (
              <span className="cart-header-table-name">⚡ Counter</span>
            )}

            {isLocked && items.length > 0 && (
              <span className="kot-locked-indicator" title="KOT Dispatched to Kitchen. Modifying items requires Manager PIN.">
                🔒 KOT Sent
              </span>
            )}
          </div>

          <div className="cart-header-right-actions">
            <span className="cart-meta-tag">#3332 • Cashier JD</span>
            {items.length > 0 && (
              <button
                type="button"
                className="cart-clear-btn"
                onClick={handleCartClear}
                title="Clear all cart items"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Customer Inputs Row */}
      <div className="customer-compact-card">
        <div className="customer-compact-input-group">
          <span className="customer-compact-icon">👤</span>
          <input
            type="text"
            placeholder="Customer Name"
            value={activeCustomerName}
            onChange={(e) => handleNameChange(e.target.value)}
            className="customer-compact-input"
            aria-label="Customer Name"
          />
        </div>
        <div className="customer-compact-input-group">
          <span className="customer-compact-icon">📱</span>
          <span className="customer-compact-prefix">+91</span>
          <input
            type="tel"
            maxLength={10}
            placeholder="Mobile (10 digits)"
            value={activeCustomerPhone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className="customer-compact-input"
            aria-label="Customer Mobile"
          />
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

      {/* Cart Items Area */}
      <div className="retail-cart-body">
        {items.length === 0 ? (
          orderType === 'DINE_IN' && !selectedTableNumber ? (
            <div className="retail-empty-state">
              <div className="empty-bag-circle" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <span>🪑</span>
              </div>
              <h4 className="empty-state-title">Select Table</h4>
              <p className="empty-state-sub">
                Choose an available dining table to start this order.
              </p>
              {onChangeTable && (
                <button
                  type="button"
                  className="cart-change-table-pill-btn"
                  onClick={onChangeTable}
                  style={{ marginTop: '10px', padding: '7px 16px', fontSize: '0.85rem' }}
                >
                  🪑 Choose Table
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
                {orderType === 'DINE_IN' && selectedTableNumber
                  ? `Tap menu items to add to Table ${selectedTableNumber}`
                  : 'Tap menu items on the catalog to add to this order'}
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
                      {item.isDispatched ? (
                        <span className="cart-badge-locked" title="Dispatched to Kitchen. Modifying requires Manager PIN.">
                          🔒 Sent
                        </span>
                      ) : runningOrderId ? (
                        <span className="cart-badge-new-addon" title="New add-on item. Ready to send to kitchen.">
                          + New
                        </span>
                      ) : null}
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

        {/* Calculations Summary Card - Collapsible GST & Tax Breakdown */}
        <div className={`billing-calc-card ${isBreakdownExpanded ? 'expanded' : 'collapsed'}`}>
          {isBreakdownExpanded && (
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
          )}

          {/* Main Total Row (Always Visible with Direction Chevron) */}
          <div
            className="calc-total-row"
            onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
            title={isBreakdownExpanded ? 'Click to minimize tax breakdown' : 'Click to view GST breakdown'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
          >
            <div className="total-label-wrap">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="total-label">Total Payable</span>
                <span className="calc-toggle-pill">
                  {isBreakdownExpanded ? '▲ Hide' : '▼ Details'}
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '1px' }}>
                Incl. ₹{tax.toFixed(2)} GST{roundOff !== 0 ? ` (Round Off: ${roundOff > 0 ? '+' : ''}₹${roundOff.toFixed(2)})` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="total-amount">₹{total.toFixed(2)}</span>
              <span className="calc-direction-arrow">{isBreakdownExpanded ? '▲' : '▼'}</span>
            </div>
          </div>
        </div>

        {orderType === 'DINE_IN' ? (
          /* ====================================================
             DINE-IN ORDER ACTIONS: Context-Aware KOT & Billing
             ==================================================== */
          (() => {
            const totalItemCount = items.reduce((s, i) => s + i.quantity, 0);
            const totalItemText = totalItemCount === 1 ? '1 Item' : `${totalItemCount} Items`;
            const pendingItems = items.filter((i) => !i.isDispatched);
            const pendingCount = pendingItems.reduce((s, i) => s + i.quantity, 0);
            const pendingItemText = pendingCount === 1 ? '1 Item' : `${pendingCount} Items`;
            const hasPendingItems = pendingCount > 0;
            const isAllDispatchedRunning = Boolean(runningOrderId) && items.length > 0 && !hasPendingItems;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                {isAllDispatchedRunning ? (
                  /* State A: All Table Items Already Sent to Kitchen -> Primary Action is Print Bill / Settle */
                  <>
                    <div
                      style={{
                        padding: '6px 10px',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        color: '#15803d',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <span>✓ Kitchen is preparing all dishes</span>
                      <span style={{ color: '#16a34a' }}>• KOT Sent</span>
                    </div>

                    {/* 1. Primary Action: Settle Check & Collect Payment */}
                    <button
                      type="button"
                      className="retail-checkout-btn"
                      style={{
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: '#ffffff',
                        boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                        fontWeight: 800,
                        fontSize: '0.98rem',
                        height: '46px',
                      }}
                      onClick={onSettleOrder || onReviewOrder}
                      disabled={isSubmitting}
                      title="Open Payment Settlement Screen to collect Cash/UPI/Card and close check"
                    >
                      <span>💳 Settle & Collect Payment • ₹{total.toFixed(2)}</span>
                    </button>

                    {/* 2. Secondary Row: Print Bill for Guest & Reprint KOT */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary-tool"
                        style={{
                          flex: 1.2,
                          padding: '9px 10px',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                        }}
                        onClick={onPrintBill || onReviewOrder}
                        disabled={isSubmitting}
                        title="Print preliminary bill for customer to review before payment"
                      >
                        🖨️ Print Guest Bill
                      </button>

                      {onPrintKot && (
                        <button
                          type="button"
                          className="btn-secondary-tool"
                          style={{
                            flex: 0.8,
                            padding: '9px 10px',
                            fontWeight: 600,
                            fontSize: '0.78rem',
                            background: '#ffffff',
                            color: '#475569',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                          }}
                          onClick={onPrintKot}
                          disabled={isSubmitting}
                          title="Reprint duplicate KOT copy"
                        >
                          👨‍🍳 Reprint KOT
                        </button>
                      )}
                    </div>

                    {/* 3. 1-Tap Fast Settle Shortcuts */}
                    {onQuickSettle && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 8px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          marginTop: '2px',
                        }}
                      >
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>
                          1-Tap Settle:
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              padding: '5px 4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid #bbf7d0',
                              background: '#f0fdf4',
                              color: '#166534',
                              cursor: 'pointer',
                            }}
                            onClick={() => onQuickSettle('CASH', autoPrint)}
                            disabled={isSubmitting}
                            title="1-Tap Cash Settlement & Auto-Print Bill"
                          >
                            💵 Cash
                          </button>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              padding: '5px 4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid #e9d5ff',
                              background: '#faf5ff',
                              color: '#6b21a8',
                              cursor: 'pointer',
                            }}
                            onClick={() => onQuickSettle('UPI', autoPrint)}
                            disabled={isSubmitting}
                            title="1-Tap UPI Settlement & Auto-Print Bill"
                          >
                            📱 UPI
                          </button>
                          <button
                            type="button"
                            style={{
                              flex: 1,
                              padding: '5px 4px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              color: '#1e40af',
                              cursor: 'pointer',
                            }}
                            onClick={() => onQuickSettle('CARD', autoPrint)}
                            disabled={isSubmitting}
                            title="1-Tap Card Settlement & Auto-Print Bill"
                          >
                            💳 Card
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* State B: New Items Ready to Send to Kitchen OR Empty Cart */
                  <>
                    <button
                      type="button"
                      className="retail-checkout-btn"
                      style={{
                        background:
                          items.length === 0
                            ? '#e2e8f0'
                            : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: items.length === 0 ? '#94a3b8' : '#ffffff',
                        boxShadow:
                          items.length === 0 ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.35)',
                        fontWeight: 700,
                        fontSize: '0.96rem',
                        height: '46px',
                        cursor: items.length === 0 ? 'not-allowed' : 'pointer',
                      }}
                      onClick={onPrintKot || onReviewOrder}
                      disabled={isSubmitting || items.length === 0}
                      title="Dispatch Kitchen Order Ticket (KOT) to Kitchen"
                    >
                      {isSubmitting ? (
                        <span>👨‍🍳 Sending to Kitchen...</span>
                      ) : items.length === 0 ? (
                        <span>🍽️ Add items to send KOT</span>
                      ) : Boolean(runningOrderId) ? (
                        <span>👨‍🍳 Send Add-on KOT to Kitchen • {pendingItemText}</span>
                      ) : (
                        <span>👨‍🍳 Send KOT to Kitchen • {totalItemText}</span>
                      )}
                    </button>

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
                  </>
                )}
              </div>
            );
          })()
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
