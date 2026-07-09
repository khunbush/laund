"use client";

import { useEffect } from "react";

export function WarmupPing() {
  useEffect(() => {
    fetch("/api/warmup").catch(() => {});
  }, []);

  return null;
}
