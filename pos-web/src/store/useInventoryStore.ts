import { create } from 'zustand';
import type {
  RawMaterial,
  Recipe,
  RecipeIngredient,
  VariantSize,
  StockTransfer,
  StockTransferItem,
  StockTransferStatus,
  InventoryLedgerEntry,
  VarianceItemReport,
  InventoryOutlet,
} from '../types/inventory';

export const OUTLETS_LIST: InventoryOutlet[] = [
  { id: 'warehouse-central', name: 'Central Master Commissary', code: 'CENTRAL-HQ', isCentralMaster: true },
  { id: 'outlet-demo-flagship', name: "Flagship Film Nagar (HQ Branch)", code: 'POB-FN-01', address: '407, Mezzanine, Film Nagar, Hyderabad' },
  { id: 'outlet-01', name: 'Outlet 1 - Jubilee Hills Flagship', code: 'OUTLET-01', address: 'Plot 72, Road 36, Jubilee Hills, Hyderabad' },
  { id: 'outlet-02', name: 'Outlet 2 - Madhapur Express', code: 'OUTLET-02', address: 'Inorbit Mall Road, Madhapur, Hyderabad' },
  { id: 'outlet-03', name: 'Outlet 3 - Hitech City Cyber Towers', code: 'OUTLET-03', address: 'Cyber Towers, Hitech City, Hyderabad' },
];

