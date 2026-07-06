import type { ReactNode } from "react";

const VARIANT_STYLES = {
  navy: "bg-brand-navy text-white",
  purple: "bg-gradient-to-br from-brand-purple to-brand-purple-dark text-white",
  orange: "bg-gradient-to-br from-brand-orange to-brand-orange-dark text-white",
  white: "bg-brand-surface text-brand-navy border border-black/5",
} as const;

export function StatCard({
  label,
  value,
  caption,
  variant = "white",
  icon,
}: {
  label: string;
  value: string;
  caption?: string;
  variant?: keyof typeof VARIANT_STYLES;
  icon?: ReactNode;
}) {
  const isDark = variant !== "white";

  return (
    <div className={`rounded-2xl p-4 shadow-sm ${VARIANT_STYLES[variant]}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${isDark ? "text-white/70" : "text-brand-muted"}`}>
          {label}
        </p>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {caption && (
        <p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-brand-muted"}`}>
          {caption}
        </p>
      )}
    </div>
  );
}
