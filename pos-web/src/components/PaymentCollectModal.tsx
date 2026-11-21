import React, { useState, useEffect, useMemo } from 'react';
import type { PaymentMethod, Bill, Order } from '../types/pos';
import './PaymentCollectModal.css';

export interface PaymentCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  bill: Bill | null;
  onRecordPayment: (
    amount: number,
    method: PaymentMethod,
    ref?: string,
    autoPrintReceipt?: boolean
  ) => Promise<void>;
  isProcessing: boolean;
}

export const PaymentCollectModal: React.FC<PaymentCollectModalProps> = ({
  isOpen,
  onClose,
  order,
  bill,
  onRecordPayment,
  isProcessing,
}) => {
  const totalAmount = bill ? bill.totalAmount : order.totalAmount;
  const paidAmount = bill ? bill.paidAmount : 0;
  const balanceDue = Math.max(0, totalAmount - paidAmount);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState<string>(balanceDue.toFixed(2));
  const [cashTendered, setCashTendered] = useState<string>(balanceDue.toFixed(2));
  const [transRef, setTransRef] = useState<string>('');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState<boolean>(true);
  const [soundboxConfirmed, setSoundboxConfirmed] = useState<boolean>(true);
  const [cardNetwork, setCardNetwork] = useState<string>('Visa / MC');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize initial balance
  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(balanceDue.toFixed(2));
      setCashTendered(balanceDue.toFixed(2));
      setTransRef('');
      setErrorMessage(null);
    }
  }, [isOpen, balanceDue]);

  // Dynamic quick cash tender denominations
  const quickCashPills = useMemo(() => {
    const pills: number[] = [];
    const exact = Math.ceil(balanceDue);
    pills.push(exact);

    // Next round of 100
    const next100 = Math.ceil(balanceDue / 100) * 100;
    if (next100 > exact && !pills.includes(next100)) pills.push(next100);

    // Next 500
    const next500 = balanceDue <= 500 ? 500 : Math.ceil(balanceDue / 500) * 500;
    if (next500 >= balanceDue && !pills.includes(next500)) pills.push(next500);

    // Next 1000
    const next1000 = balanceDue <= 1000 ? 1000 : Math.ceil(balanceDue / 1000) * 1000;
    if (next1000 >= balanceDue && !pills.includes(next1000)) pills.push(next1000);

    return pills;
  }, [balanceDue]);

  if (!isOpen) return null;

  const parsedCashReceived = parseFloat(cashTendered || '0');
  const parsedPaymentAmount = parseFloat(paymentAmount || '0');
  const changeToReturn = selectedMethod === 'CASH' ? Math.max(0, parsedCashReceived - parsedPaymentAmount) : 0;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedPaymentAmount) || parsedPaymentAmount <= 0) {
      setErrorMessage('Please enter a valid positive payment amount');
      return;
    }
    if (parsedPaymentAmount > balanceDue + 0.001) {
      setErrorMessage(`Payment cannot exceed the outstanding balance of ₹${balanceDue.toFixed(2)}`);
      return;
    }

    try {
      setErrorMessage(null);
      let reference = transRef.trim();
      if (selectedMethod === 'CASH' && parsedCashReceived > parsedPaymentAmount) {
        reference = reference
          ? `${reference} (Tendered: ₹${parsedCashReceived.toFixed(2)}, Change: ₹${changeToReturn.toFixed(2)})`
          : `Tendered: ₹${parsedCashReceived.toFixed(2)}, Change: ₹${changeToReturn.toFixed(2)}`;
      } else if (selectedMethod === 'CARD') {
        reference = reference ? `${cardNetwork}: ${reference}` : cardNetwork;
      }

      await onRecordPayment(parsedPaymentAmount, selectedMethod, reference || undefined, autoPrintReceipt);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Payment recording failed');
    }
  };

  return (
    <div className="payment-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="pmt-dialog-title">
      <div className="payment-modal-dialog">
        {/* Header */}
        <div className="pmt-modal-header">
          <div>
            <h2 id="pmt-dialog-title" className="pmt-header-title">
              <span>💳</span> Settle Bill & Collect Payment
            </h2>
            <div className="pmt-header-meta">
              <span className="pmt-meta-chip table">
                🪑 {order.table ? `Table ${order.table.tableNumber}` : 'Direct Order'}
              </span>
              <span className="pmt-meta-chip">
                #{order.orderNumber || (bill && bill.invoiceNumber) || 'INV-3332'}
              </span>
              <span className="pmt-meta-chip">
                Cashier: JD
              </span>
            </div>
          </div>
          <button
            type="button"
            className="pmt-close-btn"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handlePay}>
          <div className="pmt-modal-body">
            {/* Hero Balance Due Card */}
            <div className="pmt-hero-card">
              <div>
                <div className="pmt-hero-label">Total Balance Payable</div>
                <div className="pmt-hero-amount">₹{balanceDue.toFixed(2)}</div>
                <div className="pmt-hero-sub">Inclusive of 5% GST & Round-Off</div>
              </div>
              <div className="pmt-hero-right">
                {paidAmount > 0 && (
                  <div className="pmt-partial-badge">
                    ₹{paidAmount.toFixed(2)} Already Settled
                  </div>
                )}
              </div>
            </div>

            {errorMessage && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                ⚠ {errorMessage}
              </div>
            )}

            {/* 4 Interactive Payment Cards */}
            <div>
              <span className="pmt-input-label">Select Payment Method</span>
              <div className="pmt-methods-grid">
                <button
                  type="button"
                  className={`pmt-method-card ${selectedMethod === 'CASH' ? 'active cash' : ''}`}
                  onClick={() => setSelectedMethod('CASH')}
                >
                  <span className="pmt-card-icon">💵</span>
                  <span className="pmt-card-name">Cash</span>
                </button>

                <button
                  type="button"
                  className={`pmt-method-card ${selectedMethod === 'UPI' ? 'active upi' : ''}`}
                  onClick={() => setSelectedMethod('UPI')}
                >
                  <span className="pmt-card-icon">📱</span>
                  <span className="pmt-card-name">UPI / QR</span>
                </button>

                <button
                  type="button"
                  className={`pmt-method-card ${selectedMethod === 'CARD' ? 'active card' : ''}`}
                  onClick={() => setSelectedMethod('CARD')}
                >
                  <span className="pmt-card-icon">💳</span>
                  <span className="pmt-card-name">Card</span>
                </button>

                <button
                  type="button"
                  className={`pmt-method-card ${selectedMethod === 'OTHER' ? 'active other' : ''}`}
                  onClick={() => setSelectedMethod('OTHER')}
                >
                  <span className="pmt-card-icon">🏷️</span>
                  <span className="pmt-card-name">Split / Other</span>
                </button>
              </div>
            </div>

            {/* Contextual Payment Experience */}
            {selectedMethod === 'CASH' && (
              <div className="pmt-section-box">
                <div>
                  <span className="pmt-input-label">Quick Tender (Customer Note Handed)</span>
                  <div className="pmt-denominations-row">
                    {quickCashPills.map((val) => {
                      const isActive = parsedCashReceived === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          className={`pmt-denom-pill ${isActive ? 'active' : ''}`}
                          onClick={() => setCashTendered(val.toFixed(2))}
                        >
                          ₹{val} {val === Math.ceil(balanceDue) ? '(Exact)' : ''}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="pmt-input-label">Cash Received (₹)</label>
                    <input
                      type="number"
                      step="1"
                      min={balanceDue}
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="pmt-text-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700 }}
                    />
                  </div>
                  <div>
                    <label className="pmt-input-label">Bill To Settle (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      max={balanceDue}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="pmt-text-input"
                      style={{ fontSize: '1.1rem', fontWeight: 700, color: '#475569' }}
                    />
                  </div>
                </div>

                {/* Instant Change Due Calculation Banner */}
                {parsedCashReceived >= parsedPaymentAmount && (
                  <div className="pmt-change-banner">
                    <div>
                      <div className="pmt-change-label">💰 Change to Return to Guest</div>
                      <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '2px' }}>
                        ₹{parsedCashReceived.toFixed(2)} received − ₹{parsedPaymentAmount.toFixed(2)} bill
                      </div>
                    </div>
                    <div className="pmt-change-amount">
                      ₹{changeToReturn.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedMethod === 'UPI' && (
              <div className="pmt-section-box">
                <div className="pmt-upi-card">
                  <div className="pmt-qr-frame">
                    <span className="pmt-qr-center-icon">📱</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6b21a8' }}>
                      SCAN TO PAY
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#0f172a' }}>
                      ₹{parsedPaymentAmount.toFixed(2)}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', display: 'block' }}>
                      POP O' BOB Official UPI
                    </span>
                    <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                      VPA: popobob@icici • Accepted across all UPI Apps
                    </span>
                    <div className="pmt-qr-app-badges">
                      <span>• Google Pay</span>
                      <span>• PhonePe</span>
                      <span>• Paytm</span>
                      <span>• BHIM</span>
                    </div>
                  </div>

                  <div
                    className="pmt-soundbox-chip"
                    onClick={() => setSoundboxConfirmed(!soundboxConfirmed)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{soundboxConfirmed ? '✓' : '○'}</span>
                    <span>Soundbox / Notification Verified</span>
                  </div>
                </div>

                <div>
                  <label className="pmt-input-label">UTR / Transaction Ref (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 423984920491 or Google Pay Ref"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="pmt-text-input"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="pmt-section-box">
                <div className="pmt-card-terminal-box">
                  <span className="pmt-terminal-icon">💳</span>
                  <div className="pmt-terminal-text">
                    <strong>Swipe or Tap on EDC Card Terminal</strong>
                    <div>Swipe, insert chip, or tap contactless card for ₹{parsedPaymentAmount.toFixed(2)}.</div>
                  </div>
                </div>

                <div>
                  <span className="pmt-input-label">Card Network</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Visa / MC', 'RuPay', 'Amex'].map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setCardNetwork(net)}
                        className={`pmt-denom-pill ${cardNetwork === net ? 'active' : ''}`}
                        style={{ flex: 1 }}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="pmt-input-label">Terminal Approval / Auth Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. AUTH-789012"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="pmt-text-input"
                  />
                </div>
              </div>
            )}

            {selectedMethod === 'OTHER' && (
              <div className="pmt-section-box">
                <div>
                  <label className="pmt-input-label">Settlement Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    max={balanceDue}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pmt-text-input"
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  {parsedPaymentAmount < balanceDue && (
                    <span style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '4px', display: 'block' }}>
                      Partial payment: ₹{(balanceDue - parsedPaymentAmount).toFixed(2)} will remain due.
                    </span>
                  )}
                </div>

                <div>
                  <label className="pmt-input-label">Voucher / Payment Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. Zomato Pay, Swiggy Dineout, or Corporate Code"
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    className="pmt-text-input"
                  />
                </div>
              </div>
            )}

            {/* Auto-Print Receipt Checkbox */}
            <label className="pmt-autoprint-row">
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="pmt-checkbox"
              />
              <span className="pmt-autoprint-text">
                🖨️ Auto-Print Tax Invoice Receipt to Windows PC Printer
              </span>
            </label>
          </div>

          {/* Footer */}
          <div className="pmt-modal-footer">
            <button
              type="button"
              className="pmt-btn-cancel"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pmt-btn-confirm"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <span>⏳ Recording & Settle...</span>
              ) : (
                <span>
                  ✅ Settle Table & Print Receipt • ₹{parsedPaymentAmount.toFixed(2)}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentCollectModal;
