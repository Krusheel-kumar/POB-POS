import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, RotateCcw, Scale } from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';

export const StockTakeView: React.FC = () => {
  const { rawMaterials, physicalCounts, updatePhysicalCount, submitStockTake } =
    useInventoryStore();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(rawMaterials.map((m) => m.category)))];

  const filteredMaterials =
    filterCategory === 'ALL'
      ? rawMaterials
      : rawMaterials.filter((m) => m.category === filterCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitStockTake();
    setToastMessage('Daily Physical Stock Take submitted! Inventory ledger updated with variance audit trail.');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleMatchSystem = (matId: string, currentBranchStock: number) => {
    updatePhysicalCount(matId, currentBranchStock);
  };

  const handleMatchAllSystem = () => {
    rawMaterials.forEach((m) => updatePhysicalCount(m.id, m.branchStock));
    setToastMessage('Reset physical count fields to current system theoretical balance.');
    setTimeout(() => setToastMessage(null), 3000);
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
            <Scale size={20} color="#0284c7" />
            End-of-Day Physical Stock Take
          </h3>
          <p className="inv-card-subtitle">
            Enter physical counts and weighed stock at store closing (Milk, Boba, Cups) to audit against POS billed consumption
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleMatchAllSystem}
            style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={14} /> Prefill System Counts
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ClipboardCheck size={16} /> Submit Daily Stock Take
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`btn btn-sm ${filterCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterCategory(cat)}
            style={{ fontSize: '0.75rem', fontWeight: 600 }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock Take Data Grid */}
      <form onSubmit={handleSubmit}>
        <div className="inv-table-wrapper">
          <table className="inv-data-table">
            <thead>
              <tr>
                <th>Raw Material / Ingredient</th>
                <th>Category</th>
                <th>Expected Theoretical Stock</th>
                <th>Physical Weighed Count</th>
                <th>Portion Unit</th>
                <th>Variance / Discrepancy</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((mat) => {
                const currentPhysical =
                  typeof physicalCounts[mat.id] === 'number'
                    ? physicalCounts[mat.id]
                    : mat.branchStock;
                const diff = currentPhysical - mat.branchStock;

                return (
                  <tr key={mat.id}>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{mat.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Threshold: {(mat.reorderThreshold / mat.conversionFactor).toFixed(1)} {mat.purchaseUom}
                      </div>
                    </td>
                    <td>
                      <span className="badge-category">{mat.category}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#334155' }}>
                        {mat.branchStock.toLocaleString()} {mat.consumptionUom}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        ({(mat.branchStock / mat.conversionFactor).toFixed(2)} {mat.purchaseUom})
                      </div>
                    </td>
                    <td style={{ width: '220px' }}>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="inv-input"
                        value={currentPhysical}
                        onChange={(e) =>
                          updatePhysicalCount(mat.id, parseFloat(e.target.value) || 0)
                        }
                        style={{
                          fontWeight: 700,
                          borderColor: diff < 0 ? '#fca5a5' : '#cbd5e1',
                          background: diff < 0 ? '#fff5f5' : '#ffffff',
                        }}
                      />
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#475569' }}>{mat.consumptionUom}</span>
                    </td>
                    <td>
                      {diff === 0 ? (
                        <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.8125rem' }}>
                          ✓ Exact Match
                        </span>
                      ) : diff < 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 700, fontSize: '0.8125rem' }}>
                          Shortage: {diff} {mat.consumptionUom}
                        </span>
                      ) : (
                        <span style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.8125rem' }}>
                          Surplus: +{diff} {mat.consumptionUom}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleMatchSystem(mat.id, mat.branchStock)}
                        style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                      >
                        Match System
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};
