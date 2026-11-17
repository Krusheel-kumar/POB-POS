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

export interface InventoryOutlet {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  managerName?: string;
  isCentralMaster?: boolean;
}

export interface RawMaterial {
  id: string;
  name: string;
  category: RawMaterialCategory;
  purchaseUom: UomType;
  consumptionUom: UomType;
  conversionFactor: number; // e.g. 1000 (1 KG = 1000 GRAM, 1 LITER = 1000 ML)
  costPerPurchaseUom: number; // in INR ₹
  costPerConsumptionUom: number; // calculated cost in INR ₹
  reorderThreshold: number;
  masterStock: number; // Central Master Inventory (Commissary) in consumption UOM
  outletStocks: Record<string, number>; // outletId -> quantity in consumption UOM
  // Compatibility helpers
  warehouseStock: number;
  branchStock: number;
}

export interface RecipeIngredient {
  rawMaterialId: string;
  rawMaterialName?: string;
  quantityConsumed: number;
  uom: UomType;
  notes?: string;
}

export type VariantSize = 'REGULAR' | 'LARGE';

export interface SizeRecipe {
  size: VariantSize;
  sizeLabel: string;
  ingredients: RecipeIngredient[];
  estimatedCost: number;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  sizes: {
    REGULAR: RecipeIngredient[];
    LARGE: RecipeIngredient[];
  };
  estimatedCost: {
    REGULAR: number;
    LARGE: number;
  };
  // Compatibility single ingredients array (defaults to Regular)
  ingredients: RecipeIngredient[];
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
  | 'STOCK_ADJUSTMENT'
  | 'MASTER_RESTOCK';

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

export interface VarianceItemReport {
  rawMaterialId: string;
  name: string;
  category: RawMaterialCategory;
  uom: UomType;
  unitCost: number;
  openingStock: number;
  receivedStock: number;
  theoreticalConsumption: number;
  expectedStock: number;
  actualPhysicalStock: number;
  missingQty: number;
  varianceCost: number;
  variancePct: number;
  isHighVariance: boolean;
}
