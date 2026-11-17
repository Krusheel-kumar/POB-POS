import React, { useState } from 'react';
import {
  Store,
  ArrowRight,
  Send,
  Zap,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { VariantSize } from '../../../types/inventory';
import { CreateOutletModal } from '../CreateOutletModal';

export const MultiOutletComparisonView: React.FC = () => {
  const {
    outlets,
    rawMaterials,
    transferStockFromMaster,
    billOrderAtOutlet,
  } = useInventoryStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAddOutletModal, setShowAddOutletModal] = useState<boolean>(false);

  // Transfer Modal State
  const [transferModal, setTransferModal] = useState<{
    open: boolean;
    materialId: string;
    targetOutletId: string;
    qty: number;
  }>({
    open: false,
    materialId: 'raw-milk',
    targetOutletId: 'outlet-01',
    qty: 20000,
  });

  // Simulator State
  const [simOutletId, setSimOutletId] = useState<string>('outlet-01');
  const [simSize, setSimSize] = useState<VariantSize>('REGULAR');
  const [simQty, setSimQty] = useState<number>(2);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Simulate POS Billing
  const handleSimulateBilling = () => {
    const orderNumber = `BILL-${Math.floor(1000 + Math.random() * 9000)}`;
    billOrderAtOutlet(simOutletId, orderNumber, [
      {
        menuItemId: 'prod-02', // Authentic Boba Tea
        size: simSize,
        quantity: simQty,
      },
    ]);

    const targetOutlet = outlets.find((o) => o.id === simOutletId);
    showToast(
      `✓ Bill ${orderNumber} at ${targetOutlet?.name}: Deducted ${simQty}x Authentic Boba (${simSize}) from outlet stock!`
    );
  };

  // Quick Transfer Submit
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mat = rawMaterials.find((m) => m.id === transferModal.materialId);
    const targetOutlet = outlets.find((o) => o.id === transferModal.targetOutletId);
    if (!mat || !targetOutlet) return;

    if (mat.masterStock < transferModal.qty) {
      alert(`Insufficient Central Master stock! Available: ${mat.masterStock} ${mat.consumptionUom}`);
      return;
    }

    transferStockFromMaster(
      transferModal.targetOutletId,
      transferModal.materialId,
      transferModal.qty,
      `Replenishment transfer to ${targetOutlet.name}`
    );

    showToast(
      `Transferred ${(transferModal.qty / mat.conversionFactor).toFixed(1)} ${mat.purchaseUom} from Central Master to ${targetOutlet.name}!`
    );
    setTransferModal({ ...transferModal, open: false });
  };

  const branchOutlets = outlets.filter((o) => !o.isCentralMaster);

  return (
    <div className="inv-card">
      {toastMessage && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="inv-card-header">
        <div>
          <h3 className="inv-card-title">
            <Store size={22} color="#0284c7" />
            Central Master vs Multi-Outlet Stock Hub
          </h3>
          <p className="inv-card-subtitle">
            Compare Central Commissary master stock side-by-side with individual branch outlets, and track live consumption per bill
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline-primary btn-sm"
            onClick={() => setShowAddOutletModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1px solid #0284c7',
              color: '#0284c7',
              background: '#f0f9ff',
              cursor: 'pointer',
            }}
          >
            <Store size={15} /> + Add Outlet Branch
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() =>
              setTransferModal({
                open: true,
                materialId: rawMaterials[0]?.id || 'raw-milk',
                targetOutletId: 'outlet-01',
                qty: 10000,
              })
            }
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
          >
            <Send size={15} /> 📦 Transfer from Master to Outlet
          </button>
        </div>
      </div>

      {/* =========================================================================
          LIVE POS BILLING SIMULATOR CARD
          ========================================================================= */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Zap size={18} color="#eab308" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
            Live POS Billing Auto-Depletion Simulator (Test Your Exact Workflow)
          </h4>
        </div>
        <p style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
          When a customer orders Authentic Boba Tea, ingredients are immediately deducted from that outlet's stock (Tea base, milk, popping bubbles, whipped cream, glass cups) while Central Master stock remains intact.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Select Billing Outlet:
            </label>
            <select
              className="inv-select"
              style={{ minWidth: '220px' }}
              value={simOutletId}
              onChange={(e) => setSimOutletId(e.target.value)}
            >
              {branchOutlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Glass Size:
            </label>
            <select
              className="inv-select"
              value={simSize}
              onChange={(e) => setSimSize(e.target.value as VariantSize)}
            >
              <option value="REGULAR">Regular (300ml)</option>
              <option value="LARGE">Large (500ml)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>
              Bill Quantity:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              className="inv-input"
              style={{ width: '80px' }}
              value={simQty}
              onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSimulateBilling}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ShoppingBag size={16} /> Punch Bill: {simQty}x Authentic Boba ({simSize === 'REGULAR' ? 'Reg 300ml' : 'Lrg 500ml'})
          </button>
        </div>

        <div style={{ fontSize: '0.75rem', color: '#0369a1', marginTop: '0.75rem', fontWeight: 500 }}>
          💡 Exact deduction per cup: {simSize === 'REGULAR' ? '20g Tea, 120ml Milk, 30g Boba, 30ml Cream, 1 Reg Cup' : '30g Tea, 180ml Milk, 60g Boba, 60ml Cream, 1 Lrg Cup'}
        </div>
      </div>

      {/* =========================================================================
          MULTI-OUTLET SIDE-BY-SIDE COMPARISON TABLE
          ========================================================================= */}
      <div className="inv-table-wrapper">
        <table className="inv-data-table">
          <thead>
            <tr>
              <th>Raw Material</th>
              <th style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 700 }}>
                🏢 Central Master Stock
              </th>
              {branchOutlets.map((o) => (
                <th key={o.id}>🏪 {o.name}</th>
              ))}
              <th>Restock Action</th>
            </tr>
          </thead>
          <tbody>
            {rawMaterials.map((mat) => {
              const masterDisplay = `${(mat.masterStock / mat.conversionFactor).toFixed(1)} ${mat.purchaseUom}`;

              return (
                <tr key={mat.id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{mat.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {mat.category} ({mat.consumptionUom})
                    </div>
                  </td>

                  {/* Central Master Column */}
                  <td style={{ background: '#f8fafc' }}>
                    <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.95rem' }}>
                      {masterDisplay}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {mat.masterStock.toLocaleString()} {mat.consumptionUom}
                    </div>
                  </td>

                  {/* Outlet Columns */}
                  {branchOutlets.map((outlet) => {
                    const outletStock = mat.outletStocks[outlet.id] || 0;
                    const isLow = outletStock <= mat.conversionFactor * 2; // under 2 units

                    return (
                      <td key={outlet.id}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isLow ? '#dc2626' : '#0f172a',
                          }}
                        >
                          {(outletStock / mat.conversionFactor).toFixed(2)} {mat.purchaseUom}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: isLow ? '#dc2626' : '#64748b' }}>
                          {outletStock.toLocaleString()} {mat.consumptionUom}
                          {isLow && ' (Low!)'}
                        </div>
                      </td>
                    );
                  })}

                  {/* Quick Transfer Button */}
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setTransferModal({
                          open: true,
                          materialId: mat.id,
                          targetOutletId: 'outlet-01',
                          qty: mat.conversionFactor * 5, // default 5 KG/Liters
                        })
                      }
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#0284c7',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}
                    >
                      <ArrowRight size={13} /> Send to Outlet
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          TRANSFER MODAL
          ========================================================================= */}
      {transferModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              maxWidth: '480px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
              📦 Transfer Stock from Central Master to Branch
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Deducts bulk stock from Central Commissary and immediately adds to branch local inventory.
            </p>

            <form onSubmit={handleTransferSubmit}>
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Select Raw Material
                </label>
                <select
                  className="inv-select"
                  value={transferModal.materialId}
                  onChange={(e) => setTransferModal({ ...transferModal, materialId: e.target.value })}
                >
                  {rawMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Master Avail: {(m.masterStock / m.conversionFactor).toFixed(1)} {m.purchaseUom})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Target Destination Outlet
                </label>
                <select
                  className="inv-select"
                  value={transferModal.targetOutletId}
                  onChange={(e) => setTransferModal({ ...transferModal, targetOutletId: e.target.value })}
                >
                  {branchOutlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Transfer Quantity ({rawMaterials.find((m) => m.id === transferModal.materialId)?.consumptionUom})
                </label>
                <input
                  type="number"
                  min="1"
                  className="inv-input"
                  value={transferModal.qty}
                  onChange={(e) =>
                    setTransferModal({
                      ...transferModal,
                      qty: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  Equals {(transferModal.qty / (rawMaterials.find((m) => m.id === transferModal.materialId)?.conversionFactor || 1000)).toFixed(2)}{' '}
                  {rawMaterials.find((m) => m.id === transferModal.materialId)?.purchaseUom}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setTransferModal({ ...transferModal, open: false })}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Confirm & Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <CreateOutletModal
        isOpen={showAddOutletModal}
        onClose={() => setShowAddOutletModal(false)}
        onOutletCreated={(newOutlet) => {
          showToast(`✨ Branch "${newOutlet.name}" onboarded and ready for Master Commissary transfers!`);
        }}
      />
    </div>
  );
};
