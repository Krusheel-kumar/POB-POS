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
  onSwitchOrderType?: (type: 'TAKEAWAY' | 'COUNTER') => void;
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
  onCreateTable,
  onDeleteTable,
  onUpdateTableStatus,
  onRefresh,
  isInlineMode = false,
  onCancelSelectTable,
  onSwitchOrderType,
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

  return (
    <div
      className="table-management-container"
      style={{ padding: isInlineMode ? '14px 18px' : '18px' }}
    >
      {/* Header Bar */}
      <div className="table-header-bar">
        <div>
          <h2
            className="table-header-title"
            style={{ fontSize: isInlineMode ? '1.2rem' : '1.35rem' }}
          >
            <span>🪑</span> {isInlineMode ? 'Dine-In Table Selection' : 'Table Floor Plan'}
          </h2>
          <p className="table-header-sub">
            {isInlineMode
              ? 'Tap any table tile to start an order or manage running checks.'
              : 'Live square grid of dining tables, active checks, and floor layout.'}
          </p>
        </div>

        <div className="table-header-actions">
          {onSwitchOrderType && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className="table-btn-refresh"
                style={{ background: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => onSwitchOrderType('TAKEAWAY')}
                title="Switch to Takeaway order mode"
              >
                <span>🛍️</span> Takeaway
              </button>
              <button
                type="button"
                className="table-btn-refresh"
                style={{ background: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => onSwitchOrderType('COUNTER')}
                title="Switch to Counter Fast-Pay mode"
              >
                <span>⚡</span> Counter
              </button>
            </div>
          )}
          {onCancelSelectTable && (
            <button
              type="button"
              className="table-btn-back"
              onClick={onCancelSelectTable}
              title="Return to active menu catalog"
            >
              ← Menu
            </button>
          )}
          <button
            type="button"
            className="table-btn-refresh"
            onClick={onRefresh}
            title="Refresh tables"
          >
            ↻
          </button>
          <button
            type="button"
            className="table-btn-add"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? '✕' : '+ Table'}
          </button>
        </div>
      </div>

      {/* Add Table Form */}
      {isAdding && (
        <form onSubmit={handleCreate} className="table-create-form">
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '3px', color: '#334155' }}>
              Table # (e.g. T1 or 5)
            </label>
            <input
              type="text"
              placeholder="e.g. T9"
              value={newTableNum}
              onChange={(e) => setNewTableNum(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '120px' }}
              autoFocus
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '3px', color: '#334155' }}>
              Seats
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '80px' }}
            />
          </div>

          <button
            type="submit"
            style={{ padding: '7px 16px', background: '#2563eb', color: '#fff', borderRadius: '6px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
          >
            Save
          </button>
        </form>
      )}

      {errorMsg && (
        <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '12px', fontSize: '0.82rem', fontWeight: 600 }}>
          ⚠ {errorMsg}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="table-filter-bar">
        {['ALL', 'AVAILABLE', 'OCCUPIED', 'BILL_REQUESTED'].map((f) => {
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
              {f === 'BILL_REQUESTED' ? 'BILLED' : f} ({count})
            </button>
          );
        })}
      </div>

      {/* Modern Compact Square Cards Grid */}
      <div className="table-cards-grid">
        {filteredTables.map((tbl) => {
          const isSelected = selectedTableId === tbl.id;
          const isCartActiveOnThisTable =
            activeCartTableId === tbl.id && Boolean(activeCartItems && activeCartItems.length > 0);

          // 1. Committed items from server/order
          const committedItems: RestaurantTableItem[] = tbl.items || [];

          // 2. Pending items in active cart for this table
          const pendingCartItems: RestaurantTableItem[] = isCartActiveOnThisTable
            ? activeCartItems.map((ci) => ({
                name: ci.product.name,
                variant: ci.selectedVariant?.name,
                quantity: ci.quantity,
                lineTotal: ci.lineTotal,
                isPending: true,
              }))
            : [];

          // 3. Combined items list & total
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

          // Dynamic Card Class
          let cardStatusClass = 'card-available';
          if (effectiveStatus === 'RUNNING' || effectiveStatus === 'OCCUPIED') cardStatusClass = 'card-occupied';
          else if (effectiveStatus === 'BILL_REQUESTED') cardStatusClass = 'card-billed';
          if (isSelected) cardStatusClass += ' card-selected';

          return (
            <div
              key={tbl.id}
              className={`pos-table-card ${cardStatusClass}`}
              title={`Table ${tbl.tableNumber}`}
            >
              {hasOrder ? (
                /* ================= OCCUPIED SQUARE TILE ================= */
                <div className="square-card-occupied-body">
                  {/* Top Bar: Table Number & Duration Timer */}
                  <div className="square-card-top">
                    <span className="square-table-id">
                      <span className="square-sr-prefix">Table {tbl.tableNumber}</span>
                      <span aria-hidden="true">{tbl.tableNumber}</span>
                    </span>
                    {tbl.durationMinutes !== undefined ? (
                      <span className="square-table-timer">⏱ {tbl.durationMinutes}m</span>
                    ) : (
                      <span className="square-table-dot occupied" />
                    )}
                  </div>

                  {/* Center: Large Bill Amount & Items Count */}
                  <div
                    className="square-card-center"
                    onClick={() => {
                      if (tbl.currentOrderId) {
                        onOpenRunningOrder(tbl.currentOrderId);
                      } else {
                        onSelectTable(tbl);
                      }
                    }}
                    title="Tap to view or add items"
                  >
                    <span className="square-bill-amount">₹{displayTotal.toFixed(0)}</span>
                    <span className="square-items-sub">
                      {allTableItems.length > 0
                        ? `${totalUnits} item${totalUnits > 1 ? 's' : ''}`
                        : 'Active Order'}
                    </span>
                  </div>

                  {/* Bottom: 2 Compact Action Buttons */}
                  <div className="square-card-actions">
                    <button
                      type="button"
                      className="square-btn-add"
                      onClick={() => {
                        if (tbl.currentOrderId) {
                          onOpenRunningOrder(tbl.currentOrderId);
                        } else {
                          onSelectTable(tbl);
                        }
                      }}
                      title="Add items to table"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      className="square-btn-bill"
                      onClick={() => {
                        if (tbl.currentOrderId) {
                          if (onCollectPayment) onCollectPayment(tbl.currentOrderId);
                          else if (onPrintBill) onPrintBill(tbl.currentOrderId);
                          else if (onGenerateBill) onGenerateBill(tbl.currentOrderId);
                        } else {
                          onSelectTable(tbl);
                        }
                      }}
                      title="Print bill & settle"
                    >
                      🧾 Bill
                    </button>
                  </div>
                </div>
              ) : (
                /* ================= AVAILABLE MINIMAL SQUARE TILE ================= */
                <div
                  className="square-card-available-body"
                  onClick={() => onSelectTable(tbl)}
                >
                  {/* Top Right: Status Dot & Delete Button on Hover */}
                  <div className="square-card-top">
                    <span className="square-table-dot available" />
                    {(tbl.status === 'AVAILABLE' || tbl.status === 'CLOSED') && (
                      <button
                        type="button"
                        className="square-delete-btn"
                        title="Delete Table"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Delete Table ${tbl.tableNumber}?`)) {
                            onDeleteTable(tbl.id);
                          }
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Center: Table Identifier Only (e.g. T1, T2) */}
                  <div className="square-card-center-empty">
                    <span className="square-table-num-large">
                      <span className="square-sr-prefix">Table {tbl.tableNumber}</span>
                      <span aria-hidden="true">{tbl.tableNumber}</span>
                    </span>
                  </div>

                  {/* Bottom: + Order Pill */}
                  <div className="square-card-bottom-pill">
                    <span>+ Order</span>
                  </div>
                </div>
              )}

              {tbl.status === 'PAID_CLEARING' && (
                <button
                  type="button"
                  className="square-btn-clear"
                  onClick={() => onUpdateTableStatus(tbl.id, 'AVAILABLE')}
                >
                  Clear
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
