import React, { useState, useEffect } from 'react';
import type { Order, Bill, KitchenTicket } from '../types/pos';
import { getOrderPrintHistory, recordOrderPrint, type OrderPrintHistory } from '../utils/printTracker';
import { posApiClient } from '../api/posApiClient';
import './ReceiptModal.css';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'BILL' | 'KOT';
  order?: Order | any | null;
  bill?: Bill | null;
  ticket?: KitchenTicket | null;
  customerName?: string;
  customerPhone?: string;
  onOpenPayment?: (orderId: string) => void;
  autoPrint?: boolean;
}

export interface ExtractedTopping {
  name: string;
  price: number;
}

export const extractItemToppings = (item: any): ExtractedTopping[] => {
  const toppings: ExtractedTopping[] = [];
  const seen = new Set<string>();

  // 1. Check item.addOns array
  if (Array.isArray(item?.addOns) && item.addOns.length > 0) {
    for (const a of item.addOns) {
      const name = (typeof a === 'string' ? a : (a.name || a.addOnNameSnapshot || a.addon_name || a.addonName || '')).trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      const rawPrice = typeof a === 'object' && a !== null ? (a.price ?? a.addon_price ?? a.addon_price_snapshot ?? 0) : 0;
      toppings.push({
        name,
        price: Number(rawPrice) || 0,
      });
    }
  }

  // 2. Check item.selectedAddOns array
  if (toppings.length === 0 && Array.isArray(item?.selectedAddOns) && item.selectedAddOns.length > 0) {
    for (const a of item.selectedAddOns) {
      const name = (a.name || a.addOnNameSnapshot || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      toppings.push({
        name,
        price: Number(a.price) || 0,
      });
    }
  }

  // 3. Fallback: Parse from variantNameSnapshot if present
  if (toppings.length === 0 && item?.variantNameSnapshot) {
    const rawVariant = String(item.variantNameSnapshot);
    let addonPart = '';
    if (rawVariant.includes('• +')) {
      addonPart = rawVariant.split('• +')[1];
    } else if (rawVariant.includes('•')) {
      addonPart = rawVariant.split('•').slice(1).join('•');
    } else if (rawVariant.startsWith('+')) {
      addonPart = rawVariant.substring(1);
    }

    if (addonPart) {
      const pieces = addonPart.split(',').map((p) => p.trim()).filter(Boolean);
      for (const piece of pieces) {
        const cleanPiece = piece.replace(/^\+/, '').trim();
        const match = cleanPiece.match(/^(.*?)(?:\s*\(\+?₹?(\d+(?:\.\d+)?)\))?$/);
        if (match) {
          const tName = match[1].trim();
          const tPrice = match[2] ? parseFloat(match[2]) : 0;
          if (tName && !seen.has(tName.toLowerCase())) {
            seen.add(tName.toLowerCase());
            toppings.push({ name: tName, price: tPrice });
          }
        } else if (!seen.has(cleanPiece.toLowerCase())) {
          seen.add(cleanPiece.toLowerCase());
          toppings.push({ name: cleanPiece, price: 0 });
        }
      }
    }
  }

  return toppings;
};

export const extractItemCleanVariant = (item: any): string | null => {
  const rawVariant = item?.variantNameSnapshot || item?.variant;
  if (!rawVariant) return null;
  const str = String(rawVariant).trim();
  if (str.startsWith('+')) return null;
  if (str.includes('•')) {
    const mainPart = str.split('•')[0].trim();
    return mainPart && !mainPart.startsWith('+') ? mainPart : null;
  }
  return str;
};

export const buildThermalPrintHtml = (slipHtml: string, title: string): string => {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      @page {
        margin: 0;
        size: 80mm auto;
      }
      *, *::before, *::after {
        -ms-overflow-style: none !important;
        scrollbar-width: none !important;
        box-sizing: border-box !important;
      }
      *::-webkit-scrollbar {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 100% !important;
        height: auto !important;
        min-height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .thermal-slip {
        width: 76mm !important;
        max-width: 76mm !important;
        margin: 0 auto !important;
        padding: 2.5mm 1.5mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
        overflow-y: visible !important;
        max-height: none !important;
        height: auto !important;
        font-family: 'Courier New', Consolas, 'Roboto Mono', monospace !important;
        font-size: 9pt !important;
        font-weight: 800 !important;
        line-height: 1.3 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        color: #000000 !important;
      }
      .thermal-header { text-align: center !important; margin-bottom: 3px !important; }
      .brand-name { font-size: 15pt !important; font-weight: 900 !important; letter-spacing: 1px !important; margin: 0 !important; color: #000 !important; text-transform: uppercase !important; }
      .brand-sub { font-size: 8.5pt !important; font-weight: 800 !important; margin: 1px 0 2px !important; color: #000 !important; }
      .brand-contact { font-size: 7.5pt !important; font-weight: 700 !important; color: #000 !important; line-height: 1.2 !important; max-width: 74mm !important; margin: 0 auto !important; }
      .brand-tax-info { font-size: 8.5pt !important; font-weight: 900 !important; color: #000 !important; margin-top: 2px !important; }
      .brand-gstin { letter-spacing: 0.5px !important; }
      .slip-divider { font-size: 7.5pt !important; letter-spacing: -1px !important; color: #000 !important; font-weight: 900 !important; margin: 3px 0 !important; overflow: hidden !important; white-space: nowrap !important; text-align: center !important; }
      
      .duplicate-alert-banner { border: 1.5px dashed #000 !important; padding: 2px !important; text-align: center !important; margin: 2px 0 !important; }
      .dup-title { font-weight: 900 !important; font-size: 9pt !important; }
      .dup-sub { font-weight: 800 !important; font-size: 8pt !important; }
      .dup-timestamp { font-weight: 700 !important; font-size: 7.5pt !important; }
      
      /* 2x2 Grid Customer & Order Meta */
      .thermal-meta-box { margin: 3px 0 !important; }
      .bill-meta-grid { width: 100% !important; border-collapse: collapse !important; margin: 2px 0 !important; font-size: 8.5pt !important; line-height: 1.3 !important; }
      .bill-meta-grid td { vertical-align: top !important; padding: 1.5px 2px !important; }
      .grid-cell.cell-left { width: 52% !important; text-align: left !important; }
      .grid-cell.cell-right { width: 48% !important; text-align: left !important; padding-left: 4px !important; }
      .grid-row { display: flex !important; gap: 3px !important; overflow: hidden !important; white-space: nowrap !important; }
      .grid-lbl { font-weight: 800 !important; color: #000 !important; min-width: 38px !important; }
      .grid-val { font-weight: 700 !important; color: #000 !important; overflow: hidden !important; text-overflow: ellipsis !important; }
      .grid-val.bold { font-weight: 900 !important; }

      /* Items Table & Toppings */
      .thermal-items-table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 2px 0 !important; }
      .thermal-items-table th { font-weight: 900 !important; font-size: 8.5pt !important; color: #000 !important; padding: 1.5px 0 !important; letter-spacing: 0.5px !important; border-bottom: 1px dashed #000 !important; }
      .thermal-items-table td { padding: 1.5px 0 !important; vertical-align: top !important; font-size: 8.5pt !important; color: #000 !important; }
      .th-item, .td-item { width: 46% !important; text-align: left !important; word-break: break-word !important; }
      .th-qty, .td-qty { width: 12% !important; text-align: center !important; font-weight: 800 !important; }
      .th-rate, .td-rate { width: 21% !important; text-align: right !important; font-weight: 800 !important; padding-right: 4px !important; }
      .th-amt, .td-amt { width: 21% !important; text-align: right !important; font-weight: 900 !important; }
      .table-item-name { font-weight: 900 !important; line-height: 1.25 !important; color: #000 !important; }
      .table-item-sub { font-size: 7.5pt !important; font-weight: 700 !important; color: #222 !important; padding-left: 4px !important; }
      
      /* Transparent Toppings Rows */
      .table-topping-row td { padding: 0.5px 0 !important; font-size: 7.5pt !important; }
      .td-topping-name { padding-left: 6px !important; font-weight: 700 !important; color: #111 !important; }
      .td-topping-price { font-weight: 800 !important; color: #000 !important; text-align: right !important; }
      .table-note-row td { padding: 0.5px 0 !important; font-size: 7.5pt !important; font-style: italic !important; padding-left: 6px !important; }

      /* Totals Table */
      .thermal-totals-table { width: 100% !important; border-collapse: collapse !important; margin: 2px 0 !important; }
      .thermal-totals-table td { padding: 1px 0 !important; }
      .calc-label { font-weight: 700 !important; font-size: 8.5pt !important; color: #000 !important; text-align: left !important; }
      .calc-val { font-weight: 800 !important; font-size: 8.5pt !important; color: #000 !important; text-align: right !important; }
      .grand-total-tr .grand-label { font-size: 11.5pt !important; font-weight: 900 !important; color: #000 !important; padding: 2px 0 !important; }
      .grand-total-tr .grand-val { font-size: 11.5pt !important; font-weight: 900 !important; color: #000 !important; text-align: right !important; padding: 2px 0 !important; }
      .paid-tag { font-weight: 900 !important; color: #000 !important; }
      
      /* Compact Bill Footer */
      .slip-footer { text-align: center !important; margin-top: 4px !important; }
      .footer-fssai-box { font-size: 8pt !important; font-weight: 800 !important; margin: 2px 0 !important; color: #000 !important; }
      .fssai-number { font-weight: 900 !important; letter-spacing: 0.5px !important; }
      .thank-you-msg { font-weight: 900 !important; font-size: 8.5pt !important; margin: 2px 0 1px !important; color: #000 !important; }
      .visit-again-sub { font-weight: 700 !important; font-size: 7.5pt !important; color: #000 !important; margin: 0 0 2px !important; }
      .footer-software { font-size: 7pt !important; font-weight: 600 !important; color: #333 !important; }

      /* Minimal KOT Styling */
      .thermal-kot { width: 100% !important; margin: 0 auto !important; }
      .kot-header-minimal { text-align: center !important; margin-bottom: 2px !important; }
      .kot-brand-title { font-size: 16pt !important; font-weight: 900 !important; letter-spacing: 1.5px !important; margin: 0 !important; text-transform: uppercase !important; color: #000 !important; }
      .kot-number-title { font-size: 16pt !important; font-weight: 900 !important; letter-spacing: 1px !important; margin: 2px 0 1px !important; color: #000 !important; }
      .duplicate-kot-banner-compact { border: 1.5px solid #000 !important; font-weight: 900 !important; font-size: 8.5pt !important; text-align: center !important; padding: 2px !important; margin: 2px 0 !important; }
      .kot-compact-meta { margin: 2px 0 !important; font-size: 8.5pt !important; line-height: 1.35 !important; }
      .kot-compact-row { display: flex !important; justify-content: space-between !important; margin: 1px 0 !important; }
      .kot-compact-note { font-size: 8pt !important; font-weight: 800 !important; border: 1px dashed #000 !important; padding: 1.5px 3px !important; margin: 2px 0 !important; }
      .kot-items-table-header { display: flex !important; justify-content: space-between !important; font-size: 8.5pt !important; font-weight: 900 !important; padding: 1px 0 !important; }
      .col-kot-qty { width: 32px !important; text-align: left !important; font-weight: 900 !important; }
      .col-kot-item { flex: 1 !important; text-align: left !important; font-weight: 900 !important; }
      .kot-items-list { margin: 2px 0 !important; }
      .kot-item-entry { padding: 2px 0 !important; border-bottom: 1px dashed #555 !important; }
      .kot-item-entry:last-child { border-bottom: none !important; }
      .kot-item-main { display: flex !important; align-items: baseline !important; gap: 6px !important; }
      .kot-qty { font-size: 12pt !important; font-weight: 900 !important; width: 28px !important; text-align: left !important; }
      .kot-name { font-size: 10.5pt !important; font-weight: 900 !important; flex: 1 !important; line-height: 1.25 !important; }
      .kot-detail-line { font-size: 8.5pt !important; font-weight: 800 !important; padding-left: 28px !important; margin-top: 1px !important; }
      .kot-variant-line { color: #000 !important; }
      .kot-addons-group { margin: 0.5px 0 !important; }
      .kot-addon-line { font-size: 8.5pt !important; font-weight: 900 !important; color: #000 !important; }
      .kot-item-note { font-size: 7.5pt !important; font-weight: 800 !important; font-style: italic !important; }
      .kot-footer-summary { display: flex !important; justify-content: space-between !important; font-size: 8.5pt !important; font-weight: 900 !important; margin: 2px 0 !important; }
      .no-print { display: none !important; }
    </style>
  </head>
  <body>
    <div class="thermal-slip printable-area">
      ${slipHtml}
    </div>
  </body>
</html>`;
};

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  mode,
  order,
  bill,
  ticket,
  customerName,
  customerPhone,
  onOpenPayment,
  autoPrint = false,
}) => {
  const [fetchedOrder, setFetchedOrder] = useState<Order | null>(null);

  useEffect(() => {
    let isMounted = true;
    const targetOrderId = order?.id || bill?.orderId || bill?.order?.id;
    const hasItems = (order?.items && order.items.length > 0) || (bill?.order?.items && bill.order.items.length > 0);

    if (!hasItems && targetOrderId && targetOrderId !== 'temp-active-order') {
      posApiClient
        .getOrderById(targetOrderId)
        .then((ord) => {
          if (isMounted && ord && ord.items && ord.items.length > 0) {
            setFetchedOrder(ord);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [order, bill, isOpen]);

  const activeOrder = order || bill?.order || fetchedOrder || null;
  const activeItems = (activeOrder?.items && activeOrder.items.length > 0) ? activeOrder.items : [];

  const orderKey =
    activeOrder?.orderNumber ||
    activeOrder?.id ||
    bill?.invoiceNumber ||
    ticket?.orderNumberSnapshot ||
    ticket?.ticketNumber ||
    'temp-active-order';

  const [printHistory, setPrintHistory] = useState<OrderPrintHistory>(() =>
    getOrderPrintHistory(orderKey)
  );
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [printStatusMessage, setPrintStatusMessage] = useState<string | null>(null);
  const [defaultPrinterName, setDefaultPrinterName] = useState<string | null>(null);

  useEffect(() => {
    setPrintHistory(getOrderPrintHistory(orderKey));
  }, [orderKey, isOpen]);

  // Query connected printers when running in Electron desktop app
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      window.electronAPI
        .getPrinters()
        .then((printers) => {
          const def = printers.find((p) => p.isDefault) || printers[0];
          if (def) {
            setDefaultPrinterName(def.displayName || def.name);
          }
        })
        .catch(console.warn);
    }
  }, []);

  const fallbackIframePrint = (fullHtml: string) => {
    try {
      const existingIframe = document.getElementById('pos-receipt-print-iframe');
      if (existingIframe && document.body.contains(existingIframe)) {
        document.body.removeChild(existingIframe);
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'pos-receipt-print-iframe';
      iframe.setAttribute(
        'style',
        'position:fixed;top:-9999px;left:-9999px;width:80mm;height:0;border:none;visibility:hidden;'
      );
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) {
        window.print();
        return;
      }

      doc.open();
      doc.write(fullHtml);
      doc.close();

      const triggerPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.warn('Iframe print error, falling back to window.print():', err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      };

      // Fast trigger upon document write completion (50ms instead of 250ms)
      setTimeout(triggerPrint, 40);
    } catch (e) {
      console.warn('Print iframe creation error, using window.print():', e);
      window.print();
    }
  };

  const handlePrint = async () => {
    const updated = recordOrderPrint(orderKey, mode);
    setPrintHistory(updated);

    const printElement = document.getElementById('printable-thermal-slip');
    if (!printElement) {
      window.print();
      return;
    }

    const docTitle = mode === 'BILL' ? 'Tax Invoice' : 'Kitchen KOT';
    const fullHtml = buildThermalPrintHtml(printElement.innerHTML, docTitle);

    // Fast Path: Electron Silent Printing directly to default Windows PC printer (<150ms, no dialog)
    if (typeof window !== 'undefined' && window.electronAPI?.isElectron) {
      setIsPrinting(true);
      setPrintStatusMessage('⚡ Printing directly to PC default printer...');
      try {
        const result = await window.electronAPI.silentPrintHtml({
          html: fullHtml,
          silent: true,
        });
        if (result.success) {
          setPrintStatusMessage(`✅ Sent to ${defaultPrinterName || 'Default Windows Printer'}`);
          setTimeout(() => setPrintStatusMessage(null), 4000);
        } else {
          console.warn('Silent print returned error:', result.failureReason);
          setPrintStatusMessage('⚠️ Default printer busy, opening print dialog...');
          fallbackIframePrint(fullHtml);
        }
      } catch (err) {
        console.warn('Silent print threw error, falling back:', err);
        fallbackIframePrint(fullHtml);
      } finally {
        setIsPrinting(false);
      }
      return;
    }

    // Web Fallback: Isolated Iframe
    fallbackIframePrint(fullHtml);
  };

  // Instant Automatic Print when opened with autoPrint=true (e.g. "Print Bill" or "Auto-Print on Settle")
  useEffect(() => {
    if (isOpen && autoPrint) {
      const timer = setTimeout(() => {
        handlePrint();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoPrint]);

  const activeCustomerName = order?.customerName || bill?.customerName || customerName;
  const activeCustomerPhone = order?.customerPhone || bill?.customerPhone || customerPhone;
  const isPaid = bill?.status === 'PAID' || order?.status === 'BILLED';
  const targetOrderId = order?.id || bill?.orderId || bill?.order?.id;

  const billTaxable = bill?.taxableAmount ?? (order?.taxableAmount ?? (bill?.subtotal ?? (order?.subtotal ?? 249)));
  const billTax = bill?.taxAmount ?? (order?.taxAmount ?? 12.45);
  const rawTotal = Number((billTaxable + billTax).toFixed(2));
  const finalTotal = bill?.totalAmount ?? (order?.totalAmount ?? Math.round(rawTotal));
  const roundOff = bill?.roundOffAmount ?? Number((finalTotal - rawTotal).toFixed(2));

  if (!isOpen) return null;

  const isDuplicate = mode === 'BILL' ? printHistory.billPrintCount >= 1 : printHistory.kotPrintCount >= 1;
  const printCount = mode === 'BILL' ? printHistory.billPrintCount : printHistory.kotPrintCount;

  return (
    <div className="receipt-modal-backdrop" role="dialog" aria-modal="true">
      <div className="receipt-modal-container">
        <div className="receipt-modal-actions no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div className="modal-title-pill">
              {mode === 'BILL' ? '🧾 Customer Tax Invoice' : '🍳 Kitchen Order Ticket (KOT)'}
            </div>
            {typeof window !== 'undefined' && window.electronAPI?.isElectron && (
              <span
                className="modal-print-status-tag"
                style={{
                  background: '#e0f2fe',
                  color: '#0369a1',
                  borderColor: '#7dd3fc',
                  fontWeight: 800,
                }}
                title="Bills print silently and automatically to this Windows printer"
              >
                🖨️ {defaultPrinterName ? `Printer: ${defaultPrinterName}` : 'Windows Default Printer'}
              </span>
            )}
            {isPaid ? (
              <span className="modal-print-status-tag original" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>
                ✅ PAID & SETTLED
              </span>
            ) : mode === 'BILL' ? (
              <span className="modal-print-status-tag duplicate" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
                ⏳ UNPAID / ISSUED
              </span>
            ) : null}
            {isDuplicate ? (
              <span className="modal-print-status-tag duplicate">
                ⚠️ DUPLICATE (#{printCount + 1})
              </span>
            ) : (
              <span className="modal-print-status-tag original">
                ● ORIGINAL (1st Print)
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {mode === 'BILL' && !isPaid && onOpenPayment && targetOrderId && !targetOrderId.startsWith('temp-') && (
              <button
                type="button"
                className="receipt-btn-print"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderColor: '#059669' }}
                onClick={() => {
                  onClose();
                  onOpenPayment(targetOrderId);
                }}
              >
                💳 Collect Payment
              </button>
            )}
            <button
              type="button"
              className="receipt-btn-print"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting
                ? '⚡ Printing...'
                : `🖨️ Print ${isDuplicate ? 'Duplicate ' : ''}${mode === 'BILL' ? 'Bill' : 'KOT'}`}
            </button>
            <button type="button" className="receipt-btn-close" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Live Automatic Printing Status Banner */}
        {printStatusMessage && (
          <div
            style={{
              backgroundColor: printStatusMessage.includes('✅')
                ? '#059669'
                : printStatusMessage.includes('⚠️')
                ? '#d97706'
                : '#2563eb',
              color: '#ffffff',
              padding: '8px 16px',
              fontSize: '0.86rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              textAlign: 'center',
              letterSpacing: '0.3px',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
            }}
          >
            <span>{printStatusMessage}</span>
          </div>
        )}

        {/* Scrollable Modal Body (For Screen Preview Only) */}
        <div className="receipt-modal-scrollable-body">
          {/* Printable Thermal Slip Area */}
          <div className="thermal-slip printable-area" id="printable-thermal-slip">
          {mode === 'BILL' ? (
            /* COMPACT CUSTOMER BILL / TAX INVOICE */
            <div className="thermal-bill">
              <div className="thermal-header">
                <h2 className="brand-name">POP O' BOB</h2>
                <div className="brand-sub">Speciality Bubble Tea</div>
                <div className="brand-contact">
                  407, Mezzanine, Road No. 81, Film Nagar, Hyderabad, Telangana
                </div>
                <div className="brand-tax-info">
                  <span className="brand-gstin">GSTIN: 36AANFN9623R1Z9</span>
                </div>
                {isDuplicate && (
                  <div className="duplicate-alert-banner">
                    <div className="dup-title">*** DUPLICATE TAX INVOICE ***</div>
                    <div className="dup-sub">[ REPRINT COPY #{printCount + 1} ]</div>
                    {printHistory.firstBillPrintedAt && (
                      <div className="dup-timestamp">
                        Original: {new Date(printHistory.firstBillPrintedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                )}
                <div className="slip-divider">========================================</div>
              </div>

              {/* 2x2 Grid Customer & Order Meta */}
              {(() => {
                const billDateObj = new Date(activeOrder?.createdAt || bill?.createdAt || Date.now());
                const billDateStr = billDateObj.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const billTimeStr = billDateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
                const custName = activeCustomerName || activeOrder?.customerName || bill?.customerName || 'Walk-in Guest';
                const rawPhone = activeCustomerPhone || activeOrder?.customerPhone || bill?.customerPhone;
                const custPhone = rawPhone
                  ? (String(rawPhone).startsWith('+91') ? String(rawPhone) : `+91 ${rawPhone}`)
                  : 'N/A';
                const invoiceNo = bill?.invoiceNumber || (activeOrder?.orderNumber ? activeOrder.orderNumber.replace('ORD', 'POB-FLG') : 'INV-LIVE');
                const orderNo = activeOrder?.orderNumber || bill?.order?.orderNumber || (bill?.invoiceNumber ? bill.invoiceNumber.replace('POB-FLG', 'ORD') : 'ORD-LIVE');
                const rawType = activeOrder?.orderType || bill?.order?.orderType || 'DINE_IN';
                const orderTypeStr = rawType.replace('_', ' ');
                const tableNo = activeOrder?.tableNumber || activeOrder?.table?.tableNumber || bill?.order?.tableNumber || bill?.order?.table?.tableNumber;
                const tableStr = tableNo ? `Table ${tableNo}` : (rawType === 'DINE_IN' ? 'Table T1' : 'Counter');

                return (
                  <div className="thermal-meta-box">
                    <table className="bill-meta-grid">
                      <tbody>
                        <tr>
                          <td className="grid-cell cell-left">
                            <div className="grid-row"><span className="grid-lbl">Cust:</span> <span className="grid-val bold">{custName}</span></div>
                            <div className="grid-row"><span className="grid-lbl">Mob:</span> <span className="grid-val">{custPhone}</span></div>
                          </td>
                          <td className="grid-cell cell-right">
                            <div className="grid-row"><span className="grid-lbl">Date:</span> <span className="grid-val">{billDateStr}</span></div>
                            <div className="grid-row"><span className="grid-lbl">Time:</span> <span className="grid-val">{billTimeStr}</span></div>
                          </td>
                        </tr>
                        <tr>
                          <td className="grid-cell cell-left">
                            <div className="grid-row"><span className="grid-lbl">Inv:</span> <span className="grid-val bold">{invoiceNo}</span></div>
                            <div className="grid-row"><span className="grid-lbl">Ord:</span> <span className="grid-val bold">#{orderNo}</span></div>
                          </td>
                          <td className="grid-cell cell-right">
                            <div className="grid-row"><span className="grid-lbl">Type:</span> <span className="grid-val bold">{orderTypeStr}</span></div>
                            <div className="grid-row"><span className="grid-lbl">Table:</span> <span className="grid-val">{tableStr}</span></div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              <div className="slip-divider">----------------------------------------</div>

              {/* Items Table with Transparent Topping Pricing */}
              <table className="thermal-items-table">
                <thead>
                  <tr>
                    <th className="th-item">ITEM</th>
                    <th className="th-qty">QTY</th>
                    <th className="th-rate">RATE</th>
                    <th className="th-amt">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {activeItems.length > 0 ? (
                    activeItems.map((item: any, idx: number) => {
                      const itemName = item.productNameSnapshot || item.name || item.product?.name || 'Menu Item';
                      const cleanVariant = extractItemCleanVariant(item);
                      const toppings = extractItemToppings(item);
                      const qty = item.quantity || 1;
                      const lineTotal = item.lineTotalSnapshot != null ? Number(item.lineTotalSnapshot) : (item.unitPriceSnapshot != null ? Number(item.unitPriceSnapshot) * qty : (bill?.subtotal || 0));
                      const rate = item.unitPriceSnapshot != null ? Number(item.unitPriceSnapshot) : (lineTotal / qty);

                      return (
                        <React.Fragment key={idx}>
                          <tr className="thermal-item-row">
                            <td className="td-item">
                              <div className="table-item-name">{itemName}</div>
                              {cleanVariant && (
                                <div className="table-item-sub">• {cleanVariant}</div>
                              )}
                            </td>
                            <td className="td-qty">{qty}</td>
                            <td className="td-rate">₹{rate.toFixed(2)}</td>
                            <td className="td-amt">₹{lineTotal.toFixed(2)}</td>
                          </tr>
                          {toppings.map((top, tIdx) => (
                            <tr key={`top-${idx}-${tIdx}`} className="table-topping-row">
                              <td colSpan={3} className="td-item td-topping-name">
                                + {top.name}
                              </td>
                              <td className="td-amt td-topping-price">
                                {top.price > 0 ? `₹${top.price.toFixed(2)}` : '₹0'}
                              </td>
                            </tr>
                          ))}
                          {item.itemNotes && (
                            <tr key={`note-${idx}`} className="table-note-row">
                              <td colSpan={4} className="table-item-note">
                                * Note: {item.itemNotes}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr className="thermal-item-row">
                      <td className="td-item">
                        <div className="table-item-name">{bill?.notes || 'Ordered Item(s)'}</div>
                      </td>
                      <td className="td-qty">1</td>
                      <td className="td-rate">₹{(bill?.subtotal || order?.subtotal || 0).toFixed(2)}</td>
                      <td className="td-amt">₹{(bill?.subtotal || order?.subtotal || 0).toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="slip-divider">----------------------------------------</div>

              {/* Totals Table */}
              <table className="thermal-totals-table">
                <tbody>
                  <tr>
                    <td className="calc-label">Item Subtotal:</td>
                    <td className="calc-val">₹{(bill?.subtotal || order?.subtotal || 249).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">CGST @ 2.5%:</td>
                    <td className="calc-val">₹{((bill?.taxAmount || order?.taxAmount || 12.45) / 2).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">SGST @ 2.5%:</td>
                    <td className="calc-val">₹{((bill?.taxAmount || order?.taxAmount || 12.45) / 2).toFixed(2)}</td>
                  </tr>
                  {roundOff !== 0 && (
                    <tr>
                      <td className="calc-label">Round Off:</td>
                      <td className="calc-val">{roundOff > 0 ? `+₹${roundOff.toFixed(2)}` : `-₹${Math.abs(roundOff).toFixed(2)}`}</td>
                    </tr>
                  )}
                  <tr className="calc-divider-tr">
                    <td colSpan={2}>
                      <div className="slip-divider">========================================</div>
                    </td>
                  </tr>
                  <tr className="grand-total-tr">
                    <td className="grand-label">NET PAYABLE:</td>
                    <td className="grand-val">₹{finalTotal.toFixed(2)}</td>
                  </tr>
                  <tr className="calc-divider-tr">
                    <td colSpan={2}>
                      <div className="slip-divider">========================================</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="calc-label">Settled Amount:</td>
                    <td className="calc-val paid-tag">₹{(bill?.paidAmount || finalTotal).toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="calc-label">Payment Mode:</td>
                    <td className="calc-val payment-mode-val">
                      {bill?.payments && bill.payments.length > 0
                        ? bill.payments.map((p) => p.paymentMethod).join(', ')
                        : 'CASH / UPI'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Bill Ending: FSSAI Licence & Compact Thank You */}
              <div className="slip-footer">
                <div className="slip-divider">----------------------------------------</div>
                <div className="footer-fssai-box">
                  <span className="fssai-title">FSSAI Lic. No:</span>{' '}
                  <strong className="fssai-number">13622011000492</strong>
                </div>
                <p className="thank-you-msg">*** THANK YOU FOR VISITING POP O' BOB! ***</p>
                <p className="visit-again-sub">Speciality Bubble Tea • Have A Bobaful Day!</p>
                <p className="footer-software">Powered by POP O' BOB Cloud POS</p>
              </div>
            </div>
          ) : (
            /* KITCHEN ORDER TICKET (KOT) - MINIMAL PAPER-SAVING DESIGN */
            <div className="thermal-kot">
              {(() => {
                const rawKot = ticket?.ticketNumber || order?.kotNumber;
                let formattedKotNumber = 'KOT - #001';
                if (rawKot) {
                  if (rawKot.includes('#')) {
                    const numMatch = rawKot.match(/#(\d+)/);
                    const isRound2 = rawKot.includes('Round 2') || rawKot.includes('Running') || rawKot.includes('Add-on');
                    const numStr = numMatch ? numMatch[1].padStart(3, '0') : rawKot.replace(/[^0-9]/g, '').padStart(3, '0');
                    formattedKotNumber = `KOT - #${numStr}${isRound2 ? ' (R2)' : ''}`;
                  } else if (rawKot.startsWith('KOT-') || rawKot.startsWith('KOT -')) {
                    const numPart = rawKot.replace(/[^0-9]/g, '').padStart(3, '0');
                    formattedKotNumber = `KOT - #${numPart}`;
                  } else if (/^\d+$/.test(rawKot)) {
                    formattedKotNumber = `KOT - #${rawKot.padStart(3, '0')}`;
                  } else {
                    formattedKotNumber = rawKot.replace(/^KOT\s*#?/, 'KOT - #');
                  }
                } else if (order?.orderNumber) {
                  const digits = order.orderNumber.replace(/[^0-9]/g, '');
                  const serial = digits.slice(-3).padStart(3, '0') || '001';
                  formattedKotNumber = `KOT - #${serial}`;
                }

                const orderLocation = order?.table
                  ? `Table ${order.table.tableNumber}`
                  : order?.tableNumber
                  ? `Table ${order.tableNumber}`
                  : ticket?.tableNumberSnapshot
                  ? `Table ${ticket.tableNumberSnapshot}`
                  : ticket?.customerNotesSnapshot?.includes('Table')
                  ? ticket.customerNotesSnapshot.split('•')[0].trim()
                  : (order?.orderType || ticket?.orderTypeSnapshot || 'DINE_IN').replace('_', ' ');

                const orderDateObj = new Date(order?.createdAt || Date.now());
                const kotDateStr = orderDateObj.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                const kotTimeStr = orderDateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });

                const kotOrderId = ticket?.orderNumberSnapshot || order?.orderNumber || '0001';
                const kotOrderType = (ticket?.orderTypeSnapshot || order?.orderType || 'DINE_IN').replace('_', ' ');
                const kotOrderTypeWithLoc = `${kotOrderType}${orderLocation ? ` (${orderLocation})` : ''}`;

                const kotItems =
                  ticket?.items && ticket.items.length > 0
                    ? ticket.items.map((it) => {
                        const addOns = (it.addOns && it.addOns.length > 0)
                          ? it.addOns.map((a) => a.addOnNameSnapshot)
                          : [];
                        return {
                          name: it.productNameSnapshot,
                          variant: it.variantNameSnapshot,
                          quantity: it.quantity,
                          addOns,
                          notes: it.itemNotesSnapshot,
                        };
                      })
                    : activeItems.length > 0
                    ? activeItems.map((it: any) => {
                        const cleanVariant = extractItemCleanVariant(it);
                        const toppings = extractItemToppings(it).map((t) => t.name);
                        return {
                          name: it.productNameSnapshot || it.name || it.product?.name || 'Menu Item',
                          variant: cleanVariant,
                          quantity: it.quantity || 1,
                          addOns: toppings,
                          notes: it.itemNotes,
                        };
                      })
                    : [
                        {
                          name: bill?.notes || activeOrder?.orderNumber || '1x Order Ticket',
                          variant: undefined,
                          quantity: 1,
                          addOns: [],
                          notes: undefined,
                        },
                      ];

                const totalKotQty = kotItems.reduce((acc: number, it: any) => acc + (Number(it.quantity) || 1), 0);

                return (
                  <>
                    {/* Minimal KOT Header */}
                    <div className="kot-header-minimal">
                      <div className="kot-brand-title">POP O' BOB</div>
                      <div className="kot-number-title">{formattedKotNumber}</div>
                    </div>

                    {isDuplicate && (
                      <div className="duplicate-kot-banner-compact">
                        ⚠️ DUPLICATE KOT (REPRINT #{printCount + 1})
                      </div>
                    )}

                    {/* Metadata: 2 Single Lines */}
                    <div className="kot-compact-meta">
                      <div className="kot-compact-row">
                        <span><strong>DATE:</strong> {kotDateStr}</span>
                        <span><strong>TIME:</strong> {kotTimeStr}</span>
                      </div>
                      <div className="kot-compact-row">
                        <span><strong>ORDER:</strong> #{kotOrderId}</span>
                        <span><strong>TYPE:</strong> {kotOrderTypeWithLoc}</span>
                      </div>
                      {(ticket?.customerNotesSnapshot || order?.customerNotes) && (
                        <div className="kot-compact-note">
                          * Note: {ticket?.customerNotesSnapshot || order?.customerNotes}
                        </div>
                      )}
                    </div>

                    <div className="slip-divider">----------------------------------------</div>
                    <div className="kot-items-table-header">
                      <span className="col-kot-qty">QTY</span>
                      <span className="col-kot-item">ITEM & TOPPINGS</span>
                    </div>
                    <div className="slip-divider">----------------------------------------</div>

                    <div className="kot-items-list">
                      {kotItems.map((it: any, idx: number) => (
                        <div key={idx} className="kot-item-entry">
                          <div className="kot-item-main">
                            <span className="kot-qty">{it.quantity}x</span>
                            <span className="kot-name">{it.name}</span>
                          </div>
                          {it.variant && (
                            <div className="kot-detail-line kot-variant-line">
                              ▸ Size: {it.variant}
                            </div>
                          )}
                          {it.addOns && it.addOns.length > 0 && (
                            <div className="kot-addons-group">
                              {it.addOns.map((add: string, aIdx: number) => (
                                <div key={aIdx} className="kot-detail-line kot-addon-line">
                                  + {add}
                                </div>
                              ))}
                            </div>
                          )}
                          {it.notes && (
                            <div className="kot-detail-line kot-item-note">
                              * Note: {it.notes}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="slip-divider">----------------------------------------</div>
                    <div className="kot-footer-summary">
                      <span>Items: {kotItems.length}</span>
                      <span>Total Qty: {totalKotQty}</span>
                    </div>
                    <div className="slip-divider">========================================</div>
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