export const INITIAL_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'raw-tea',
    name: 'Ceylon Black Tea Base',
    category: 'TEA_BASE',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 680,
    costPerConsumptionUom: 0.68,
    reorderThreshold: 5000, // 5 KG
    masterStock: 50000, // 50 KG in Central Master
    outletStocks: {
      'outlet-01': 3500, // 3.5 KG
      'outlet-02': 2800, // 2.8 KG
      'outlet-03': 2200, // 2.2 KG
    },
    warehouseStock: 50000,
    branchStock: 3500,
  },
  {
    id: 'raw-milk',
    name: 'Farm Fresh Whole Milk (3.5% Fat)',
    category: 'DAIRY',
    purchaseUom: 'LITER',
    consumptionUom: 'MILLILITER',
    conversionFactor: 1000,
    costPerPurchaseUom: 72,
    costPerConsumptionUom: 0.072,
    reorderThreshold: 30000, // 30 Liters
    masterStock: 500000, // 500 Liters in Central Master
    outletStocks: {
      'outlet-01': 24000, // 24 Liters
      'outlet-02': 18000, // 18 Liters
      'outlet-03': 15000, // 15 Liters
    },
    warehouseStock: 500000,
    branchStock: 24000,
  },
  {
    id: 'raw-boba',
    name: 'Popping Bubbles / Boba Pearls',
    category: 'BOBA_TOPPINGS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 320,
    costPerConsumptionUom: 0.32,
    reorderThreshold: 10000,
    masterStock: 100000, // 100 KG in Central Master
    outletStocks: {
      'outlet-01': 6500, // 6.5 KG
      'outlet-02': 4800, // 4.8 KG
      'outlet-03': 4000, // 4.0 KG
    },
    warehouseStock: 100000,
    branchStock: 6500,
  },
  {
    id: 'raw-cream',
    name: 'Velvet Whipped Cream Base',
    category: 'DAIRY',
    purchaseUom: 'LITER',
    consumptionUom: 'MILLILITER',
    conversionFactor: 1000,
    costPerPurchaseUom: 280,
    costPerConsumptionUom: 0.28,
    reorderThreshold: 6000,
    masterStock: 60000, // 60 Liters in Central Master
    outletStocks: {
      'outlet-01': 4500, // 4.5 Liters
      'outlet-02': 3200, // 3.2 Liters
      'outlet-03': 2800, // 2.8 Liters
    },
    warehouseStock: 60000,
    branchStock: 4500,
  },
  {
    id: 'raw-cup-reg',
    name: 'Regular Glass Cup (300ml)',
    category: 'PACKAGING',
    purchaseUom: 'BOX',
    consumptionUom: 'UNIT',
    conversionFactor: 500,
    costPerPurchaseUom: 1200,
    costPerConsumptionUom: 2.4,
    reorderThreshold: 200,
    masterStock: 5000, // 10 Boxes in Master
    outletStocks: {
      'outlet-01': 350,
      'outlet-02': 280,
      'outlet-03': 220,
    },
    warehouseStock: 5000,
    branchStock: 350,
  },
  {
    id: 'raw-cup-lrg',
    name: 'Large Glass Cup (500ml/700ml)',
    category: 'PACKAGING',
    purchaseUom: 'BOX',
    consumptionUom: 'UNIT',
    conversionFactor: 500,
    costPerPurchaseUom: 1600,
    costPerConsumptionUom: 3.2,
    reorderThreshold: 200,
    masterStock: 5000, // 10 Boxes in Master
    outletStocks: {
      'outlet-01': 400,
      'outlet-02': 320,
      'outlet-03': 250,
    },
    warehouseStock: 5000,
    branchStock: 400,
  },
  {
    id: 'raw-straw',
    name: '12mm Wide Boba Straw',
    category: 'PACKAGING',
    purchaseUom: 'BOX',
    consumptionUom: 'UNIT',
    conversionFactor: 1000,
    costPerPurchaseUom: 800,
    costPerConsumptionUom: 0.8,
    reorderThreshold: 500,
    masterStock: 40000,
    outletStocks: {
      'outlet-01': 1200,
      'outlet-02': 900,
      'outlet-03': 850,
    },
    warehouseStock: 40000,
    branchStock: 1200,
  },
  {
    id: 'raw-syrup',
    name: 'Taiwanese Brown Sugar Tiger Syrup',
    category: 'SYRUPS',
    purchaseUom: 'LITER',
    consumptionUom: 'MILLILITER',
    conversionFactor: 1000,
    costPerPurchaseUom: 450,
    costPerConsumptionUom: 0.45,
    reorderThreshold: 5000,
    masterStock: 80000,
    outletStocks: {
      'outlet-01': 5500,
      'outlet-02': 4200,
      'outlet-03': 3800,
    },
    warehouseStock: 80000,
    branchStock: 5500,
  },
  {
    id: 'raw-fries',
    name: 'Belgian Cut Potato Fries',
    category: 'SNACKS',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 190,
    costPerConsumptionUom: 0.19,
    reorderThreshold: 15000,
    masterStock: 120000,
    outletStocks: {
      'outlet-01': 16000,
      'outlet-02': 12000,
      'outlet-03': 10000,
    },
    warehouseStock: 120000,
    branchStock: 16000,
  },
  {
    id: 'raw-chicken',
    name: 'Boneless Marinated Chicken',
    category: 'PROTEIN',
    purchaseUom: 'KG',
    consumptionUom: 'GRAM',
    conversionFactor: 1000,
    costPerPurchaseUom: 340,
    costPerConsumptionUom: 0.34,
    reorderThreshold: 10000,
    masterStock: 70000,
    outletStocks: {
      'outlet-01': 12000,
      'outlet-02': 9000,
      'outlet-03': 8000,
    },
    warehouseStock: 70000,
    branchStock: 12000,
  },
];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rcp-authentic-boba',
    menuItemId: 'prod-02',
    menuItemName: 'Authentic Boba Tea',
    estimatedCost: {
      REGULAR: 42.64, // calculated from ingredients
      LARGE: 68.36,
    },
    sizes: {
      // User's exact recipe specification for Regular:
      REGULAR: [
        { rawMaterialId: 'raw-cup-reg', quantityConsumed: 1, uom: 'UNIT', notes: 'Regular Cup (300ml)' },
        { rawMaterialId: 'raw-tea', quantityConsumed: 20, uom: 'GRAM', notes: 'Ceylon Tea Base (20g)' },
        { rawMaterialId: 'raw-milk', quantityConsumed: 120, uom: 'MILLILITER', notes: 'Fresh Milk (120ml)' },
        { rawMaterialId: 'raw-boba', quantityConsumed: 30, uom: 'GRAM', notes: 'Popping Bubbles (30g)' },
        { rawMaterialId: 'raw-cream', quantityConsumed: 30, uom: 'MILLILITER', notes: 'Whipped Cream (30ml)' },
        { rawMaterialId: 'raw-straw', quantityConsumed: 1, uom: 'UNIT', notes: '12mm Straw' },
      ],
      // User's exact recipe specification for Large:
      LARGE: [
        { rawMaterialId: 'raw-cup-lrg', quantityConsumed: 1, uom: 'UNIT', notes: 'Large Cup (500ml/700ml)' },
        { rawMaterialId: 'raw-tea', quantityConsumed: 30, uom: 'GRAM', notes: 'Ceylon Tea Base (30g)' },
        { rawMaterialId: 'raw-milk', quantityConsumed: 180, uom: 'MILLILITER', notes: 'Fresh Milk (180ml)' },
        { rawMaterialId: 'raw-boba', quantityConsumed: 60, uom: 'GRAM', notes: 'Popping Bubbles (60g)' },
        { rawMaterialId: 'raw-cream', quantityConsumed: 60, uom: 'MILLILITER', notes: 'Whipped Cream (60ml)' },
        { rawMaterialId: 'raw-straw', quantityConsumed: 1, uom: 'UNIT', notes: '12mm Straw' },
      ],
    },
    ingredients: [], // compatibility
  },
  {
    id: 'rcp-tiger-boba',
    menuItemId: 'prod-01',
    menuItemName: 'Tiger Brown Sugar Boba',
    estimatedCost: {
      REGULAR: 44.54,
      LARGE: 72.10,
    },
    sizes: {
      REGULAR: [
        { rawMaterialId: 'raw-cup-reg', quantityConsumed: 1, uom: 'UNIT', notes: 'Regular Cup' },
        { rawMaterialId: 'raw-milk', quantityConsumed: 150, uom: 'MILLILITER', notes: 'Chilled Milk (150ml)' },
        { rawMaterialId: 'raw-syrup', quantityConsumed: 30, uom: 'MILLILITER', notes: 'Brown Sugar Syrup (30ml)' },
        { rawMaterialId: 'raw-boba', quantityConsumed: 40, uom: 'GRAM', notes: 'Boba Pearls (40g)' },
        { rawMaterialId: 'raw-straw', quantityConsumed: 1, uom: 'UNIT', notes: '12mm Straw' },
      ],
      LARGE: [
        { rawMaterialId: 'raw-cup-lrg', quantityConsumed: 1, uom: 'UNIT', notes: 'Large Cup' },
        { rawMaterialId: 'raw-milk', quantityConsumed: 220, uom: 'MILLILITER', notes: 'Chilled Milk (220ml)' },
        { rawMaterialId: 'raw-syrup', quantityConsumed: 45, uom: 'MILLILITER', notes: 'Brown Sugar Syrup (45ml)' },
        { rawMaterialId: 'raw-boba', quantityConsumed: 70, uom: 'GRAM', notes: 'Boba Pearls (70g)' },
        { rawMaterialId: 'raw-straw', quantityConsumed: 1, uom: 'UNIT', notes: '12mm Straw' },
      ],
    },
    ingredients: [],
  },
];

