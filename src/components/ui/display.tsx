"use client";

import { BadgeCheck, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { TONES } from "@/data/constants";
import { cn } from "@/lib/cn";

export type Tone = "gray" | "brand" | "success" | "warning" | "error" | "blue" | "highlight" | "dark";

const badgeTones: Record<Tone, string> = {
  gray: "bg-gray-50 text-gray-700 border-gray-200",
  brand: "bg-brand-50 text-brand-700 border-brand-200",
  success: "bg-success-50 text-success-700 border-success-200",
  warning: "bg-warning-50 text-warning-700 border-warning-200",
  error: "bg-error-50 text-error-700 border-error-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  highlight: "bg-highlight-soft text-highlight-ink border-[hsl(60_80%_70%)]",
  dark: "bg-gray-900 text-white border-gray-900",
};

const dotTones: Record<Tone, string> = {
  gray: "bg-gray-500",
  brand: "bg-brand-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  error: "bg-error-500",
  blue: "bg-blue-600",
  highlight: "bg-[hsl(60_90%_45%)]",
  dark: "bg-white",
};

export function Badge({
  tone = "gray",
  size = "sm",
  dot,
  icon: Icon,
  className,
  children,
}: {
  tone?: Tone;
  size?: "xs" | "sm" | "md";
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border font-medium whitespace-nowrap",
        size === "xs" ? "px-1.5 py-px text-[11px]" : size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-sm",
        badgeTones[tone],
        className,
      )}
    >
      {dot ? <span className={cn("h-1.5 w-1.5 rounded-full", dotTones[tone])} /> : null}
      {Icon ? <Icon size={size === "md" ? 14 : 12} /> : null}
      {children}
    </span>
  );
}

/** 方角标签（Untitled UI 的 tag），用于赛道、关键词。 */
export function Tag({ children, className, onClick, active }: { children: ReactNode; className?: string; onClick?: () => void; active?: boolean }) {
  const cls = cn(
    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
    active ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700",
    onClick && "hover:bg-gray-50",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  ) : (
    <span className={cls}>{children}</span>
  );
}

const avatarSizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-14 w-14 text-lg",
  "2xl": "h-16 w-16 text-xl",
  "3xl": "h-24 w-24 text-3xl",
} as const;

export function Avatar({
  name,
  tone = 0,
  size = "md",
  verified,
  online,
  anonymous,
  className,
}: {
  name: string;
  tone?: number;
  size?: keyof typeof avatarSizes;
  verified?: boolean;
  online?: boolean;
  anonymous?: boolean;
  className?: string;
}) {
  const t = TONES[tone % TONES.length];
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn("inline-flex items-center justify-center rounded-full font-semibold ring-1 ring-black/5 select-none", avatarSizes[size])}
        style={anonymous ? { background: "var(--color-gray-100)", color: "var(--color-gray-500)" } : { background: `linear-gradient(135deg, ${t.from}, ${t.to})`, color: t.ink }}
      >
        {anonymous ? "?" : name.slice(0, 1)}
      </span>
      {verified ? (
        <BadgeCheck
          className="absolute -right-1 -bottom-1 rounded-full bg-white text-brand-600"
          size={size === "xs" || size === "sm" ? 14 : size === "3xl" ? 26 : 18}
          fill="var(--color-brand-100)"
        />
      ) : null}
      {online ? <span className="absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full bg-success-500 ring-2 ring-white" /> : null}
    </span>
  );
}

export function AvatarGroup({ people, size = "sm", max = 4, more }: { people: { name: string; tone: number }[]; size?: "xs" | "sm" | "md"; max?: number; more?: number }) {
  const shown = people.slice(0, max);
  const extra = (more ?? people.length - shown.length) || 0;
  return (
    <div className="flex items-center -space-x-2">
      {shown.map((p, i) => (
        <Avatar key={i} name={p.name} tone={p.tone} size={size} className="rounded-full ring-2 ring-white" />
      ))}
      {extra > 0 ? (
        <span className={cn("inline-flex items-center justify-center rounded-full bg-gray-100 font-medium text-gray-600 ring-2 ring-white", avatarSizes[size])}>+{extra}</span>
      ) : null}
    </div>
  );
}

export function ProjectLogo({ text, tone, size = "md", className }: { text: string; tone: number; size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl"; className?: string }) {
  const t = TONES[tone % TONES.length];
  const s = { xs: "h-6 w-6 text-[11px] rounded-md", sm: "h-8 w-8 text-sm rounded-lg", md: "h-10 w-10 text-base rounded-lg", lg: "h-12 w-12 text-lg rounded-xl", xl: "h-16 w-16 text-2xl rounded-2xl", "2xl": "h-20 w-20 text-3xl rounded-2xl" }[size];
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center font-bold shadow-xs ring-1 ring-black/5 select-none", s, className)}
      style={{ background: `linear-gradient(140deg, ${t.from}, ${t.to})`, color: t.ink }}
    >
      {text}
    </span>
  );
}

