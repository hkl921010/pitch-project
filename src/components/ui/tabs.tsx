"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: ReactNode;
  count?: number;
  dot?: boolean;
}

/** 下划线标签页（页面级）。 */
export function Tabs<T extends string>({ items, value, onChange, className }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div className={cn("scrollbar-none flex gap-1 overflow-x-auto border-b border-gray-200", className)} role="tablist">
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(it.value)}
            className={cn(
              "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pt-1 pb-3 text-sm font-semibold transition-colors focus-visible:focus-ring sm:mr-3",
              on ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
            )}
          >
            {it.label}
            {it.count !== undefined ? (
              <span className={cn("rounded-full px-2 py-px text-xs font-medium", on ? "bg-brand-50 text-brand-700" : "bg-gray-100 text-gray-700")}>{it.count}</span>
            ) : null}
            {it.dot ? <span className="h-2 w-2 rounded-full bg-error-500" /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** 分段按钮（局部切换）。 */
export function Segmented<T extends string>({ items, value, onChange, size = "md", className }: { items: TabItem<T>[]; value: T; onChange: (v: T) => void; size?: "sm" | "md"; className?: string }) {
  return (
    <div className={cn("scrollbar-none inline-flex max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-1", className)}>
      {items.map((it) => {
        const on = it.value === value;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md font-semibold transition-all focus-visible:focus-ring",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
              on ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700",
            )}
          >
            {it.label}
            {it.count !== undefined ? <span className={cn("text-xs", on ? "text-gray-500" : "text-gray-400")}>{it.count}</span> : null}
            {it.dot ? <span className="h-1.5 w-1.5 rounded-full bg-error-500" /> : null}
          </button>
        );
      })}
    </div>
  );
}
