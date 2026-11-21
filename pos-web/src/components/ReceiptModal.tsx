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
        padding: 3mm 2mm !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
        background: #ffffff !important;
        overflow: visible !important;
        overflow-y: visible !important;
        max-height: none !important;
        height: auto !important;
        font-family: 'Courier New', Consolas, 'Roboto Mono', monospace !important;
        font-size: 9.5pt !important;
        font-weight: 800 !important;
        line-height: 1.35 !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        color: #000000 !important;
      }
      .thermal-header { text-align: center !important; margin-bottom: 6px !important; }
      .brand-name { font-size: 16pt !important; font-weight: 900 !important; letter-spacing: 1.5px !important; margin: 0 !important; color: #000 !important; text-transform: uppercase !important; }
      .brand-sub { font-size: 9.5pt !important; font-weight: 800 !important; margin: 2px 0 4px !important; color: #000 !important; }
      .brand-contact { font-size: 8.5pt !important; font-weight: 700 !important; color: #000 !important; line-height: 1.3 !important; max-width: 74mm !important; margin: 0 auto !important; }
      .brand-tax-info { font-size: 9pt !important; font-weight: 900 !important; color: #000 !important; margin-top: 4px !important; }
      .brand-gstin { letter-spacing: 0.5px !important; }
      .slip-divider { font-size: 8pt !important; letter-spacing: -1px !important; color: #000 !important; font-weight: 900 !important; margin: 4px 0 !important; overflow: hidden !important; white-space: nowrap !important; text-align: center !important; }
      .slip-copy-badge { font-size: 8.5pt !important; font-weight: 900 !important; margin: 2px 0 !important; text-align: center !important; }
      .slip-title { font-weight: 900 !important; font-size: 10.5pt !important; letter-spacing: 0.5px !important; margin: 2px 0 !important; text-align: center !important; }
      .duplicate-alert-banner { border: 1.5px dashed #000 !important; padding: 4px !important; text-align: center !important; margin: 4px 0 !important; }
      .dup-title { font-weight: 900 !important; font-size: 10pt !important; }
      .dup-sub { font-weight: 800 !important; font-size: 8.5pt !important; }
      .dup-timestamp { font-weight: 700 !important; font-size: 8pt !important; }
      .dup-warning { font-weight: 900 !important; font-size: 8.5pt !important; }
      .duplicate-kot-banner { border: 2px solid #000 !important; padding: 5px !important; text-align: center !important; margin: 4px 0 !important; }
      .dup-kot-title { font-weight: 900 !important; font-size: 11pt !important; }
      .dup-kot-sub { font-weight: 800 !important; font-size: 9pt !important; }
      .dup-kot-alert { font-weight: 900 !important; font-size: 9.5pt !important; }
      .dup-kot-alert-sub { font-weight: 700 !important; font-size: 8pt !important; }
      .thermal-meta-box { margin: 6px 0 !important; }
      .receipt-meta-table { width: 100% !important; border-collapse: collapse !important; margin: 3px 0 !important; font-size: 9pt !important; line-height: 1.35 !important; }
      .receipt-meta-table tr { vertical-align: top !important; }
      .receipt-meta-table .meta-key { width: 30% !important; font-weight: 800 !important; color: #000 !important; white-space: nowrap !important; padding: 1.5px 0 !important; }
      .receipt-meta-table .meta-colon { width: 4% !important; text-align: center !important; font-weight: 800 !important; color: #000 !important; padding: 1.5px 0 !important; }
      .receipt-meta-table .meta-val { width: 66% !important; font-weight: 700 !important; color: #000 !important; word-break: break-word !important; padding: 1.5px 0 1.5px 4px !important; }
      .thermal-items-table { width: 100% !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 4px 0 !important; }
      .thermal-items-table th { font-weight: 900 !important; font-size: 9pt !important; color: #000 !important; padding: 2px 0 !important; letter-spacing: 0.5px !important; border-bottom: 1px dashed #000 !important; }
      .thermal-items-table td { padding: 3px 0 !important; vertical-align: top !important; font-size: 9pt !important; color: #000 !important; }
      .th-item, .td-item { width: 44% !important; text-align: left !important; word-break: break-word !important; }
      .th-qty, .td-qty { width: 14% !important; text-align: center !important; font-weight: 800 !important; }
      .th-rate, .td-rate { width: 21% !important; text-align: right !important; font-weight: 800 !important; padding-right: 4px !important; }
      .th-amt, .td-amt { width: 21% !important; text-align: right !important; font-weight: 900 !important; }
      .table-item-name { font-weight: 800 !important; line-height: 1.25 !important; color: #000 !important; }
      .table-item-sub { font-size: 8pt !important; font-weight: 700 !important; color: #111 !important; padding-left: 4px !important; }
      .table-item-note { font-size: 8pt !important; font-weight: 700 !important; color: #111 !important; padding-left: 4px !important; }
      .thermal-totals-table { width: 100% !important; border-collapse: collapse !important; margin: 4px 0 !important; }
      .thermal-totals-table td { padding: 1.5px 0 !important; }
      .calc-label { font-weight: 700 !important; font-size: 9pt !important; color: #000 !important; text-align: left !important; }
      .calc-val { font-weight: 800 !important; font-size: 9pt !important; color: #000 !important; text-align: right !important; }
      .grand-total-tr .grand-label { font-size: 13pt !important; font-weight: 900 !important; color: #000 !important; padding: 3px 0 !important; }
      .grand-total-tr .grand-val { font-size: 13pt !important; font-weight: 900 !important; color: #000 !important; text-align: right !important; padding: 3px 0 !important; }
      .paid-tag { font-weight: 900 !important; color: #000 !important; }
      .slip-footer { text-align: center !important; margin-top: 8px !important; }
      .footer-fssai-box { font-size: 9pt !important; font-weight: 800 !important; margin: 4px 0 !important; color: #000 !important; }
      .fssai-number { font-weight: 900 !important; letter-spacing: 0.5px !important; }
      .qr-box { display: flex !important; flex-direction: column !important; align-items: center !important; margin: 6px 0 !important; }
      .simulated-qr { font-size: 11pt !important; letter-spacing: 3px !important; color: #000 !important; }
      .qr-box span { font-size: 7.5pt !important; font-weight: 700 !important; color: #000 !important; }
      .thank-you-msg { font-weight: 900 !important; font-size: 9.5pt !important; margin: 4px 0 2px !important; color: #000 !important; }
      .visit-again-sub { font-weight: 700 !important; font-size: 8.5pt !important; color: #000 !important; margin: 0 0 4px !important; }
      .footer-software { font-size: 7.5pt !important; font-weight: 600 !important; color: #222 !important; }
      .kot-badge { font-size: 13pt !important; font-weight: 900 !important; color: #000 !important; }
      .kot-number-banner { border: 2px solid #000 !important; padding: 3px 6px !important; display: flex !important; justify-content: center !important; gap: 8px !important; align-items: center !important; }
      .kot-num-title { font-size: 11pt !important; font-weight: 900 !important; color: #000 !important; }
      .kot-number { font-size: 18pt !important; font-weight: 900 !important; color: #000 !important; }
      .kot-location-banner { border: 1.5px solid #000 !important; padding: 4px 6px !important; margin-bottom: 6px !important; font-weight: 900 !important; text-align: center !important; }
      .kot-location-val { font-size: 11pt !important; font-weight: 900 !important; color: #000 !important; }
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

  const formattedDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
            /* TAX INVOICE */
            <div className="thermal-bill">
              <div className="thermal-header">
                <h2 className="brand-name">POP O' BOB</h2>
                <div className="brand-sub">Speciality Bubble Tea</div>
                <div className="brand-contact">
                  407, Mezzanine, Road No. 81, Film Nagar, Hyderabad, Telangana
                </div>
                <div className="brand-tax-info">
                  <span className="brand-gstin">GSTIN/UIN: 36AANFN9623R1Z9</span>
                </div>
                <div className="slip-divider">========================================</div>
                {isDuplicate ? (
                  <div className="duplicate-alert-banner">
                    <div className="dup-title">*** DUPLICATE TAX INVOICE ***</div>
                    <div className="dup-sub">[ REPRINT COPY #{printCount + 1} ]</div>
                    {printHistory.firstBillPrintedAt && (
                      <div className="dup-timestamp">
                        Original Issued: {new Date(printHistory.firstBillPrintedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                    <div className="dup-warning">⚠️ NOT AN ORIGINAL TAX INVOICE</div>
                  </div>
                ) : (
                  <>
                    <div className="slip-copy-badge original">● ORIGINAL FOR RECIPIENT</div>
                    <div className="slip-title">TAX INVOICE / CASH BILL</div>
                  </>
                )}
                <div className="slip-divider">========================================</div>
              </div>

              {/* Customer, Date & Order Meta (Clean structured table - NO sentence gaps) */}
              <div className="thermal-meta-box">
                <table className="receipt-meta-table">
                  <tbody>
                    <tr>
                      <td className="meta-key">Customer</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">{activeCustomerName || activeOrder?.customerName || bill?.customerName || 'Walk-in Guest'}</td>
                    </tr>
                    <tr>
                      <td className="meta-key">Mobile No</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">
                        {activeCustomerPhone || activeOrder?.customerPhone || bill?.customerPhone
                          ? String(activeCustomerPhone || activeOrder?.customerPhone || bill?.customerPhone).startsWith('+91')
                            ? String(activeCustomerPhone || activeOrder?.customerPhone || bill?.customerPhone)
                            : `+91 ${String(activeCustomerPhone || activeOrder?.customerPhone || bill?.customerPhone)}`
                          : 'Walk-in'}
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-key">Date & Time</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">{formattedDate}</td>
                    </tr>
                    <tr>
                      <td className="meta-key">Invoice No</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">
                        {bill?.invoiceNumber || (activeOrder?.orderNumber ? activeOrder.orderNumber.replace('ORD', 'POB-FLG') : 'INV-2026-LIVE')}
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-key">Order No</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">
                        #{activeOrder?.orderNumber || bill?.order?.orderNumber || (bill?.invoiceNumber ? bill.invoiceNumber.replace('POB-FLG', 'ORD') : 'ORD-2026-LIVE')}
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-key">Order Type</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">
                        {activeOrder?.orderType ? activeOrder.orderType.replace('_', ' ') : 'DINE IN'}
                        {activeOrder?.tableNumber ? ` (Table #${activeOrder.tableNumber})` : activeOrder?.table ? ` (Table #${activeOrder.table.tableNumber})` : ' (Counter Pickup)'}
                      </td>
                    </tr>
                    <tr>
                      <td className="meta-key">Cashier</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">POS Terminal #1 (JD)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="slip-divider">----------------------------------------</div>

              {/* Fixed HTML Table for Items to guarantee column alignment without collision */}
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
                      const variantName = item.variantNameSnapshot || item.variant;
                      const qty = item.quantity || 1;
                      const lineTotal = item.lineTotalSnapshot != null ? Number(item.lineTotalSnapshot) : (item.unitPriceSnapshot != null ? Number(item.unitPriceSnapshot) * qty : (bill?.subtotal || 0));
                      const rate = item.unitPriceSnapshot != null ? Number(item.unitPriceSnapshot) : (lineTotal / qty);

                      return (
                        <tr key={idx} className="thermal-item-row">
                          <td className="td-item">
                            <div className="table-item-name">{itemName}</div>
                            {variantName && (
                              <div className="table-item-sub">• {variantName}</div>
                            )}
                            {item.itemNotes && (
                              <div className="table-item-note">* Note: {item.itemNotes}</div>
                            )}
                          </td>
                          <td className="td-qty">{qty}</td>
                          <td className="td-rate">₹{rate.toFixed(2)}</td>
                          <td className="td-amt">₹{lineTotal.toFixed(2)}</td>
                        </tr>
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

              {/* Bill Ending: FSSAI Licence & Thank You */}
              <div className="slip-footer">
                <div className="slip-divider">----------------------------------------</div>
                <div className="footer-fssai-box">
                  <span className="fssai-title">FSSAI Lic. No:</span>{' '}
                  <strong className="fssai-number">13622011000492</strong>
                </div>
                <div className="slip-divider">----------------------------------------</div>

                <div className="qr-box">
                  <div className="simulated-qr">▦ ▣ ▤ ▥ ▦</div>
                  <span>Scan to pay or leave feedback</span>
                </div>
                <p className="thank-you-msg">*** THANK YOU FOR VISITING POP O' BOB! ***</p>
                <p className="visit-again-sub">Speciality Bubble Tea • Have A Bobaful Day!</p>
                <p className="footer-software">Powered by POP O' BOB Cloud POS</p>
              </div>
            </div>
          ) : (
            /* KITCHEN ORDER TICKET (KOT) - PRODUCTION LEVEL */
            <div className="thermal-kot">
              <div className="thermal-header">
                <div className="brand-name">POP O' BOB</div>
                <div className="brand-sub">Speciality Bubble Tea • Barista & Kitchen Line</div>
                <div className="slip-divider">========================================</div>
                {isDuplicate ? (
                  <div className="duplicate-kot-banner">
                    <div className="dup-kot-title">⚠️ *** DUPLICATE KOT *** ⚠️</div>
                    <div className="dup-kot-sub">[ REPRINT COPY #{printCount + 1} ]</div>
                    <div className="dup-kot-alert">🛑 CHECK IF ALREADY PREPARED! 🛑</div>
                    {printHistory.firstKotPrintedAt && (
                      <div className="dup-kot-alert-sub">
                        Original KOT printed: {new Date(printHistory.firstKotPrintedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="slip-copy-badge original">● ORIGINAL KOT (KITCHEN COPY)</div>
                    <div className="kot-badge">KITCHEN ORDER TICKET</div>
                  </>
                )}

                <div className="kot-number-banner">
                  <span className="kot-num-title">KOT NO:</span>
                  <span className="kot-number">
                    {ticket?.ticketNumber || (order?.orderNumber ? order.orderNumber.replace('ORD-', 'KOT-') : 'KOT-104')}
                  </span>
                </div>
                <div className="slip-divider">========================================</div>
              </div>

              <div className="thermal-meta-box">
                <div className="kot-location-banner">
                  <span className="kot-location-val">
                    {order?.table
                      ? `🪑 TABLE: ${order.table.tableNumber}`
                      : ticket?.customerNotesSnapshot?.includes('Table')
                      ? `🪑 ${ticket.customerNotesSnapshot.split('•')[0]}`
                      : '⚡ COUNTER / TAKEAWAY'}
                  </span>
                </div>

                <table className="receipt-meta-table kot-meta-table">
                  <tbody>
                    <tr>
                      <td className="meta-key">Order No</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">#{ticket?.orderNumberSnapshot || order?.orderNumber || 'ORD-2026-4095'}</td>
                    </tr>
                    <tr>
                      <td className="meta-key">Date & Time</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">{formattedDate}</td>
                    </tr>
                    <tr>
                      <td className="meta-key">Order Type</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">
                        {ticket?.orderTypeSnapshot || order?.orderType
                          ? (ticket?.orderTypeSnapshot || order?.orderType || '').replace('_', ' ')
                          : 'DINE IN'}
                      </td>
                    </tr>
                    {(activeCustomerName || activeCustomerPhone) && (
                      <tr>
                        <td className="meta-key">Guest</td>
                        <td className="meta-colon">:</td>
                        <td className="meta-val">
                          {activeCustomerName || 'Walk-in'} {activeCustomerPhone ? `(+91 ${activeCustomerPhone})` : ''}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className="meta-key">Staff / Biller</td>
                      <td className="meta-colon">:</td>
                      <td className="meta-val">POS Terminal #1 (JD)</td>
                    </tr>
                  </tbody>
                </table>

                {(ticket?.customerNotesSnapshot || order?.customerNotes) && (
                  <div className="kot-special-notes">
                    <div className="kot-notes-title">🚨 SPECIAL KITCHEN / COOKING NOTE:</div>
                    <div className="kot-notes-body">{ticket?.customerNotesSnapshot || order?.customerNotes}</div>
                  </div>
                )}
              </div>

              <div className="slip-divider">========================================</div>
              <div className="kot-items-header">
                <span className="col-kot-qty">QTY</span>
                <span className="col-kot-desc">ITEM & TOPPING MODIFIERS</span>
              </div>
              <div className="slip-divider">========================================</div>

              <div className="kot-items-list">
                {(() => {
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
                          let variant = it.variantNameSnapshot || it.variant;
                          let addOns: string[] = [];

                          // Check explicit addOns field first
                          if (it.addOns && Array.isArray(it.addOns) && it.addOns.length > 0) {
                            addOns = it.addOns
                              .map((a: any) => typeof a === 'string' ? a : (a.name || a.addOnNameSnapshot || ''))
                              .filter(Boolean);
                          }

                          // If variant contains toppings formatted with bullet or plus
                          if (variant) {
                            if (variant.includes('• +')) {
                              const parts = variant.split('• +');
                              variant = parts[0].trim();
                              const extracted = parts[1].split(',').map((s: string) => s.trim()).filter(Boolean);
                              if (addOns.length === 0) addOns = extracted;
                            } else if (variant.includes('•')) {
                              const parts = variant.split('•');
                              variant = parts[0].trim();
                              const extracted = parts.slice(1).map((s: string) => s.replace(/^\+/, '').trim()).filter(Boolean);
                              if (addOns.length === 0) addOns = extracted;
                            } else if (variant.startsWith('+')) {
                              const extracted = variant.substring(1).split(',').map((s: string) => s.trim()).filter(Boolean);
                              if (addOns.length === 0) addOns = extracted;
                              variant = undefined;
                            }
                          }

                          return {
                            name: it.productNameSnapshot || it.name || it.product?.name || 'Menu Item',
                            variant,
                            quantity: it.quantity || 1,
                            addOns,
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

                  return kotItems.map((it: any, idx: number) => (
                    <div key={idx} className="kot-item-entry">
                      <div className="kot-item-row">
                        <span className="kot-qty">{it.quantity}x</span>
                        <div className="kot-desc">
                          <div className="kot-name">{it.name}</div>
                          {it.variant && (
                            <div className="kot-variant">▸ Size: {it.variant}</div>
                          )}
                          {it.addOns && it.addOns.length > 0 ? (
                            <div className="kot-addons">
                              {it.addOns.map((add: string, aIdx: number) => (
                                <div key={aIdx} className="kot-addon-line">
                                  ✦ TOPPING: {add}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="kot-addon-none">• Toppings: None (Standard / Plain)</div>
                          )}
                          {it.notes && (
                            <div className="kot-instruction">👉 Note: {it.notes}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="slip-divider">========================================</div>
              <div className="kot-footer">
                <div className="kot-summary-row">
                  <span>Total Items: {ticket?.items?.length || order?.items?.length || 1}</span>
                  <span>Kitchen Station: MAIN BAR</span>
                </div>
                <div className="kot-dispatch-tag">[ DISPATCHED TO BARISTA & KITCHEN LINE ]</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
};
