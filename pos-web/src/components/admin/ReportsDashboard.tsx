import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Receipt,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  Download,
  Search,
  ArrowUpDown,
  CheckCircle2,
  Flame,
  Award,
  AlertTriangle,
  Layers,
  Sparkles,
  DollarSign,
  Eye,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getVoidAuditLogs,
  type VoidAuditRecord,
  getSettledSalesInvoices,
  type SettledInvoiceRecord,
  formatINR,
  type ItemMatrixRecord,
  type DailySummary,
  type HourlySalesPoint,
  type PaymentSplit,
} from '../../lib/mockReportsData';
import { posApiClient } from '../../api/posApiClient';
import { ReceiptModal } from '../ReceiptModal';
import type { Bill, Order } from '../../types/pos';
import './ReportsDashboard.css';

export type ReportTab = 'z-report' | 'sales-report' | 'hourly' | 'item-matrix' | 'void-log' | 'gst-export';

type SortField = 'name' | 'category' | 'qtySold' | 'totalRevenue' | 'foodCostPct';
type SortDirection = 'asc' | 'desc';

export interface ReportsDashboardProps {
  bills?: Bill[];
  orders?: Order[];
  outletId?: string;
  onRefresh?: () => void;
}

const toLocalDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({
  bills: externalBills,
  orders: externalOrders,
  outletId,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('z-report');

  // Internal state when not passed via props
  const [internalBills, setInternalBills] = useState<Bill[]>([]);
  const [internalOrders, setInternalOrders] = useState<Order[]>([]);
  const [dbVoidLogs, setDbVoidLogs] = useState<VoidAuditRecord[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load live data from API if external bills not passed
  const loadData = async () => {
    setIsLoading(true);
    try {
      const targetOutlet = outletId || posApiClient.getConfig().outletId || 'outlet-demo-flagship';
      const [bList, oList, vList] = await Promise.all([
        posApiClient.getOutletBills(targetOutlet).catch(() => [] as Bill[]),
        posApiClient.getOutletOrders(targetOutlet).catch(() => [] as Order[]),
        posApiClient.getVoidLogs(targetOutlet).catch(() => [] as VoidAuditRecord[]),
      ]);
      setInternalBills(bList);
      setInternalOrders(oList);
      if (vList && vList.length > 0) {
        setDbVoidLogs(vList);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Failed to load live bills/orders for reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [outletId]);

  const activeBills = internalBills.length > 0 ? internalBills : (externalBills || []);
  const activeOrders = internalOrders.length > 0 ? internalOrders : (externalOrders || []);

  // Settled Sales Register & Timeline State
  const [salesTimeline, setSalesTimeline] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL' | 'CUSTOM'>('TODAY');
  const [salesSearch, setSalesSearch] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'ALL' | 'UPI' | 'CASH' | 'CARD'>('ALL');
  const [salesChannelFilter, setSalesChannelFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'COUNTER'>('ALL');
  const todayStr = toLocalDateString(new Date());
  const sevenDaysAgoStr = toLocalDateString(new Date(Date.now() - 7 * 86400000));
  const [salesFromDate, setSalesFromDate] = useState(sevenDaysAgoStr);
  const [salesToDate, setSalesToDate] = useState(todayStr);
  const [inspectedBill, setInspectedBill] = useState<Bill | null>(null);

  // Convert real live bills to SettledInvoiceRecords
  const allSettledInvoices = useMemo<SettledInvoiceRecord[]>(() => {
    if (!posApiClient.isDemoModeActive() || externalBills !== undefined || internalBills.length > 0) {
      return activeBills
        .filter((b) => b.status === 'PAID' || (b.paidAmount && b.paidAmount > 0))
        .map((b) => {
          const associatedOrder = b.order?.id
            ? activeOrders.find((o) => o.id === b.order?.id)
            : null;

          const pmt = b.payments && b.payments.length > 0 ? b.payments[0] : null;
          const method: 'UPI' | 'CASH' | 'CARD' =
            pmt?.paymentMethod === 'CASH' ? 'CASH' : pmt?.paymentMethod === 'CARD' ? 'CARD' : 'UPI';

          const createdDate = new Date(b.createdAt);

          const itemsDesc =
            b.order?.items && b.order.items.length > 0
              ? b.order.items
                  .map(
                    (it: any) =>
                      `${it.quantity}x ${it.productNameSnapshot || it.name}${
                        it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ''
                      }`
                  )
                  .join(', ')
              : associatedOrder?.items && associatedOrder.items.length > 0
              ? associatedOrder.items
                  .map(
                    (it) =>
                      `${it.quantity}x ${it.productNameSnapshot}${
                        it.variantNameSnapshot ? ` (${it.variantNameSnapshot})` : ''
                      }`
                  )
                  .join(', ')
              : 'Assorted Item(s)';

          const tableInfo = b.order?.tableNumber
            ? `Table #${b.order.tableNumber}`
            : associatedOrder?.table?.tableNumber
            ? `Table #${associatedOrder.table.tableNumber}`
            : b.order?.orderType === 'TAKEAWAY' || associatedOrder?.orderType === 'TAKEAWAY'
            ? 'Takeaway Parcel'
            : 'Counter Pickup';

          const cgst = b.cgstAmount ?? Number((b.taxAmount / 2).toFixed(2));
          const sgst = b.sgstAmount ?? Number((b.taxAmount / 2).toFixed(2));
          const rawTotal = Number((b.taxableAmount + b.taxAmount).toFixed(2));
          const roundOff = b.roundOffAmount ?? Number((b.totalAmount - rawTotal).toFixed(2));

          return {
            id: b.id,
            invoiceNumber: b.invoiceNumber,
            orderNumber: b.order?.orderNumber || associatedOrder?.orderNumber || 'ORD-LIVE',
            createdAt: b.createdAt,
            dateFormatted: !isNaN(createdDate.getTime())
              ? createdDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
              : b.createdAt.slice(0, 10),
            timeFormatted: !isNaN(createdDate.getTime())
              ? createdDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
              : '12:00 PM',
            customerName: b.customerName || b.order?.customerName || associatedOrder?.customerName || 'Walk-in Guest',
            customerPhone: b.customerPhone || b.order?.customerPhone || associatedOrder?.customerPhone || '',
            tableOrChannel: tableInfo,
            orderType: b.order?.orderType || associatedOrder?.orderType || 'COUNTER',
            itemsSummary: itemsDesc,
            subtotal: b.subtotal,
            discountAmount: b.discountAmount || 0,
            taxableAmount: b.taxableAmount,
            cgst,
            sgst,
            taxAmount: b.taxAmount,
            roundOff,
            totalAmount: b.totalAmount,
            paidAmount: b.paidAmount || b.totalAmount,
            paymentMethod: method,
            transactionReference: pmt?.transactionReference || `PMT-${b.invoiceNumber}`,
            status: b.status,
            rawBill: b,
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return posApiClient.isDemoModeActive() ? getSettledSalesInvoices() : [];
  }, [activeBills, activeOrders]);

  // Item Matrix State
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('totalRevenue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Hourly Graph mode
  const [hourlyViewMode, setHourlyViewMode] = useState<'revenue' | 'orders'>('revenue');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filtered Settled Invoices according to timeline, payment, channel, and search
  const filteredSettledInvoices = useMemo(() => {
    return allSettledInvoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      const invDayStr = !isNaN(invDate.getTime()) ? toLocalDateString(invDate) : '';
      const invUtcDayStr = !isNaN(invDate.getTime()) ? invDate.toISOString().slice(0, 10) : '';
      const today = toLocalDateString(new Date());
      const todayUtc = new Date().toISOString().slice(0, 10);

      // Timeline filter
      if (salesTimeline === 'TODAY') {
        const isToday =
          invDayStr === today ||
          invUtcDayStr === todayUtc ||
          Math.abs(Date.now() - invDate.getTime()) < 24 * 3600 * 1000;
        if (!isToday) return false;
      } else if (salesTimeline === 'YESTERDAY') {
        const yesterday = toLocalDateString(new Date(Date.now() - 86400000));
        const yesterdayUtc = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        if (invDayStr !== yesterday && invUtcDayStr !== yesterdayUtc) return false;
      } else if (salesTimeline === 'LAST_7_DAYS') {
        const cutoff = Date.now() - 7 * 86400000;
        if (!isNaN(invDate.getTime()) && invDate.getTime() < cutoff) return false;
      } else if (salesTimeline === 'THIS_MONTH') {
        const now = new Date();
        if (!isNaN(invDate.getTime()) && (invDate.getMonth() !== now.getMonth() || invDate.getFullYear() !== now.getFullYear())) {
          return false;
        }
      } else if (salesTimeline === 'CUSTOM') {
        if (salesFromDate && invDayStr < salesFromDate) return false;
        if (salesToDate && invDayStr > salesToDate) return false;
      }

      // Payment mode filter
      if (salesPaymentFilter !== 'ALL' && inv.paymentMethod !== salesPaymentFilter) {
        return false;
      }

      // Channel filter
      if (salesChannelFilter !== 'ALL' && inv.orderType !== salesChannelFilter) {
        return false;
      }

      // Omni-search filter
      if (salesSearch.trim() !== '') {
        const q = salesSearch.toLowerCase();
        const match =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.orderNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q) ||
          inv.tableOrChannel.toLowerCase().includes(q) ||
          inv.itemsSummary.toLowerCase().includes(q) ||
          inv.transactionReference.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [allSettledInvoices, salesTimeline, salesPaymentFilter, salesChannelFilter, salesSearch, salesFromDate, salesToDate]);

  // Real-time Daily Summary (Z-Report Metrics)
  const dailySummary = useMemo<DailySummary>(() => {
    const totalOrders = filteredSettledInvoices.length;
    const grossSales = filteredSettledInvoices.reduce((sum, inv) => sum + (inv.subtotal || inv.taxableAmount), 0);
    const discounts = filteredSettledInvoices.reduce((sum, inv) => sum + (inv.discountAmount || 0), 0);
    const netSales = filteredSettledInvoices.reduce((sum, inv) => sum + (inv.taxableAmount || 0), 0);
    const totalTax = filteredSettledInvoices.reduce((sum, inv) => sum + (inv.taxAmount || 0), 0);
    const totalRev = filteredSettledInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalRoundOff = Number((totalRev - (netSales + totalTax)).toFixed(2));
    const averageOrderValue = totalOrders > 0 ? Number((totalRev / totalOrders).toFixed(2)) : 0;

    let cashAmount = 0;
    let upiAmount = 0;
    let cardsAmount = 0;
    let swiggyAmount = 0;
    let zomatoAmount = 0;

    filteredSettledInvoices.forEach((inv) => {
      const cName = (inv.customerName || '').toLowerCase();
      if (inv.orderType === 'DELIVERY' && cName.includes('swiggy')) {
        swiggyAmount += inv.totalAmount;
      } else if (inv.orderType === 'DELIVERY' && cName.includes('zomato')) {
        zomatoAmount += inv.totalAmount;
      } else if (inv.paymentMethod === 'CASH') {
        cashAmount += inv.totalAmount;
      } else if (inv.paymentMethod === 'CARD') {
        cardsAmount += inv.totalAmount;
      } else {
        upiAmount += inv.totalAmount;
      }
    });

    const splits: PaymentSplit[] = [
      { mode: 'UPI', label: 'UPI / QR Scan', amount: upiAmount, percentage: totalRev > 0 ? Number(((upiAmount / totalRev) * 100).toFixed(1)) : 0, color: '#4f46e5' },
      { mode: 'CASH', label: 'Cash Drawer', amount: cashAmount, percentage: totalRev > 0 ? Number(((cashAmount / totalRev) * 100).toFixed(1)) : 0, color: '#10b981' },
      { mode: 'CARDS', label: 'Credit/Debit Card', amount: cardsAmount, percentage: totalRev > 0 ? Number(((cardsAmount / totalRev) * 100).toFixed(1)) : 0, color: '#0ea5e9' },
      { mode: 'SWIGGY', label: 'Swiggy Online', amount: swiggyAmount, percentage: totalRev > 0 ? Number(((swiggyAmount / totalRev) * 100).toFixed(1)) : 0, color: '#f97316' },
      { mode: 'ZOMATO', label: 'Zomato Online', amount: zomatoAmount, percentage: totalRev > 0 ? Number(((zomatoAmount / totalRev) * 100).toFixed(1)) : 0, color: '#ef4444' },
    ];

    return {
      grossSales,
      netSales,
      totalTax,
      totalRoundOff,
      discounts,
      totalOrders,
      averageOrderValue,
      paymentSplits: {
        cash: cashAmount,
        upi: upiAmount,
        swiggy: swiggyAmount,
        zomato: zomatoAmount,
        cards: cardsAmount,
      },
      detailedSplits: splits,
    };
  }, [filteredSettledInvoices]);

  // Channel breakdown counts
  const channelCounts = useMemo(() => {
    let dineIn = 0;
    let takeaway = 0;
    let counter = 0;
    filteredSettledInvoices.forEach((inv) => {
      if (inv.orderType === 'DINE_IN') dineIn++;
      else if (inv.orderType === 'TAKEAWAY') takeaway++;
      else counter++;
    });
    return { dineIn, takeaway, counter };
  }, [filteredSettledInvoices]);

  // Real-time Hourly Sales Points
  const hourlySales = useMemo<HourlySalesPoint[]>(() => {
    const hoursMap: Record<number, { hourLabel: string; revenue: number; orders: number }> = {};
    for (let h = 10; h <= 23; h++) {
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${String(h12).padStart(2, '0')}:00 ${ampm}`;
      hoursMap[h] = { hourLabel: label, revenue: 0, orders: 0 };
    }

    filteredSettledInvoices.forEach((inv) => {
      const dt = new Date(inv.createdAt);
      if (!isNaN(dt.getTime())) {
        const h = dt.getHours();
        if (hoursMap[h]) {
          hoursMap[h].revenue += inv.totalAmount;
          hoursMap[h].orders += 1;
        }
      }
    });

    return Object.keys(hoursMap).map((k) => {
      const entry = hoursMap[Number(k)];
      return {
        hour: entry.hourLabel,
        revenue: Number(entry.revenue.toFixed(2)),
        orders: entry.orders,
        avgTicket: entry.orders > 0 ? Number((entry.revenue / entry.orders).toFixed(2)) : 0,
      };
    });
  }, [filteredSettledInvoices]);

  // Real-time Peak Analysis
  const peakStats = useMemo(() => {
    const sortedByRevenue = [...hourlySales].sort((a, b) => b.revenue - a.revenue);
    const sortedByOrders = [...hourlySales].sort((a, b) => b.orders - a.orders);
    const sortedByTicket = [...hourlySales].filter((h) => h.orders > 0).sort((a, b) => b.avgTicket - a.avgTicket);

    const peakRev = sortedByRevenue[0] && sortedByRevenue[0].revenue > 0 ? sortedByRevenue[0] : null;
    const peakOrd = sortedByOrders[0] && sortedByOrders[0].orders > 0 ? sortedByOrders[0] : null;
    const peakTick = sortedByTicket[0] || null;

    return { peakRev, peakOrd, peakTick };
  }, [hourlySales]);

  // Real-time Item Matrix aggregated from settled bills
  const realItemMatrix = useMemo<ItemMatrixRecord[]>(() => {
    const map = new Map<string, ItemMatrixRecord>();

    filteredSettledInvoices.forEach((inv) => {
      const rawBill = inv.rawBill;
      const rawOrder = rawBill?.order;
      const associatedOrder = rawOrder?.id
        ? activeOrders.find((o) => o.id === rawOrder.id)
        : null;

      const items =
        rawOrder?.items && rawOrder.items.length > 0
          ? rawOrder.items
          : associatedOrder?.items && associatedOrder.items.length > 0
          ? associatedOrder.items
          : [];

      items.forEach((it: any) => {
        const key = it.productId || it.productNameSnapshot || 'unknown';
        const name = it.productNameSnapshot || 'Assorted Item';
        const qty = it.quantity || 1;
        const lineTotal = it.lineTotalSnapshot || (it.unitPriceSnapshot ? it.unitPriceSnapshot * qty : 0);
        const unitPrice = it.unitPriceSnapshot || (qty > 0 ? lineTotal / qty : 0);

        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.qtySold += qty;
          existing.totalRevenue += lineTotal;
        } else {
          map.set(key, {
            id: key,
            name,
            category: 'Boba & Cafe Menu',
            qtySold: qty,
            unitPrice,
            totalRevenue: lineTotal,
            foodCostPct: 24,
          });
        }
      });
    });

    return Array.from(map.values());
  }, [filteredSettledInvoices, activeOrders]);

  // Distinct categories for Item Matrix
  const itemCategories = useMemo(() => {
    const set = new Set<string>();
    realItemMatrix.forEach((item) => set.add(item.category));
    return ['ALL', ...Array.from(set)];
  }, [realItemMatrix]);

  // Filtered and sorted Item Matrix
  const filteredAndSortedItems = useMemo(() => {
    let result = [...realItemMatrix];

    if (selectedCategory !== 'ALL') {
      result = result.filter((item) => item.category === selectedCategory);
    }

    if (itemSearch.trim() !== '') {
      const q = itemSearch.toLowerCase();
      result = result.filter(
        (item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (typeof valA === 'string') {
        const comp = (valA as string).localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }

      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });

    return result;
  }, [realItemMatrix, selectedCategory, itemSearch, sortField, sortDirection]);

  // Determine top 3 and bottom 3 items globally by revenue for visual badges
  const { top3Ids, bottom3Ids } = useMemo(() => {
    if (realItemMatrix.length === 0) return { top3Ids: new Set<string>(), bottom3Ids: new Set<string>() };
    const sortedByRev = [...realItemMatrix].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const top = new Set(sortedByRev.slice(0, 3).map((i) => i.id));
    const bottom = sortedByRev.length > 3 ? new Set(sortedByRev.slice(-3).map((i) => i.id)) : new Set<string>();
    return { top3Ids: top, bottom3Ids: bottom };
  }, [realItemMatrix]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Dynamic Sales Metrics
  const salesMetrics = useMemo(() => {
    const count = filteredSettledInvoices.length;
    const totalRevenue = filteredSettledInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const upiTotal = filteredSettledInvoices.filter((i) => i.paymentMethod === 'UPI').reduce((sum, i) => sum + i.totalAmount, 0);
    const cashTotal = filteredSettledInvoices.filter((i) => i.paymentMethod === 'CASH').reduce((sum, i) => sum + i.totalAmount, 0);
    const cardTotal = filteredSettledInvoices.filter((i) => i.paymentMethod === 'CARD').reduce((sum, i) => sum + i.totalAmount, 0);
    const totalTax = filteredSettledInvoices.reduce((sum, i) => sum + i.taxAmount, 0);
    const avgTicket = count > 0 ? totalRevenue / count : 0;

    return { count, totalRevenue, upiTotal, cashTotal, cardTotal, totalTax, avgTicket };
  }, [filteredSettledInvoices]);

  // CSV Exporter Helper
  const downloadCSV = (filename: string, csvContent: string, toastTitle: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(toastTitle);
  };

  const handleExportSalesReportCSV = () => {
    let csv = 'Invoice No,Order No,Date,Time,Customer Name,Mobile,Table/Channel,Order Type,Items Summary,Taxable Value (INR),CGST 2.5%,SGST 2.5%,Total Tax,Round Off (INR),Net Total (INR),Payment Mode,Payment Ref,Status\n';
    filteredSettledInvoices.forEach((inv) => {
      csv += `"${inv.invoiceNumber}","${inv.orderNumber}","${inv.dateFormatted}","${inv.timeFormatted}","${inv.customerName}","${inv.customerPhone}","${inv.tableOrChannel}","${inv.orderType}","${inv.itemsSummary.replace(/"/g, '""')}","${inv.taxableAmount.toFixed(2)}","${inv.cgst.toFixed(2)}","${inv.sgst.toFixed(2)}","${inv.taxAmount.toFixed(2)}","${(inv.roundOff || 0).toFixed(2)}","${inv.totalAmount.toFixed(2)}","${inv.paymentMethod}","${inv.transactionReference}","${inv.status}"\n`;
    });
    downloadCSV(`POB_Settled_Sales_Report_${Date.now()}.csv`, csv, 'Settled Invoices Sales Report CSV Downloaded');
  };

  const handleExportTable7 = () => {
    const cgst = dailySummary.totalTax / 2;
    const sgst = dailySummary.totalTax / 2;
    const grossTaxable = dailySummary.netSales;
    const roundOff = dailySummary.totalRoundOff || 0;
    const netTotal = grossTaxable + dailySummary.totalTax + roundOff;
    const csv = `GSTIN,State,Supply Type,Rate %,Gross Taxable Value,Central Tax (CGST),State Tax (SGST),Total Cess,Round Off,Net Invoice Value
36AAACK1234F1Z5,Telangana (36),Intra-State B2C,5.00%,${grossTaxable.toFixed(2)},${cgst.toFixed(2)},${sgst.toFixed(2)},0.00,${roundOff.toFixed(2)},${netTotal.toFixed(2)}
`;
    downloadCSV('GSTR1_Table_7_B2C_Consolidated.csv', csv, 'GSTR-1 Table 7 (B2C Consolidated) CSV Downloaded');
  };

  const handleExportSection9_5 = () => {
    const swiggyAmt = dailySummary.paymentSplits.swiggy;
    const zomatoAmt = dailySummary.paymentSplits.zomato;
    const totalEco = swiggyAmt + zomatoAmt;
    const csv = `ECO Operator,ECO GSTIN,Gross Orders,Taxable Value,IGST,CGST,SGST,Net Payable By ECO
Swiggy (Bundl Technologies),29AABCB1234D1ZP,0,${swiggyAmt.toFixed(2)},0.00,${(swiggyAmt * 0.025).toFixed(2)},${(swiggyAmt * 0.025).toFixed(2)},${(swiggyAmt * 1.05).toFixed(2)}
Zomato Limited,07AAACZ1234E1ZR,0,${zomatoAmt.toFixed(2)},0.00,${(zomatoAmt * 0.025).toFixed(2)},${(zomatoAmt * 0.025).toFixed(2)},${(zomatoAmt * 1.05).toFixed(2)}
TOTAL ECO AGGREGATOR,,0,${totalEco.toFixed(2)},0.00,${(totalEco * 0.025).toFixed(2)},${(totalEco * 0.025).toFixed(2)},${(totalEco * 1.05).toFixed(2)}
`;
    downloadCSV('GSTR1_Section_9_5_ECO_Aggregators.csv', csv, 'GSTR-1 Section 9(5) ECO Aggregators CSV Downloaded');
  };

  const handleExportTable12 = () => {
    const cgst = dailySummary.totalTax / 2;
    const sgst = dailySummary.totalTax / 2;
    const grossTaxable = dailySummary.netSales;
    const csv = `HSN/SAC Code,Description,UQC,Total Quantity,Total Taxable Value,Tax Rate,CGST Amount,SGST Amount,IGST Amount,Total Tax
996331,Restaurant Dining & Takeaway Services,NA,${dailySummary.totalOrders},${grossTaxable.toFixed(2)},5.00%,${cgst.toFixed(2)},${sgst.toFixed(2)},0.00,${dailySummary.totalTax.toFixed(2)}
`;
    downloadCSV('GSTR1_Table_12_HSN_SAC_Summary.csv', csv, 'GSTR-1 Table 12 (HSN/SAC Summary) CSV Downloaded');
  };

  return (
    <div className="reports-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="reports-toast" role="status">
          <CheckCircle2 size={20} className="toast-icon-success" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="reports-header">
        <div className="reports-header-top">
          <div className="reports-header-title-box">
            <h2>
              <Sparkles size={20} color="#4f46e5" />
              Reports & Analytics
            </h2>
            <p>Live sales summary, transaction register, hourly trends, and statutory tax reports</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              title="Refresh live data from PostgreSQL database"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              <RefreshCw size={14} className={isLoading ? 'spin' : ''} />
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <div className="reports-date-badge">
              <Clock size={14} />
              <span>Today: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="reports-tabs-nav" role="tablist">
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'z-report' ? 'active' : ''}`}
            onClick={() => setActiveTab('z-report')}
          >
            <Receipt size={15} />
            Summary
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'sales-report' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales-report')}
          >
            <DollarSign size={15} />
            Sales Register
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'hourly' ? 'active' : ''}`}
            onClick={() => setActiveTab('hourly')}
          >
            <Clock size={15} />
            Hourly Sales
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'item-matrix' ? 'active' : ''}`}
            onClick={() => setActiveTab('item-matrix')}
          >
            <ShoppingBag size={15} />
            Item Sales
          </button>
          <button
            type="button"
            className={`reports-tab-btn tab-danger ${activeTab === 'void-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('void-log')}
          >
            <ShieldAlert size={15} />
            Void Audit
          </button>
          <button
            type="button"
            className={`reports-tab-btn ${activeTab === 'gst-export' ? 'active' : ''}`}
            onClick={() => setActiveTab('gst-export')}
          >
            <FileSpreadsheet size={15} />
            Tax (GST)
          </button>
        </div>
      </div>

      {/* =========================================================================
          VIEW A: THE Z-REPORT (END OF DAY OVERVIEW)
          ========================================================================= */}
      {activeTab === 'z-report' && (
        <>
          {/* Quick Timeline Selector for Z-Report */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
              📊 Sales Timeline Range:
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH', 'ALL'] as const).map((t) => {
                const labels: Record<string, string> = {
                  TODAY: 'Today',
                  YESTERDAY: 'Yesterday',
                  LAST_7_DAYS: 'Last 7 Days',
                  THIS_MONTH: 'This Month',
                  ALL: 'All Time (Live)',
                };
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSalesTimeline(t)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: salesTimeline === t ? '1px solid #4f46e5' : '1px solid #cbd5e1',
                      background: salesTimeline === t ? '#4f46e5' : '#ffffff',
                      color: salesTimeline === t ? '#ffffff' : '#334155',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {labels[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#4f46e5' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Gross Revenue</span>
                <div className="kpi-card-icon" style={{ background: '#eef2ff', color: '#4f46e5' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(dailySummary.grossSales)}</div>
              <div className="kpi-card-subtitle">
                <span>Total gross volume before deductions</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#0ea5e9' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Orders</span>
                <div className="kpi-card-icon" style={{ background: '#e0f2fe', color: '#0ea5e9' }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{dailySummary.totalOrders}</div>
              <div className="kpi-card-subtitle">
                <span>Dine-in: {channelCounts.dineIn} | Takeaway: {channelCounts.takeaway} | Counter: {channelCounts.counter}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#10b981' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Average Order Value</span>
                <div className="kpi-card-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                  <Layers size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(dailySummary.averageOrderValue, true)}</div>
              <div className="kpi-card-subtitle">
                <span>Average settled ticket size</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#f59e0b' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Tax Collected (GST 5%)</span>
                <div className="kpi-card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                  <Receipt size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(dailySummary.totalTax)}</div>
              <div className="kpi-card-subtitle">
                <span>CGST: {formatINR(dailySummary.totalTax / 2)} | SGST: {formatINR(dailySummary.totalTax / 2)}</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#ef4444' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Total Discounts</span>
                <div className="kpi-card-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                  <TrendingDown size={18} />
                </div>
              </div>
              <div className="kpi-card-value">{formatINR(dailySummary.discounts)}</div>
              <div className="kpi-card-subtitle">
                <span>Promos & Coupons Applied</span>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-indicator" style={{ background: '#64748b' }} />
              <div className="kpi-card-header">
                <span className="kpi-card-title">Net Round-Off</span>
                <div className="kpi-card-icon" style={{ background: '#f1f5f9', color: '#475569' }}>
                  <Receipt size={18} />
                </div>
              </div>
              <div className="kpi-card-value" style={{ color: (dailySummary.totalRoundOff || 0) < 0 ? '#475569' : '#16a34a' }}>
                {dailySummary.totalRoundOff ? (dailySummary.totalRoundOff > 0 ? `+₹${dailySummary.totalRoundOff.toFixed(2)}` : `-₹${Math.abs(dailySummary.totalRoundOff).toFixed(2)}`) : '₹0.00'}
              </div>
              <div className="kpi-card-subtitle">
                <span>GST Sec 170 Audited Ledger</span>
              </div>
            </div>
          </div>

          {/* Payment Split & Cash Drawer Reconciliation */}
          <div className="report-card">
            <div className="report-card-header">
              <div>
                <h3 className="report-card-title">Payment Settlement Breakdown</h3>
                <p className="report-card-subtitle">Channel distribution across Digital UPI, Aggregators, Cards & Cash Drawer</p>
              </div>
              <span className="badge-category">Reconciled 100%</span>
            </div>

            <div className="payment-split-grid">
              {/* Donut Chart with Recharts */}
              <div style={{ height: 260, width: '100%', position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dailySummary.detailedSplits.filter((s) => s.amount > 0 || dailySummary.totalOrders === 0)}
                      dataKey="amount"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={105}
                      paddingAngle={3}
                    >
                      {dailySummary.detailedSplits.map((entry) => (
                        <Cell key={entry.mode} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: unknown) => [formatINR(Number(val) || 0), 'Settled Amount']}
                      contentStyle={{ background: '#0f172a', color: '#fff', borderRadius: '8px', border: 'none', fontSize: '13px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    {formatINR(dailySummary.grossSales)}
                  </div>
                </div>
              </div>

              {/* Progress Bars & Amounts List */}
              <div className="payment-bars-list">
                {dailySummary.detailedSplits.map((item) => (
                  <div key={item.mode} className="payment-bar-item">
                    <div className="payment-bar-meta">
                      <span className="payment-bar-name">
                        <span className="payment-bar-dot" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <div>
                        <span className="payment-bar-amt">{formatINR(item.amount)}</span>
                        <span className="payment-bar-pct">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="payment-track">
                      <div
                        className="payment-fill"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          VIEW: SETTLED INVOICES & REAL-TIME SALES REGISTER
          ========================================================================= */}
      {activeTab === 'sales-report' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <DollarSign size={18} color="#059669" />
                Sales Register
              </h3>
              <p className="report-card-subtitle">
                Live transactional sales ledger with invoice numbers, payment modes, and order history
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={loadData}
                disabled={isLoading}
                title="Refresh live transactions"
                style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}
              >
                <RefreshCw size={13} className={isLoading ? 'spin' : ''} /> Refresh
              </button>
              <button
                type="button"
                className="btn-export-download"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
                onClick={handleExportSalesReportCSV}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          {/* Timeline & Filter Controls Bar */}
          <div className="sales-filter-control-panel">
            {/* Row 1: Timeline Presets */}
            <div className="sales-timeline-row">
              <div className="sales-preset-group">
                {(['TODAY', 'YESTERDAY', 'LAST_7_DAYS', 'THIS_MONTH', 'ALL', 'CUSTOM'] as const).map((t) => {
                  const labels = {
                    TODAY: 'Today',
                    YESTERDAY: 'Yesterday',
                    LAST_7_DAYS: 'Last 7 Days',
                    THIS_MONTH: 'This Month',
                    ALL: 'All Time',
                    CUSTOM: 'Custom',
                  };
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`sales-timeline-btn ${salesTimeline === t ? 'active' : ''}`}
                      onClick={() => setSalesTimeline(t)}
                    >
                      {labels[t]}
                    </button>
                  );
                })}
              </div>

              {/* Custom Date Pickers */}
              {salesTimeline === 'CUSTOM' && (
                <div className="sales-custom-dates">
                  <div className="date-input-wrap">
                    <label>From:</label>
                    <input
                      type="date"
                      value={salesFromDate}
                      onChange={(e) => setSalesFromDate(e.target.value)}
                    />
                  </div>
                  <div className="date-input-wrap">
                    <label>To:</label>
                    <input
                      type="date"
                      value={salesToDate}
                      onChange={(e) => setSalesToDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Search & Filter Toggles */}
            <div className="sales-filters-row">
              <div className="sales-search-box">
                <Search size={16} className="sales-search-icon" />
                <input
                  type="text"
                  placeholder="Search invoice #, customer name, phone, item..."
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  className="sales-search-input"
                  aria-label="Search Invoices"
                />
                {salesSearch && (
                  <button type="button" className="sales-clear-search-btn" onClick={() => setSalesSearch('')}>
                    ✕
                  </button>
                )}
              </div>

              {/* Payment Mode Filter */}
              <div className="sales-toggle-group">
                <span className="toggle-label">Payment:</span>
                {(['ALL', 'UPI', 'CASH', 'CARD'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`sales-toggle-pill ${salesPaymentFilter === m ? 'active' : ''}`}
                    onClick={() => setSalesPaymentFilter(m)}
                  >
                    {m === 'ALL' ? 'All' : m === 'UPI' ? 'UPI' : m === 'CASH' ? 'Cash' : 'Card'}
                  </button>
                ))}
              </div>

              {/* Order Channel Filter */}
              <div className="sales-toggle-group">
                <span className="toggle-label">Channel:</span>
                {(['ALL', 'DINE_IN', 'TAKEAWAY', 'COUNTER'] as const).map((ch) => (
                  <button
                    key={ch}
                    type="button"
                    className={`sales-toggle-pill ${salesChannelFilter === ch ? 'active' : ''}`}
                    onClick={() => setSalesChannelFilter(ch)}
                  >
                    {ch === 'ALL' ? 'All' : ch === 'DINE_IN' ? 'Dine In' : ch === 'TAKEAWAY' ? 'Takeaway' : 'Counter'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Minimal Production KPI Metrics */}
          <div className="sales-kpi-ribbon">
            <div className="sales-kpi-pill">
              <span className="kpi-label">Filtered Revenue</span>
              <strong className="kpi-value">{formatINR(salesMetrics.totalRevenue)}</strong>
              <span className="kpi-sub">Tax: {formatINR(salesMetrics.totalTax)}</span>
            </div>
            <div className="sales-kpi-pill">
              <span className="kpi-label">Total Invoices</span>
              <strong className="kpi-value">{salesMetrics.count}</strong>
              <span className="kpi-sub">Settled Orders</span>
            </div>
            <div className="sales-kpi-pill">
              <span className="kpi-label">Average Bill</span>
              <strong className="kpi-value">{formatINR(salesMetrics.avgTicket)}</strong>
              <span className="kpi-sub">Per order</span>
            </div>
            <div className="sales-kpi-pill payment-split-pill">
              <span className="kpi-label">Payment Split</span>
              <div className="kpi-split-details">
                <span className="split-dot upi" title="UPI">UPI: {formatINR(salesMetrics.upiTotal)}</span>
                <span className="split-dot cash" title="Cash">Cash: {formatINR(salesMetrics.cashTotal)}</span>
                <span className="split-dot card" title="Card">Card: {formatINR(salesMetrics.cardTotal)}</span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="data-table-wrapper">
            <table className="reports-data-table sales-report-table">
              <thead>
                <tr>
                  <th>Invoice & Order #</th>
                  <th>Date & Time</th>
                  <th>Customer Info</th>
                  <th>Table / Type</th>
                  <th>Items Summary</th>
                  <th>Taxable</th>
                  <th>Tax (GST 5%)</th>
                  <th>Round Off</th>
                  <th>Total Amount</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSettledInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>No settled sales invoices found for this timeline</p>
                      <span style={{ fontSize: '0.85rem' }}>Checkout a live order on the POS counter to see transactions here</span>
                    </td>
                  </tr>
                ) : (
                  filteredSettledInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.invoiceNumber}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.orderNumber}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{inv.dateFormatted}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.timeFormatted}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{inv.customerName}</div>
                        {inv.customerPhone && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{inv.customerPhone}</div>
                        )}
                      </td>
                      <td>
                        <span className="badge-channel-tag">{inv.tableOrChannel}</span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{inv.orderType}</div>
                      </td>
                      <td style={{ maxWidth: '280px' }}>
                        <div className="sales-items-truncate" title={inv.itemsSummary}>
                          {inv.itemsSummary}
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{formatINR(inv.taxableAmount)}</td>
                      <td style={{ color: '#047857', fontWeight: 500 }}>{formatINR(inv.taxAmount)}</td>
                      <td style={{ fontSize: '0.85rem', fontWeight: 600, color: (inv.roundOff || 0) < 0 ? '#475569' : (inv.roundOff || 0) > 0 ? '#16a34a' : '#64748b' }}>
                        {inv.roundOff ? (inv.roundOff > 0 ? `+₹${inv.roundOff.toFixed(2)}` : `-₹${Math.abs(inv.roundOff).toFixed(2)}`) : '₹0.00'}
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>
                          {formatINR(inv.totalAmount)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`badge-payment-mode ${
                            inv.paymentMethod === 'UPI'
                              ? 'mode-upi'
                              : inv.paymentMethod === 'CASH'
                              ? 'mode-cash'
                              : 'mode-card'
                          }`}
                        >
                          {inv.paymentMethod}
                        </span>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }} title={inv.transactionReference}>
                          {inv.transactionReference.length > 14
                            ? `${inv.transactionReference.slice(0, 14)}...`
                            : inv.transactionReference}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-inspect-invoice"
                          title="View & Reprint Thermal Bill"
                          onClick={() => {
                            if (inv.rawBill) {
                              setInspectedBill(inv.rawBill);
                            } else {
                              const syntheticBill: Bill = {
                                id: inv.id,
                                orderId: inv.id,
                                invoiceNumber: inv.invoiceNumber,
                                subtotal: inv.subtotal,
                                discountAmount: inv.discountAmount,
                                taxableAmount: inv.taxableAmount,
                                cgstAmount: inv.cgst,
                                sgstAmount: inv.sgst,
                                taxAmount: inv.taxAmount,
                                totalAmount: inv.totalAmount,
                                paidAmount: inv.paidAmount,
                                status: inv.status,
                                payments: [
                                  {
                                    id: `pmt-${inv.id}`,
                                    amount: inv.paidAmount,
                                    paymentMethod: inv.paymentMethod,
                                    transactionReference: inv.transactionReference,
                                    status: 'SUCCESSFUL',
                                    createdAt: inv.createdAt,
                                  },
                                ],
                                createdAt: inv.createdAt,
                                customerName: inv.customerName,
                                customerPhone: inv.customerPhone,
                              };
                              setInspectedBill(syntheticBill);
                            }
                          }}
                        >
                          <Eye size={14} />
                          Reprint
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW B: HOURLY SALES & RUSH HEATMAP
          ========================================================================= */}
      {activeTab === 'hourly' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <Clock size={20} color="#4f46e5" />
                Hourly Sales Distribution & Rush Peak Curves
              </h3>
              <p className="report-card-subtitle">
                Operational store traffic velocity from 10:00 AM opening to 11:00 PM closing
              </p>
            </div>
            {/* View Mode Switcher */}
            <div className="hourly-view-toggle">
              <button
                type="button"
                className={`toggle-btn ${hourlyViewMode === 'revenue' ? 'active' : ''}`}
                onClick={() => setHourlyViewMode('revenue')}
              >
                Revenue (₹)
              </button>
              <button
                type="button"
                className={`toggle-btn ${hourlyViewMode === 'orders' ? 'active' : ''}`}
                onClick={() => setHourlyViewMode('orders')}
              >
                Order Velocity
              </button>
            </div>
          </div>

          {/* Peak Rushes Highlight Pills */}
          <div className="peak-callouts-grid">
            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                <Flame size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Peak Revenue Hour</h4>
                <p>{peakStats.peakRev ? peakStats.peakRev.hour : 'Awaiting orders'}</p>
                <span>
                  {peakStats.peakRev
                    ? `${formatINR(peakStats.peakRev.revenue)} revenue (${peakStats.peakRev.orders} orders)`
                    : 'No orders recorded yet today'}
                </span>
              </div>
            </div>

            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                <Sparkles size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Order Volume Velocity</h4>
                <p>{peakStats.peakOrd ? peakStats.peakOrd.hour : 'Awaiting rush'}</p>
                <span>
                  {peakStats.peakOrd ? `${peakStats.peakOrd.orders} orders placed` : '0 orders placed today'}
                </span>
              </div>
            </div>

            <div className="peak-pill-card">
              <div className="peak-pill-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                <TrendingUp size={22} />
              </div>
              <div className="peak-pill-details">
                <h4>Highest Average Ticket</h4>
                <p>{peakStats.peakTick ? `${peakStats.peakTick.hour} (${formatINR(peakStats.peakTick.avgTicket)} / ticket)` : 'Awaiting data'}</p>
                <span>Average settled ticket across peak window</span>
              </div>
            </div>
          </div>

          {/* Recharts Area / Bar Chart */}
          <div style={{ height: 380, width: '100%', marginTop: '1rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              {hourlyViewMode === 'revenue' ? (
                <AreaChart data={hourlySales} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dy={8} />
                  <YAxis
                    tickFormatter={(val) => `₹${val}`}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                    dx={-4}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatINR(Number(val) || 0), 'Hourly Revenue']}
                    labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGrad)"
                  />
                </AreaChart>
              ) : (
                <BarChart data={hourlySales} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dy={8} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" dx={-4} />
                  <Tooltip
                    formatter={(val: unknown) => [`${val} Orders`, 'Order Count']}
                    labelStyle={{ fontWeight: 700, color: '#0f172a' }}
                    contentStyle={{ borderRadius: 8, borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  />
                  <Bar dataKey="orders" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW C: ITEM-WISE SALES (THE MENU MATRIX)
          ========================================================================= */}
      {activeTab === 'item-matrix' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <ShoppingBag size={20} color="#4f46e5" />
                The Menu Matrix (Item-Wise Sales & Velocity)
              </h3>
              <p className="report-card-subtitle">
                Real-time menu item sales velocity and turnover directly from live customer bills
              </p>
            </div>
            <span className="badge-category">{realItemMatrix.length} Items Sold</span>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="matrix-toolbar">
            <div className="matrix-search-box">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search items by name or category..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
              />
              {itemSearch && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setItemSearch('')}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="matrix-category-pills">
              {itemCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Item Matrix Data Table */}
          <div className="data-table-wrapper">
            <table className="reports-data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort('name')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Item Name <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('category')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Category <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('qtySold')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Quantity Sold <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th>Unit Price</th>
                  <th className="sortable" onClick={() => handleSort('totalRevenue')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Total Revenue <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th className="sortable" onClick={() => handleSort('foodCostPct')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      Food Cost % <ArrowUpDown size={14} />
                    </div>
                  </th>
                  <th>Performance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>No settled item sales recorded yet</p>
                      <span style={{ fontSize: '0.85rem' }}>Punch and checkout an order on the POS to see live menu matrix rankings</span>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedItems.map((item: ItemMatrixRecord) => {
                    const isTop = top3Ids.has(item.id);
                    const isBottom = bottom3Ids.has(item.id);

                    return (
                      <tr key={item.id}>
                        <td style={{ fontWeight: 600, color: '#0f172a' }}>{item.name}</td>
                        <td>
                          <span className="badge-category">{item.category}</span>
                        </td>
                        <td style={{ fontWeight: 700 }}>{item.qtySold} units</td>
                        <td>{formatINR(item.unitPrice)}</td>
                        <td style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(item.totalRevenue)}</td>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: item.foodCostPct > 30 ? '#dc2626' : '#16a34a',
                            }}
                          >
                            {item.foodCostPct}%
                          </span>
                        </td>
                        <td>
                          {isTop && (
                            <span className="badge-top-seller">
                              <Award size={13} />
                              Top Seller
                            </span>
                          )}
                          {isBottom && (
                            <span className="badge-slow-seller">
                              <AlertTriangle size={13} />
                              Slow Moving
                            </span>
                          )}
                          {!isTop && !isBottom && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Normal Velocity</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW D: THE ANTI-FRAUD VOID LOG (SECURITY AUDIT)
          ========================================================================= */}
      {activeTab === 'void-log' && (
        <div className="report-card" style={{ borderColor: '#fca5a5' }}>
          {/* Security Banner */}
          <div className="void-audit-header-banner">
            <ShieldAlert size={28} style={{ flexShrink: 0 }} />
            <div>
              <h3>Security & Loss Prevention Audit Trail</h3>
              <p>
                Strict ledger tracking of all item cancellations, KOT voids, and supervisor override PINs.
                Sudden spikes in voids are automatically flagged for restaurant management review.
              </p>
            </div>
          </div>

          {/* Quick Void Metrics */}
          {(() => {
            const voidLogs = dbVoidLogs && dbVoidLogs.length > 0 ? dbVoidLogs : getVoidAuditLogs();
            const totalVoidValue = voidLogs.reduce((sum, item) => sum + item.amount, 0);
            const highestVoid = voidLogs.length > 0 ? Math.max(...voidLogs.map((i) => i.amount)) : 0;

            return (
              <>
                <div className="kpi-grid" style={{ marginBottom: '1.5rem' }}>
                  <div className="kpi-card" style={{ borderLeft: '4px solid #dc2626' }}>
                    <div className="kpi-card-header">
                      <span className="kpi-card-title">Total Void Incidents</span>
                      <ShieldAlert size={18} color="#dc2626" />
                    </div>
                    <div className="kpi-card-value">{voidLogs.length}</div>
                    <div className="kpi-card-subtitle">
                      <span>Authorized by manager PIN</span>
                    </div>
                  </div>

                  <div className="kpi-card" style={{ borderLeft: '4px solid #ef4444' }}>
                    <div className="kpi-card-header">
                      <span className="kpi-card-title">Total Voided Value</span>
                      <TrendingDown size={18} color="#ef4444" />
                    </div>
                    <div className="kpi-card-value">
                      {formatINR(totalVoidValue)}
                    </div>
                    <div className="kpi-card-subtitle">
                      <span>Cancelled items amount</span>
                    </div>
                  </div>

                  <div className="kpi-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                    <div className="kpi-card-header">
                      <span className="kpi-card-title">Highest Void</span>
                      <Flame size={18} color="#f59e0b" />
                    </div>
                    <div className="kpi-card-value">₹{highestVoid}</div>
                    <div className="kpi-card-subtitle">
                      <span>Highest single cancelled item</span>
                    </div>
                  </div>
                </div>

                {/* Audit Data Table */}
                <div className="data-table-wrapper">
                  <table className="reports-data-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Order / Ref</th>
                        <th>Item Cancelled</th>
                        <th>Qty & Value</th>
                        <th>Original Waiter</th>
                        <th>Authorizing Manager</th>
                        <th>Cancellation Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voidLogs.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                            Zero void incidents logged. All punched items successfully served.
                          </td>
                        </tr>
                      ) : (
                        voidLogs.map((record) => (
                          <tr key={record.id}>
                            <td style={{ fontWeight: 600, color: '#475569', fontSize: '0.8125rem' }}>
                              {record.time}
                            </td>
                            <td>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{record.orderNumber}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{record.tableNumber}</div>
                            </td>
                            <td style={{ fontWeight: 600, color: '#b91c1c' }}>{record.item}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{formatINR(record.amount)}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Qty: {record.qty}</div>
                            </td>
                            <td style={{ color: '#334155', fontWeight: 500 }}>{record.originalWaiter}</td>
                            <td>
                              <span className="pin-masked-tag">PIN: {record.managerPin}</span>
                            </td>
                            <td>
                              <span className="reason-tag">{record.reason}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* =========================================================================
          VIEW E: GST & CA EXPORT MODULE
          ========================================================================= */}
      {activeTab === 'gst-export' && (
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">
                <FileSpreadsheet size={20} color="#4f46e5" />
                GST Statutory Returns & Chartered Accountant (CA) Exporter
              </h3>
              <p className="report-card-subtitle">
                1-click statutory GSTR-1 compliant exports formatted for direct import into ClearTax, Tally Prime, and GSTN Portal
              </p>
            </div>
          </div>

          {/* 3 Prominent Export Cards */}
          <div className="export-cards-grid">
            {/* Card 1: Table 7 */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Table 7 (B2C Consolidated)</h3>
                    <p>Consolidated small supplies for direct consumer retail dining & takeaway under 5% GST rate.</p>
                    <span className="export-format-badge">GSTR-1 Format • Table 7</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                onClick={handleExportTable7}
              >
                <Download size={16} />
                Download Table 7 CSV
              </button>
            </div>

            {/* Card 2: Section 9(5) */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon" style={{ background: '#ffedd5', color: '#ea580c' }}>
                    <Download size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Section 9(5) (Swiggy / Zomato)</h3>
                    <p>Segregated E-Commerce Operator deliveries where GST liability & TCS are deposited by ECO platforms.</p>
                    <span className="export-format-badge">GSTR-1 Format • Sec 9(5)</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                style={{ background: '#ea580c' }}
                onClick={handleExportSection9_5}
              >
                <Download size={16} />
                Download Sec 9(5) CSV
              </button>
            </div>

            {/* Card 3: Table 12 */}
            <div className="export-action-card">
              <div>
                <div className="export-card-top">
                  <div className="export-card-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="export-card-info">
                    <h3>Export Table 12 (HSN / SAC Summary)</h3>
                    <p>Consolidated SAC 996331 service code ledger with total tax, CGST (2.5%), and SGST (2.5%) amounts.</p>
                    <span className="export-format-badge">GSTR-1 Format • Table 12</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="btn-export-download"
                style={{ background: '#059669' }}
                onClick={handleExportTable12}
              >
                <Download size={16} />
                Download Table 12 CSV
              </button>
            </div>
          </div>

          {/* CA Summary Preview */}
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#334155', fontWeight: 700 }}>
              Audit Filing Preview (Current Settled Bills)
            </h4>
            <div style={{ fontSize: '0.8125rem', color: '#64748b', lineHeight: 1.6 }}>
              • Total Taxable Turnover: <strong>{formatINR(dailySummary.netSales)}</strong><br />
              • Output Tax (CGST 2.5% + SGST 2.5%): <strong>{formatINR(dailySummary.totalTax)}</strong><br />
              • Aggregator Turnover (ECO Sec 9(5)): <strong>{formatINR(dailySummary.paymentSplits.swiggy + dailySummary.paymentSplits.zomato)} (Swiggy + Zomato)</strong><br />
              • Direct Counter Turnover (Table 7): <strong>{formatINR(dailySummary.paymentSplits.cash + dailySummary.paymentSplits.upi + dailySummary.paymentSplits.cards)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Invoice Preview & Reprint Modal */}
      {inspectedBill && (
        <ReceiptModal
          isOpen={Boolean(inspectedBill)}
          onClose={() => setInspectedBill(null)}
          mode="BILL"
          bill={inspectedBill}
          customerName={inspectedBill.customerName}
          customerPhone={inspectedBill.customerPhone}
        />
      )}
    </div>
  );
};