// Ensure fallback ingredients array is populated
INITIAL_RECIPES.forEach((rcp) => {
  rcp.ingredients = rcp.sizes.REGULAR;
});

export const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'trf-01',
    transferNumber: 'TRF-2026-1001',
    fromOutletId: 'warehouse-central',
    fromOutletName: 'Central Master Commissary',
    toOutletId: 'outlet-01',
    toOutletName: 'Outlet 1 - Jubilee Hills Flagship',
    status: 'IN_TRANSIT',
    requestedBy: 'Rahul Sharma (Branch Manager)',
    dispatchedBy: 'Vikram Patel (Commissary Admin)',
    requestedAt: 'Today, 08:30 AM',
    dispatchedAt: 'Today, 10:15 AM',
    notes: 'Morning restock: 20L Milk & 10kg Boba',
    items: [
      { rawMaterialId: 'raw-boba', requestedQty: 10000, dispatchedQty: 10000, receivedQty: 0, uom: 'GRAM' },
      { rawMaterialId: 'raw-milk', requestedQty: 20000, dispatchedQty: 20000, receivedQty: 0, uom: 'MILLILITER' },
      { rawMaterialId: 'raw-cup-reg', requestedQty: 500, dispatchedQty: 500, receivedQty: 0, uom: 'UNIT' },
    ],
  },
  {
    id: 'trf-02',
    transferNumber: 'TRF-2026-1002',
    fromOutletId: 'warehouse-central',
    fromOutletName: 'Central Master Commissary',
    toOutletId: 'outlet-02',
    toOutletName: 'Outlet 2 - Madhapur Express',
    status: 'PENDING',
    requestedBy: 'Priya Mehta (Outlet 2 Manager)',
    requestedAt: 'Today, 11:00 AM',
    notes: 'Afternoon indent: 5kg Tea & 15L Whipped Cream',
    items: [
      { rawMaterialId: 'raw-tea', requestedQty: 5000, dispatchedQty: 0, receivedQty: 0, uom: 'GRAM' },
      { rawMaterialId: 'raw-cream', requestedQty: 15000, dispatchedQty: 0, receivedQty: 0, uom: 'MILLILITER' },
    ],
  },
];

