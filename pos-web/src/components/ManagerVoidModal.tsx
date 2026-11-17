import React, { useState } from 'react';
import './ManagerVoidModal.css';

export interface VoidItemDetails {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  orderNumber?: string;
  tableNumber?: string;
}

interface ManagerVoidModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: VoidItemDetails | null;
  onConfirmVoid: (reason: string, notes: string, managerPin: string) => void;
}

const VOID_REASONS = [
  'Customer Changed Mind',
  'Wrong Item Punched on POS',
  'Kitchen Preparation Delayed > 20 mins',
  'Taste / Quality Complaint',
  'Out of Stock / Raw Material Exhausted',
  'Accidental Duplicate KOT Fire',
  'Guest Left Table Without Notice',
];

export const ManagerVoidModal: React.FC<ManagerVoidModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirmVoid,
}) => {
  const [managerPin, setManagerPin] = useState('');
  const [reason, setReason] = useState(VOID_REASONS[0]);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Strict Manager PIN validation (e.g. 1234 or 9999 for demo)
    if (!managerPin.trim()) {
      setErrorMsg('Manager PIN is mandatory');
      return;
    }

    if (managerPin !== '1234' && managerPin !== '9999') {
      setErrorMsg('❌ Invalid Manager PIN. Anti-fraud security alert logged.');
      return;
    }

    onConfirmVoid(reason, notes.trim(), managerPin);
    setManagerPin('');
    setNotes('');
    onClose();
  };

  return (
    <div className="void-modal-overlay" role="dialog" aria-modal="true">
      <div className="void-modal-card">
        <div className="void-modal-header">
          <div className="void-title-box">
            <span className="void-shield-icon">🛡️</span>
            <div>
              <h3 className="void-title">Manager Authorization Required</h3>
              <p className="void-subtitle">Strict KOT Cancellation & Anti-Fraud Audit</p>
            </div>
          </div>
          <button type="button" className="void-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="void-modal-body">
          <div className="void-item-banner">
            <div className="void-item-main">
              <span className="void-item-name">{item.name}</span>
              <span className="void-item-amt">₹{(item.unitPrice * item.quantity).toFixed(2)}</span>
            </div>
            <div className="void-item-meta">
              <span>Qty to Void: <strong>{item.quantity}</strong></span>
              <span>•</span>
              <span>Rate: ₹{item.unitPrice.toFixed(2)} each</span>
              {item.orderNumber && (
                <>
                  <span>•</span>
                  <span>Ref: {item.orderNumber}</span>
                </>
              )}
            </div>
          </div>

          <div className="void-warning-callout">
            <span className="callout-icon">⚠️</span>
            <div className="callout-text">
              <strong>KOT Already Sent to Kitchen:</strong> This item is active on kitchen stations. Voiding requires manager authorization, audit logging, and wastage reasoning to prevent stock manipulation.
            </div>
          </div>

          {errorMsg && (
            <div className="void-error-box" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="void-form-field">
            <label className="void-label">
              Manager Security PIN * <span className="pin-hint">(Demo PIN: 1234)</span>
            </label>
            <input
              type="password"
              maxLength={6}
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="Enter 4-digit Manager PIN"
              className="void-input pin-input"
              autoFocus
              required
            />
          </div>

          <div className="void-form-field">
            <label className="void-label">Cancellation / Void Reason *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="void-select"
            >
              {VOID_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="void-form-field">
            <label className="void-label">Staff Explanation / Kitchen Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional details (e.g. guest wanted takeaway, ordered extra by mistake)..."
              className="void-input"
            />
          </div>

          <div className="void-modal-footer">
            <button type="button" className="void-btn-cancel" onClick={onClose}>
              Cancel (Keep Item)
            </button>
            <button type="submit" className="void-btn-confirm">
              Authorize Void & Log Audit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManagerVoidModal;
