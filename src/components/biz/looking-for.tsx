"use client";

import { Banknote, Factory, Handshake, HelpCircle, LifeBuoy, Megaphone, Store, UserPlus, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { COOP_LABEL, NEED_KIND_LABEL, SERVICE_LABEL } from "@/data/constants";
import type { CoopKind, IntentKind, NeedItem, ServiceKind } from "@/data/types";
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

export const COOP_ICON: Record<CoopKind, LucideIcon> = {
  supply: Factory,
  channel: Store,
  funding: Banknote,
};

export const COOP_TONE: Record<CoopKind, string> = {
  supply: "border-warning-200 bg-warning-50 text-warning-700",
  channel: "border-blue-200 bg-blue-50 text-blue-700",
  funding: "border-success-200 bg-success-50 text-success-700",
};

export const SERVICE_ICON: Record<ServiceKind, LucideIcon> = {
  friend: Users,
  media: Megaphone,
  hiring: UserPlus,
  other: HelpCircle,
};

export const SERVICE_TONE: Record<ServiceKind, string> = {
  friend: "border-brand-200 bg-brand-50 text-brand-700",
  media: "border-warning-200 bg-warning-50 text-warning-700",
  hiring: "border-blue-200 bg-blue-50 text-blue-700",
  other: "border-gray-200 bg-gray-50 text-gray-700",
};

export function kindFromCoop(coop: CoopKind): IntentKind {
  return coop === "funding" ? "invest" : "partner";
}

export function needIcon(n: NeedItem): LucideIcon {
  if (n.service) return SERVICE_ICON[n.service];
  return n.coop ? COOP_ICON[n.coop] : NEED_ICON[n.kind];
}

export function needTone(n: NeedItem): string {
  if (n.service) return SERVICE_TONE[n.service];
  return n.coop ? COOP_TONE[n.coop] : NEED_TONE[n.kind];
}

export function needLabel(n: NeedItem) {
  if (n.service) return SERVICE_LABEL[n.service];
  if (n.coop) return n.sub ? `${COOP_LABEL[n.coop]} · ${n.sub}` : COOP_LABEL[n.coop];
  return n.sub ? `${NEED_KIND_LABEL[n.kind]} · ${n.sub}` : NEED_KIND_LABEL[n.kind];
}

export function coopHref(slug: string, needId: string) {
  return `/p/${slug}#need-${needId}`;
}

export function serviceAction(kind: ServiceKind) {
  if (kind === "friend") return "我能介绍";
  if (kind === "hiring") return "我来对接";
  return "我能做";
}

/** “正在寻找”短标签。项目合作链到对应的合作方式。 */
export function LookingForChips({
  needs,
  max = 3,
  size = "sm",
  showTitle,
  hrefFor,
}: {
  needs: NeedItem[];
  max?: number;
  size?: "xs" | "sm";
  showTitle?: boolean;
  hrefFor?: (n: NeedItem) => string;
}) {
  if (!needs.length) return null;
  const shown = needs.slice(0, max);
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((n) => {
        const Icon = needIcon(n);
        const cls = cn(
          "inline-flex max-w-full items-center gap-1 rounded-md border font-medium",
          size === "xs" ? "px-1.5 py-px text-[11px]" : "px-2 py-0.5 text-xs",
          needTone(n),
          hrefFor && "hover:brightness-95",
        );
        const body = (
          <>
            <Icon size={size === "xs" ? 11 : 12} className="shrink-0" />
            <span className="truncate">{showTitle ? n.title : needLabel(n)}</span>
          </>
        );
        const href = hrefFor?.(n);
        return href ? (
          <Link key={n.id} href={href} title={n.title} className={cls} onClick={(e) => e.stopPropagation()}>
            {body}
          </Link>
        ) : (
          <span key={n.id} title={n.title} className={cls}>
            {body}
          </span>
        );
      })}
      {needs.length > max ? <span className="px-1 py-0.5 text-xs text-gray-500">+{needs.length - max}</span> : null}
    </div>
  );
}