export const INITIAL_LEDGER: InventoryLedgerEntry[] = [
  {
    id: 'led-001',
    outletId: 'warehouse-central',
    rawMaterialId: 'raw-milk',
    rawMaterialName: 'Farm Fresh Whole Milk',
    transactionType: 'MASTER_RESTOCK',
    quantityChange: 500000,
    uom: 'MILLILITER',
    referenceId: 'PO-DELIVERY-441',
    createdAt: 'Today, 06:00 AM',
    notes: 'Dairy Supplier Tanker Delivery (500 Liters)',
  },
  {
    id: 'led-002',
    outletId: 'outlet-01',
    rawMaterialId: 'raw-boba',
    rawMaterialName: 'Popping Bubbles / Boba Pearls',
    transactionType: 'OPENING_BALANCE',
    quantityChange: 6500,
    uom: 'GRAM',
    referenceId: 'SYS-INIT',
    createdAt: 'Today, 07:00 AM',
    notes: 'Outlet 1 Opening Stock Verified',
  },
];

interface InventoryStoreState {
  outlets: InventoryOutlet[];
  selectedOutletId: string;
  rawMaterials: RawMaterial[];
  recipes: Recipe[];
  transfers: StockTransfer[];
  ledger: InventoryLedgerEntry[];
  physicalCounts: Record<string, number>;

  // Navigation / Outlet Selection
  setSelectedOutletId: (outletId: string) => void;
  createOutlet: (newOutletData: {
    id?: string;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    managerName?: string;
    initialStockAllocation?: 'EMPTY' | 'STARTER_PACK';
  }) => InventoryOutlet;

  // Screen 1: Master Inventory Actions
  addRawMaterial: (material: Omit<RawMaterial, 'id' | 'costPerConsumptionUom' | 'warehouseStock' | 'branchStock'>) => void;
  addStockToMaster: (rawMaterialId: string, addedQty: number, notes?: string) => void;

  // Screen 2: Recipe Builder with Sizes (Regular vs Large)
  saveSizeRecipe: (menuItemId: string, menuItemName: string, size: VariantSize, ingredients: RecipeIngredient[]) => void;
  deleteRecipe: (recipeId: string) => void;

  // Screen 3: Multi-Outlet Transfers & Replenishment
  transferStockFromMaster: (toOutletId: string, rawMaterialId: string, quantity: number, notes?: string) => void;
  createStockIndent: (requestedBy: string, items: { rawMaterialId: string; requestedQty: number }[], notes?: string) => StockTransfer;
  dispatchStockTransfer: (transferId: string, dispatchedBy: string) => void;
  receiveStockTransfer: (transferId: string, receivedBy: string) => void;

  // Screen 4: POS Billing & Auto-Depletion with Dual Comparison
  billOrderAtOutlet: (
    outletId: string,
    orderNumber: string,
    items: { menuItemId: string; size: VariantSize; quantity: number }[]
  ) => { success: boolean; deductions: Record<string, number>; message: string };

  // Compatibility method
  depleteStockOnKot: (orderNumber: string, items: { menuItemId: string; quantity: number }[]) => void;

