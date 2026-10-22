"use client";

import { Banknote, Handshake, HelpCircle, LifeBuoy, UserPlus, type LucideIcon } from "lucide-react";

import { NEED_KIND_LABEL } from "@/data/constants";
import type { IntentKind, NeedItem } from "@/data/types";
import { cn } from "@/lib/cn";

export const NEED_ICON: Record<IntentKind, LucideIcon> = {
  invest: Banknote,
  partner: Handshake,
  join: UserPlus,
  help: LifeBuoy,
  other: HelpCircle,
};

export const NEED_TONE: Record<IntentKind, string> = {
  invest: "border-success-200 bg-success-50 text-success-700",
  partner: "border-blue-200 bg-blue-50 text-blue-700",
  join: "border-brand-200 bg-brand-50 text-brand-700",
  help: "border-warning-200 bg-warning-50 text-warning-700",
  other: "border-gray-200 bg-gray-50 text-gray-700",
};

export function needLabel(n: NeedItem) {
  return n.sub ? `${NEED_KIND_LABEL[n.kind]} · ${n.sub}` : NEED_KIND_LABEL[n.kind];
}

/** “正在寻找”短标签：卡片上只显示类型，详情页显示完整标题。 */
export function LookingForChips({ needs, max = 3, size = "sm", showTitle }: { needs: NeedItem[]; max?: number; size?: "xs" | "sm"; showTitle?: boolean }) {
  if (!needs.length) return null;
  const shown = needs.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((n) => {
        const Icon = NEED_ICON[n.kind];
        return (
          <span
            key={n.id}
            title={n.title}
            className={cn("inline-flex max-w-full items-center gap-1 rounded-md border font-medium", size === "xs" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs", NEED_TONE[n.kind])}
          >
            <Icon size={size === "xs" ? 11 : 12} className="shrink-0" />
            <span className="truncate">{showTitle ? n.title : needLabel(n)}</span>
          </span>
        );
      })}
      {needs.length > max ? <span className="px-1 py-0.5 text-xs text-gray-500">+{needs.length - max}</span> : null}
    </div>
  );
}
