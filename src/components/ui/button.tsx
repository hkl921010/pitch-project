"use client";

import { Loader2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "tertiary" | "brand" | "highlight" | "destructive" | "link" | "link-gray";
type Size = "xs" | "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-xs hover:bg-primary-hover disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none",
  secondary:
    "bg-white text-gray-700 border border-gray-300 shadow-xs hover:bg-gray-50 hover:text-gray-800 disabled:text-gray-400 disabled:border-gray-200 disabled:bg-white",
  tertiary: "text-gray-600 hover:bg-gray-50 hover:text-gray-700 disabled:text-gray-400 disabled:bg-transparent",
  brand: "bg-brand-600 text-white shadow-xs hover:bg-brand-700 disabled:bg-gray-100 disabled:text-gray-400",
  highlight: "bg-highlight text-gray-900 shadow-xs hover:brightness-95 disabled:bg-gray-100 disabled:text-gray-400",
  destructive: "bg-error-600 text-white shadow-xs hover:bg-error-700 disabled:bg-gray-100 disabled:text-gray-400",
  link: "text-brand-700 hover:text-brand-800 px-0! h-auto! disabled:text-gray-400",
  "link-gray": "text-gray-600 hover:text-gray-800 px-0! h-auto! disabled:text-gray-400",
};

const sizes: Record<Size, string> = {
  xs: "h-8 px-2.5 text-xs gap-1 rounded-md",
  sm: "h-9 px-3 text-sm gap-1.5 rounded-lg",
  md: "h-10 px-3.5 text-sm gap-1.5 rounded-lg",
  lg: "h-11 px-4 text-base gap-2 rounded-lg",
};

const iconOnlySizes: Record<Size, string> = {
  xs: "h-8 w-8 rounded-md",
  sm: "h-9 w-9 rounded-lg",
  md: "h-10 w-10 rounded-lg",
  lg: "h-11 w-11 rounded-lg",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  iconOnly?: LucideIcon;
  href?: string;
  children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", loading, iconLeft: IconL, iconRight: IconR, iconOnly: IconOnly, href, className, children, disabled, ...rest },
  ref,
) {
  const cls = cn(
    "inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap transition-colors duration-100 outline-none focus-visible:focus-ring select-none",
    variants[variant],
    IconOnly ? iconOnlySizes[size] : sizes[size],
    className,
  );
  const iconSize = size === "lg" ? 20 : size === "xs" ? 14 : 18;
  const content = IconOnly ? (
    loading ? <Loader2 size={iconSize} className="animate-spin" /> : <IconOnly size={iconSize} />
  ) : (
    <>
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : IconL ? <IconL size={iconSize} /> : null}
      {children}
      {IconR && !loading ? <IconR size={iconSize} /> : null}
    </>
  );
  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  );
});
