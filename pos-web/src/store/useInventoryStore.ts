import { create } from 'zustand';
import type {
  RawMaterial,
  Recipe,
  RecipeIngredient,
  StockTransfer,
  StockTransferItem,
  StockTransferStatus,
  InventoryLedgerEntry,
  VarianceItemReport,
} from '../types/inventory';

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'raw-001',
    name: 'Black Tapioca Boba Pearls',
    category: 'BOBA_TOPPINGS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 320,
    costPerConsumptionUom: 0.32,
    reorderThreshold: 10000, // 10 KG
    warehouseStock: 180000, // 180 KG in central warehouse
    branchStock: 25000, // 25 KG in branch
  },
  {
    id: 'raw-002',
    name: 'Farm Fresh Whole Milk (3.5% Fat)',
    category: 'DAIRY',
    purchaseUom: 'LITER',
    consumptionUom: 'MILLILITER',
    conversionFactor: 1000,
    costPerPurchaseUom: 72,
    costPerConsumptionUom: 0.072,
    reorderThreshold: 30000, // 30 Liters
    warehouseStock: 500000, // 500 Liters in central warehouse
    branchStock: 65000, // 65 Liters in branch
  },
  {
    id: 'raw-003',
    name: 'Taiwanese Brown Sugar Tiger Syrup',
    category: 'SYRUPS',
    purchaseUom: 'LITER',
    consumptionUom: 'MILLILITER',
    conversionFactor: 1000,
    costPerPurchaseUom: 450,
    costPerConsumptionUom: 0.45,
    reorderThreshold: 5000, // 5 Liters
    warehouseStock: 80000, // 80 Liters in central warehouse
    branchStock: 12000, // 12 Liters in branch
  },
  {
    id: 'raw-004',
    name: 'Ceylon Black Tea Leaves',
    category: 'TEA_BASE',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 680,
    costPerConsumptionUom: 0.68,
    reorderThreshold: 4000, // 4 KG
    warehouseStock: 45000,
    branchStock: 6000,
  },
  {
    id: 'raw-005',
    name: 'Ceremonial Uji Matcha Powder',
    category: 'POWDERS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 1800,
    costPerConsumptionUom: 1.8,
    reorderThreshold: 2000, // 2 KG
    warehouseStock: 20000,
    branchStock: 2500,
  },
  {
    id: 'raw-006',
    name: 'Creamy Taro Powder Mix',
    category: 'POWDERS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 580,
    costPerConsumptionUom: 0.58,
    reorderThreshold: 3000,
    warehouseStock: 35000,
    branchStock: 4000,
  },
  {
    id: 'raw-007',
    name: 'Cream Cheese Cap Foam Blend',
    category: 'DAIRY',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 620,
    costPerConsumptionUom: 0.62,
    reorderThreshold: 4000,
    warehouseStock: 30000,
    branchStock: 5000,
  },
  {
    id: 'raw-008',
    name: 'Mango Juice Popping Boba',
    category: 'BOBA_TOPPINGS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 420,
    costPerConsumptionUom: 0.42,
    reorderThreshold: 6000,
    warehouseStock: 60000,
    branchStock: 8000,
  },
  {
    id: 'raw-009',
    name: '500ml Frosted PP Boba Cup',
    category: 'PACKAGING',
    purchaseUom: 'BOX',
    consumptionUom: 'UNIT',
    conversionFactor: 500,
    costPerPurchaseUom: 1500,
    costPerConsumptionUom: 3.0,
    reorderThreshold: 300,
    warehouseStock: 25000, // 50 boxes
    branchStock: 850,
  },
  {
    id: 'raw-010',
    name: '12mm Individually Wrapped Boba Straw',
    category: 'PACKAGING',
    purchaseUom: 'BOX',
    consumptionUom: 'UNIT',
    conversionFactor: 1000,
    costPerPurchaseUom: 800,
    costPerConsumptionUom: 0.8,
    reorderThreshold: 500,
    warehouseStock: 40000,
    branchStock: 1200,
  },
  {
    id: 'raw-011',
    name: 'POP O BOB Branded Sealing Film',
    category: 'PACKAGING',
    purchaseUom: 'ROLL',
    consumptionUom: 'UNIT',
    conversionFactor: 2500,
    costPerPurchaseUom: 1250,
    costPerConsumptionUom: 0.5,
    reorderThreshold: 1000,
    warehouseStock: 62500, // 25 rolls
    branchStock: 3400,
  },
  {
    id: 'raw-012',
    name: 'Belgian Cut Potato Fries',
    category: 'SNACKS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 190,
    costPerConsumptionUom: 0.19,
    reorderThreshold: 15000,
    warehouseStock: 120000,
    branchStock: 18000,
  },
  {
    id: 'raw-013',
    name: 'Truffle Mayo Dressing',
    category: 'CONDIMENTS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 650,
    costPerConsumptionUom: 0.65,
    reorderThreshold: 2000,
    warehouseStock: 25000,
    branchStock: 3500,
  },
  {
    id: 'raw-014',
    name: 'Boneless Chicken Breast (Marinated)',
    category: 'PROTEIN',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 340,
    costPerConsumptionUom: 0.34,
    reorderThreshold: 10000,
    warehouseStock: 70000,
    branchStock: 12000,
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rcp-01',
    menuItemId: 'prod-01',
    menuItemName: 'Tiger Brown Sugar Boba',
    estimatedCost: 35.84, // calculated from raw materials
    ingredients: [
      { rawMaterialId: 'raw-001', quantityConsumed: 45, uom: 'GRAM', notes: 'Warm steeped boba scoop' },
      { rawMaterialId: 'raw-002', quantityConsumed: 180, uom: 'MILLILITER', notes: 'Fresh chilled milk' },
      { rawMaterialId: 'raw-003', quantityConsumed: 35, uom: 'MILLILITER', notes: 'Cup wall tiger marbling' },
      { rawMaterialId: 'raw-009', quantityConsumed: 1, uom: 'UNIT', notes: '500ml Cup' },
      { rawMaterialId: 'raw-010', quantityConsumed: 1, uom: 'UNIT', notes: '12mm Straw' },
      { rawMaterialId: 'raw-011', quantityConsumed: 1, uom: 'UNIT', notes: 'Sealing film' },
    ],
  },
  {
    id: 'rcp-02',
    menuItemId: 'prod-02',
    menuItemName: 'Authentic Ceylon Milk Tea',
    estimatedCost: 35.18,
    ingredients: [
      { rawMaterialId: 'raw-004', quantityConsumed: 12, uom: 'GRAM', notes: 'Brewed decoction' },
      { rawMaterialId: 'raw-002', quantityConsumed: 160, uom: 'MILLILITER', notes: 'Steamed dairy' },
      { rawMaterialId: 'raw-001', quantityConsumed: 35, uom: 'GRAM', notes: 'Classic boba scoop' },
      { rawMaterialId: 'raw-009', quantityConsumed: 1, uom: 'UNIT', notes: 'Cup' },
      { rawMaterialId: 'raw-010', quantityConsumed: 1, uom: 'UNIT', notes: 'Straw' },
      { rawMaterialId: 'raw-011', quantityConsumed: 1, uom: 'UNIT', notes: 'Sealing film' },
    ],
  },
  {
    id: 'rcp-06',
    menuItemId: 'prod-06',
    menuItemName: 'Velvet Cheese Foam Matcha',
    estimatedCost: 59.44,
    ingredients: [
      { rawMaterialId: 'raw-005', quantityConsumed: 8, uom: 'GRAM', notes: 'Ceremonial matcha whisked' },
      { rawMaterialId: 'raw-002', quantityConsumed: 170, uom: 'MILLILITER', notes: 'Whole milk base' },
      { rawMaterialId: 'raw-007', quantityConsumed: 50, uom: 'GRAM', notes: 'Whipped salted cheese foam cap' },
      { rawMaterialId: 'raw-009', quantityConsumed: 1, uom: 'UNIT', notes: 'Cup' },
      { rawMaterialId: 'raw-010', quantityConsumed: 1, uom: 'UNIT', notes: 'Straw' },
    ],
  },
  {
    id: 'rcp-04',
    menuItemId: 'prod-04',
    menuItemName: 'Truffle Parmesan Fries',
    estimatedCost: 64.0,
    ingredients: [
      { rawMaterialId: 'raw-012', quantityConsumed: 200, uom: 'GRAM', notes: 'Crispy fried fries portion' },
      { rawMaterialId: 'raw-013', quantityConsumed: 40, uom: 'GRAM', notes: 'Truffle dip dressing' },
    ],
  },
  {
    id: 'rcp-03',
    menuItemId: 'prod-03',
    menuItemName: 'Chicken Tikka Roll',
    estimatedCost: 54.4,
    ingredients: [
      { rawMaterialId: 'raw-014', quantityConsumed: 160, uom: 'GRAM', notes: 'Char-grilled chicken strips' },
    ],
  },
];

