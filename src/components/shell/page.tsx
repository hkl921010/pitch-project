import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/** 页面容器：统一最大宽度与左右留白。 */
export function Page({ children, className, narrow }: { children: ReactNode; className?: string; narrow?: boolean }) {
  return <div className={cn("mx-auto w-full px-4 py-6 sm:px-8 sm:py-8", narrow ? "max-w-[880px]" : "max-w-[1280px]", className)}>{children}</div>;
}
