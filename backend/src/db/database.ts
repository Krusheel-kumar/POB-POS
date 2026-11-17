import { createClient, type Client } from '@libsql/client';
import path from 'path';
import { pgDatabase } from './pgDatabase.js';
import dotenv from 'dotenv';
dotenv.config();

const dbPath = path.resolve(process.cwd(), 'pos_production.db');
const sqliteClient: Client = createClient({
  url: `file:${dbPath}`,
});

export let isPostgresActive = false;

export const db = {
  execute: async (statement: string | { sql: string; args?: any[] }) => {
    if (isPostgresActive) {
      return pgDatabase.execute(statement);
    }
    return sqliteClient.execute(statement as any);
  },
};

export async function initDatabase(): Promise<void> {
  // Test and initialize PostgreSQL if requested or configured
  if (process.env.DATABASE_TYPE === 'postgres' || process.env.DATABASE_URL) {
    try {
      console.log('[Database] Initializing PostgreSQL schema & connection...');
      await pgDatabase.initSchema();
      const connected = await pgDatabase.testConnection();
      if (connected) {
        isPostgresActive = true;
        console.log('====================================================');
        console.log('🚀 [Database] CONNECTED TO POSTGRESQL PRODUCTION DB!');
        console.log(`   Host: ${process.env.PGHOST || 'localhost'}:${process.env.PGPORT || '5432'}`);
        console.log(`   Database: ${process.env.PGDATABASE || 'pob_pos'}`);
        console.log(`   User: ${process.env.PGUSER || 'postgres'}`);
        console.log('====================================================');
        return;
      }
    } catch (err: any) {
      console.warn('[Database] PostgreSQL connection attempt failed:', err.message);
      console.warn('[Database] Falling back to SQLite WAL engine until PostgreSQL credentials are provided.');
    }
  }

  isPostgresActive = false;
  // Enable Write-Ahead Logging for high concurrency and zero locking
  await sqliteClient.execute('PRAGMA journal_mode = WAL;');
  await sqliteClient.execute('PRAGMA foreign_keys = ON;');

  // 1. OUTLETS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS outlets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      address TEXT,
      phone TEXT,
      manager_name TEXT,
      payment_policy TEXT DEFAULT 'FLEXIBLE',
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 2. CATEGORIES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      display_order INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      subcategories TEXT, -- JSON array of subcategories
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 3. ADDONS / TOPPINGS / MODIFIERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS add_ons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0.0,
      category TEXT NOT NULL, -- 'Choice Of Size', 'Choice Of Sweetness', etc.
      selection_type TEXT DEFAULT 'SINGLE', -- 'SINGLE' or 'MULTI'
      min_selections INTEGER DEFAULT 1,
      max_selections INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 4. PRODUCTS / MENU ITEMS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      subcategory TEXT,
      name TEXT NOT NULL,
      description TEXT,
      sku TEXT UNIQUE,
      base_price REAL NOT NULL,
      image_url TEXT,
      badge TEXT,
      dietary_type TEXT DEFAULT 'BEVERAGE', -- 'BEVERAGE', 'VEG', 'NON_VEG', 'VEGAN'
      prep_time_minutes INTEGER DEFAULT 5,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  // 5. PRODUCT ADD-ON MAPPINGS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS product_addons (
      product_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      PRIMARY KEY (product_id, addon_id),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (addon_id) REFERENCES add_ons(id) ON DELETE CASCADE
    );
  `);

  // 6. RESTAURANT TABLES
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      outlet_id TEXT NOT NULL,
      table_number TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      status TEXT DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED', 'BILLED'
      current_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 7. SEQUENCES (Gapless numbering engine for Bills, Orders, KOTs)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sequences (
      name TEXT PRIMARY KEY,
      last_value INTEGER DEFAULT 0
    );
  `);

  // 8. ORDERS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      outlet_id TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      order_type TEXT NOT NULL, -- 'DINE_IN', 'TAKEAWAY', 'COUNTER'
      status TEXT DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'BILLED', 'CANCELLED'
      customer_name TEXT,
      customer_phone TEXT,
      table_id TEXT,
      table_number TEXT,
      customer_notes TEXT,
      subtotal REAL NOT NULL DEFAULT 0.0,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      taxable_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL DEFAULT 0.0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // 9. ORDER ITEMS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name_snapshot TEXT NOT NULL,
      variant_name_snapshot TEXT,
      unit_price_snapshot REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      line_total_snapshot REAL NOT NULL,
      item_notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // 10. ORDER ITEM ADDONS (Toppings applied to this line item)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_item_addons (
      id TEXT PRIMARY KEY,
      order_item_id TEXT NOT NULL,
      addon_id TEXT NOT NULL,
      addon_name_snapshot TEXT NOT NULL,
      addon_price_snapshot REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
    );
  `);

  // 11. BILLS / INVOICES (GST Tax compliant, sequential gapless numbers)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      outlet_id TEXT NOT NULL,
      invoice_number TEXT NOT NULL UNIQUE,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0.0,
      taxable_amount REAL NOT NULL,
      cgst_rate REAL NOT NULL DEFAULT 2.5,
      cgst_amount REAL NOT NULL DEFAULT 0.0,
      sgst_rate REAL NOT NULL DEFAULT 2.5,
      sgst_amount REAL NOT NULL DEFAULT 0.0,
      tax_amount REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      paid_amount REAL NOT NULL DEFAULT 0.0,
      status TEXT NOT NULL DEFAULT 'ISSUED', -- 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      settled_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // 12. PAYMENTS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL, -- 'CASH', 'UPI', 'CARD', 'OTHER'
      status TEXT NOT NULL DEFAULT 'SUCCESSFUL', -- 'PENDING', 'SUCCESSFUL', 'FAILED'
      idempotency_key TEXT,
      transaction_reference TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
    );
  `);

  // 13. KITCHEN ORDER TICKETS (KOT)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kitchen_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT NOT NULL,
      outlet_id TEXT NOT NULL,
      order_id TEXT NOT NULL,
      order_number_snapshot TEXT NOT NULL,
      order_type_snapshot TEXT NOT NULL,
      table_number_snapshot TEXT,
      status TEXT DEFAULT 'QUEUED', -- 'QUEUED', 'PREPARING', 'READY', 'CANCELLED'
      customer_notes_snapshot TEXT,
      cancellation_reason TEXT,
      reprint_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // 14. KITCHEN TICKET ITEMS
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kitchen_ticket_items (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      order_item_id TEXT,
      product_name_snapshot TEXT NOT NULL,
      variant_name_snapshot TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      status TEXT DEFAULT 'QUEUED',
      is_voided INTEGER DEFAULT 0,
      void_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (ticket_id) REFERENCES kitchen_tickets(id) ON DELETE CASCADE
    );
  `);

  // 15. KITCHEN TICKET ITEM ADDONS (Detailed toppings on KOT print)
  await db.execute(`
    CREATE TABLE IF NOT EXISTS kitchen_ticket_item_addons (
      id TEXT PRIMARY KEY,
      ticket_item_id TEXT NOT NULL,
      addon_name_snapshot TEXT NOT NULL,
      FOREIGN KEY (ticket_item_id) REFERENCES kitchen_ticket_items(id) ON DELETE CASCADE
    );
  `);

  // Seed default flagship outlet if empty
  const outletCheck = await db.execute('SELECT COUNT(*) as count FROM outlets');
  if (Number(outletCheck.rows[0].count) === 0) {
    await seedInitialData();
  }
}

/**
 * Atomic Gapless Sequence Generator
 * Guarantees zero gaps for GST invoices and sequential KOT tickets
 */
export async function getNextSequence(sequenceName: string): Promise<number> {
  if (isPostgresActive) {
    return pgDatabase.getNextSequence(sequenceName);
  }

  const selectRes = await db.execute({
    sql: 'SELECT last_value FROM sequences WHERE name = ?',
    args: [sequenceName],
  });

  if (selectRes.rows.length === 0) {
    await db.execute({
      sql: 'INSERT INTO sequences (name, last_value) VALUES (?, 1)',
      args: [sequenceName],
    });
    return 1;
  }

  const nextVal = Number(selectRes.rows[0].last_value) + 1;
  await db.execute({
    sql: 'UPDATE sequences SET last_value = ? WHERE name = ?',
    args: [nextVal, sequenceName],
  });
  return nextVal;
}

async function seedInitialData(): Promise<void> {
  // Outlet
  await db.execute({
    sql: `INSERT INTO outlets (id, name, code, address, phone, manager_name, payment_policy)
          VALUES ('outlet-demo-flagship', 'POP O'' BOB - Flagship Film Nagar', 'POB-FN-01',
                  '407, Mezzanine, Road No 81, Film Nagar, Hyderabad, Telangana 500096',
                  '+91 98765 43210', 'Arjun Varma', 'FLEXIBLE')`,
    args: [],
  });

  // Categories
  const categories = [
    { id: 'cat-boba', name: '🧋 Boba & Specialty Teas', desc: 'Handcrafted boba and specialty milk teas', subcats: JSON.stringify(['Milk Teas', 'Fruit Teas', 'Cheese Foam']) },
    { id: 'cat-snacks', name: '🍟 Korean Street Snacks', desc: 'Crispy snacks, corn dogs and loaded fries', subcats: JSON.stringify(['Corn Dogs', 'Fries & Dips', 'Bites']) },
    { id: 'cat-waffles', name: '🧇 Bubble Waffles & Desserts', desc: 'Warm egg waffles with fresh gelato', subcats: JSON.stringify(['Egg Waffles', 'Gelato']) },
  ];

  for (const c of categories) {
    await db.execute({
      sql: 'INSERT INTO categories (id, name, description, subcategories) VALUES (?, ?, ?, ?)',
      args: [c.id, c.name, c.desc, c.subcats],
    });
  }

  // Add-ons
  const addOns = [
    { id: 'addon-size-reg', name: 'Regular (400ml)', price: 0, cat: 'Choice Of Size', type: 'SINGLE' },
    { id: 'addon-size-med', name: 'Medium (500ml)', price: 40, cat: 'Choice Of Size', type: 'SINGLE' },
    { id: 'addon-size-lg', name: 'Large (700ml)', price: 70, cat: 'Choice Of Size', type: 'SINGLE' },
    { id: 'addon-sweet-100', name: '100% Normal Sugar', price: 0, cat: 'Choice Of Sweetness', type: 'SINGLE' },
    { id: 'addon-sweet-70', name: '70% Less Sugar', price: 0, cat: 'Choice Of Sweetness', type: 'SINGLE' },
    { id: 'addon-sweet-50', name: '50% Half Sugar', price: 0, cat: 'Choice Of Sweetness', type: 'SINGLE' },
    { id: 'addon-sweet-0', name: '0% Sugar-Free', price: 0, cat: 'Choice Of Sweetness', type: 'SINGLE' },
    { id: 'addon-ice-reg', name: 'Regular Ice', price: 0, cat: 'Choice Of Ice Level', type: 'SINGLE' },
    { id: 'addon-ice-less', name: 'Less Ice', price: 0, cat: 'Choice Of Ice Level', type: 'SINGLE' },
    { id: 'addon-ice-none', name: 'No Ice', price: 0, cat: 'Choice Of Ice Level', type: 'SINGLE' },
    { id: 'addon-pearls', name: 'Extra Brown Sugar Boba', price: 35, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
    { id: 'addon-golden-boba', name: 'Golden Honey Boba', price: 35, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
    { id: 'addon-crystal-boba', name: 'Chewy Crystal Boba', price: 40, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
    { id: 'addon-mango-popping', name: 'Mango Popping Boba', price: 35, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
    { id: 'addon-lychee-jelly', name: 'Lychee Coconut Jelly', price: 30, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
    { id: 'addon-cheese-foam', name: 'Velvet Cheese Foam Cap', price: 45, cat: 'Choice Of Boba & Toppings', type: 'MULTI' },
  ];

  for (const a of addOns) {
    await db.execute({
      sql: 'INSERT INTO add_ons (id, name, price, category, selection_type) VALUES (?, ?, ?, ?, ?)',
      args: [a.id, a.name, a.price, a.cat, a.type],
    });
  }

  // Products
  const products = [
    {
      id: 'prod-boba-1',
      catId: 'cat-boba',
      subcat: 'Milk Teas',
      name: 'Tiger Brown Sugar Boba',
      desc: 'Fresh organic milk with warm chewy tapioca pearls and caramelized brown sugar.',
      sku: 'TEA-TGR-01',
      price: 240,
      image: 'https://images.unsplash.com/photo-1558857563-b371f30ca6a5?w=500&auto=format&fit=crop&q=80',
      badge: 'Bestseller',
      dietary: 'BEVERAGE',
    },
    {
      id: 'prod-boba-2',
      catId: 'cat-boba',
      subcat: 'Milk Teas',
      name: 'Kyoto Ceremonial Matcha',
      desc: 'First-harvest Uji matcha hand-whisked over silky textured milk and honey.',
      sku: 'TEA-MTC-02',
      price: 260,
      image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=80',
      badge: 'Chef Special',
      dietary: 'BEVERAGE',
    },
    {
      id: 'prod-boba-3',
      catId: 'cat-boba',
      subcat: 'Fruit Teas',
      name: 'Mango Passion Popping Tea',
      desc: 'Refreshing jasmine green tea infused with ripe alphonso mango purée and popping pearls.',
      sku: 'TEA-MNG-03',
      price: 220,
      image: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=500&auto=format&fit=crop&q=80',
      badge: 'Summer Special',
      dietary: 'BEVERAGE',
    },
    {
      id: 'prod-boba-4',
      catId: 'cat-boba',
      subcat: 'Milk Teas',
      name: 'Royal Taro Milk Tea',
      desc: 'Slow-cooked organic taro paste blended with Ceylon black tea and velvety creamer.',
      sku: 'TEA-TRO-04',
      price: 230,
      image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80',
      badge: 'Customer Fav',
      dietary: 'BEVERAGE',
    },
  ];

  for (const p of products) {
    await db.execute({
      sql: `INSERT INTO products (id, category_id, subcategory, name, description, sku, base_price, image_url, badge, dietary_type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.catId, p.subcat, p.name, p.desc, p.sku, p.price, p.image, p.badge, p.dietary],
    });

    // Map all standard add-ons to each boba drink
    for (const a of addOns) {
      await db.execute({
        sql: 'INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)',
        args: [p.id, a.id],
      });
    }
  }

  // Restaurant Tables (T1 to T8)
  for (let i = 1; i <= 8; i++) {
    await db.execute({
      sql: 'INSERT INTO tables (id, outlet_id, table_number, capacity) VALUES (?, ?, ?, ?)',
      args: [`tbl-fn-${i}`, 'outlet-demo-flagship', `T${i}`, i <= 2 ? 2 : i <= 6 ? 4 : 6],
    });
  }
}
