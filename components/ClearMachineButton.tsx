"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearMachineBranch } from "@/app/compare/actions";

export function ClearMachineButton({
  branch,
  firstDate,
  lastDate,
}: {
  branch: number;
  firstDate: string;
  lastDate: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(lastDate);
  const [armedAll, setArmedAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const disarm = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (armedAll) disarm.current = setTimeout(() => setArmedAll(false), 3000);
    return () => {
      if (disarm.current) clearTimeout(disarm.current);
    };
  }, [armedAll]);

  function toggle() {
    if (open) {
      setOpen(false);
    } else {
      setDate(lastDate);
      setArmedAll(false);
      setError(null);
      setOpen(true);
    }
  }

  function clear(target?: string) {
    startTransition(async () => {
      try {
        const result = await clearMachineBranch(branch, target);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        if (result.deleted === 0) {
          setError("No data on that date");
          return;
        }
        setOpen(false);
        router.refresh();
      } catch {
        setError("Something went wrong");
      }
    });
  }

  return (
    <span className="relative shrink-0">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={`Clear branch ${branch} data`}
        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all active:scale-95 ${
          open ? "bg-brand-navy text-white" : "bg-black/5 text-brand-muted"
        }`}
      >
        {open ? "Close" : "Clear"}
      </button>
      {open && (
        <div className="absolute bottom-full right-0 z-20 mb-2 flex w-60 flex-col gap-2 rounded-2xl border border-black/10 bg-brand-surface p-3 shadow-xl">
          <label
            htmlFor={`clear-date-${branch}`}
            className="text-[11px] font-semibold text-brand-muted"
          >
            Clear a single day
          </label>
          <input
            id={`clear-date-${branch}`}
            type="date"
            value={date}
            min={firstDate}
            max={lastDate}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-brand-navy"
          />
          <button
            type="button"
            onClick={() => clear(date)}
            disabled={pending || !date}
            className="rounded-full bg-brand-navy px-3 py-2 text-[11px] font-semibold text-white transition-all active:scale-95 disabled:opacity-50"
          >
            {pending ? "Clearing…" : "Clear this day"}
          </button>
          <div className="my-0.5 border-t border-black/5" />
          <button
            type="button"
            onClick={() => (armedAll ? clear() : setArmedAll(true))}
            disabled={pending}
            className={`rounded-full px-3 py-2 text-[11px] font-semibold transition-all active:scale-95 disabled:opacity-50 ${
              armedAll
                ? "bg-brand-orange text-white shadow-md shadow-brand-orange/30"
                : "bg-black/5 text-brand-muted"
            }`}
          >
            {pending
              ? "Clearing…"
              : armedAll
                ? "Sure? Tap again"
                : "Clear everything"}
          </button>
          {error && (
            <p className="text-[11px] font-semibold text-brand-purple-dark">{error}</p>
          )}
        </div>
      )}
    </span>
  );
}
