import React, { useState } from 'react';
import {
  Boxes,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Edit2,
  Trash2,
  SlidersHorizontal,
  X,
  Package,
} from 'lucide-react';
import { useInventoryStore } from '../../../store/useInventoryStore';
import type { RawMaterial, RawMaterialCategory, UomType } from '../../../types/inventory';
import { formatINR } from '../../../lib/mockReportsData';

export const MasterInventoryView: React.FC = () => {
  const {
    rawMaterials,
    addRawMaterial,
    updateRawMaterial,
    deleteRawMaterial,
    addStockToMaster,
    setStockLevel,
  } = useInventoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Restock Modal State
  const [restockItem, setRestockItem] = useState<{
    id: string;
    name: string;
    uom: string;
    conversion: number;
    purchaseUom: string;
  } | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(50);

  // Direct Adjust / Update Stock Modal State
  const [adjustItem, setAdjustItem] = useState<{
    material: RawMaterial;
    newBulkQuantity: number;
    reason: string;
  } | null>(null);

  // Edit Material Modal State
  const [editItem, setEditItem] = useState<{
    id: string;
    name: string;
    category: RawMaterialCategory;
    costPerPurchaseUom: number;
    reorderThreshold: number;
  } | null>(null);

  // Delete Confirmation State
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<RawMaterial | null>(null);

  // New Material Modal State
  const [isNewMaterialOpen, setIsNewMaterialOpen] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState<RawMaterialCategory>('BOBA_TOPPINGS');
  const [newMatPurchaseUom, setNewMatPurchaseUom] = useState<UomType>('KG');
  const [newMatConsumptionUom, setNewMatConsumptionUom] = useState<UomType>('GRAM');
  const newMatConversion = newMatPurchaseUom === 'BOX' ? 500 : 1000;
  const [newMatCost, setNewMatCost] = useState<number>(350);
  const [newMatInitialStock, setNewMatInitialStock] = useState<number>(50);

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

  // 1. Handle Quick Restock Submission
  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem) return;
    const addedInConsumption = restockAmount * restockItem.conversion;
    addStockToMaster(
      restockItem.id,
      addedInConsumption,
      `Delivery truck restock: +${restockAmount} ${restockItem.purchaseUom}`
    );
    showToast(`Added ${restockAmount} ${restockItem.purchaseUom} to Central Commissary stock of "${restockItem.name}"!`);
    setRestockItem(null);
  };

  // 2. Handle Direct Stock Balance Adjustment (e.g. set Boba to 20 KG)
  const handleDirectAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem) return;
    const mat = adjustItem.material;
    const newConsumptionQty = adjustItem.newBulkQuantity * mat.conversionFactor;
    setStockLevel(
      mat.id,
      'warehouse-central',
      newConsumptionQty,
      adjustItem.reason.trim() || `Manual warehouse audit adjustment to ${adjustItem.newBulkQuantity} ${mat.purchaseUom}`
    );
    showToast(`✓ Updated stock for "${mat.name}" to ${adjustItem.newBulkQuantity} ${mat.purchaseUom}!`);
    setAdjustItem(null);
  };

  // 3. Handle Edit Material Metadata
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    updateRawMaterial(editItem.id, {
      name: editItem.name.trim(),
      category: editItem.category,
      costPerPurchaseUom: editItem.costPerPurchaseUom,
      reorderThreshold: editItem.reorderThreshold,
    });
    showToast(`✓ Updated specifications for "${editItem.name}"!`);
    setEditItem(null);
  };

  // 4. Handle Delete Item
  const handleDeleteConfirm = () => {
    if (!deleteConfirmItem) return;
    deleteRawMaterial(deleteConfirmItem.id);
    showToast(`✓ Removed "${deleteConfirmItem.name}" from inventory catalog.`);
    setDeleteConfirmItem(null);
  };

  // 5. Handle New Material Creation
  const handleCreateNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;

    const initialConsumption = newMatInitialStock * newMatConversion;

    addRawMaterial({
      name: newMatName.trim(),
      category: newMatCategory,
      purchaseUom: newMatPurchaseUom,
      consumptionUom: newMatConsumptionUom,
      conversionFactor: newMatConversion,
      costPerPurchaseUom: newMatCost,
      reorderThreshold: newMatConversion * 5,
      masterStock: initialConsumption,
      outletStocks: {
        'outlet-01': Math.round(initialConsumption * 0.1),
        'outlet-02': Math.round(initialConsumption * 0.08),
        'outlet-03': Math.round(initialConsumption * 0.06),
      },
    });

    showToast(`✓ "${newMatName}" added to Central Commissary with ${newMatInitialStock} ${newMatPurchaseUom} initial stock!`);
    setIsNewMaterialOpen(false);
    setNewMatName('');
    setNewMatCost(350);
    setNewMatInitialStock(50);
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
            Central Master Inventory (Commissary & Main Warehouse)
          </h3>
          <p className="inv-card-subtitle">
            Enterprise central repository for raw materials, bulk inventory adjustments, and supply chain control
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setIsNewMaterialOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
        >
          <Plus size={16} /> + Add Raw Material
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="kpi-card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Total Catalog Materials</span>
            <Boxes size={18} color="#0284c7" />
          </div>
          <div className="kpi-card-value">{totalItemsCount} Catalog Items</div>
          <div className="kpi-card-subtitle">
            <span>Dairy, Boba, Tea Base & Packaging</span>
          </div>
        </div>

        <div className="kpi-card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Central Bulk Milk</span>
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
            <span className="kpi-card-title">Reorder Alerts</span>
            <AlertTriangle size={18} color="#f59e0b" />
          </div>
          <div className="kpi-card-value">{lowMasterItems.length} Low Alerts</div>
          <div className="kpi-card-subtitle">
            <span>Triggered threshold reorder</span>
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
            placeholder="Search raw material by name..."
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
              <th>Central Commissary Stock</th>
              <th>Portion Unit</th>
              <th>Purchase Rate</th>
              <th>Unit Cost</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
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
                        ⚠️ Low Stock
                      </span>
                    ) : (
                      <span className="badge-top-seller" style={{ fontSize: '0.75rem' }}>
                        ✓ Healthy Reserve
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      {/* Set / Adjust Stock Quantity (e.g. set to 20 KG) */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setAdjustItem({
                            material: mat,
                            newBulkQuantity: parseFloat(bulkQty) || 0,
                            reason: 'Warehouse physical audit correction',
                          })
                        }
                        title={`Adjust or set current stock quantity for ${mat.name}`}
                        style={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#0284c7',
                          borderColor: '#bae6fd',
                          background: '#f0f9ff',
                        }}
                      >
                        <SlidersHorizontal size={12} /> Adjust Stock
                      </button>

                      {/* Quick Restock (+ Add Stock) */}
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
                        title={`Receive vendor delivery for ${mat.name}`}
                        style={{
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#16a34a',
                          borderColor: '#bbf7d0',
                          background: '#f0fdf4',
                        }}
                      >
                        <ArrowUpRight size={13} /> + Add Stock
                      </button>

                      {/* Edit Specifications */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setEditItem({
                            id: mat.id,
                            name: mat.name,
                            category: mat.category,
                            costPerPurchaseUom: mat.costPerPurchaseUom,
                            reorderThreshold: mat.reorderThreshold,
                          })
                        }
                        title="Edit ingredient specifications"
                        style={{ padding: '0.35rem 0.5rem', color: '#475569' }}
                      >
                        <Edit2 size={13} />
                      </button>

                      {/* Delete Raw Material */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setDeleteConfirmItem(mat)}
                        title={`Delete ${mat.name} from inventory`}
                        style={{ padding: '0.35rem 0.5rem', color: '#dc2626', borderColor: '#fecaca' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          MODAL 1: DIRECT STOCK ADJUSTMENT (e.g. Change Boba to 20 KG)
          ========================================================================= */}
      {adjustItem && (
        <div className="outlet-modal-backdrop" onClick={() => setAdjustItem(null)} role="dialog" aria-modal="true">
          <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="outlet-modal-header">
              <div className="outlet-modal-title">
                <div className="outlet-modal-icon-badge">
                  <SlidersHorizontal size={22} color="#0284c7" />
                </div>
                <div>
                  <h3>Adjust Stock Balance</h3>
                  <p>Update Central Commissary inventory for <strong>{adjustItem.material.name}</strong></p>
                </div>
              </div>
              <button
                type="button"
                className="outlet-modal-close-btn"
                onClick={() => setAdjustItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDirectAdjustSubmit} className="outlet-modal-form">
              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Current Recorded Balance:</span>
                <span style={{ fontWeight: 800, color: '#0f172a' }}>
                  {(adjustItem.material.masterStock / adjustItem.material.conversionFactor).toFixed(1)} {adjustItem.material.purchaseUom} ({adjustItem.material.masterStock.toLocaleString()} {adjustItem.material.consumptionUom})
                </span>
              </div>

              <div className="outlet-form-group">
                <label htmlFor="adjust-qty">
                  New Desired Balance ({adjustItem.material.purchaseUom}) <span className="req">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    id="adjust-qty"
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    className="inv-input"
                    value={adjustItem.newBulkQuantity}
                    onChange={(e) =>
                      setAdjustItem({
                        ...adjustItem,
                        newBulkQuantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  <span style={{ fontWeight: 700, color: '#475569', minWidth: '40px' }}>
                    {adjustItem.material.purchaseUom}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0284c7', marginTop: '0.25rem' }}>
                  Equals <strong>{(adjustItem.newBulkQuantity * adjustItem.material.conversionFactor).toLocaleString()} {adjustItem.material.consumptionUom}</strong> in Central Commissary
                </div>
              </div>

              <div className="outlet-form-group">
                <label htmlFor="adjust-reason">Audit Justification / Notes</label>
                <input
                  id="adjust-reason"
                  type="text"
                  placeholder="e.g. Physical inventory count correction or shrinkage write-off"
                  value={adjustItem.reason}
                  onChange={(e) => setAdjustItem({ ...adjustItem, reason: e.target.value })}
                />
              </div>

              <div className="outlet-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAdjustItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  ✓ Update Stock Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT INGREDIENT SPECIFICATIONS
          ========================================================================= */}
      {editItem && (
        <div className="outlet-modal-backdrop" onClick={() => setEditItem(null)} role="dialog" aria-modal="true">
          <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="outlet-modal-header">
              <div className="outlet-modal-title">
                <div className="outlet-modal-icon-badge">
                  <Edit2 size={22} color="#0284c7" />
                </div>
                <div>
                  <h3>Edit Raw Material</h3>
                  <p>Update specifications and purchase cost</p>
                </div>
              </div>
              <button
                type="button"
                className="outlet-modal-close-btn"
                onClick={() => setEditItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="outlet-modal-form">
              <div className="outlet-form-group">
                <label htmlFor="edit-name">Raw Material Name</label>
                <input
                  id="edit-name"
                  type="text"
                  required
                  value={editItem.name}
                  onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                />
              </div>

              <div className="outlet-form-row">
                <div className="outlet-form-group flex-1">
                  <label htmlFor="edit-category">Category</label>
                  <select
                    id="edit-category"
                    value={editItem.category}
                    onChange={(e) => setEditItem({ ...editItem, category: e.target.value as RawMaterialCategory })}
                  >
                    <option value="BOBA_TOPPINGS">Boba & Toppings</option>
                    <option value="DAIRY">Dairy & Milk</option>
                    <option value="TEA_BASE">Tea Base</option>
                    <option value="SYRUPS">Syrups & Sugar</option>
                    <option value="POWDERS">Powders & Mixes</option>
                    <option value="PACKAGING">Cups & Packaging</option>
                    <option value="SNACKS">Snacks & Sides</option>
                    <option value="PROTEIN">Protein & Meats</option>
                  </select>
                </div>

                <div className="outlet-form-group flex-1">
                  <label htmlFor="edit-cost">Purchase Rate (₹)</label>
                  <input
                    id="edit-cost"
                    type="number"
                    min="1"
                    required
                    value={editItem.costPerPurchaseUom}
                    onChange={(e) => setEditItem({ ...editItem, costPerPurchaseUom: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="outlet-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                  Save Specifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: DELETE CONFIRMATION
          ========================================================================= */}
      {deleteConfirmItem && (
        <div className="outlet-modal-backdrop" onClick={() => setDeleteConfirmItem(null)} role="dialog" aria-modal="true">
          <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="outlet-modal-header" style={{ background: '#fef2f2' }}>
              <div className="outlet-modal-title">
                <div className="outlet-modal-icon-badge" style={{ background: '#fee2e2' }}>
                  <Trash2 size={22} color="#dc2626" />
                </div>
                <div>
                  <h3 style={{ color: '#dc2626' }}>Delete Raw Material?</h3>
                  <p>Permanent removal from inventory</p>
                </div>
              </div>
              <button
                type="button"
                className="outlet-modal-close-btn"
                onClick={() => setDeleteConfirmItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '1.25rem', fontSize: '0.875rem', color: '#334155' }}>
              Are you sure you want to delete <strong>{deleteConfirmItem.name}</strong> from the Central Commissary?
              <div style={{ marginTop: '0.5rem', background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.6rem 0.8rem', borderRadius: '8px', color: '#9f1239', fontSize: '0.8rem' }}>
                ⚠️ This item will be removed from future recipes and stock transfer tracking.
              </div>
            </div>

            <div className="outlet-modal-footer" style={{ padding: '1rem 1.25rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteConfirmItem(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
                style={{ background: '#dc2626', borderColor: '#dc2626', color: '#ffffff' }}
              >
                Yes, Delete Material
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: QUICK RESTOCK (+ ADD STOCK)
          ========================================================================= */}
      {restockItem && (
        <div className="outlet-modal-backdrop" onClick={() => setRestockItem(null)} role="dialog" aria-modal="true">
          <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <div className="outlet-modal-header">
              <div className="outlet-modal-title">
                <div className="outlet-modal-icon-badge">
                  <ArrowUpRight size={22} color="#16a34a" />
                </div>
                <div>
                  <h3>Receive Inward Delivery</h3>
                  <p>Log incoming vendor stock for <strong>{restockItem.name}</strong></p>
                </div>
              </div>
              <button
                type="button"
                className="outlet-modal-close-btn"
                onClick={() => setRestockItem(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="outlet-modal-form">
              <div className="outlet-form-group">
                <label htmlFor="restock-qty">
                  Delivery Quantity ({restockItem.purchaseUom}) <span className="req">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="restock-qty"
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
                  Adds +{(restockAmount * restockItem.conversion).toLocaleString()} {restockItem.uom} to Central Commissary stock
                </div>
              </div>

              <div className="outlet-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setRestockItem(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#16a34a', borderColor: '#16a34a' }}>
                  + Confirm & Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: NEW RAW MATERIAL
          ========================================================================= */}
      {isNewMaterialOpen && (
        <div className="outlet-modal-backdrop" onClick={() => setIsNewMaterialOpen(false)} role="dialog" aria-modal="true">
          <div className="outlet-modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="outlet-modal-header">
              <div className="outlet-modal-title">
                <div className="outlet-modal-icon-badge">
                  <Package size={22} color="#0284c7" />
                </div>
                <div>
                  <h3>Add New Raw Material</h3>
                  <p>Define ingredient specifications and initial stock</p>
                </div>
              </div>
              <button
                type="button"
                className="outlet-modal-close-btn"
                onClick={() => setIsNewMaterialOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateNewMaterial} className="outlet-modal-form">
              <div className="outlet-form-row">
                <div className="outlet-form-group flex-2">
                  <label htmlFor="new-mat-name">
                    Material Name <span className="req">*</span>
                  </label>
                  <input
                    id="new-mat-name"
                    type="text"
                    placeholder="e.g. Alphonso Mango Puree"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    required
                  />
                </div>
                <div className="outlet-form-group flex-1">
                  <label htmlFor="new-mat-cat">Category</label>
                  <select
                    id="new-mat-cat"
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
                    <option value="PROTEIN">Protein & Meats</option>
                  </select>
                </div>
              </div>

              <div className="outlet-form-row">
                <div className="outlet-form-group flex-1">
                  <label htmlFor="new-mat-puom">Purchase Unit (Vendor)</label>
                  <select
                    id="new-mat-puom"
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
                <div className="outlet-form-group flex-1">
                  <label htmlFor="new-mat-cuom">Portion Unit (Recipe)</label>
                  <select
                    id="new-mat-cuom"
                    value={newMatConsumptionUom}
                    onChange={(e) => setNewMatConsumptionUom(e.target.value as UomType)}
                  >
                    <option value="GRAM">GRAM</option>
                    <option value="MILLILITER">MILLILITER</option>
                    <option value="UNIT">UNIT</option>
                  </select>
                </div>
              </div>

              <div className="outlet-form-row">
                <div className="outlet-form-group flex-1">
                  <label htmlFor="new-mat-cost">Purchase Rate (₹ per {newMatPurchaseUom})</label>
                  <input
                    id="new-mat-cost"
                    type="number"
                    min="1"
                    value={newMatCost}
                    onChange={(e) => setNewMatCost(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="outlet-form-group flex-1">
                  <label htmlFor="new-mat-initial">Initial Stock ({newMatPurchaseUom})</label>
                  <input
                    id="new-mat-initial"
                    type="number"
                    min="0"
                    value={newMatInitialStock}
                    onChange={(e) => setNewMatInitialStock(parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#f0f9ff', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '0.8rem', color: '#0369a1' }}>
                Conversion: 1 {newMatPurchaseUom} = {newMatConversion} {newMatConsumptionUom} • Initial: {(newMatInitialStock * newMatConversion).toLocaleString()} {newMatConsumptionUom}
              </div>

              <div className="outlet-modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsNewMaterialOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
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