export const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'trf-01',
    transferNumber: 'TRF-2026-1001',
    fromOutletId: 'warehouse-central',
    fromOutletName: 'Central Kitchen & Commissary',
    toOutletId: 'outlet-downtown',
    toOutletName: 'POP O BOB Flagship (Jubilee Hills)',
    status: 'IN_TRANSIT',
    requestedBy: 'Rahul Sharma (Branch Manager)',
    dispatchedBy: 'Vikram Patel (Warehouse Admin)',
    requestedAt: 'Today, 08:30 AM',
    dispatchedAt: 'Today, 10:15 AM',
    notes: 'Morning priority restock for boba pearls & fresh milk',
    items: [
      { rawMaterialId: 'raw-001', requestedQty: 15000, dispatchedQty: 15000, receivedQty: 0, uom: 'GRAM' },
      { rawMaterialId: 'raw-002', requestedQty: 30000, dispatchedQty: 30000, receivedQty: 0, uom: 'MILLILITER' },
      { rawMaterialId: 'raw-009', requestedQty: 500, dispatchedQty: 500, receivedQty: 0, uom: 'UNIT' },
    ],
  },
  {
    id: 'trf-02',
    transferNumber: 'TRF-2026-1002',
    fromOutletId: 'warehouse-central',
    fromOutletName: 'Central Kitchen & Commissary',
    toOutletId: 'outlet-downtown',
    toOutletName: 'POP O BOB Flagship (Jubilee Hills)',
    status: 'PENDING',
    requestedBy: 'Priya Mehta (Asst. Manager)',
    requestedAt: 'Today, 11:00 AM',
    notes: 'Afternoon indent for ceremonial matcha and tiger brown sugar syrup',
    items: [
      { rawMaterialId: 'raw-005', requestedQty: 3000, dispatchedQty: 0, receivedQty: 0, uom: 'GRAM' },
      { rawMaterialId: 'raw-003', requestedQty: 10000, dispatchedQty: 0, receivedQty: 0, uom: 'MILLILITER' },
      { rawMaterialId: 'raw-010', requestedQty: 500, dispatchedQty: 0, receivedQty: 0, uom: 'UNIT' },
    ],
  },
  {
    id: 'trf-03',
    transferNumber: 'TRF-2026-0998',
    fromOutletId: 'warehouse-central',
    fromOutletName: 'Central Kitchen & Commissary',
    toOutletId: 'outlet-downtown',
    toOutletName: 'POP O BOB Flagship (Jubilee Hills)',
    status: 'RECEIVED',
    requestedBy: 'Rahul Sharma (Branch Manager)',
    dispatchedBy: 'Vikram Patel (Warehouse Admin)',
    receivedBy: 'Rahul Sharma (Branch Manager)',
    requestedAt: 'Yesterday, 09:00 AM',
    dispatchedAt: 'Yesterday, 11:30 AM',
    receivedAt: 'Yesterday, 02:15 PM',
    notes: 'Regular replenishment',
    items: [
      { rawMaterialId: 'raw-008', requestedQty: 5000, dispatchedQty: 5000, receivedQty: 5000, uom: 'GRAM' },
      { rawMaterialId: 'raw-006', requestedQty: 3000, dispatchedQty: 3000, receivedQty: 3000, uom: 'GRAM' },
    ],
  },
];

