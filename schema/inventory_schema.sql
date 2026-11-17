-- ============================================================================
-- Krunnex POS: Advanced Inventory, Recipe (BOM) & Central Warehouse Transfer Schema
-- PostgreSQL 14+ Relational DDL
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RAW MATERIALS CATALOG
-- Purchase UOM (e.g. Liter, KG) vs Consumption UOM (e.g. Milliliter, Gram)
CREATE TABLE IF NOT EXISTS raw_materials (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'DAIRY', 'BOBA_TOPPINGS', 'PACKAGING', 'SYRUPS', 'SNACKS'
    purchase_uom VARCHAR(50) NOT NULL, -- e.g., 'KG', 'LITER', 'BOX', 'ROLL'
    consumption_uom VARCHAR(50) NOT NULL, -- e.g., 'GRAM', 'MILLILITER', 'UNIT'
    conversion_factor NUMERIC(12, 4) NOT NULL DEFAULT 1000.0000, -- 1 KG = 1000 GRAM
    cost_per_purchase_uom NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost_per_consumption_uom NUMERIC(12, 4) GENERATED ALWAYS AS (
        CASE WHEN conversion_factor > 0 THEN cost_per_purchase_uom / conversion_factor ELSE cost_per_purchase_uom END
    ) STORED,
    reorder_threshold NUMERIC(12, 2) NOT NULL DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raw_materials_category ON raw_materials(category);
CREATE INDEX IF NOT EXISTS idx_raw_materials_name ON raw_materials(name);

-- 2. RECIPES (BILL OF MATERIALS - BOM)
-- Maps menu items to raw material ingredients with exact recipe quantity
CREATE TABLE IF NOT EXISTS recipes (
    id VARCHAR(36) PRIMARY KEY,
    menu_item_id VARCHAR(100) NOT NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    raw_material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id) ON DELETE RESTRICT,
    quantity_consumed NUMERIC(12, 4) NOT NULL, -- e.g. 40.0000 (g), 150.0000 (ml)
    uom VARCHAR(50) NOT NULL, -- matches raw_materials.consumption_uom
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_recipe_menu_item_ingredient UNIQUE (menu_item_id, raw_material_id)
);

CREATE INDEX IF NOT EXISTS idx_recipes_menu_item_id ON recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_recipes_raw_material_id ON recipes(raw_material_id);

