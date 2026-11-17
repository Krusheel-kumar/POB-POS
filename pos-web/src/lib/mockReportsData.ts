import { mockStore } from '../data/mockStore';
import type { Bill, BillStatus } from '../types/pos';

export interface PaymentSplit {
  mode: string;
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface DailySummary {
  grossSales: number;
  netSales: number;
  totalTax: number;
  discounts: number;
  totalOrders: number;
  averageOrderValue: number;
  paymentSplits: {
    cash: number;
    upi: number;
    swiggy: number;
    zomato: number;
    cards: number;
  };
  detailedSplits: PaymentSplit[];
}

export interface HourlySalesPoint {
  hour: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

export interface ItemMatrixRecord {
  id: string;
  name: string;
  category: string;
  qtySold: number;
  unitPrice: number;
  totalRevenue: number;
  foodCostPct: number;
}

export interface VoidAuditRecord {
  id: string;
  time: string;
  item: string;
  qty: number;
  amount: number;
  originalWaiter: string;
  managerPin: string;
  reason: string;
  orderNumber: string;
  tableNumber: string;
}

export const MOCK_DAILY_SUMMARY: DailySummary = {
  grossSales: 168450,
  netSales: 152800,
  totalTax: 7640,
  discounts: 8010,
  totalOrders: 342,
  averageOrderValue: 492.54,
  paymentSplits: {
    cash: 23650,
    upi: 75800,
    swiggy: 33700,
    zomato: 25300,
    cards: 10000,
  },
  detailedSplits: [
    { mode: 'UPI', label: 'UPI / QR Scan', amount: 75800, percentage: 45.0, color: '#4f46e5' },
    { mode: 'SWIGGY', label: 'Swiggy Online', amount: 33700, percentage: 20.0, color: '#f97316' },
    { mode: 'ZOMATO', label: 'Zomato Online', amount: 25300, percentage: 15.0, color: '#ef4444' },
    { mode: 'CASH', label: 'Cash Drawer', amount: 23650, percentage: 14.0, color: '#10b981' },
    { mode: 'CARDS', label: 'Credit/Debit Card', amount: 10000, percentage: 6.0, color: '#0ea5e9' },
  ],
};

export const MOCK_HOURLY_SALES: HourlySalesPoint[] = [
  { hour: '10:00 AM', revenue: 2400, orders: 6, avgTicket: 400 },
  { hour: '11:00 AM', revenue: 5600, orders: 12, avgTicket: 466 },
  { hour: '12:00 PM', revenue: 11800, orders: 24, avgTicket: 491 },
  { hour: '01:00 PM', revenue: 22400, orders: 46, avgTicket: 486 },
  { hour: '02:00 PM', revenue: 19500, orders: 38, avgTicket: 513 },
  { hour: '03:00 PM', revenue: 7200, orders: 15, avgTicket: 480 },
  { hour: '04:00 PM', revenue: 8900, orders: 19, avgTicket: 468 },
  { hour: '05:00 PM', revenue: 14200, orders: 31, avgTicket: 458 },
  { hour: '06:00 PM', revenue: 17800, orders: 37, avgTicket: 481 },
  { hour: '07:00 PM', revenue: 19600, orders: 40, avgTicket: 490 },
  { hour: '08:00 PM', revenue: 24500, orders: 49, avgTicket: 500 },
  { hour: '09:00 PM', revenue: 22100, orders: 44, avgTicket: 502 },
  { hour: '10:00 PM', revenue: 13800, orders: 27, avgTicket: 511 },
  { hour: '11:00 PM', revenue: 4550, orders: 9, avgTicket: 505 },
];

export const MOCK_ITEM_MATRIX: ItemMatrixRecord[] = [
  { id: 'itm-01', name: 'Tiger Brown Sugar Boba', category: 'Specialty Boba', qtySold: 92, unitPrice: 240, totalRevenue: 22080, foodCostPct: 24 },
  { id: 'itm-02', name: 'Authentic Ceylon Milk Tea', category: 'Classic Teas', qtySold: 84, unitPrice: 249, totalRevenue: 20916, foodCostPct: 22 },
  { id: 'itm-03', name: 'Chicken Tikka Roll', category: 'Snacks & Quick Bites', qtySold: 76, unitPrice: 250, totalRevenue: 19000, foodCostPct: 32 },
  { id: 'itm-04', name: 'Truffle Parmesan Fries', category: 'Sides & Dips', qtySold: 68, unitPrice: 220, totalRevenue: 14960, foodCostPct: 20 },
  { id: 'itm-05', name: 'Mango Popping Boba Tea', category: 'Fruit Teas', qtySold: 54, unitPrice: 240, totalRevenue: 12960, foodCostPct: 26 },
  { id: 'itm-06', name: 'Velvet Cheese Foam Matcha', category: 'Cheese Foam Special', qtySold: 48, unitPrice: 260, totalRevenue: 12480, foodCostPct: 28 },
  { id: 'itm-07', name: 'Peri-Peri Fried Chicken Strips', category: 'Snacks & Quick Bites', qtySold: 42, unitPrice: 280, totalRevenue: 11760, foodCostPct: 34 },
  { id: 'itm-08', name: 'Classic Cold Coffee', category: 'Cold Brews & Coffee', qtySold: 59, unitPrice: 190, totalRevenue: 11210, foodCostPct: 21 },
  { id: 'itm-09', name: 'Paneer Tikka Sandwich', category: 'Sandwiches & Melts', qtySold: 39, unitPrice: 220, totalRevenue: 8580, foodCostPct: 29 },
  { id: 'itm-10', name: 'Taro Coconut Cream Tea', category: 'Specialty Boba', qtySold: 34, unitPrice: 250, totalRevenue: 8500, foodCostPct: 27 },
  { id: 'itm-11', name: 'Iced Spanish Latte', category: 'Cold Brews & Coffee', qtySold: 29, unitPrice: 220, totalRevenue: 6380, foodCostPct: 25 },
  { id: 'itm-12', name: 'Butter Croissant', category: 'Bakery & Pastry', qtySold: 25, unitPrice: 150, totalRevenue: 3750, foodCostPct: 35 },
  { id: 'itm-13', name: 'Peach Passion Green Tea', category: 'Fruit Teas', qtySold: 18, unitPrice: 200, totalRevenue: 3600, foodCostPct: 23 },
  { id: 'itm-14', name: 'Mint Mojito Refresher', category: 'Mocktails', qtySold: 12, unitPrice: 160, totalRevenue: 1920, foodCostPct: 18 },
  { id: 'itm-15', name: 'Herbal Chamomile Tea', category: 'Hot Brews', qtySold: 5, unitPrice: 190, totalRevenue: 950, foodCostPct: 15 },
  { id: 'itm-16', name: 'Vegan Gluten-Free Biscotti', category: 'Bakery & Pastry', qtySold: 3, unitPrice: 190, totalRevenue: 570, foodCostPct: 40 },
  { id: 'itm-17', name: 'Decaf Espresso Shot Single', category: 'Hot Brews', qtySold: 2, unitPrice: 90, totalRevenue: 180, foodCostPct: 16 },
];

export const MOCK_VOID_AUDIT_LOG: VoidAuditRecord[] = [
  {
    id: 'void-001',
    time: '11:20 AM',
    item: 'Classic Cold Coffee',
    qty: 2,
    amount: 380,
    originalWaiter: 'Rahul S. (W-03)',
    managerPin: '****4402',
    reason: 'Customer Changed Mind',
    orderNumber: 'ORD-1004',
    tableNumber: 'Table #04',
  },
  {
    id: 'void-002',
    time: '01:45 PM',
    item: 'Chicken Tikka Roll',
    qty: 1,
    amount: 250,
    originalWaiter: 'Arjun K. (W-01)',
    managerPin: '****8891',
    reason: 'Wrong Item Punched on POS',
    orderNumber: 'ORD-1048',
    tableNumber: 'Table #12',
  },
  {
    id: 'void-003',
    time: '03:10 PM',
    item: 'Taro Coconut Cream Tea',
    qty: 1,
    amount: 250,
    originalWaiter: 'Priya M. (W-05)',
    managerPin: '****4402',
    reason: 'Preparation Delayed >25 mins',
    orderNumber: 'ORD-1092',
    tableNumber: 'QSR Counter #01',
  },
  {
    id: 'void-004',
    time: '07:35 PM',
    item: 'Truffle Parmesan Fries',
    qty: 2,
    amount: 440,
    originalWaiter: 'Rahul S. (W-03)',
    managerPin: '****1109',
    reason: 'Accidental Duplicate KOT Fire',
    orderNumber: 'ORD-1178',
    tableNumber: 'Table #07',
  },
  {
    id: 'void-005',
    time: '08:50 PM',
    item: 'Tiger Brown Sugar Boba',
    qty: 3,
    amount: 720,
    originalWaiter: 'Vikram P. (W-02)',
    managerPin: '****8891',
    reason: 'Takeaway Customer Left Without Pick',
    orderNumber: 'ORD-1233',
    tableNumber: 'Parcel Counter #02',
  },
  {
    id: 'void-006',
    time: '10:15 PM',
    item: 'Paneer Tikka Sandwich',
    qty: 1,
    amount: 220,
    originalWaiter: 'Arjun K. (W-01)',
    managerPin: '****1109',
    reason: 'Cottage Cheese Out of Stock',
    orderNumber: 'ORD-1310',
    tableNumber: 'Table #02',
  },
];

// Helper to format currency in Indian format: ₹1,45,000
export const formatINR = (value: number, includeDecimals = false): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(value);
};

const STORAGE_VOID_KEY = 'pob_void_audit_logs';

export function getVoidAuditLogs(): VoidAuditRecord[] {
  if (typeof window === 'undefined') return MOCK_VOID_AUDIT_LOG;
  try {
    const raw = localStorage.getItem(STORAGE_VOID_KEY);
    if (!raw) return MOCK_VOID_AUDIT_LOG;
    return JSON.parse(raw);
  } catch {
    return MOCK_VOID_AUDIT_LOG;
  }
}

export function recordVoidAuditLog(entry: {
  item: string;
  qty: number;
  amount: number;
  originalWaiter: string;
  managerPin: string;
  reason: string;
  orderNumber: string;
  tableNumber: string;
}): VoidAuditRecord {
  const current = getVoidAuditLogs();
  const timeFormatted = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const newRecord: VoidAuditRecord = {
    id: `void-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    time: timeFormatted,
    ...entry,
    managerPin: `****${entry.managerPin.slice(-4) || '1234'}`,
  };

  const updated = [newRecord, ...current];
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_VOID_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.warn('Failed to save void log to storage:', e);
  }

  return newRecord;
}

// ---------------------------------------------------------------------------
// Settled Sales Invoices & Real-time Billing Register
// ---------------------------------------------------------------------------
export interface SettledInvoiceRecord {
  id: string;
  invoiceNumber: string;
  orderNumber: string;
  createdAt: string; // ISO date string for range filtering
  dateFormatted: string;
  timeFormatted: string;
  customerName: string;
  customerPhone: string;
  tableOrChannel: string;
  orderType: string;
  itemsSummary: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'UPI' | 'CASH' | 'CARD';
  transactionReference: string;
  status: BillStatus;
  rawBill?: Bill;
}

export const HISTORICAL_SETTLED_INVOICES: SettledInvoiceRecord[] = [];

export function getSettledSalesInvoices(): SettledInvoiceRecord[] {
  let liveBills: Bill[] = [];
  try {
    liveBills = mockStore.getBills();
  } catch (err) {
    console.warn('Failed to get bills from mockStore:', err);
  }

  const liveOrders = mockStore.getOrders();

  // Convert live bills from POS store
  const convertedLive: SettledInvoiceRecord[] = liveBills
    .filter((b) => b.status === 'PAID' || (b.paidAmount && b.paidAmount > 0))
    .map((b) => {
      const associatedOrder = b.order?.id
        ? liveOrders.find((o) => o.id === b.order?.id)
        : null;

      const pmt = (b.payments && b.payments.length > 0) ? b.payments[0] : null;
      const method: 'UPI' | 'CASH' | 'CARD' =
        pmt?.paymentMethod === 'CASH' ? 'CASH' :
        pmt?.paymentMethod === 'CARD' ? 'CARD' : 'UPI';

      const createdDate = new Date(b.createdAt);

      const itemsDesc = associatedOrder?.items && associatedOrder.items.length > 0
        ? associatedOrder.items.map((it) => `${it.quantity}x ${it.productNameSnapshot}${it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ''}`).join(', ')
        : (b.order?.items && b.order.items.length > 0)
        ? b.order.items.map((it) => `${it.quantity}x ${it.productNameSnapshot}${it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ''}`).join(', ')
        : 'Assorted Bubble Tea & Cafe Items';

      const tableInfo = associatedOrder?.table?.tableNumber
        ? `Table #${associatedOrder.table.tableNumber}`
        : b.order?.table?.tableNumber
        ? `Table #${b.order.table.tableNumber}`
        : associatedOrder?.orderType === 'TAKEAWAY' || b.order?.orderType === 'TAKEAWAY'
        ? 'Takeaway Parcel'
        : 'Counter Pickup';

      const cgst = Number((b.taxAmount / 2).toFixed(2));
      const sgst = Number((b.taxAmount / 2).toFixed(2));

      return {
        id: b.id,
        invoiceNumber: b.invoiceNumber,
        orderNumber: b.order?.orderNumber || associatedOrder?.orderNumber || 'ORD-2026-LIVE',
        createdAt: b.createdAt,
        dateFormatted: createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        timeFormatted: createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        customerName: b.customerName || associatedOrder?.customerName || 'Walk-in Guest',
        customerPhone: b.customerPhone || associatedOrder?.customerPhone || '',
        tableOrChannel: tableInfo,
        orderType: b.order?.orderType || associatedOrder?.orderType || 'COUNTER',
        itemsSummary: itemsDesc,
        subtotal: b.subtotal,
        discountAmount: b.discountAmount || 0,
        taxableAmount: b.taxableAmount,
        cgst,
        sgst,
        taxAmount: b.taxAmount,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount || b.totalAmount,
        paymentMethod: method,
        transactionReference: pmt?.transactionReference || `PMT-${b.invoiceNumber}`,
        status: b.status,
        rawBill: b,
      };
    });

  // Return live sorted by createdAt descending
  return convertedLive.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

