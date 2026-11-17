import React, { useState, useEffect } from 'react';
import type { Order, Bill, KitchenTicket } from '../types/pos';
import { getOrderPrintHistory, recordOrderPrint, type OrderPrintHistory } from '../utils/printTracker';
import './ReceiptModal.css';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'BILL' | 'KOT';
  order?: Order | null;
  bill?: Bill | null;
  ticket?: KitchenTicket | null;
  customerName?: string;
  customerPhone?: string;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  mode,
  order,
  bill,
  ticket,
  customerName,
  customerPhone,
}) => {
  const orderKey =
    order?.orderNumber ||
    order?.id ||
    bill?.order?.orderNumber ||
    bill?.invoiceNumber ||
    ticket?.orderNumberSnapshot ||
    ticket?.ticketNumber ||
    'temp-active-order';

  const [printHistory, setPrintHistory] = useState<OrderPrintHistory>(() =>
    getOrderPrintHistory(orderKey)
  );

  useEffect(() => {
    setPrintHistory(getOrderPrintHistory(orderKey));
  }, [orderKey, isOpen]);

  if (!isOpen) return null;

  const isDuplicate = mode === 'BILL' ? printHistory.billPrintCount >= 1 : printHistory.kotPrintCount >= 1;
  const printCount = mode === 'BILL' ? printHistory.billPrintCount : printHistory.kotPrintCount;

  const handlePrint = () => {
    const updated = recordOrderPrint(orderKey, mode);
    setPrintHistory(updated);
    window.print();
  };

  const formattedDate = new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const activeCustomerName = order?.customerName || bill?.customerName || customerName;
  const activeCustomerPhone = order?.customerPhone || bill?.customerPhone || customerPhone;

  return (
    <div className="receipt-modal-backdrop" role="dialog" aria-modal="true">
      <div className="receipt-modal-container">
        <div className="receipt-modal-actions no-print">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="modal-title-pill">
              {mode === 'BILL' ? '🧾 Customer Tax Invoice' : '🍳 Kitchen Order Ticket (KOT)'}
            </div>
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
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="receipt-btn-print" onClick={handlePrint}>
              🖨️ Print {isDuplicate ? 'Duplicate ' : ''}{mode === 'BILL' ? 'Bill' : 'KOT'}
            </button>
            <button type="button" className="receipt-btn-close" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Printable Thermal Slip Area */}
        <div className="thermal-slip printable-area">
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
                  <span className="brand-gstin">GSTIN: 36AABCP1234A1Z9</span>
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

              <div className="thermal-meta">
                <div className="meta-row">
                  <span className="meta-bold">Invoice:</span>
                  <span>{bill?.invoiceNumber || (order?.orderNumber ? order.orderNumber.replace('ORD', 'INV') : 'INV-2026-089')}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-bold">Date & Time:</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-bold">Order No:</span>
                  <span>#{order?.orderNumber || bill?.order?.orderNumber || 'ORD-2026-4095'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-bold">Order Type:</span>
                  <span>
                    {order?.orderType ? order.orderType.replace('_', ' ') : 'DINE IN'}
                    {order?.table ? ` (Table ${order.table.tableNumber})` : ' (Counter Pickup)'}
                  </span>
                </div>
                {(activeCustomerName || activeCustomerPhone) && (
                  <div className="meta-row customer-row">
                    <span className="meta-bold">Customer:</span>
                    <span>{activeCustomerName || 'Walk-in Guest'} {activeCustomerPhone ? `(+91 ${activeCustomerPhone})` : ''}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span className="meta-bold">Cashier:</span>
                  <span>POS Terminal #1 (JD)</span>
                </div>
              </div>

              <div className="slip-divider">----------------------------------------</div>
              <div className="thermal-items-header">
                <span className="col-desc">ITEM</span>
                <span className="col-qty">QTY</span>
                <span className="col-rate">RATE</span>
                <span className="col-amt">AMT</span>
              </div>
              <div className="slip-divider">----------------------------------------</div>

              <div className="thermal-items-list">
                {order?.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <div key={idx} className="thermal-item-entry">
                      <div className="item-main-row">
                        <span className="item-title">{item.productNameSnapshot}</span>
                        <span className="item-qty">{item.quantity}</span>
                        <span className="item-rate">
                          ₹{(item.lineTotalSnapshot / item.quantity).toFixed(2)}
                        </span>
                        <span className="item-amount">₹{item.lineTotalSnapshot.toFixed(2)}</span>
                      </div>
                      {item.variantNameSnapshot && (
                        <div className="item-sub-addon">• {item.variantNameSnapshot}</div>
                      )}
                      {item.itemNotes && (
                        <div className="item-sub-note">* Note: {item.itemNotes}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="thermal-item-entry">
                    <div className="item-main-row">
                      <span className="item-title">AUTHENTIC MILK TEA</span>
                      <span className="item-qty">1</span>
                      <span className="item-rate">₹249.00</span>
                      <span className="item-amount">₹249.00</span>
                    </div>
                    <div className="item-sub-addon">• Regular (350ml)</div>
                  </div>
                )}
              </div>

              <div className="slip-divider">----------------------------------------</div>

              <div className="thermal-totals">
                <div className="calc-row">
                  <span>Item Subtotal:</span>
                  <span>₹{(bill?.subtotal || order?.subtotal || 249).toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>CGST @ 2.5%:</span>
                  <span>₹{((bill?.taxAmount || order?.taxAmount || 12.45) / 2).toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>SGST @ 2.5%:</span>
                  <span>₹{((bill?.taxAmount || order?.taxAmount || 12.45) / 2).toFixed(2)}</span>
                </div>
                <div className="slip-divider">========================================</div>
                <div className="calc-row grand-total">
                  <span>NET TOTAL:</span>
                  <span className="grand-val">₹{(bill?.totalAmount || order?.totalAmount || 261.45).toFixed(2)}</span>
                </div>
                <div className="slip-divider">========================================</div>
                <div className="calc-row">
                  <span>Settled Amount:</span>
                  <span className="paid-tag">
                    ₹{(bill?.paidAmount || order?.totalAmount || 261.45).toFixed(2)}
                  </span>
                </div>
                <div className="calc-row">
                  <span>Payment Mode:</span>
                  <span>
                    {bill?.payments && bill.payments.length > 0
                      ? bill.payments.map((p) => p.paymentMethod).join(', ')
                      : 'CASH / UPI'}
                  </span>
                </div>
              </div>

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
            /* KITCHEN ORDER TICKET (KOT) */
            <div className="thermal-kot">
              <div className="thermal-header">
                <div className="kot-brand-badge" style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '1px' }}>POP O' BOB</div>
                {isDuplicate ? (
                  <div className="duplicate-kot-banner">
                    <div className="dup-kot-title">⚠️ *** DUPLICATE KOT *** ⚠️</div>
                    <div className="dup-kot-sub">[ REPRINT COPY #{printCount + 1} ]</div>
                    <div className="dup-kot-alert">🛑 DO NOT PREPARE AGAIN! 🛑</div>
                    {printHistory.firstKotPrintedAt && (
                      <div className="dup-kot-alert-sub">
                        Original KOT sent at {new Date(printHistory.firstKotPrintedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="slip-copy-badge original">● ORIGINAL KOT (KITCHEN COPY)</div>
                    <div className="kot-badge">KITCHEN ORDER TICKET</div>
                  </>
                )}
                <div className="kot-number">
                  {ticket?.ticketNumber || 'KOT-104'}
                </div>
                <div className="slip-divider">================================</div>
              </div>

              <div className="thermal-meta">
                <div className="meta-row highlight-table">
                  <span>
                    {order?.table
                      ? `TABLE ${order.table.tableNumber}`
                      : ticket?.customerNotesSnapshot?.includes('Table')
                      ? ticket.customerNotesSnapshot.split('•')[0]
                      : 'COUNTER / TAKEAWAY'}
                  </span>
                  <span>#{ticket?.orderNumberSnapshot || order?.orderNumber || 'ORD-2026-042'}</span>
                </div>
                {(activeCustomerName || activeCustomerPhone) && (
                  <div className="meta-row" style={{ fontWeight: 700 }}>
                    <span>Guest: {activeCustomerName || 'Walk-in'}</span>
                    <span>{activeCustomerPhone ? `+91 ${activeCustomerPhone}` : ''}</span>
                  </div>
                )}
                <div className="meta-row">
                  <span>Type: {ticket?.orderTypeSnapshot || order?.orderType || 'DINE_IN'}</span>
                  <span>Time: {formattedDate.split(',')[1]}</span>
                </div>
                {(ticket?.customerNotesSnapshot || order?.customerNotes) && (
                  <div className="kot-special-notes">
                    <strong>Kitchen Note:</strong>{' '}
                    {ticket?.customerNotesSnapshot || order?.customerNotes}
                  </div>
                )}
              </div>

              <div className="slip-divider">================================</div>
              <div className="kot-items-header">
                <span>QTY</span>
                <span>ITEM & MODIFIERS</span>
              </div>
              <div className="slip-divider">================================</div>

              <div className="kot-items-list">
                {ticket?.items && ticket.items.length > 0 ? (
                  ticket.items.map((it, idx) => (
                    <div key={idx} className="kot-item-row">
                      <span className="kot-qty">{it.quantity}x</span>
                      <div className="kot-desc">
                        <strong className="kot-name">{it.productNameSnapshot}</strong>
                        {it.variantNameSnapshot && (
                          <div className="kot-variant">[{it.variantNameSnapshot}]</div>
                        )}
                        {it.addOns && it.addOns.length > 0 && (
                          <div className="kot-addons">
                            + {it.addOns.map((a) => a.addOnNameSnapshot).join(', ')}
                          </div>
                        )}
                        {it.itemNotesSnapshot && (
                          <div className="kot-instruction">👉 {it.itemNotesSnapshot}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="kot-item-row">
                    <span className="kot-qty">1x</span>
                    <div className="kot-desc">
                      <strong className="kot-name">Assorted Chef Preparation</strong>
                    </div>
                  </div>
                )}
              </div>

              <div className="slip-divider">================================</div>
              <div className="kot-footer">
                <span>[ KOT SENT TO CHEF STATION ]</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
