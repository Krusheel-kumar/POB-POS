import React, { useState } from 'react';
import {
  Truck,
  PackagePlus,
  Send,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Store,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { StockTransferStatus } from '../../../types/inventory';

export const StockTransferView: React.FC = () => {
  const {
    rawMaterials,
    transfers,
    createStockIndent,
    dispatchStockTransfer,
    receiveStockTransfer,
  } = useInventoryStore();

  const [activeSubtab, setActiveSubtab] = useState<'request' | 'inbound'>('inbound');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Requesting Stock Indent
  const [requestedBy, setRequestedBy] = useState('Rahul Sharma (Branch Manager)');
  const [indentNotes, setIndentNotes] = useState('');
  const [indentItems, setIndentItems] = useState<{ rawMaterialId: string; requestedQty: number }[]>([
    { rawMaterialId: 'raw-001', requestedQty: 10000 }, // 10 KG Boba
    { rawMaterialId: 'raw-002', requestedQty: 25000 }, // 25 Liters Milk
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddItemToIndent = () => {
    const available = rawMaterials.find((m) => !indentItems.some((i) => i.rawMaterialId === m.id));
    if (available) {
      setIndentItems([...indentItems, { rawMaterialId: available.id, requestedQty: 5000 }]);
    }
  };

  const handleRemoveIndentItem = (idx: number) => {
    setIndentItems(indentItems.filter((_, i) => i !== idx));
  };

  const handleUpdateIndentItem = (idx: number, field: string, value: unknown) => {
    const updated = [...indentItems];
    if (field === 'rawMaterialId') {
      updated[idx].rawMaterialId = value as string;
    } else if (field === 'requestedQty') {
      updated[idx].requestedQty = parseFloat(value as string) || 0;
    }
    setIndentItems(updated);
  };

  const handleSubmitIndent = (e: React.FormEvent) => {
    e.preventDefault();
    if (indentItems.length === 0) return;
    const newTrf = createStockIndent(requestedBy, indentItems, indentNotes);
    showToast(`Stock Indent ${newTrf.transferNumber} created successfully (Status: PENDING)`);
    setActiveSubtab('inbound');
    setIndentNotes('');
  };

  const handleDispatch = (transferId: string, trfNum: string) => {
    dispatchStockTransfer(transferId, 'Vikram Patel (Warehouse Admin)');
    showToast(`Shipment ${trfNum} approved & dispatched! Stock deducted from Central Warehouse.`);
  };

  const handleReceive = (transferId: string, trfNum: string) => {
    receiveStockTransfer(transferId, 'Rahul Sharma (Branch Manager)');
    showToast(`GRN generated for ${trfNum}! Stock added to Branch Inventory.`);
  };

  const getStatusBadge = (status: StockTransferStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="status-badge pending">
            <Clock size={12} /> Pending Approval
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="status-badge in_transit">
            <Truck size={12} /> In Transit
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="status-badge received">
            <CheckCircle2 size={12} /> Received & GRN
          </span>
        );
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="inv-card">
      {toastMessage && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="inv-card-header">
        <div>
          <h3 className="inv-card-title">
            <Truck size={20} color="#0284c7" />
            Central Warehouse Stock Transfer & GRN Pipeline
          </h3>
          <p className="inv-card-subtitle">
            Replenish raw materials from Central Kitchen Commissary down to branch inventory with audited state progression
          </p>
        </div>
      </div>

      {/* Subtab Switcher */}
      <div className="transfer-subtabs">
        <button
          type="button"
          className={`transfer-subtab-btn ${activeSubtab === 'inbound' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('inbound')}
        >
          <Truck size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Inbound Shipments & Pipeline ({transfers.length})
        </button>
        <button
          type="button"
          className={`transfer-subtab-btn ${activeSubtab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveSubtab('request')}
        >
          <PackagePlus size={14} style={{ display: 'inline', marginRight: '4px' }} />
          Request Stock (New Indent)
        </button>
      </div>

      {/* VIEW 1: INBOUND SHIPMENTS & WAREHOUSE STATE MACHINE */}
      {activeSubtab === 'inbound' && (
        <div className="inv-table-wrapper">
          <table className="inv-data-table">
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Routing Route</th>
                <th>Requested Materials</th>
                <th>Status</th>
                <th>Timeline & Authorization</th>
                <th>State Machine Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.map((trf) => (
                <tr key={trf.id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{trf.transferNumber}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{trf.notes || 'Routine restock'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}>
                      <Building2 size={14} color="#64748b" />
                      <span style={{ fontWeight: 600 }}>Central Commissary</span>
                      <ArrowRight size={14} color="#94a3b8" />
                      <Store size={14} color="#0284c7" />
                      <span style={{ fontWeight: 600, color: '#0284c7' }}>Branch (Jubilee Hills)</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8125rem' }}>
                      {trf.items.map((item, idx) => {
                        const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
                        return (
                          <div key={idx} style={{ color: '#334155' }}>
                            • <strong>{item.requestedQty} {item.uom}</strong> {mat?.name}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td>{getStatusBadge(trf.status)}</td>
                  <td>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                      <div>Req: {trf.requestedBy} ({trf.requestedAt})</div>
                      {trf.dispatchedBy && <div style={{ color: '#0369a1' }}>Dispatched by {trf.dispatchedBy}</div>}
                      {trf.receivedBy && <div style={{ color: '#15803d' }}>Received by {trf.receivedBy}</div>}
                    </div>
                  </td>
                  <td>
                    {trf.status === 'PENDING' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleDispatch(trf.id, trf.transferNumber)}
                        style={{
                          background: '#0284c7',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Send size={13} /> Approve & Dispatch
                      </button>
                    )}

                    {trf.status === 'IN_TRANSIT' && (
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => handleReceive(trf.id, trf.transferNumber)}
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <ShieldCheck size={14} /> Receive & Generate GRN
                      </button>
                    )}

                    {trf.status === 'RECEIVED' && (
                      <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                        ✓ Inventory Added to Branch
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: REQUEST STOCK (STOCK INDENT FORM) */}
      {activeSubtab === 'request' && (
        <form onSubmit={handleSubmitIndent} style={{ maxWidth: '750px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Requesting Manager Name
              </label>
              <input
                type="text"
                className="inv-input"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Dispatch Route
              </label>
              <input
                type="text"
                className="inv-input"
                value="Central Warehouse ➔ Jubilee Hills Flagship"
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                Requested Raw Materials & Quantities
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItemToIndent}
                style={{ fontSize: '0.75rem', fontWeight: 600 }}
              >
                + Add Another Material
              </button>
            </div>

            {indentItems.map((item, idx) => {
              const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
              return (
                <div
                  key={idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr auto',
                    gap: '0.5rem',
                    alignItems: 'center',
                    marginBottom: '0.5rem',
                  }}
                >
                  <select
                    className="inv-select"
                    value={item.rawMaterialId}
                    onChange={(e) => handleUpdateIndentItem(idx, 'rawMaterialId', e.target.value)}
                  >
                    {rawMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Warehouse: {(m.warehouseStock / m.conversionFactor).toFixed(1)} {m.purchaseUom})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    className="inv-input"
                    value={item.requestedQty}
                    onChange={(e) => handleUpdateIndentItem(idx, 'requestedQty', e.target.value)}
                    placeholder="Quantity"
                    required
                  />

                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569' }}>
                    {mat?.consumptionUom} ({((item.requestedQty || 0) / (mat?.conversionFactor || 1000)).toFixed(2)} {mat?.purchaseUom})
                  </span>

                  <button
                    type="button"
                    onClick={() => handleRemoveIndentItem(idx)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Indent Reason / Special Delivery Instructions
            </label>
            <input
              type="text"
              className="inv-input"
              placeholder="e.g. Weekend evening boba rush preparation"
              value={indentNotes}
              onChange={(e) => setIndentNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Send size={16} /> Submit Stock Indent to Central Warehouse
          </button>
        </form>
      )}
    </div>
  );
};
