"use client";

import { createContext, useContext } from "react";

export type SessionChange = "paid" | "unpaid" | "deleted";

/**
 * Lets row buttons (paid toggle, delete) report a change from inside their
 * pending transition so the History page's unpaid banner updates
 * optimistically, before the server roundtrip lands. Null on pages without
 * the banner (dashboard, session detail).
 */
export const UnpaidSummaryContext = createContext<
  ((sessionId: string, change: SessionChange) => void) | null
>(null);

export function useUnpaidSummaryNotify() {
  return useContext(UnpaidSummaryContext);
}
