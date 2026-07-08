"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  // Starts visible (SSR'd) so it paints on the very first frame, then fades.
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setHidden(true), 500);
    const gone = setTimeout(() => setRemoved(true), 1000);
    return () => {
      clearTimeout(fade);
      clearTimeout(gone);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy transition-opacity duration-500 motion-reduce:transition-none ${
        hidden ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-brand-purple/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-brand-orange/20 blur-3xl" />
      <div className="relative flex flex-col items-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-purple to-brand-orange text-4xl font-bold text-white shadow-xl shadow-brand-purple/30 motion-safe:animate-[splashpop_450ms_ease-out]">
          ฿
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Laund
        </h1>
      </div>
    </div>
  );
}