export const INITIAL_LEDGER: InventoryLedgerEntry[] = [
  {
    id: 'led-001',
    outletId: 'outlet-downtown',
    rawMaterialId: 'raw-001',
    rawMaterialName: 'Black Tapioca Boba Pearls',
    transactionType: 'OPENING_BALANCE',
    quantityChange: 25000,
    uom: 'GRAM',
    referenceId: 'SYS-INIT',
    createdAt: 'Today, 07:00 AM',
    notes: 'Daily Opening Stock Verified',
  },
  {
    id: 'led-002',
    outletId: 'outlet-downtown',
    rawMaterialId: 'raw-002',
    rawMaterialName: 'Farm Fresh Whole Milk',
    transactionType: 'OPENING_BALANCE',
    quantityChange: 65000,
    uom: 'MILLILITER',
    referenceId: 'SYS-INIT',
    createdAt: 'Today, 07:00 AM',
    notes: 'Daily Opening Stock Verified',
  },
  {
    id: 'led-003',
    outletId: 'outlet-downtown',
    rawMaterialId: 'raw-001',
    rawMaterialName: 'Black Tapioca Boba Pearls',
    transactionType: 'SALE',
    quantityChange: -450,
    uom: 'GRAM',
    referenceId: 'KOT-1011',
    createdAt: 'Today, 10:15 AM',
    notes: 'Auto-depleted via KOT-1011 (10x Tiger Brown Sugar Boba)',
  },
  {
    id: 'led-004',
    outletId: 'outlet-downtown',
    rawMaterialId: 'raw-002',
    rawMaterialName: 'Farm Fresh Whole Milk',
    transactionType: 'SALE',
    quantityChange: -1800,
    uom: 'MILLILITER',
    referenceId: 'KOT-1011',
    createdAt: 'Today, 10:15 AM',
    notes: 'Auto-depleted via KOT-1011 (10x Tiger Brown Sugar Boba)',
  },
];

