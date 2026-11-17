import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { RawMaterialCategory, UomType } from '../../../types/inventory';
import { formatINR } from '../../../lib/mockReportsData';

export const MasterInventoryView: React.FC = () => {
  const { rawMaterials, addRawMaterial, addStockToMaster } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock Modal State
  const [restockItem, setRestockItem] = useState<{ id: string; name: string; uom: string; conversion: number; purchaseUom: string } | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(50);

  // New Material Modal State
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<RawMaterialCategory>('BOBA_TOPPINGS');
  const [newMatPurchaseUom, setNewMatPurchaseUom] = useState<UomType>('KG');
  const [newMatConsumptionUom, setNewMatConsumptionUom] = useState<UomType>('GRAM');
  const newMatConversion = newMatPurchaseUom === 'BOX' ? 500 : 1000;
  const [newMatCost, setNewMatCost] = useState<number>(350);
  const [newMatInitialStock, setNewMatInitialStock] = useState<number>(50000);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const categories = ['ALL', ...Array.from(new Set(rawMaterials.map((m) => m.category)))];

  const filteredMaterials = rawMaterials.filter((m) => {
    const matchCat = selectedCategory === 'ALL' || m.category === selectedCategory;
    const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addedInConsumption = restockAmount * restockItem.conversion;
    addStockToMaster(
      restockItem.id,
      addedInConsumption,
      `Delivery truck restock: +${restockAmount} ${restockItem.purchaseUom}`
    );
    showToast(`Added ${restockAmount} ${restockItem.purchaseUom} to Central Master stock of "${restockItem.name}"!`);
    setRestockItem(null);
  };

  const handleCreateNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    addRawMaterial({
      name: newMatName,
      category: newMatCategory,
      purchaseUom: newMatPurchaseUom,
      consumptionUom: newMatConsumptionUom,
      conversionFactor: newMatConversion,
      costPerPurchaseUom: newMatCost,
      reorderThreshold: newMatConversion * 5,
      masterStock: newMatInitialStock,
      outletStocks: {
        'outlet-01': Math.round(newMatInitialStock * 0.1),
        'outlet-02': Math.round(newMatInitialStock * 0.08),
        'outlet-03': Math.round(newMatInitialStock * 0.06),
      },
    });

    showToast(`"${newMatName}" added to Central Master Inventory with initial stock!`);
    setIsNewMaterialOpen(false);
    setNewMatName('');
  };

  // Summary Metrics
  const totalItemsCount = rawMaterials.length;
  const lowMasterItems = rawMaterials.filter((m) => m.masterStock <= m.reorderThreshold);

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
            <Boxes size={22} color="#0284c7" />
            Central Master Inventory (Commissary & Main Warehouse) — Main Godown Bulk Stock
          </h3>
          <p className="inv-card-subtitle">
            Main Godown bulk stock for all raw materials before dispatch to retail cafe outlets
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsNewMaterialOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Plus size={16} /> ➕ Add New Raw Material / Item
        </button>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Godown Items</span>
            <Boxes size={18} color="#0284c7" />
          </div>
          <div className="kpi-card-value">{totalItemsCount} Catalog Items</div>
          <div className="kpi-card-subtitle">
            <span>Dairy, Boba, Tea Base & Packaging</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Main Milk Reserve (Godown)</span>
            <TrendingUp size={18} color="#16a34a" />
          </div>
          <div className="kpi-card-value">
            {((rawMaterials.find((m) => m.id === 'raw-milk')?.masterStock || 0) / 1000).toFixed(0)} Liters
          </div>
          <div className="kpi-card-subtitle">
            <span>Ready for outlet dispatch</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Khatam Hone Wala (Low Alert)</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div className="kpi-card-value">{lowMasterItems.length} Low Alert</div>
          <div className="kpi-card-subtitle">
            <span>Needs vendor purchase order</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            className="inv-input"
            placeholder="Search raw material name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedCategory(cat)}
              style={{ fontSize: '0.75rem', fontWeight: 600 }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Master Inventory Data Table */}
      <div className="inv-table-wrapper">
        <table className="inv-data-table">
          <thead>
            <tr>
              <th>Raw Material / Ingredient</th>
              <th>Category</th>
              <th>Godown Bulk Stock (Central Master)</th>
              <th>Portion Unit (Kitchen)</th>
              <th>Purchase Rate (Vendor)</th>
              <th>Cost per Cup / Portion</th>
              <th>Stock Status</th>
              <th>Maal Inward (Restock)</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.map((mat) => {
              const bulkQty = (mat.masterStock / mat.conversionFactor).toFixed(1);
              const isLow = mat.masterStock <= mat.reorderThreshold;

              return (
                <tr key={mat.id}>
                  <td>
                    <strong style={{ color: '#0f172a' }}>{mat.name}</strong>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      1 {mat.purchaseUom} = {mat.conversionFactor} {mat.consumptionUom}
                    </div>
                  </td>
                  <td>
                    <span className="badge-category">{mat.category}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0284c7' }}>
                      {bulkQty} {mat.purchaseUom}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ({mat.masterStock.toLocaleString()} {mat.consumptionUom})
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, color: '#334155' }}>{mat.consumptionUom}</td>
                  <td>{formatINR(mat.costPerPurchaseUom)} / {mat.purchaseUom}</td>
                  <td style={{ fontWeight: 700, color: '#16a34a' }}>
                    {formatINR(mat.costPerConsumptionUom, true)}
                  </td>
                  <td>
                    {isLow ? (
                      <span className="badge-slow-seller" style={{ fontSize: '0.75rem' }}>
                        ⚠️ Low Master Stock
                      </span>
                    ) : (
                      <span className="badge-top-seller" style={{ fontSize: '0.75rem' }}>
                        ✓ Healthy Reserve
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() =>
                        setRestockItem({
                          id: mat.id,
                          name: mat.name,
                          uom: mat.consumptionUom,
                          conversion: mat.conversionFactor,
                          purchaseUom: mat.purchaseUom,
                        })
                      }
                      style={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: '#0284c7',
                        borderColor: '#bae6fd',
                      }}
                    >
                      <ArrowUpRight size={13} /> + Add Stock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QUICK RESTOCK MODAL */}
      {restockItem && (
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
              maxWidth: '460px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
              Add Stock to Central Master
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', color: '#64748b' }}>
              Receiving vendor delivery for <strong>{restockItem.name}</strong>
            </p>

            <form onSubmit={handleQuickRestockSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Delivery Quantity ({restockItem.purchaseUom})
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="number"
                    min="1"
                    className="inv-input"
                    value={restockAmount}
                    onChange={(e) => setRestockAmount(parseFloat(e.target.value) || 0)}
                    required
                  />
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: '#475569' }}>
                    {restockItem.purchaseUom}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Equals +{(restockAmount * restockItem.conversion).toLocaleString()} {restockItem.uom} added to Master Stock
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setRestockItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Confirm & Add to Central Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW MATERIAL MODAL */}
      {isNewMaterialOpen && (
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
              maxWidth: '520px',
              width: '100%',
              padding: '1.5rem',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#0f172a' }}>
              ➕ Add New Raw Material to Master
            </h3>
            <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#64748b' }}>
              Define ingredient specifications and initial bulk stock in the Central Commissary
            </p>

            <form onSubmit={handleCreateNewMaterial}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Material Name
                  </label>
                  <input
                    type="text"
                    className="inv-input"
                    placeholder="e.g. Alphonso Mango Puree"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Category
                  </label>
                  <select
                    className="inv-select"
                    value={newMatCategory}
                    onChange={(e) => setNewMatCategory(e.target.value as RawMaterialCategory)}
                  >
                    <option value="BOBA_TOPPINGS">Boba & Toppings</option>
                    <option value="DAIRY">Dairy & Milk</option>
                    <option value="TEA_BASE">Tea Base</option>
                    <option value="SYRUPS">Syrups & Sugar</option>
                    <option value="POWDERS">Powders & Mixes</option>
                    <option value="PACKAGING">Cups & Packaging</option>
                    <option value="SNACKS">Snacks & Sides</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Purchase Unit (Vendor)
                  </label>
                  <select
                    className="inv-select"
                    value={newMatPurchaseUom}
                    onChange={(e) => setNewMatPurchaseUom(e.target.value as UomType)}
                  >
                    <option value="KG">KG</option>
                    <option value="LITER">LITER</option>
                    <option value="BOX">BOX</option>
                    <option value="ROLL">ROLL</option>
                    <option value="CAN">CAN</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Consumption Unit (Recipe)
                  </label>
                  <select
                    className="inv-select"
                    value={newMatConsumptionUom}
                    onChange={(e) => setNewMatConsumptionUom(e.target.value as UomType)}
                  >
                    <option value="GRAM">GRAM</option>
                    <option value="MILLILITER">MILLILITER</option>
                    <option value="UNIT">UNIT</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Purchase Price (₹ per {newMatPurchaseUom})
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="inv-input"
                    value={newMatCost}
                    onChange={(e) => setNewMatCost(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Initial Master Stock ({newMatConsumptionUom})
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="inv-input"
                    value={newMatInitialStock}
                    onChange={(e) => setNewMatInitialStock(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsNewMaterialOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ fontWeight: 600 }}>
                  Create & Save Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