  // Physical Stock Take & Variance
  updatePhysicalCount: (rawMaterialId: string, count: number) => void;
  submitStockTake: () => void;
  getVarianceReports: () => VarianceItemReport[];
}

export const useInventoryStore = create<InventoryStoreState>((set, get) => ({
  outlets: OUTLETS_LIST,
  selectedOutletId: 'outlet-01',
  rawMaterials: INITIAL_RAW_MATERIALS,
  recipes: INITIAL_RECIPES,
  transfers: INITIAL_TRANSFERS,
  ledger: INITIAL_LEDGER,
  physicalCounts: {
    'raw-tea': 3350,   // Expected 3500 -> slight shortage
    'raw-milk': 21800, // Expected 24000 -> -9.1% shortage (flagged in RED > 3%)
    'raw-boba': 5900,  // Expected 6500 -> -9.2% shortage (flagged in RED > 3%)
    'raw-cream': 4300,
    'raw-cup-reg': 340,
    'raw-cup-lrg': 390,
    'raw-straw': 1180,
    'raw-syrup': 5400,
    'raw-fries': 15800,
    'raw-chicken': 11900,
  },

  setSelectedOutletId: (outletId: string) => set({ selectedOutletId: outletId }),

  createOutlet: (data) => {
    const { outlets, rawMaterials, ledger } = get();
    const newId = data.id || `outlet-${Date.now()}`;
    const newOutlet: InventoryOutlet = {
      id: newId,
      name: data.name.trim(),
      code: data.code?.trim() || `OUTLET-0${outlets.length}`,
      address: data.address?.trim() || 'Hyderabad, Telangana',
      phone: data.phone?.trim() || '+91 98765 00000',
      managerName: data.managerName?.trim() || 'Branch Manager',
    };

    const isStarterPack = data.initialStockAllocation === 'STARTER_PACK';

    const updatedMaterials = rawMaterials.map((mat) => {
      const allocatedQty = isStarterPack ? Math.floor(mat.reorderThreshold * 0.5) : 0;
      const newMasterStock = isStarterPack ? Math.max(0, mat.masterStock - allocatedQty) : mat.masterStock;
      return {
        ...mat,
        masterStock: newMasterStock,
        warehouseStock: newMasterStock,
        outletStocks: {
          ...mat.outletStocks,
          [newId]: allocatedQty,
        },
      };
    });

    const newLedgerEntry: InventoryLedgerEntry = {
      id: `led-${Date.now()}`,
      outletId: newId,
      rawMaterialId: 'all',
      rawMaterialName: 'New Branch Onboarding',
      transactionType: isStarterPack ? 'TRANSFER' : 'OPENING_BALANCE',
      quantityChange: isStarterPack ? 500 : 0,
      uom: 'UNIT',
      referenceId: newOutlet.code,
      createdAt: 'Just now',
      notes: `Branch ${newOutlet.name} (${newOutlet.code}) created.${isStarterPack ? ' Starter pack allocated from Central Commissary.' : ' Ready for replenishment transfer.'}`,
    };

    set({
      outlets: [...outlets, newOutlet],
      rawMaterials: updatedMaterials,
      ledger: [newLedgerEntry, ...ledger],
      selectedOutletId: newId,
    });

    return newOutlet;
  },

  // 1. MASTER INVENTORY ACTIONS
  addRawMaterial: (newMatData) => {
    const { rawMaterials, ledger } = get();
    const id = `raw-${Date.now()}`;
    const costPerConsumption =
      newMatData.conversionFactor > 0
        ? newMatData.costPerPurchaseUom / newMatData.conversionFactor
        : newMatData.costPerPurchaseUom;

    const newMaterial: RawMaterial = {
      ...newMatData,
      id,
      costPerConsumptionUom: Math.round(costPerConsumption * 1000) / 1000,
      warehouseStock: newMatData.masterStock,
      branchStock: newMatData.outletStocks['outlet-01'] || 0,
    };

    const newLedgerEntry: InventoryLedgerEntry = {
      id: `led-${Date.now()}`,
      outletId: 'warehouse-central',
      rawMaterialId: id,
      rawMaterialName: newMatData.name,
      transactionType: 'MASTER_RESTOCK',
      quantityChange: newMatData.masterStock,
      uom: newMatData.consumptionUom,
      referenceId: 'NEW-MATERIAL-INIT',
      createdAt: 'Just now',
      notes: `Added new material to Central Master with initial stock of ${newMatData.masterStock} ${newMatData.consumptionUom}`,
    };

    set({
      rawMaterials: [...rawMaterials, newMaterial],
      ledger: [newLedgerEntry, ...ledger],
    });
  },

  addStockToMaster: (rawMaterialId, addedQty, notes) => {
    const { rawMaterials, ledger } = get();
    const target = rawMaterials.find((m) => m.id === rawMaterialId);
    if (!target) return;

    const updatedMaterials = rawMaterials.map((mat) => {
      if (mat.id === rawMaterialId) {
        const newMaster = mat.masterStock + addedQty;
        return {
          ...mat,
          masterStock: newMaster,
          warehouseStock: newMaster,
        };
      }
      return mat;
    });

    const newLedger: InventoryLedgerEntry = {
      id: `led-${Date.now()}`,
      outletId: 'warehouse-central',
      rawMaterialId: target.id,
      rawMaterialName: target.name,
      transactionType: 'MASTER_RESTOCK',
      quantityChange: addedQty,
      uom: target.consumptionUom,
      referenceId: `RESTOCK-${Date.now()}`,
      createdAt: 'Just now',
      notes: notes || `Direct stock replenishment to Central Master (+${addedQty} ${target.consumptionUom})`,
    };

    set({
      rawMaterials: updatedMaterials,
      ledger: [newLedger, ...ledger],
    });
  },

  // 2. RECIPE BUILDER WITH SIZES (REGULAR VS LARGE)
  saveSizeRecipe: (menuItemId, menuItemName, size, ingredients) => {
    const { recipes, rawMaterials } = get();
    const existing = recipes.find((r) => r.menuItemId === menuItemId);

    // Calculate cost for this size
    const sizeCost = ingredients.reduce((total, ing) => {
      const mat = rawMaterials.find((m) => m.id === ing.rawMaterialId);
      return total + (mat ? ing.quantityConsumed * mat.costPerConsumptionUom : 0);
    }, 0);

    if (existing) {
      const updatedSizes = {
        ...existing.sizes,
        [size]: ingredients,
      };
      const updatedCost = {
        ...existing.estimatedCost,
        [size]: Math.round(sizeCost * 100) / 100,
      };

      const updated = recipes.map((r) =>
        r.menuItemId === menuItemId
          ? {
              ...r,
              menuItemName,
              sizes: updatedSizes,
              estimatedCost: updatedCost,
              ingredients: updatedSizes.REGULAR,
            }
          : r
      );
      set({ recipes: updated });
    } else {
      const newRecipe: Recipe = {
        id: `rcp-${Date.now()}`,
        menuItemId,
        menuItemName,
        sizes: {
          REGULAR: size === 'REGULAR' ? ingredients : [],
          LARGE: size === 'LARGE' ? ingredients : [],
        },
        estimatedCost: {
          REGULAR: size === 'REGULAR' ? Math.round(sizeCost * 100) / 100 : 0,
          LARGE: size === 'LARGE' ? Math.round(sizeCost * 100) / 100 : 0,
        },
        ingredients,
      };
      set({ recipes: [...recipes, newRecipe] });
    }
  },

  deleteRecipe: (recipeId) => {
    set((state) => ({ recipes: state.recipes.filter((r) => r.id !== recipeId) }));
  },

  // 3. MULTI-OUTLET TRANSFERS
  transferStockFromMaster: (toOutletId, rawMaterialId, quantity, notes) => {
    const { rawMaterials, ledger, outlets } = get();
    const mat = rawMaterials.find((m) => m.id === rawMaterialId);
    const destOutlet = outlets.find((o) => o.id === toOutletId);
    if (!mat || !destOutlet || mat.masterStock < quantity) return;

    const newLedgerEntries: InventoryLedgerEntry[] = [
      {
        id: `led-${Date.now()}-out`,
        outletId: 'warehouse-central',
        rawMaterialId: mat.id,
        rawMaterialName: mat.name,
        transactionType: 'TRANSFER',
        quantityChange: -quantity,
        uom: mat.consumptionUom,
        referenceId: `TRF-${destOutlet.code}`,
        createdAt: 'Just now',
        notes: `Transfer dispatched to ${destOutlet.name}`,
      },
      {
        id: `led-${Date.now()}-in`,
        outletId: toOutletId,
        rawMaterialId: mat.id,
        rawMaterialName: mat.name,
        transactionType: 'GRN',
        quantityChange: quantity,
        uom: mat.consumptionUom,
        referenceId: `TRF-${destOutlet.code}`,
        createdAt: 'Just now',
        notes: `Received from Central Master Commissary: ${notes || 'Restock'}`,
      },
    ];

    const updatedMaterials = rawMaterials.map((m) => {
      if (m.id === rawMaterialId) {
        const newMaster = m.masterStock - quantity;
        const currentOutletStock = m.outletStocks[toOutletId] || 0;
        const updatedOutlets = {
          ...m.outletStocks,
          [toOutletId]: currentOutletStock + quantity,
        };
        return {
          ...m,
          masterStock: newMaster,
          warehouseStock: newMaster,
          outletStocks: updatedOutlets,
          branchStock: updatedOutlets['outlet-01'] || 0,
        };
      }
      return m;
    });

    set({
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

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
      fromOutletName: 'Central Master Commissary',
      toOutletId: 'outlet-01',
      toOutletName: 'Outlet 1 - Jubilee Hills Flagship',
      status: 'PENDING',
      requestedBy,
      requestedAt: 'Just now',
      notes,
      items: transferItems,
    };

    set({ transfers: [newTransfer, ...transfers] });
    return newTransfer;
  },

  dispatchStockTransfer: (transferId, dispatchedBy) => {
    const { transfers, rawMaterials, ledger } = get();
    const target = transfers.find((t) => t.id === transferId);
    if (!target || target.status !== 'PENDING') return;

    const newLedgerEntries: InventoryLedgerEntry[] = [];
    const updatedMaterials = rawMaterials.map((mat) => {
      const transferItem = target.items.find((item) => item.rawMaterialId === mat.id);
      if (transferItem) {
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
        const newMaster = Math.max(0, mat.masterStock - transferItem.requestedQty);
        return {
          ...mat,
          masterStock: newMaster,
          warehouseStock: newMaster,
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
          notes: `GRN Verified & Received from Central Master by ${receivedBy}`,
        });

        const currentOutletStock = mat.outletStocks[target.toOutletId] || 0;
        const updatedOutlets = {
          ...mat.outletStocks,
          [target.toOutletId]: currentOutletStock + qtyToReceive,
        };

        return {
          ...mat,
          outletStocks: updatedOutlets,
          branchStock: updatedOutlets['outlet-01'] || 0,
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

  // 4. POS BILLING AUTO-DEPLETION WITH DUAL COMPARISON
  billOrderAtOutlet: (outletId, orderNumber, items) => {
    const { recipes, rawMaterials, ledger, outlets } = get();
    const outlet = outlets.find((o) => o.id === outletId) || outlets[1];
    const totalDeductions: Record<string, number> = {};

    items.forEach((item) => {
      const rcp = recipes.find((r) => r.menuItemId === item.menuItemId);
      if (rcp) {
        const ingredientList = rcp.sizes[item.size] || rcp.sizes.REGULAR;
        ingredientList.forEach((ing) => {
          const qty = ing.quantityConsumed * item.quantity;
          totalDeductions[ing.rawMaterialId] = (totalDeductions[ing.rawMaterialId] || 0) + qty;
        });
      }
    });

    const newLedgerEntries: InventoryLedgerEntry[] = [];
    const updatedMaterials = rawMaterials.map((mat) => {
      const consumed = totalDeductions[mat.id];
      if (consumed) {
        const currentStock = mat.outletStocks[outletId] || 0;
        const newStock = Math.max(0, currentStock - consumed);

        newLedgerEntries.push({
          id: `led-${Date.now()}-${mat.id}`,
          outletId,
          rawMaterialId: mat.id,
          rawMaterialName: mat.name,
          transactionType: 'SALE',
          quantityChange: -consumed,
          uom: mat.consumptionUom,
          referenceId: orderNumber,
          createdAt: 'Just now',
          notes: `Billed at ${outlet.name}: Auto-depleted ${consumed} ${mat.consumptionUom}`,
        });

        const updatedOutlets = {
          ...mat.outletStocks,
          [outletId]: newStock,
        };

        return {
          ...mat,
          outletStocks: updatedOutlets,
          branchStock: updatedOutlets['outlet-01'] || 0,
        };
      }
      return mat;
    });

    set({
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });

    return {
      success: true,
      deductions: totalDeductions,
      message: `Billed ${orderNumber} at ${outlet.name}! Auto-depleted ${Object.keys(totalDeductions).length} ingredients.`,
    };
  },

  // Compatibility helper for single items
  depleteStockOnKot: (orderNumber, items) => {
    const formatted = items.map((i) => ({ ...i, size: 'REGULAR' as VariantSize }));
    get().billOrderAtOutlet('outlet-01', orderNumber, formatted);
  },

  // Physical Stock Take
  updatePhysicalCount: (rawMaterialId, count) => {
    set((state) => ({
      physicalCounts: { ...state.physicalCounts, [rawMaterialId]: count },
    }));
  },

  submitStockTake: () => {
    const { physicalCounts, rawMaterials, ledger, selectedOutletId } = get();
    const newLedgerEntries: InventoryLedgerEntry[] = [];

    const updatedMaterials = rawMaterials.map((mat) => {
      const actual = physicalCounts[mat.id];
      const currentStock = mat.outletStocks[selectedOutletId] || mat.branchStock;

      if (typeof actual === 'number') {
        const diff = actual - currentStock;
        if (diff !== 0) {
          newLedgerEntries.push({
            id: `led-${Date.now()}-${mat.id}`,
            outletId: selectedOutletId,
            rawMaterialId: mat.id,
            rawMaterialName: mat.name,
            transactionType: 'STOCK_ADJUSTMENT',
            quantityChange: diff,
            uom: mat.consumptionUom,
            referenceId: `ST-AUDIT-${new Date().toISOString().slice(0, 10)}`,
            createdAt: 'Just now',
            notes: `Stock Take Audit: Diff ${diff > 0 ? '+' : ''}${diff} ${mat.consumptionUom}`,
          });
        }

        const updatedOutlets = {
          ...mat.outletStocks,
          [selectedOutletId]: actual,
        };

        return {
          ...mat,
          outletStocks: updatedOutlets,
          branchStock: updatedOutlets['outlet-01'] || 0,
        };
      }
      return mat;
    });

    set({
      rawMaterials: updatedMaterials,
      ledger: [...newLedgerEntries, ...ledger],
    });
  },

  getVarianceReports: () => {
    const { rawMaterials, physicalCounts, ledger, selectedOutletId } = get();

    return rawMaterials.map((mat) => {
      const relevantEntries = ledger.filter(
        (l) => l.rawMaterialId === mat.id && l.outletId === selectedOutletId
      );

      const openingEntry = relevantEntries.find((l) => l.transactionType === 'OPENING_BALANCE');
      const openingStock = openingEntry ? openingEntry.quantityChange : mat.outletStocks[selectedOutletId] || mat.branchStock;

      const receivedStock = relevantEntries
        .filter((l) => l.transactionType === 'GRN')
        .reduce((sum, l) => sum + l.quantityChange, 0);

      const theoreticalConsumption = Math.abs(
        relevantEntries
          .filter((l) => l.transactionType === 'SALE')
          .reduce((sum, l) => sum + l.quantityChange, 0)
      );

      const expectedStock = openingStock + receivedStock - theoreticalConsumption;
      const currentOutletStock = mat.outletStocks[selectedOutletId] || mat.branchStock;
      const actualPhysicalStock =
        typeof physicalCounts[mat.id] === 'number' ? physicalCounts[mat.id] : currentOutletStock;

      const missingQty = actualPhysicalStock - expectedStock;
      const variancePct = expectedStock > 0 ? (missingQty / expectedStock) * 100 : 0;
      const varianceCost = Math.round(missingQty * mat.costPerConsumptionUom * 100) / 100;
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
