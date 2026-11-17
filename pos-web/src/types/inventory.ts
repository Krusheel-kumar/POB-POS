export type UomType = 'KG' | 'GRAM' | 'LITER' | 'MILLILITER' | 'BOX' | 'UNIT' | 'ROLL' | 'CAN';

export type RawMaterialCategory =
  | 'BOBA_TOPPINGS'
  | 'DAIRY'
  | 'SYRUPS'
  | 'TEA_BASE'
  | 'POWDERS'
  | 'PACKAGING'
  | 'SNACKS'
  | 'CONDIMENTS'
  | 'PROTEIN';

export interface RawMaterial {
  id: string;
  name: string;
  category: RawMaterialCategory;
  purchaseUom: UomType;
  consumptionUom: UomType;
  conversionFactor: number; // e.g. 1000 (1 KG = 1000 GRAM)
  costPerPurchaseUom: number; // in INR ₹
  costPerConsumptionUom: number; // calculated cost in INR ₹
  reorderThreshold: number;
  warehouseStock: number; // stock at Central Commissary
  branchStock: number; // stock at Branch Outlet
}

export interface RecipeIngredient {
  rawMaterialId: string;
  quantityConsumed: number;
  uom: UomType;
  notes?: string;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  ingredients: RecipeIngredient[];
  estimatedCost: number;
}

export type StockTransferStatus = 'PENDING' | 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED';

export interface StockTransferItem {
  rawMaterialId: string;
  requestedQty: number;
  dispatchedQty: number;
  receivedQty: number;
  uom: UomType;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromOutletId: string;
  fromOutletName: string;
  toOutletId: string;
  toOutletName: string;
  status: StockTransferStatus;
  requestedBy: string;
  dispatchedBy?: string;
  receivedBy?: string;
  requestedAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
  items: StockTransferItem[];
}

export type InventoryTransactionType =
  | 'SALE'
  | 'GRN'
  | 'TRANSFER'
  | 'WASTAGE'
  | 'OPENING_BALANCE'
  | 'STOCK_ADJUSTMENT';

export interface InventoryLedgerEntry {
  id: string;
  outletId: string;
  rawMaterialId: string;
  rawMaterialName: string;
  transactionType: InventoryTransactionType;
  quantityChange: number; // Negative for SALE/TRANSFER_OUT, Positive for GRN/TRANSFER_IN
  uom: UomType;
  referenceId: string;
  createdAt: string;
  notes?: string;
}

export interface PhysicalStockCount {
  rawMaterialId: string;
  actualQty: number;
}

export interface VarianceItemReport {
  rawMaterialId: string;
  name: string;
  category: RawMaterialCategory;
  uom: UomType;
  unitCost: number;
  openingStock: number;
  receivedStock: number;
  theoreticalConsumption: number; // From POS KOT recipe depletion
  expectedStock: number; // (Opening + Received) - Theoretical Consumption
  actualPhysicalStock: number;
  missingQty: number; // Actual - Expected (negative means shortage)
  varianceCost: number; // missingQty * unitCost
  variancePct: number; // (missingQty / expectedStock) * 100
  isHighVariance: boolean; // true if negative variance > 3%
}
