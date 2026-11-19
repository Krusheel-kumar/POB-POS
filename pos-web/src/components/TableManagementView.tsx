import React, { useState } from 'react';
import type { RestaurantTable, TableStatus, CartItem, RestaurantTableItem } from '../types/pos';
import './TableManagementView.css';

interface TableManagementViewProps {
  tables: RestaurantTable[];
  selectedTableId: string | null;
  activeCartTableId?: string | null;
  activeCartItems?: CartItem[];
  activeCartTotal?: number;
  onSelectTable: (table: RestaurantTable) => void;
  onOpenRunningOrder: (orderId: string) => void;
  onCollectPayment?: (orderId: string) => void;
  onGenerateBill?: (orderId: string) => void;
  onPrintBill?: (orderId: string) => void;
  onPrintKot?: (orderId: string) => void;
  onCreateTable: (tableNumber: string, capacity: number) => Promise<void>;
  onDeleteTable: (tableId: string) => Promise<void>;
  onUpdateTableStatus: (tableId: string, status: TableStatus, reason?: string) => Promise<void>;
  onRefresh: () => void;
  isInlineMode?: boolean;
  onCancelSelectTable?: () => void;
}

export const TableManagementView: React.FC<TableManagementViewProps> = ({
  tables,
  selectedTableId,
  activeCartTableId,
  activeCartItems = [],
  activeCartTotal = 0,
  onSelectTable,
  onOpenRunningOrder,
  onCollectPayment,
  onGenerateBill,
  onPrintBill,
  onPrintKot,
  onCreateTable,
  onDeleteTable,
  onUpdateTableStatus,
  onRefresh,
  isInlineMode = false,
  onCancelSelectTable,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newCapacity, setNewCapacity] = useState('4');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum.trim()) {
      setErrorMsg('Table number is required');
      return;
    }

    try {
      setErrorMsg(null);
      await onCreateTable(newTableNum.trim(), Number(newCapacity) || 4);
      setNewTableNum('');
      setIsAdding(false);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create table');
    }
  };

  const filteredTables = tables.filter((t) => {
    if (selectedStatusFilter === 'ALL') return true;
    if (selectedStatusFilter === 'OCCUPIED' || selectedStatusFilter === 'RUNNING') {
      return t.status === 'RUNNING' || t.status === 'OCCUPIED';
    }
    return t.status === selectedStatusFilter;
  });

  const getStatusBadge = (status: TableStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return { label: 'Available', bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'RUNNING':
      case 'OCCUPIED':
        return { label: 'Occupied', bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
      case 'BILL_REQUESTED':
        return { label: 'Bill Issued', bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
      case 'PAYMENT_DUE':
        return { label: 'Payment Due', bg: '#fef2f2', color: '#dc2626', border: '#fecaca' };
      case 'PAID_CLEARING':
        return { label: 'Paid / Clearing', bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' };
      case 'CLOSED':
        return { label: 'Closed', bg: '#f8fafc', color: '#64748b', border: '#cbd5e1' };
      default:
        return { label: status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
    }
  };

  return (
    <div
      className="table-management-container"
      style={{ padding: isInlineMode ? '16px 20px' : '20px' }}
    >
      {/* Header Bar */}
      <div className="table-header-bar">
        <div>
          <h2
            className="table-header-title"
            style={{ fontSize: isInlineMode ? '1.25rem' : '1.4rem' }}
          >
            <span>🪑</span> {isInlineMode ? 'Dine-In Table Selection' : 'Table Overview & Running Orders'}
          </h2>
          <p className="table-header-sub">
            {isInlineMode
              ? 'Tap any table card to open menu, view live items, or add items to an active order.'
              : 'Live status of dining tables, active ticket durations, ordered items, and outstanding balances.'}
          </p>
        </div>

        <div className="table-header-actions">
          {onCancelSelectTable && (
            <button
              type="button"
              className="table-btn-back"
              onClick={onCancelSelectTable}
              title="Return to active menu catalog"
            >
              ← Back to Menu
            </button>
          )}
          <button
            type="button"
            className="table-btn-refresh"
            onClick={onRefresh}
            title="Refresh table list from server"
          >
            ↻ Refresh
          </button>
          <button
            type="button"
            className="table-btn-add"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? '✕ Cancel' : '➕ Add Table'}
          </button>
        </div>
      </div>

      {/* Add Table Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="table-create-form">
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
              Table Number / Label
            </label>
            <input
              type="text"
              placeholder="e.g. 7 or Patio-2"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '160px' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px', color: '#334155' }}>
              Seating Capacity
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '100px' }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: '8px 18px', background: '#2563eb', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Save Table
          </button>
        </form>
      )}

      {errorMsg && (
        <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', fontWeight: 600 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="table-filter-bar">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED', 'CLOSED'].map((f) => {
          const isActive =
            selectedStatusFilter === f ||
            (f === 'OCCUPIED' && selectedStatusFilter === 'RUNNING');
          const count = tables.filter((t) => {
            if (f === 'ALL') return true;
            if (f === 'OCCUPIED') return t.status === 'RUNNING' || t.status === 'OCCUPIED';
            return t.status === f;
          }).length;

          return (
            <button
              key={f}
              type="button"
              className={`table-filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedStatusFilter(f)}
            >
              {f.replace('_', ' ')} ({count})
            </button>
          );
        })}
      </div>

      {/* Table Cards Grid */}
      <div className="table-cards-grid">
        {filteredTables.map((tbl) => {
          const isSelected = selectedTableId === tbl.id;
          const isCartActiveOnThisTable =
            activeCartTableId === tbl.id && Boolean(activeCartItems && activeCartItems.length > 0);

          // 1. Committed items from server/order
          const committedItems: RestaurantTableItem[] = tbl.items || [];

          // 2. Pending items being staged in active POS cart for this table
          const pendingCartItems: RestaurantTableItem[] = isCartActiveOnThisTable
            ? activeCartItems.map((ci) => ({
                name: ci.product.name,
                variant: ci.selectedVariant?.name,
                quantity: ci.quantity,
                lineTotal: ci.lineTotal,
                isPending: true,
              }))
            : [];

          // 3. Combined items list
          const allTableItems: RestaurantTableItem[] = [...committedItems, ...pendingCartItems];
          const totalUnits = allTableItems.reduce((sum, it) => sum + it.quantity, 0);

          // 4. Real-time Bill Amount Calculation
          const committedTotal = tbl.currentTotal || 0;
          const pendingTotal = isCartActiveOnThisTable ? activeCartTotal : 0;
          const displayTotal = committedTotal + pendingTotal;

          const hasOrder = Boolean(tbl.currentOrderId) || isCartActiveOnThisTable || allTableItems.length > 0;
          const effectiveStatus: TableStatus =
            isCartActiveOnThisTable && tbl.status === 'AVAILABLE'
              ? 'OCCUPIED'
              : tbl.status;
          const badge = getStatusBadge(effectiveStatus);

          // Dynamic Card Class
          let cardStatusClass = 'card-available';
          if (effectiveStatus === 'RUNNING' || effectiveStatus === 'OCCUPIED') cardStatusClass = 'card-occupied';
          else if (effectiveStatus === 'BILL_REQUESTED') cardStatusClass = 'card-billed';
          if (isSelected) cardStatusClass += ' card-selected';

          return (
            <div key={tbl.id} className={`pos-table-card ${cardStatusClass}`}>
              {/* Entire upper body is 1-tap clickable */}
              <div
                className="table-card-clickable"
                onClick={() => {
                  if (tbl.currentOrderId) {
                    onOpenRunningOrder(tbl.currentOrderId);
                  } else {
                    onSelectTable(tbl);
                  }
                }}
                title={
                  hasOrder
                    ? `Table ${tbl.tableNumber}: Tap to open menu & add items`
                    : `Table ${tbl.tableNumber}: Tap to select table & start order`
                }
              >
                {/* Header: Table Number, Seats & Status Badge */}
                <div className="table-card-header">
                  <div className="table-card-title-group">
                    <h3 className="table-card-num">Table {tbl.tableNumber}</h3>
                    <span className="table-card-meta">
                      👥 {tbl.capacity} seats {tbl.name ? `• ${tbl.name}` : ''}
                    </span>
                  </div>
                  <span
                    className="table-status-pill"
                    style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
                  >
                    <span className="status-dot" />
                    {isCartActiveOnThisTable ? 'In Cart' : badge.label}
                  </span>
                </div>

                {/* Hero Bill Amount Block (High-Brand Minimal Display) */}
                {hasOrder ? (
                  <div className="table-card-bill-hero">
                    <div className="bill-hero-top">
                      <span className="bill-hero-label">BILL TOTAL</span>
                      <span className="bill-hero-ticket">
                        {tbl.orderNumber || (isCartActiveOnThisTable ? 'Draft Cart' : 'Active Ticket')}
                      </span>
                    </div>

                    <div className="bill-hero-amount-row">
                      <span className="bill-hero-amount">₹{displayTotal.toFixed(2)}</span>
                      {tbl.durationMinutes !== undefined && (
                        <span className="bill-hero-timer">⏱ {tbl.durationMinutes}m</span>
                      )}
                    </div>

                    {isCartActiveOnThisTable && (
                      <div className="bill-hero-pending-alert">
                        <span>⚡ New In Cart (+{pendingCartItems.length} items)</span>
                        <span>+₹{pendingTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="table-card-available-block">
                    <span>●</span> Table Available • Tap to open menu
                  </div>
                )}

                {/* Itemized Items Section (What items are on this table) */}
                {allTableItems.length > 0 && (
                  <div className="table-card-items-section">
                    <div className="items-section-header">
                      <span>Ordered Items ({allTableItems.length})</span>
                      <span className="items-section-count">{totalUnits} units</span>
                    </div>

                    <div className="table-card-items-list">
                      {allTableItems.map((item, idx) => (
                        <div key={idx} className="table-item-row">
                          <div className="item-left">
                            <span className="item-qty-pill">{item.quantity}×</span>
                            <span className="item-name-span">{item.name}</span>
                            {item.variant && (
                              <span className="item-variant-span">({item.variant})</span>
                            )}
                            {item.isPending && (
                              <span className="item-pending-badge">In Cart</span>
                            )}
                          </div>
                          {item.lineTotal != null && (
                            <span className="item-price-span">₹{item.lineTotal.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="table-card-actions">
                <button
                  type="button"
                  className={`btn-card-action ${isSelected ? 'btn-card-current' : 'btn-card-take'}`}
                  onClick={() => onSelectTable(tbl)}
                >
                  {isSelected ? '✓ In Menu' : 'Take Order'}
                </button>

                {hasOrder && (
                  <>
                    <button
                      type="button"
                      className="btn-card-action btn-card-add-items"
                      onClick={() => {
                        if (tbl.currentOrderId) {
                          onOpenRunningOrder(tbl.currentOrderId);
                        } else {
                          onSelectTable(tbl);
                        }
                      }}
                      title="Add more items to this table"
                    >
                      ➕ Add Items
                    </button>

                    {onPrintKot && tbl.currentOrderId && (
                      <button
                        type="button"
                        className="btn-card-action btn-card-kot"
                        onClick={() => onPrintKot(tbl.currentOrderId!)}
                        title="Print Kitchen Order Ticket (KOT)"
                      >
                        👨‍🍳 KOT
                      </button>
                    )}

                    {(onPrintBill || onGenerateBill) && tbl.currentOrderId && (
                      <button
                        type="button"
                        className="btn-card-action btn-card-bill"
                        onClick={() => {
                          if (onPrintBill) onPrintBill(tbl.currentOrderId!);
                          else if (onGenerateBill) onGenerateBill(tbl.currentOrderId!);
                        }}
                        title="Print Tax Invoice / Bill"
                      >
                        🧾 Bill
                      </button>
                    )}

                    {onCollectPayment && tbl.currentOrderId && (
                      <button
                        type="button"
                        className="btn-card-action btn-card-pay"
                        onClick={() => onCollectPayment(tbl.currentOrderId!)}
                        title="Collect Payment & Settle Table"
                      >
                        💳 Pay
                      </button>
                    )}
                  </>
                )}

                {tbl.status === 'PAID_CLEARING' && (
                  <button
                    type="button"
                    className="btn-card-action btn-card-pay"
                    onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE')}
                  >
                    Clear & Free
                  </button>
                )}

                {(tbl.status === 'AVAILABLE' || tbl.status === 'CLOSED') && !isCartActiveOnThisTable && (
                  <button
                    type="button"
                    className="btn-card-delete"
                    title="Delete Table"
                    onClick={() => {
                      if (window.confirm(`Delete Table ${tbl.tableNumber}?`)) {
                        onDeleteTable(tbl.id);
                      }
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