interface InventoryStoreState {
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  transfers: StockTransfer[];
  ledger: InventoryLedgerEntry[];
  physicalCounts: Record<string, number>; // rawMaterialId -> actual physical count

  // Recipe Builder Actions
  saveRecipe: (menuItemId: string, menuItemName: string, ingredients: RecipeIngredient[]) => void;
  deleteRecipe: (recipeId: string) => void;

  // Stock Transfer State Machine
  createStockIndent: (
    requestedBy: string,
    items: { rawMaterialId: string; requestedQty: number }[],
    notes?: string
  ) => StockTransfer;
  dispatchStockTransfer: (transferId: string, dispatchedBy: string) => void;
  receiveStockTransfer: (transferId: string, receivedBy: string) => void;

  // POS KOT Auto-Depletion Event
  depleteStockOnKot: (orderNumber: string, items: { menuItemId: string; quantity: number }[]) => void;

  // Physical Stock Take & Variance
  updatePhysicalCount: (rawMaterialId: string, count: number) => void;
  submitStockTake: () => void;
  getVarianceReports: () => VarianceItemReport[];
}

export const useInventoryStore = create<InventoryStoreState>((set, get) => ({
  rawMaterials: INITIAL_RAW_MATERIALS,
  recipes: INITIAL_RECIPES,
  transfers: INITIAL_TRANSFERS,
  ledger: INITIAL_LEDGER,
  physicalCounts: {
    // Initial mocked physical count for realistic demonstration of variance:
    'raw-001': 21350, // Expected ~22,400 -> -4.69% shortage (THEFT/WASTAGE FLAGGED IN RED >3%)
    'raw-002': 51000, // Expected ~54,200 -> -5.90% shortage (SPOILAGE/OVERPOUR FLAGGED IN RED >3%)
    'raw-003': 10850, // Expected 10,950 -> -0.91% normal variance
    'raw-004': 5650,  // Expected 5,700 -> -0.88% normal variance
    'raw-005': 2380,  // Expected 2,400 -> -0.83% normal variance
    'raw-006': 3910,  // Expected 3,920 -> -0.25% normal variance
    'raw-007': 4720,  // Expected 4,750 -> -0.63% normal variance
    'raw-008': 7850,  // Expected 7,900 -> -0.63% normal variance
    'raw-009': 740,   // Expected 750 -> -1.33% normal variance
    'raw-010': 1140,  // Expected 1,150 -> -0.87% normal variance
    'raw-011': 3290,  // Expected 3,300 -> -0.30% normal variance
    'raw-012': 16100, // Expected 16,200 -> -0.62% normal variance
    'raw-013': 2680,  // Expected 2,800 -> -4.29% shortage (OVER-DISPENSE FLAGGED IN RED >3%)
    'raw-014': 11200, // Expected 11,300 -> -0.88% normal variance
  },

  // 1. SAVE RECIPE (BILL OF MATERIALS)
  saveRecipe: (menuItemId: string, menuItemName: string, ingredients: RecipeIngredient[]) => {
    const { rawMaterials, recipes } = get();

    // Calculate estimated food cost
    let totalCost = 0;
    ingredients.forEach((ing) => {
      const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      if (mat) {
        totalCost += ing.quantityConsumed * mat.costPerConsumptionUom;
      }
    });

    const existingIdx = recipes.findIndex((r) => r.menuItemId === menuItemId);
    if (existingIdx >= 0) {
      const updated = [...recipes];
      updated[existingIdx] = {
        ...updated[existingIdx],
        menuItemName,
        ingredients,
        estimatedCost: Math.round(totalCost * 100) / 100,
      };
      set({ recipes: updated });
    } else {
      const newRecipe: Recipe = {
        id: `rcp-${Date.now()}`,
        menuItemId,
        menuItemName,
        ingredients,
        estimatedCost: Math.round(totalCost * 100) / 100,
      };
      set({ recipes: [...recipes, newRecipe] });
    }
  },

  deleteRecipe: (recipeId: string) => {
    set((state) => ({ recipes: state.recipes.filter((r) => r.id !== recipeId) }));
  },

  // 2. STOCK TRANSFER STATE MACHINE
  // Step A: Branch creates Indent -> PENDING
  createStockIndent: (requestedBy, items, notes) => {
    const { rawMaterials, transfers } = get();
    const transferNumber = `TRF-2026-${1000 + transfers.length + 1}`;

    const transferItems: StockTransferItem[] = items.map((item) => {
      const mat = rawMaterials.find((m) => m.id === item.rawMaterialId);
      return {
        rawMaterialId: item.rawMaterialId,
        requestedQty: item.requestedQty,
        dispatchedQty: 0,
        receivedQty: 0,
        uom: mat?.consumptionUom || 'GRAM',
      };
    });

    const newTransfer: StockTransfer = {
      id: `trf-${Date.now()}`,
      transferNumber,
      fromOutletId: 'warehouse-central',
      fromOutletName: 'Central Kitchen & Commissary',
      toOutletId: 'outlet-downtown',
      toOutletName: 'POP O BOB Flagship (Jubilee Hills)',
      status: 'PENDING',
      requestedBy,
      requestedAt: 'Just now',
      notes,
      items: transferItems,
    };

    set({ transfers: [newTransfer, ...transfers] });
    return newTransfer;
  },

  // Step B: Warehouse Admin Approves & Dispatches -> IN_TRANSIT (Deducts Warehouse Stock)
  dispatchStockTransfer: (transferId, dispatchedBy) => {
    const { transfers, rawMaterials, ledger } = get();
    const target = transfers.find((t) => t.id === transferId);
    if (!target || target.status !== 'PENDING') return;

    // Deduct stock from central warehouse and create ledger entries
    const newLedgerEntries: InventoryLedgerEntry[] = [];
    const updatedMaterials = rawMaterials.map((mat) => {
      const transferItem = target.items.find((item) => item.rawMaterialId === mat.id);
      if (transferItem) {
        // Transfer item dispatched matches requested quantity
        transferItem.dispatchedQty = transferItem.requestedQty;
        newLedgerEntries.push({
          id: `led-${Date.now()}-${mat.id}`,
          outletId: 'warehouse-central',
          rawMaterialId: mat.id,
          rawMaterialName: mat.name,
          transactionType: 'TRANSFER',
          quantityChange: -transferItem.requestedQty,
          uom: mat.consumptionUom,
          referenceId: target.transferNumber,
          createdAt: 'Just now',
          notes: `Dispatched to ${target.toOutletName} by ${dispatchedBy}`,
        });
        return {
          ...mat,
          warehouseStock: Math.max(0, mat.warehouseStock - transferItem.requestedQty),
        };
      }
      return mat;
    });

    const updatedTransfers = transfers.map((t) =>
      t.id === transferId
        ? {
            ...t,
            status: 'IN_TRANSIT' as StockTransferStatus,
            dispatchedBy,
            dispatchedAt: 'Just now',
          }
        : t
    );

    set({
      transfers: updatedTransfers,
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

  // Step C: Branch Manager Receives -> RECEIVED (Adds Stock to Branch Inventory with GRN)
  receiveStockTransfer: (transferId, receivedBy) => {
    const { transfers, rawMaterials, ledger } = get();
    const target = transfers.find((t) => t.id === transferId);
    if (!target || target.status !== 'IN_TRANSIT') return;

    const newLedgerEntries: InventoryLedgerEntry[] = [];
    const updatedMaterials = rawMaterials.map((mat) => {
      const transferItem = target.items.find((item) => item.rawMaterialId === mat.id);
      if (transferItem) {
        const qtyToReceive = transferItem.dispatchedQty || transferItem.requestedQty;
        transferItem.receivedQty = qtyToReceive;

        newLedgerEntries.push({
          id: `led-${Date.now()}-${mat.id}`,
          outletId: target.toOutletId,
          rawMaterialId: mat.id,
          rawMaterialName: mat.name,
          transactionType: 'GRN',
          quantityChange: qtyToReceive,
          uom: mat.consumptionUom,
          referenceId: `${target.transferNumber}-GRN`,
          createdAt: 'Just now',
          notes: `GRN Verified & Received from Central Warehouse by ${receivedBy}`,
        });

        return {
          ...mat,
          branchStock: mat.branchStock + qtyToReceive,
        };
      }
      return mat;
    });

    const updatedTransfers = transfers.map((t) =>
      t.id === transferId
        ? {
            ...t,
            status: 'RECEIVED' as StockTransferStatus,
            receivedBy,
            receivedAt: 'Just now',
          }
        : t
    );

    set({
      transfers: updatedTransfers,
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

  // 3. AUTO-DEPLETION ON KOT
  depleteStockOnKot: (orderNumber, items) => {
    const { recipes, rawMaterials, ledger } = get();
    const deductions: Record<string, number> = {}; // rawMaterialId -> total grams/units consumed

    items.forEach((item) => {
      const rcp = recipes.find((r) => r.menuItemId === item.menuItemId);
      if (rcp) {
        rcp.ingredients.forEach((ing) => {
          const totalConsumed = ing.quantityConsumed * item.quantity;
          deductions[ing.rawMaterialId] = (deductions[ing.rawMaterialId] || 0) + totalConsumed;
        });
      }
    });

    const newLedgerEntries: InventoryLedgerEntry[] = [];
    const updatedMaterials = rawMaterials.map((mat) => {
      const consumed = deductions[mat.id];
      if (consumed) {
        newLedgerEntries.push({
          id: `led-${Date.now()}-${mat.id}`,
          outletId: 'outlet-downtown',
          rawMaterialId: mat.id,
          rawMaterialName: mat.name,
          transactionType: 'SALE',
          quantityChange: -consumed,
          uom: mat.consumptionUom,
          referenceId: orderNumber,
          createdAt: 'Just now',
          notes: `Auto-depleted on KOT ${orderNumber} (${consumed} ${mat.consumptionUom})`,
        });
        return {
          ...mat,
          branchStock: Math.max(0, mat.branchStock - consumed),
        };
      }
      return mat;
    });

    set({
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

  // 4. PHYSICAL STOCK TAKE & VARIANCE CALCULATION
  updatePhysicalCount: (rawMaterialId, count) => {
    set((state) => ({
      physicalCounts: { ...state.physicalCounts, [rawMaterialId]: count },
    }));
  },

  submitStockTake: () => {
    const { physicalCounts, rawMaterials, ledger } = get();
    const newLedgerEntries: InventoryLedgerEntry[] = [];

    // Recalculate and add adjustment ledger entries for any variance
    const updatedMaterials = rawMaterials.map((mat) => {
      const actual = physicalCounts[mat.id];
      if (typeof actual === 'number') {
        const diff = actual - mat.branchStock;
        if (diff !== 0) {
          newLedgerEntries.push({
            id: `led-${Date.now()}-${mat.id}`,
            outletId: 'outlet-downtown',
            rawMaterialId: mat.id,
            rawMaterialName: mat.name,
            transactionType: 'STOCK_ADJUSTMENT',
            quantityChange: diff,
            uom: mat.consumptionUom,
            referenceId: `ST-AUDIT-${new Date().toISOString().slice(0, 10)}`,
            createdAt: 'Just now',
            notes: `End of Day Stock Take Reconciliation (Diff: ${diff > 0 ? '+' : ''}${diff} ${mat.consumptionUom})`,
          });
        }
        return { ...mat, branchStock: actual };
      }
      return mat;
    });

    set({
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

  getVarianceReports: () => {
    const { rawMaterials, physicalCounts, ledger } = get();

    return rawMaterials.map((mat) => {
      // Aggregate ledger transactions for this branch
      const relevantEntries = ledger.filter(
        (l) => l.rawMaterialId === mat.id && l.outletId === 'outlet-downtown'
      );

      const openingEntry = relevantEntries.find((l) => l.transactionType === 'OPENING_BALANCE');
      const openingStock = openingEntry ? openingEntry.quantityChange : mat.branchStock;

      const receivedStock = relevantEntries
        .filter((l) => l.transactionType === 'GRN')
        .reduce((sum, l) => sum + l.quantityChange, 0);

      const theoreticalConsumption = Math.abs(
        relevantEntries
          .filter((l) => l.transactionType === 'SALE')
          .reduce((sum, l) => sum + l.quantityChange, 0)
      );

      // (Opening + Received) - Theoretical POS Consumption = Expected Stock
      const expectedStock = openingStock + receivedStock - theoreticalConsumption;

      // Actual physical count input by branch manager
      const actualPhysicalStock =
        typeof physicalCounts[mat.id] === 'number' ? physicalCounts[mat.id] : mat.branchStock;

      const missingQty = actualPhysicalStock - expectedStock;
      const variancePct = expectedStock > 0 ? (missingQty / expectedStock) * 100 : 0;
      const varianceCost = Math.round(missingQty * mat.costPerConsumptionUom * 100) / 100;

      // Negative variance greater than 3% (e.g. -4.5%) indicates high theft/wastage
      const isHighVariance = variancePct < -3.0;

      return {
        rawMaterialId: mat.id,
        name: mat.name,
        category: mat.category,
        uom: mat.consumptionUom,
        unitCost: mat.costPerConsumptionUom,
        openingStock,
        receivedStock,
        theoreticalConsumption,
        expectedStock,
        actualPhysicalStock,
        missingQty,
        varianceCost,
        variancePct: Math.round(variancePct * 100) / 100,
        isHighVariance,
      };
    });
  },
}));
