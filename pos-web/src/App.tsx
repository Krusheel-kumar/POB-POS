import { useState, useMemo, useEffect, useCallback } from 'react';
import type {
  Product,
  ProductCategory,
  ProductRequest,
  CategoryRequest,
  CartItem,
  OrderType,
  CalculationResponse,
  CreateOrderRequest,
  RestaurantTable,
  TableStatus,
  PaymentPolicy,
  Bill,
  PaymentMethod,
  Order,
  AddOn,
  AddOnRequest,
  Outlet,
} from './types/pos';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartPanel } from './components/CartPanel';
import { OrderReviewModal } from './components/OrderReviewModal';
import { TableManagementView } from './components/TableManagementView';
import { PaymentCollectModal } from './components/PaymentCollectModal';
import { KitchenDisplay } from './components/KitchenDisplay';
import { AdminLayout } from './components/admin/AdminLayout';
import { ReceiptModal } from './components/ReceiptModal';
import { AddProductModal } from './components/AddProductModal';
import { ManagerVoidModal, type VoidItemDetails } from './components/ManagerVoidModal';
import { recordVoidAuditLog } from './lib/mockReportsData';
import { posApiClient } from './api/posApiClient';
import { mockStore } from './data/mockStore';
import './App.css';

type ActiveTab = 'MENU' | 'TABLES';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const [activeTab, setActiveTab] = useState<ActiveTab>('MENU');

  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [receiptModal, setReceiptModal] = useState<{
    isOpen: boolean;
    mode: 'BILL' | 'KOT';
    order?: Order | null;
    bill?: Bill | null;
    customerName?: string;
    customerPhone?: string;
  }>({ isOpen: false, mode: 'BILL' });

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat-all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);

  // Table Management State
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // Running Order State (When adding items to an existing running dine-in order)
  const [runningOrder, setRunningOrder] = useState<Order | null>(null);

  // Payment Collection Modal State
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);
  const [activePaymentBill, setActivePaymentBill] = useState<Bill | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Outlet & Payment Policy
  const [paymentPolicy, setPaymentPolicy] = useState<PaymentPolicy>('PAY_FIRST');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [currentOutletId, setCurrentOutletId] = useState<string>(() => posApiClient.getConfig().outletId || 'outlet-demo-flagship');

  useEffect(() => {
    let isMounted = true;
    posApiClient.getOutlets().then((list) => {
      if (isMounted) {
        setOutlets(list);
        const configured = posApiClient.getConfig().outletId;
        if (!configured && list.length > 0) {
          setCurrentOutletId(list[0].id);
          posApiClient.updateConfig({ outletId: list[0].id });
        }
      }
    }).catch(console.warn);
    return () => { isMounted = false; };
  }, []);

  const handleSwitchOutlet = (newId: string) => {
    setCurrentOutletId(newId);
    posApiClient.updateConfig({ outletId: newId });
    loadTables();
  };

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null);

  // Strict KOT Anti-Fraud Lock and Manager Void State
  const [isKotSent, setIsKotSent] = useState<boolean>(false);
  const [voidTarget, setVoidTarget] = useState<VoidItemDetails | null>(null);

  // Backend calculation state (null indicates fallback local estimate)
  const [backendCalculation, setBackendCalculation] = useState<CalculationResponse | null>(null);

  // Load Tables
  const loadTables = useCallback(async () => {
    try {
      const outletId = posApiClient.getConfig().outletId;
      if (!outletId) return;
      const data = await posApiClient.getTables(outletId);
      setTables(data);
    } catch (err: unknown) {
      console.warn('Could not fetch tables:', err);
    }
  }, []);

  // Load Real Catalog Data from Backend
  const loadCatalog = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [catData, prodData, addOnData] = await Promise.all([
        posApiClient.getCategories(),
        posApiClient.getProducts(),
        posApiClient.getAddOns(),
      ]);
      const allCategory: ProductCategory = {
        id: 'cat-all',
        name: 'All Items',
        displayOrder: 0,
        isActive: true,
      };
      setCategories([allCategory, ...catData]);
      setProducts(prodData);
      setAddOns(addOnData);
      await loadTables();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to backend';
      setApiError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [loadTables]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  // Recalculate totals with backend pricing when cart items change
  useEffect(() => {
    if (cartItems.length === 0) {
      setBackendCalculation(null);
      return;
    }

    const calcItems = cartItems.map((item) => ({
      productId: item.product.id,
      variantId: item.selectedVariant?.id,
      addOnIds: item.selectedAddOns.map((a) => a.id),
      quantity: item.quantity,
    }));

    posApiClient
      .calculatePricing(calcItems)
      .then((calc) => {
        if (calc) {
          setBackendCalculation(calc);
        }
      })
      .catch(() => {
        // Silent catch: falls back to item line totals
      });
  }, [cartItems]);

  // Filter products by category, subcategory, and search query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        selectedCategoryId === 'cat-all' ||
        product.category?.id === selectedCategoryId;
      const matchesSubcategory =
        selectedSubcategory === 'all' ||
        product.subcategory === selectedSubcategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSubcategory && matchesSearch;
    });
  }, [products, selectedCategoryId, selectedSubcategory, searchQuery]);

  // Current category subcategories for filter pills
  const currentCategorySubcategories = useMemo(() => {
    if (selectedCategoryId === 'cat-all') {
      const allSubs = new Set<string>();
      products.forEach((p) => {
        if (p.subcategory) allSubs.add(p.subcategory);
      });
      return Array.from(allSubs);
    }
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (cat?.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories;
    }
    const subSet = new Set<string>();
    products
      .filter((p) => p.category?.id === selectedCategoryId)
      .forEach((p) => {
        if (p.subcategory) subSet.add(p.subcategory);
      });
    return Array.from(subSet);
  }, [categories, products, selectedCategoryId]);

  // Cart Management
  const handleAddToCart = (item: Omit<CartItem, 'id' | 'lineTotal'>) => {
    const newItem: CartItem = {
      ...item,
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      lineTotal: item.unitPrice * item.quantity,
    };
    setCartItems((prev) => [...prev, newItem]);
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0
              ? {
                  ...item,
                  quantity: newQty,
                  lineTotal: item.unitPrice * newQty,
                }
              : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCustomerNotes('');
    setCustomerName('');
    setCustomerPhone('');
    setBackendCalculation(null);
    setRunningOrder(null);
    setIsKotSent(false);
  };

  const handleConfirmVoid = (reason: string, notes: string, managerPin: string) => {
    if (!voidTarget) return;

    if (voidTarget.id === 'cart-all') {
      setCartItems([]);
      setIsKotSent(false);
    } else {
      setCartItems((prev) =>
        prev
          .map((item) => {
            if (item.id === voidTarget.id) {
              const newQty = item.quantity - voidTarget.quantity;
              return newQty > 0
                ? { ...item, quantity: newQty, lineTotal: item.unitPrice * newQty }
                : null;
            }
            return item;
          })
          .filter((item): item is CartItem => item !== null)
      );
    }

    recordVoidAuditLog({
      item: voidTarget.name,
      qty: voidTarget.quantity,
      amount: voidTarget.unitPrice * voidTarget.quantity,
      originalWaiter: 'Cashier JD (POS-1)',
      managerPin,
      reason: notes ? `${reason} (${notes})` : reason,
      orderNumber: lastPlacedOrder?.orderNumber || (runningOrder ? runningOrder.orderNumber : 'ORD-2026-LIVE'),
      tableNumber: selectedTable ? `Table #${selectedTable.tableNumber}` : 'Counter Pickup',
    });

    const voidedName = voidTarget.name;
    setVoidTarget(null);
    setOrderSuccessMessage(`🛡️ Void authorized by Manager (PIN: ${managerPin}) for "${voidedName}". Logged to Anti-Fraud Audit.`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  // Table Selection & Actions
  const handleSelectTable = (table: RestaurantTable) => {
    setSelectedTable(table);
    setOrderType('DINE_IN');
    setRunningOrder(null);
    setActiveTab('MENU');
  };

  const handleOpenRunningOrder = async (orderId: string) => {
    try {
      setIsLoading(true);
      const order = await posApiClient.getOrderById(orderId);
      setRunningOrder(order);
      setOrderType('DINE_IN');
      if (order.table) {
        setSelectedTable(order.table);
      }
      setActiveTab('MENU');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to load running order');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTable = async (tableNumber: string, capacity: number) => {
    const outletId = posApiClient.getConfig().outletId || '00000000-0000-0000-0000-000000000000';
    await posApiClient.createTable({
      outletId,
      tableNumber,
      capacity,
    });
    await loadTables();
  };

  const handleDeleteTable = async (tableId: string) => {
    await posApiClient.deleteTable(tableId);
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
    await loadTables();
  };

  const handleUpdateTableStatus = async (tableId: string, status: TableStatus, reason?: string) => {
    await posApiClient.updateTableStatus(tableId, { status, reason });
    await loadTables();
  };

  // Billing & Payment Actions
  const handleOpenPayment = async (orderId: string) => {
    try {
      setIsProcessingPayment(true);
      const order = await posApiClient.getOrderById(orderId);
      let bill = await posApiClient.getBillByOrderId(orderId);
      if (!bill) {
        bill = await posApiClient.issueBill(orderId);
      }
      setActivePaymentOrder(order);
      setActivePaymentBill(bill);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to open payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleGenerateBill = async (orderId: string) => {
    try {
      const bill = await posApiClient.issueBill(orderId);
      setOrderSuccessMessage(`Bill #${bill.invoiceNumber} generated! Total: ₹${bill.totalAmount.toFixed(2)}`);
      await loadTables();
      setTimeout(() => setOrderSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to generate bill');
    }
  };

  const handleRecordPayment = async (amount: number, method: PaymentMethod, ref?: string) => {
    if (!activePaymentBill || !activePaymentOrder) return;
    setIsProcessingPayment(true);
    try {
      const pmtKey = `PMT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const payment = await posApiClient.recordPayment(activePaymentBill.id, amount, method, pmtKey, ref);
      // Confirm payment to SUCCESSFUL
      await posApiClient.updatePaymentStatus(payment.id, 'SUCCESSFUL');

      setOrderSuccessMessage(`Payment of ₹${amount.toFixed(2)} recorded successfully!`);
      setActivePaymentBill(null);
      setActivePaymentOrder(null);
      await loadTables();
      setTimeout(() => setOrderSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to record payment');
      throw err;
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Policy Switcher
  const handlePolicyChange = async (newPolicy: PaymentPolicy) => {
    const outletId = posApiClient.getConfig().outletId;
    if (!outletId) return;
    try {
      await posApiClient.updatePaymentPolicy(outletId, newPolicy);
      setPaymentPolicy(newPolicy);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Failed to change payment policy');
    }
  };

  // Submit flow: Either create new order or add items to running order
  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setApiError(null);

    // If adding items to an existing running order
    if (runningOrder) {
      try {
        const idempotencyKey = `ADD-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        const updated = await posApiClient.addOrderItems(runningOrder.id, {
          idempotencyKey,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            variantId: item.selectedVariant?.id,
            addOnIds: item.selectedAddOns.map((a) => a.id),
            quantity: item.quantity,
            itemNotes: item.itemNotes.trim() !== '' ? item.itemNotes : undefined,
          })),
        });

        setOrderSuccessMessage(
          `Items added to Order #${updated.orderNumber}! New Total: ₹${updated.totalAmount.toFixed(2)} (Add-on KOT dispatched)`
        );
        setLastPlacedOrder(updated);
        setIsReviewOpen(false);
        setCartItems([]);
        setCustomerNotes('');
        setBackendCalculation(null);
        setRunningOrder(null);
        setIsKotSent(false);
        await loadTables();
        setTimeout(() => setOrderSuccessMessage(null), 6000);
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'Failed to add items to running order');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Normal Create Order flow
    const outletId = posApiClient.getConfig().outletId || 'outlet-demo-flagship';
    const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const orderPayload: CreateOrderRequest = {
      outletId,
      orderType,
      idempotencyKey,
      customerName: customerName.trim() !== '' ? customerName.trim() : undefined,
      customerPhone: customerPhone.trim() !== '' ? customerPhone.trim() : undefined,
      tableId: orderType === 'DINE_IN' && selectedTable ? selectedTable.id : undefined,
      tableNumber: orderType === 'DINE_IN' && selectedTable ? selectedTable.tableNumber : undefined,
      customerNotes: customerNotes.trim() !== '' ? customerNotes : undefined,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        variantId: item.selectedVariant?.id,
        addOnIds: item.selectedAddOns.map((a) => a.id),
        quantity: item.quantity,
        itemNotes: item.itemNotes.trim() !== '' ? item.itemNotes : undefined,
      })),
    };

    try {
      const createdOrder = await posApiClient.createOrder(orderPayload);
      setLastPlacedOrder(createdOrder);
      setIsReviewOpen(false);
      setCartItems([]);
      setCustomerNotes('');
      setBackendCalculation(null);
      setIsKotSent(false);
      await loadTables();

      // Cashier flow: Pay First (COUNTER / TAKEAWAY / PAY_FIRST policy) opens payment immediately;
      // Sit & Order (DINE_IN) sends KOT first and keeps bill open for table checkout.
      if (orderType === 'COUNTER' || orderType === 'TAKEAWAY' || paymentPolicy === 'PAY_FIRST') {
        setOrderSuccessMessage(
          `Order #${createdOrder.orderNumber} placed! Total: ₹${createdOrder.totalAmount.toFixed(2)}`
        );
        await handleOpenPayment(createdOrder.id);
      } else {
        setOrderSuccessMessage(
          `Order #${createdOrder.orderNumber} placed! Total: ₹${createdOrder.totalAmount.toFixed(2)}`
        );
      }

      setTimeout(() => {
        setOrderSuccessMessage(null);
      }, 6000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Click Atomic Quick Settle (Order + Bill + Payment in one atomic pipeline)
  const handleQuickSettle = async (method: PaymentMethod, autoPrintReceipt = true) => {
    if (cartItems.length === 0) return;
    setIsSubmitting(true);
    setApiError(null);

    try {
      const outletId = posApiClient.getConfig().outletId || 'outlet-demo-flagship';
      const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

      const orderPayload: CreateOrderRequest = {
        outletId,
        orderType,
        idempotencyKey,
        customerName: customerName.trim() !== '' ? customerName.trim() : undefined,
        customerPhone: customerPhone.trim() !== '' ? customerPhone.trim() : undefined,
        tableId: orderType === 'DINE_IN' && selectedTable ? selectedTable.id : undefined,
        tableNumber: orderType === 'DINE_IN' && selectedTable ? selectedTable.tableNumber : undefined,
        customerNotes: customerNotes.trim() !== '' ? customerNotes : undefined,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          variantId: item.selectedVariant?.id,
          addOnIds: item.selectedAddOns.map((a) => a.id),
          quantity: item.quantity,
          itemNotes: item.itemNotes.trim() !== '' ? item.itemNotes : undefined,
        })),
      };

      // 1. Create order
      const createdOrder = await posApiClient.createOrder(orderPayload);

      // 2. Issue official gapless GST Tax Invoice
      const issuedBill = await posApiClient.issueBill(createdOrder.id);

      // 3. Record payment immediately with chosen payment method
      const pmtKey = `PMT-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      await posApiClient.recordPayment(issuedBill.id, issuedBill.totalAmount, method, pmtKey);

      // 4. Retrieve complete order with item snapshots for receipt printing
      const finalOrder = await posApiClient.getOrderById(createdOrder.id).catch(() => createdOrder);
      const finalBill = await posApiClient.getBillByOrderId(createdOrder.id).catch(() => issuedBill);

      setLastPlacedOrder(finalOrder);
      setCartItems([]);
      setCustomerNotes('');
      setBackendCalculation(null);
      setIsKotSent(false);
      await loadTables();

      setOrderSuccessMessage(
        `🎉 Bill #${issuedBill.invoiceNumber} Settled via ${method} (₹${issuedBill.totalAmount.toFixed(2)})! Saved to Sales Reports.`
      );
      setTimeout(() => setOrderSuccessMessage(null), 6000);

      // 5. Open Thermal Receipt preview
      if (autoPrintReceipt) {
        setReceiptModal({
          isOpen: true,
          mode: 'BILL',
          order: finalOrder,
          bill: finalBill,
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to settle order';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintBill = async (orderId?: string) => {
    let orderToPrint: Order | null = null;
    let billToPrint: Bill | null = null;
    if (orderId) {
      try {
        orderToPrint = await posApiClient.getOrderById(orderId);
        billToPrint = await posApiClient.getBillByOrderId(orderId).catch(() => null);
      } catch {
        // fallback
      }
    }
    if (!orderToPrint) {
      if (cartItems.length > 0) {
        try {
          setIsSubmitting(true);
          const outletId = posApiClient.getConfig().outletId || 'outlet-demo-flagship';
          const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          const createdOrder = await posApiClient.createOrder({
            outletId,
            orderType,
            idempotencyKey,
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            tableId: orderType === 'DINE_IN' && selectedTable ? selectedTable.id : undefined,
            tableNumber: orderType === 'DINE_IN' && selectedTable ? selectedTable.tableNumber : undefined,
            customerNotes: customerNotes.trim() || undefined,
            items: cartItems.map((item) => ({
              productId: item.product.id,
              variantId: item.selectedVariant?.id,
              addOnIds: item.selectedAddOns.map((a) => a.id),
              quantity: item.quantity,
              itemNotes: item.itemNotes.trim() !== '' ? item.itemNotes : undefined,
            })),
          });

          const bill = await posApiClient.issueBill(createdOrder.id);
          orderToPrint = await posApiClient.getOrderById(createdOrder.id).catch(() => createdOrder);
          billToPrint = bill;
          setLastPlacedOrder(orderToPrint);
          setCartItems([]);
          setCustomerNotes('');
          setBackendCalculation(null);
          setIsKotSent(false);
          await loadTables();

          setOrderSuccessMessage(`🧾 Bill #${bill.invoiceNumber} generated! Click 'Collect Payment' to settle.`);
          setTimeout(() => setOrderSuccessMessage(null), 6000);
        } catch (err: unknown) {
          console.warn('Backend bill generation failed, using local estimate:', err);
          const estSubtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);
          const estDiscount = backendCalculation?.discountAmount ?? 0;
          const estTaxable = estSubtotal - estDiscount;
          const estTax = backendCalculation?.taxAmount ?? (estTaxable * 0.05);
          const estTotal = backendCalculation?.totalAmount ?? (estTaxable + estTax);

          orderToPrint = {
            id: `temp-bill-${Date.now()}`,
            orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            orderType,
            status: 'CONFIRMED',
            customerName: customerName.trim() || undefined,
            customerPhone: customerPhone.trim() || undefined,
            subtotal: estSubtotal,
            discountAmount: estDiscount,
            taxableAmount: estTaxable,
            taxAmount: estTax,
            totalAmount: estTotal,
            table: selectedTable ? selectedTable : undefined,
            customerNotes,
            items: cartItems.map((ci) => ({
              id: ci.id,
              productNameSnapshot: ci.product.name,
              variantNameSnapshot: ci.selectedVariant?.name,
              quantity: ci.quantity,
              unitPriceSnapshot: ci.unitPrice,
              lineTotalSnapshot: ci.lineTotal,
              itemNotes: ci.itemNotes,
              addOns: ci.selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
            })),
            createdAt: new Date().toISOString(),
          };
        } finally {
          setIsSubmitting(false);
        }
      } else if (lastPlacedOrder) {
        orderToPrint = lastPlacedOrder;
        billToPrint = await posApiClient.getBillByOrderId(lastPlacedOrder.id).catch(() => null);
      } else {
        const seedBills = mockStore.getBills();
        if (seedBills.length > 0 && seedBills[0].order) {
          orderToPrint = await posApiClient.getOrderById(seedBills[0].order.id);
        }
      }
    }

    setReceiptModal({
      isOpen: true,
      mode: 'BILL',
      order: orderToPrint,
      bill: billToPrint,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    });
  };

  const handlePrintKot = async (orderId?: string) => {
    setIsKotSent(true);
    let orderToPrint: Order | null = null;
    if (orderId) {
      try {
        orderToPrint = await posApiClient.getOrderById(orderId);
      } catch {
        // fallback
      }
    }
    if (!orderToPrint) {
      if (cartItems.length > 0) {
        const estSubtotal = cartItems.reduce((s, i) => s + i.lineTotal, 0);
        orderToPrint = {
          id: `temp-kot-${Date.now()}`,
          orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          orderType,
          status: 'CONFIRMED',
          customerName: customerName.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          subtotal: estSubtotal,
          discountAmount: 0,
          taxableAmount: estSubtotal,
          taxAmount: 0,
          totalAmount: estSubtotal,
          table: selectedTable ? selectedTable : undefined,
          customerNotes,
          items: cartItems.map((ci) => {
            const addOnNames = ci.selectedAddOns.map((a) => a.name).join(', ');
            const fullVariant = ci.selectedVariant?.name
              ? (addOnNames ? `${ci.selectedVariant.name} • +${addOnNames}` : ci.selectedVariant.name)
              : (addOnNames ? `+${addOnNames}` : undefined);
            return {
              id: ci.id,
              productNameSnapshot: ci.product.name,
              variantNameSnapshot: fullVariant,
              quantity: ci.quantity,
              unitPriceSnapshot: ci.unitPrice,
              lineTotalSnapshot: ci.lineTotal,
              itemNotes: ci.itemNotes,
              addOns: ci.selectedAddOns.map((a) => ({ id: a.id, name: a.name, price: a.price })),
            };
          }),
          createdAt: new Date().toISOString(),
        };
      } else if (lastPlacedOrder) {
        orderToPrint = lastPlacedOrder;
      } else {
        const seedOrders = mockStore.getOrders();
        if (seedOrders.length > 0) {
          orderToPrint = seedOrders[0];
        }
      }
    }

    setReceiptModal({
      isOpen: true,
      mode: 'KOT',
      order: orderToPrint,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
    });
  };

  const handleCreateProduct = async (req: ProductRequest) => {
    await posApiClient.createProduct(req);
    await loadCatalog();
    setOrderSuccessMessage(`✨ Item "${req.name}" created and added to live menu!`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  const handleUpdateProduct = async (id: string, req: ProductRequest) => {
    await posApiClient.updateProduct(id, req);
    await loadCatalog();
    setOrderSuccessMessage(`✨ Item "${req.name}" updated successfully!`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  const handleDeleteProduct = async (id: string) => {
    await posApiClient.deleteProduct(id);
    await loadCatalog();
    setOrderSuccessMessage('🗑️ Item removed from catalog!');
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  const handleCreateCategory = async (req: CategoryRequest) => {
    const newCat = await posApiClient.createCategory(req);
    await loadCatalog();
    setSelectedCategoryId(newCat.id);
    setSelectedSubcategory('all');
    setOrderSuccessMessage(`📁 Category "${newCat.name}" created successfully!`);
    setTimeout(() => setOrderSuccessMessage(null), 5000);
    return newCat;
  };

  const handleCreateAddOn = async (req: AddOnRequest) => {
    const created = await posApiClient.createAddOn(req);
    await loadCatalog();
    return created;
  };

  const handleDeleteAddOn = async (id: string) => {
    await posApiClient.deleteAddOn(id);
    await loadCatalog();
  };

  const handleClearCatalog = async () => {
    await posApiClient.clearCatalog();
    await loadCatalog();
    setSelectedCategoryId('cat-all');
    setSelectedSubcategory('all');
    setOrderSuccessMessage('🧹 Catalog cleared! Ready to add fresh categories, toppings & items.');
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  const handleLoadSampleCatalog = async () => {
    await posApiClient.loadSampleCatalog();
    await loadCatalog();
    setSelectedCategoryId('cat-all');
    setSelectedSubcategory('all');
    setOrderSuccessMessage('📥 Sample demo catalog restored!');
    setTimeout(() => setOrderSuccessMessage(null), 5000);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  if (currentPath === '/admin' || currentPath === '/admin/reports' || currentPath === '/admin/inventory') {
    return (
      <AdminLayout
        initialTab={
          currentPath === '/admin/reports'
            ? 'reports'
            : currentPath === '/admin/inventory'
            ? 'inventory'
            : 'dashboard'
        }
        onBackToPos={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
        onNavigateToKitchen={() => {
          window.history.pushState({}, '', '/kitchen');
          setCurrentPath('/kitchen');
        }}
      />
    );
  }

  if (currentPath === '/kitchen') {
    return (
      <KitchenDisplay
        onBackToPos={() => {
          window.history.pushState({}, '', '/');
          setCurrentPath('/');
        }}
      />
    );
  }

  return (
    <div className="pos-app-root">
      {/* Top Header Bar - Minimal High-Brand Executive POS Header */}
      <header className="pos-topbar" role="banner">
        <div className="topbar-left">
          <div className="brand-badge-box">
            <div className="brand-icon-logo">P</div>
            <div className="brand-text-stack">
              <span className="brand-title-text">POP O' BOB</span>
              <span className="brand-subtitle-tag">POS TERMINAL</span>
            </div>
          </div>

          {/* Primary View Controller Segmented Switch (Operations) */}
          <nav className="topbar-nav-segmented" aria-label="Terminal views">
            <button
              type="button"
              className={`nav-segmented-btn header-action-pill ${activeTab === 'MENU' ? 'active' : ''}`}
              onClick={() => setActiveTab('MENU')}
            >
              <span className="nav-btn-icon">🍽️</span>
              <span>Menu POS</span>
            </button>
            <button
              type="button"
              className={`nav-segmented-btn header-action-pill ${activeTab === 'TABLES' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('TABLES');
                loadTables();
              }}
            >
              <span className="nav-btn-icon">🪑</span>
              <span>Tables</span>
              {tables.filter((t) => t.status === 'RUNNING').length > 0 && (
                <span className="header-badge-count">
                  {tables.filter((t) => t.status === 'RUNNING').length}
                </span>
              )}
            </button>
            <button
              type="button"
              className="nav-segmented-btn header-action-pill"
              onClick={() => {
                window.history.pushState({}, '', '/kitchen');
                setCurrentPath('/kitchen');
              }}
            >
              <span className="nav-btn-icon">🍳</span>
              <span>Kitchen (KDS)</span>
            </button>
          </nav>
        </div>

        {/* Center / Management Quick Tools */}
        <div className="topbar-center-tools">
          <div className="topbar-tools-group">
            <button
              type="button"
              className="topbar-tool-pill header-action-pill header-admin-pill"
              onClick={() => {
                window.history.pushState({}, '', '/admin');
                setCurrentPath('/admin');
              }}
              title="Open Admin Portal to manage catalog, categories, and add-ons"
            >
              ⚙️ Admin
            </button>
            <button
              type="button"
              className="topbar-tool-pill header-action-pill"
              onClick={() => {
                window.history.pushState({}, '', '/admin/reports');
                setCurrentPath('/admin/reports');
              }}
              title="Open Live Analytics & Reports Dashboard"
            >
              📊 Reports
            </button>
            <button
              type="button"
              className="topbar-tool-pill header-action-pill"
              onClick={() => {
                window.history.pushState({}, '', '/admin/inventory');
                setCurrentPath('/admin/inventory');
              }}
              title="Open Advanced Inventory, Recipes (BOM), Central Transfers & Variance Report"
            >
              📦 Inventory
            </button>
            <button
              type="button"
              className="topbar-tool-pill header-action-pill"
              onClick={() => setIsAddProductOpen(true)}
              title="Create and manage menu items, categories, or modifiers in Petpooja view"
            >
              📋 Menu
            </button>
          </div>

          <button
            type="button"
            className="topbar-new-order-btn header-action-pill"
            onClick={handleClearCart}
          >
            + New Order
          </button>
        </div>

        {/* Right Section: Status, Policy, Tools & Staff Avatar */}
        <div className="topbar-right">
          <div className="topbar-status-chip engine-chip" title="Live Fastify + SQLite WAL Production Engine running locally on port 8080">
            <span className="status-live-dot" />
            <span>Fastify (:8080)</span>
          </div>

          <div className="topbar-status-chip branch-chip" title="Current active outlet branch">
            <span className="branch-label-prefix">📍</span>
            <select
              value={currentOutletId}
              onChange={(e) => handleSwitchOutlet(e.target.value)}
              className="branch-native-select"
              aria-label="Active Outlet Branch"
            >
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={paymentPolicy}
            onChange={(e) => handlePolicyChange(e.target.value as PaymentPolicy)}
            className="policy-native-select"
            aria-label="Payment Policy"
          >
            <option value="PAY_FIRST">Pay First (QSR)</option>
            <option value="PAY_LATER">Pay Later (Dine-in)</option>
            <option value="FLEXIBLE">Flexible</option>
          </select>

          <div className="topbar-print-group">
            <button
              type="button"
              className="topbar-icon-action-btn header-action-pill"
              onClick={() => handlePrintKot()}
              title="Preview and print Kitchen Order Ticket (KOT)"
            >
              👨‍🍳 KOT
            </button>
            <button
              type="button"
              className="topbar-icon-action-btn header-action-pill"
              onClick={() => handlePrintBill()}
              title="Preview and print thermal bill receipt"
            >
              🧾 Bill
            </button>
            <button
              type="button"
              className="topbar-icon-action-btn btn-danger-clean header-action-pill"
              onClick={async () => {
                if (window.confirm('Clear all demo products, categories, orders, and reports to start completely fresh?')) {
                  await posApiClient.clearAllDemoData();
                  await loadCatalog();
                  setOrderSuccessMessage('✨ Clean slate activated! All demo data cleared. Ready for your real menu!');
                  setTimeout(() => setOrderSuccessMessage(null), 5000);
                }
              }}
              title="Clear all demo products and start fresh with real items"
            >
              🧹 Demo
            </button>
          </div>

          <div className="user-avatar-pill">
            <span className="avatar-initials">JD</span>
            <span className="avatar-name">John Doe</span>
          </div>
        </div>
      </header>

      {/* Subtoolbar with Centered Search Bar */}
      {activeTab === 'MENU' && (
        <div className="pos-subtoolbar">
          {selectedTable && (
            <div className="subtoolbar-table-badge">
              <span>🪑 Table: {selectedTable.tableNumber}</span>
            </div>
          )}

          <div className="search-input-wrapper">
            <span className="search-icon-inside">🔍</span>
            <input
              type="search"
              placeholder="Search dishes, burgers, pizzas, boba tea, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="retail-search-bar"
              aria-label="Search items"
            />
            {searchQuery ? (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            ) : (
              <span className="search-shortcut-hint">⌘K</span>
            )}
          </div>

          {orderSuccessMessage && (
            <div className="topbar-success-alert" role="status" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              ✓ {orderSuccessMessage}
            </div>
          )}
          {apiError && (
            <div className="topbar-error-alert" role="alert" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>
              ⚠ {apiError}
              <button type="button" className="retry-btn" onClick={loadCatalog}>Retry</button>
            </div>
          )}
        </div>
      )}

      {/* Main Container: Either Table View OR Menu POS View */}
      {activeTab === 'TABLES' ? (
        <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>
          <TableManagementView
            tables={tables}
            selectedTableId={selectedTable?.id ?? null}
            onSelectTable={handleSelectTable}
            onOpenRunningOrder={handleOpenRunningOrder}
            onCollectPayment={handleOpenPayment}
            onGenerateBill={handleGenerateBill}
            onPrintBill={handlePrintBill}
            onPrintKot={handlePrintKot}
            onCreateTable={handleCreateTable}
            onDeleteTable={handleDeleteTable}
            onUpdateTableStatus={handleUpdateTableStatus}
            onRefresh={loadTables}
          />
        </div>
      ) : (
        <div className="pos-main-container">
          {/* Category Navigation Sidebar */}
          <nav className="pos-category-nav" aria-label="Menu categories">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-pill ${selectedCategoryId === cat.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSelectedSubcategory('all');
                }}
              >
                <span className="category-name-text">{cat.name}</span>
              </button>
            ))}
            <button
              type="button"
              className="category-pill new-category-pill"
              onClick={() => setIsAddProductOpen(true)}
              title="Create new category & subcategories"
            >
              + New Category
            </button>
          </nav>

          {/* Product Catalog Grid */}
          <section className="pos-catalog-section" aria-label="Product Catalog">
            {/* Subcategory Filter Bar */}
            {currentCategorySubcategories.length > 0 && (
              <div className="subcategory-bar" role="group" aria-label="Subcategories">
                <button
                  type="button"
                  className={`subcat-pill ${selectedSubcategory === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedSubcategory('all')}
                >
                  All (
                  {
                    products.filter(
                      (p) => selectedCategoryId === 'cat-all' || p.category?.id === selectedCategoryId
                    ).length
                  }
                  )
                </button>
                {currentCategorySubcategories.map((sc) => {
                  const count = products.filter(
                    (p) =>
                      (selectedCategoryId === 'cat-all' || p.category?.id === selectedCategoryId) &&
                      p.subcategory === sc
                  ).length;
                  return (
                    <button
                      key={sc}
                      type="button"
                      className={`subcat-pill ${selectedSubcategory === sc ? 'active' : ''}`}
                      onClick={() => setSelectedSubcategory(sc)}
                    >
                      {sc} {count > 0 ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>
            )}

            {isLoading ? (
              <div className="loading-state">
                <p>Loading menu from server...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="no-products-view" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', background: '#ffffff', borderRadius: '16px', border: '2px dashed #cbd5e1', margin: '2rem auto', maxWidth: '480px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✨</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  {products.length === 0 ? 'Fresh Clean Menu Canvas' : 'No Items Found'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                  {products.length === 0
                    ? 'All demo items have been cleared. Ready to start fresh! Click below to add your first real product with your laptop images.'
                    : `No items found matching "${searchQuery || 'selected category'}".`}
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    style={{ background: '#7c3aed', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '0.75rem 1.75rem', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(124, 58, 237, 0.3)' }}
                  >
                    + Add Real Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddProductOpen(true)}
                    style={{ background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.75rem 1.25rem', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                  >
                    + New Category
                  </button>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={(p) => setActiveModalProduct(p)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right Cart Sidebar */}
          <CartPanel
            items={cartItems}
            orderType={orderType}
            onOrderTypeChange={(t) => {
              setOrderType(t);
              if (t !== 'DINE_IN') {
                setSelectedTable(null);
                setRunningOrder(null);
              }
            }}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            customerPhone={customerPhone}
            onCustomerPhoneChange={setCustomerPhone}
            customerNotes={customerNotes}
            onCustomerNotesChange={setCustomerNotes}
            backendCalculation={backendCalculation}
            onReviewOrder={() => setIsReviewOpen(true)}
            onQuickSettle={handleQuickSettle}
            isSubmitting={isSubmitting}
            onPrintBill={() => handlePrintBill()}
            onPrintKot={() => handlePrintKot()}
            selectedTableNumber={orderType === 'DINE_IN' && selectedTable ? selectedTable.tableNumber : null}
            runningOrderId={runningOrder ? runningOrder.id : null}
            onCancelRunningOrder={() => setRunningOrder(null)}
            isKotSent={isKotSent}
            onRequireManagerVoid={(details) => setVoidTarget(details)}
          />
        </div>
      )}

      {/* Product Customization Modal */}
      {activeModalProduct && (
        <ProductModal
          product={activeModalProduct}
          availableAddOns={addOns}
          isOpen={Boolean(activeModalProduct)}
          onClose={() => setActiveModalProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Order Review Modal */}
      <OrderReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirmOrder={handleConfirmOrder}
        items={cartItems}
        orderType={orderType}
        customerNotes={customerNotes}
        calculation={backendCalculation}
        isSubmitting={isSubmitting}
        tableNumber={selectedTable?.tableNumber}
        isAddingToRunningOrder={Boolean(runningOrder)}
      />

      {/* Payment Collection Modal */}
      {activePaymentOrder && (
        <PaymentCollectModal
          isOpen={Boolean(activePaymentOrder)}
          onClose={() => {
            setActivePaymentOrder(null);
            setActivePaymentBill(null);
          }}
          order={activePaymentOrder}
          bill={activePaymentBill}
          onRecordPayment={handleRecordPayment}
          isProcessing={isProcessingPayment}
        />
      )}

      {/* Thermal Receipt & Kitchen Order Ticket (KOT) Preview Modal */}
      <ReceiptModal
        isOpen={receiptModal.isOpen}
        onClose={() => setReceiptModal((p) => ({ ...p, isOpen: false }))}
        mode={receiptModal.mode}
        order={receiptModal.order}
        bill={receiptModal.bill}
        customerName={receiptModal.customerName || customerName}
        customerPhone={receiptModal.customerPhone || customerPhone}
        onOpenPayment={handleOpenPayment}
      />

      {/* Add Product & Category Wizard Modal */}
      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        categories={categories.filter((c) => c.id !== 'cat-all')}
        products={products}
        addOns={addOns}
        onProductCreated={handleCreateProduct}
        onProductUpdated={handleUpdateProduct}
        onProductDeleted={handleDeleteProduct}
        onCategoryCreated={handleCreateCategory}
        onCreateAddOn={handleCreateAddOn}
        onDeleteAddOn={handleDeleteAddOn}
        onClearCatalog={handleClearCatalog}
        onLoadSampleCatalog={handleLoadSampleCatalog}
        initialCategoryId={selectedCategoryId !== 'cat-all' ? selectedCategoryId : undefined}
      />

      {/* Strict Anti-Fraud Manager Approval Modal for Voiding KOT Items */}
      <ManagerVoidModal
        isOpen={Boolean(voidTarget)}
        onClose={() => setVoidTarget(null)}
        item={voidTarget}
        onConfirmVoid={handleConfirmVoid}
      />
    </div>
  );
}

export default App;
