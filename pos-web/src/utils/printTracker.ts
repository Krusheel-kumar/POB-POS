/**
 * Utility to track Bill and KOT print counts per order
 * Ensures strictly single original KOT and Bill, marking any reprint as DUPLICATE.
 */

export interface OrderPrintHistory {
  kotPrintCount: number;
  billPrintCount: number;
  firstKotPrintedAt?: string;
  firstBillPrintedAt?: string;
  lastKotPrintedAt?: string;
  lastBillPrintedAt?: string;
}

const STORAGE_PREFIX = 'pob_print_tracker_';

export function getOrderPrintHistory(orderKey: string | undefined): OrderPrintHistory {
  if (!orderKey || typeof window === 'undefined') {
    return { kotPrintCount: 0, billPrintCount: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + orderKey);
    if (!raw) return { kotPrintCount: 0, billPrintCount: 0 };
    return JSON.parse(raw);
  } catch {
    return { kotPrintCount: 0, billPrintCount: 0 };
  }
}

export function recordOrderPrint(orderKey: string | undefined, mode: 'BILL' | 'KOT'): OrderPrintHistory {
  if (!orderKey || typeof window === 'undefined') {
    return { kotPrintCount: 1, billPrintCount: 1 };
  }

  const history = getOrderPrintHistory(orderKey);
  const now = new Date().toISOString();

  if (mode === 'KOT') {
    history.kotPrintCount += 1;
    if (!history.firstKotPrintedAt) {
      history.firstKotPrintedAt = now;
    }
    history.lastKotPrintedAt = now;
  } else {
    history.billPrintCount += 1;
    if (!history.firstBillPrintedAt) {
      history.firstBillPrintedAt = now;
    }
    history.lastBillPrintedAt = now;
  }

  try {
    localStorage.setItem(STORAGE_PREFIX + orderKey, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save print tracking to storage:', e);
  }

  return history;
}