-- 3. INVENTORY LEDGER (IMMUTABLE STOCK TRANSACTIONS)
-- Tracks every physical movement at branch and warehouse level
CREATE TABLE IF NOT EXISTS inventory_ledger (
    id VARCHAR(36) PRIMARY KEY,
    outlet_id VARCHAR(100) NOT NULL,
    raw_material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id),
    transaction_type VARCHAR(50) NOT NULL CHECK (
        transaction_type IN ('SALE', 'GRN', 'WASTAGE', 'TRANSFER', 'OPENING_BALANCE', 'STOCK_ADJUSTMENT')
    ),
    quantity_change NUMERIC(14, 4) NOT NULL, -- Negative for SALE/TRANSFER_OUT/WASTAGE, Positive for GRN/TRANSFER_IN
    uom VARCHAR(50) NOT NULL, -- Consumption UOM
    reference_id VARCHAR(100) NOT NULL, -- order_id (SALE), transfer_id (TRANSFER/GRN), stock_take_id
    unit_cost NUMERIC(12, 4) DEFAULT 0.0000,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_outlet_material ON inventory_ledger(outlet_id, raw_material_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference_id ON inventory_ledger(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON inventory_ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_tx_type ON inventory_ledger(transaction_type);

-- 4. STOCK TRANSFERS (CENTRAL WAREHOUSE TO BRANCH PIPELINE)
CREATE TABLE IF NOT EXISTS stock_transfers (
    id VARCHAR(36) PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'TRF-2026-1001'
    from_outlet_id VARCHAR(100) NOT NULL, -- 'warehouse-central'
    to_outlet_id VARCHAR(100) NOT NULL,   -- 'outlet-downtown'
    status VARCHAR(50) NOT NULL CHECK (
        status IN ('PENDING', 'IN_TRANSIT', 'RECEIVED', 'REJECTED')
    ),
    requested_by VARCHAR(100) NOT NULL,
    dispatched_by VARCHAR(100),
    received_by VARCHAR(100),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP WITH TIME ZONE,
    received_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfers_from_to ON stock_transfers(from_outlet_id, to_outlet_id);
CREATE INDEX IF NOT EXISTS idx_transfers_status ON stock_transfers(status);

-- 4B. STOCK TRANSFER ITEMS
CREATE TABLE IF NOT EXISTS stock_transfer_items (
    id VARCHAR(36) PRIMARY KEY,
    transfer_id VARCHAR(36) NOT NULL REFERENCES stock_transfers(id) ON DELETE CASCADE,
    raw_material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id),
    requested_qty NUMERIC(12, 4) NOT NULL,
    dispatched_qty NUMERIC(12, 4) DEFAULT 0.0000,
    received_qty NUMERIC(12, 4) DEFAULT 0.0000,
    uom VARCHAR(50) NOT NULL, -- purchase_uom or consumption_uom
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer_id ON stock_transfer_items(transfer_id);

-- 5. PHYSICAL STOCK TAKE & VARIANCE AUDIT
CREATE TABLE IF NOT EXISTS physical_stock_takes (
    id VARCHAR(36) PRIMARY KEY,
    stock_take_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'ST-2026-0042'
    outlet_id VARCHAR(100) NOT NULL,
    taken_by VARCHAR(100) NOT NULL,
    stock_take_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_variance_cost NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS physical_stock_take_items (
    id VARCHAR(36) PRIMARY KEY,
    stock_take_id VARCHAR(36) NOT NULL REFERENCES physical_stock_takes(id) ON DELETE CASCADE,
    raw_material_id VARCHAR(36) NOT NULL REFERENCES raw_materials(id),
    opening_qty NUMERIC(14, 4) NOT NULL,
    received_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    pos_consumed_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.0000,
    expected_qty NUMERIC(14, 4) NOT NULL, -- (opening + received) - pos_consumed
    actual_qty NUMERIC(14, 4) NOT NULL,   -- physical count
    variance_qty NUMERIC(14, 4) NOT NULL, -- actual - expected
    variance_pct NUMERIC(8, 2) NOT NULL,  -- (variance_qty / expected_qty) * 100
    uom VARCHAR(50) NOT NULL,
    unit_cost NUMERIC(12, 4) NOT NULL,
    variance_cost NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_take_outlet ON physical_stock_takes(outlet_id, stock_take_date);

-- ============================================================================
-- SEED DATA: OUTLETS, RAW MATERIALS, BOM RECIPES & INITIAL LEDGER
-- ============================================================================

-- Raw Materials
INSERT INTO raw_materials (id, name, category, purchase_uom, consumption_uom, conversion_factor, cost_per_purchase_uom, reorder_threshold) VALUES
('raw-001', 'Black Tapioca Boba Pearls', 'BOBA_TOPPINGS', 'KG', 'GRAM', 1000.0000, 320.00, 15.00),
('raw-002', 'Farm Fresh Whole Milk (3.5% Fat)', 'DAIRY', 'LITER', 'MILLILITER', 1000.0000, 72.00, 40.00),
('raw-003', 'Taiwanese Brown Sugar Syrup (Tiger)', 'SYRUPS', 'LITER', 'MILLILITER', 1000.0000, 450.00, 8.00),
('raw-004', 'Ceylon Black Tea Leaves', 'TEA_BASE', 'KG', 'GRAM', 1000.0000, 680.00, 5.00),
('raw-005', 'Ceremonial Uji Matcha Powder', 'POWDERS', 'KG', 'GRAM', 1000.0000, 1800.00, 3.00),
('raw-006', 'Creamy Taro Powder Mix', 'POWDERS', 'KG', 'GRAM', 1000.0000, 580.00, 5.00),
('raw-007', 'Cream Cheese Cap Foam Blend', 'DAIRY', 'KG', 'GRAM', 1000.0000, 620.00, 6.00),
('raw-008', 'Mango Juice Popping Boba', 'BOBA_TOPPINGS', 'KG', 'GRAM', 1000.0000, 420.00, 10.00),
('raw-009', '500ml Frosted PP Boba Cup', 'PACKAGING', 'BOX', 'UNIT', 500.0000, 1500.00, 200.00),
('raw-010', '12mm Individually Wrapped Boba Straw', 'PACKAGING', 'BOX', 'UNIT', 1000.0000, 800.00, 300.00),
('raw-011', 'POP O BOB Branded Cup Sealing Film', 'PACKAGING', 'ROLL', 'UNIT', 2500.0000, 1250.00, 500.00),
('raw-012', 'Belgian Cut Potato Fries', 'SNACKS', 'KG', 'GRAM', 1000.0000, 190.00, 25.00),
('raw-013', 'Truffle Mayo Dressing', 'CONDIMENTS', 'KG', 'GRAM', 1000.0000, 650.00, 4.00),
('raw-014', 'Boneless Chicken Breast (Marinated)', 'PROTEIN', 'KG', 'GRAM', 1000.0000, 340.00, 18.00)
ON CONFLICT (id) DO NOTHING;

-- Recipes (Bill of Materials)
-- Tiger Brown Sugar Boba (prod-01)
INSERT INTO recipes (id, menu_item_id, menu_item_name, raw_material_id, quantity_consumed, uom, notes) VALUES
('rcp-01-1', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-001', 45.0000, 'GRAM', 'Cooked & steeped in brown sugar'),
('rcp-01-2', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-002', 180.0000, 'MILLILITER', 'Chilled fresh milk'),
('rcp-01-3', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-003', 35.0000, 'MILLILITER', 'Wall tiger stripe drizzle'),
('rcp-01-4', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-009', 1.0000, 'UNIT', '500ml Cup'),
('rcp-01-5', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-010', 1.0000, 'UNIT', '12mm Straw'),
('rcp-01-6', 'prod-01', 'Tiger Brown Sugar Boba', 'raw-011', 1.0000, 'UNIT', 'Machine Seal')
ON CONFLICT (id) DO NOTHING;

-- Ceylon Milk Tea (prod-02)
INSERT INTO recipes (id, menu_item_id, menu_item_name, raw_material_id, quantity_consumed, uom, notes) VALUES
('rcp-02-1', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-004', 12.0000, 'GRAM', 'Freshly brewed tea decoction'),
('rcp-02-2', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-002', 160.0000, 'MILLILITER', 'Steamed/chilled milk'),
('rcp-02-3', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-001', 35.0000, 'GRAM', 'Standard boba scoop'),
('rcp-02-4', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-009', 1.0000, 'UNIT', 'Cup'),
('rcp-02-5', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-010', 1.0000, 'UNIT', 'Straw'),
('rcp-02-6', 'prod-02', 'Authentic Ceylon Milk Tea', 'raw-011', 1.0000, 'UNIT', 'Sealing Film')
ON CONFLICT (id) DO NOTHING;

-- Velvet Cheese Foam Matcha (prod-06)
INSERT INTO recipes (id, menu_item_id, menu_item_name, raw_material_id, quantity_consumed, uom, notes) VALUES
('rcp-06-1', 'prod-06', 'Velvet Cheese Foam Matcha', 'raw-005', 8.0000, 'GRAM', 'Whisked ceremonial grade'),
('rcp-06-2', 'prod-06', 'Velvet Cheese Foam Matcha', 'raw-002', 170.0000, 'MILLILITER', 'Cold whole milk'),
('rcp-06-3', 'prod-06', 'Velvet Cheese Foam Matcha', 'raw-007', 50.0000, 'GRAM', 'Whipped cheese top layer'),
('rcp-06-4', 'prod-06', 'Velvet Cheese Foam Matcha', 'raw-009', 1.0000, 'UNIT', 'Cup'),
('rcp-06-5', 'prod-06', 'Velvet Cheese Foam Matcha', 'raw-010', 1.0000, 'UNIT', 'Straw')
ON CONFLICT (id) DO NOTHING;

-- Truffle Parmesan Fries (prod-04)
INSERT INTO recipes (id, menu_item_id, menu_item_name, raw_material_id, quantity_consumed, uom, notes) VALUES
('rcp-04-1', 'prod-04', 'Truffle Parmesan Fries', 'raw-012', 200.0000, 'GRAM', 'Double fried portions'),
('rcp-04-2', 'prod-04', 'Truffle Parmesan Fries', 'raw-013', 40.0000, 'GRAM', 'Truffle drizzle & dip')
ON CONFLICT (id) DO NOTHING;

-- Chicken Tikka Roll (prod-03)
INSERT INTO recipes (id, menu_item_id, menu_item_name, raw_material_id, quantity_consumed, uom, notes) VALUES
('rcp-03-1', 'prod-03', 'Chicken Tikka Roll', 'raw-014', 160.0000, 'GRAM', 'Grilled chicken portion')
ON CONFLICT (id) DO NOTHING;