/** 用渐变 + 几何纹理代替真实图片，离线也能呈现“图集”的效果。 */
export function Cover({
  tone,
  label,
  labelAt = "left",
  className,
  children,
}: {
  tone: number;
  label?: string;
  labelAt?: "left" | "right";
  className?: string;
  children?: ReactNode;
}) {
  const t = TONES[tone % TONES.length];
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ background: `linear-gradient(135deg, ${t.from} 0%, ${t.to} 100%)` }}>
      <svg className="absolute inset-0 h-full w-full opacity-[0.18]" aria-hidden>
        <defs>
          <pattern id={`p-${tone}`} width="28" height="28" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="2" cy="2" r="1.6" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#p-${tone})`} />
      </svg>
      <div className="absolute -right-10 -bottom-16 h-48 w-48 rounded-full bg-white/15" />
      <div className="absolute -top-12 -left-8 h-36 w-36 rounded-full bg-black/5" />
      {label ? (
        <span className={cn("absolute bottom-3 rounded-md bg-black/35 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm", labelAt === "right" ? "right-3" : "left-3")}>{label}</span>
      ) : null}
      {children}
    </div>
  );
}

export function Card({ id, className, children, padded = true }: { id?: string; className?: string; children: ReactNode; padded?: boolean }) {
  return (
    <div id={id} className={cn("rounded-xl border border-gray-200 bg-white shadow-xs", padded && "p-5", className)}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, desc, action, className }: { title: ReactNode; desc?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {desc ? <p className="mt-0.5 text-sm text-gray-500">{desc}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function PageHeader({ title, desc, actions, breadcrumb }: { title: ReactNode; desc?: ReactNode; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-3 text-sm text-gray-500">{breadcrumb}</div> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">{title}</h1>
        {desc ? <p className="mt-1 text-[15px] text-gray-500">{desc}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}

const featuredTones: Record<Tone, string> = {
  gray: "bg-gray-100 text-gray-600 ring-gray-50",
  brand: "bg-brand-100 text-brand-600 ring-brand-50",
  success: "bg-success-100 text-success-600 ring-success-50",
  warning: "bg-warning-100 text-warning-600 ring-warning-50",
  error: "bg-error-100 text-error-600 ring-error-50",
  blue: "bg-blue-100 text-blue-600 ring-blue-50",
  highlight: "bg-highlight-soft text-highlight-ink ring-[hsl(60_100%_95%)]",
  dark: "bg-gray-900 text-white ring-gray-200",
};

export function FeaturedIcon({ icon: Icon, tone = "brand", size = "md" }: { icon: LucideIcon; tone?: Tone; size?: "sm" | "md" | "lg" }) {
  const s = { sm: "h-8 w-8 ring-4", md: "h-10 w-10 ring-[6px]", lg: "h-12 w-12 ring-8" }[size];
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full", s, featuredTones[tone])}>
      <Icon size={size === "lg" ? 24 : size === "md" ? 20 : 16} />
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
  tone = "gray",
  compact,
  className,
}: {
  icon: LucideIcon;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  tone?: Tone;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", compact ? "gap-2 px-4 py-6" : "gap-3 px-6 py-12", className)}>
      <FeaturedIcon icon={icon} tone={tone} size={compact ? "md" : "lg"} />
      <div className="max-w-sm">
        <p className="text-[15px] font-semibold text-gray-900">{title}</p>
        {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
      </div>
      {action ? <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

export function ProgressBar({ value, tone = "brand", className, label }: { value: number; tone?: "brand" | "success" | "highlight" | "dark"; className?: string; label?: boolean }) {
  const color = { brand: "bg-brand-600", success: "bg-success-500", highlight: "bg-highlight", dark: "bg-gray-900" }[tone];
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      {label ? <span className="text-sm font-medium text-gray-700 tabular-nums">{value}%</span> : null}
    </div>
  );
}

export function ProgressRing({ value, size = 56, stroke = 6, children }: { value: number; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-gray-100)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--color-brand-600)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-gray-900">{children ?? `${value}%`}</span>
    </span>
  );
}

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" }) {
  return (
    <span className="group/tt relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={cn(
          "pointer-events-none absolute left-1/2 z-50 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs leading-5 font-medium text-white shadow-lg hidden group-hover/tt:block",
          side === "top" ? "bottom-full mb-2" : "top-full mt-2",
        )}
      >
        {content}
      </span>
    </span>
  );
}

export function Divider({ label, className }: { label?: string; className?: string }) {
  if (!label) return <hr className={cn("border-gray-200", className)} />;
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <hr className="flex-1 border-gray-200" />
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <hr className="flex-1 border-gray-200" />
    </div>
  );
}

export function Stat({ label, value, delta, hint }: { label: string; value: ReactNode; delta?: number; hint?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-500">{label}</span>
      <div className="flex items-end gap-2">
        <span className="text-[28px] leading-9 font-semibold text-gray-900 tabular-nums">{value}</span>
        {delta !== undefined ? (
          <Badge tone={delta >= 0 ? "success" : "error"} size="sm" className="mb-1.5">
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </Badge>
        ) : null}
      </div>
      {hint ? <span className="text-xs text-gray-500">{hint}</span> : null}
    </div>
  );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("font-semibold text-brand-700 hover:text-brand-800", className)}>
      {children}
    </Link>
  );
}
