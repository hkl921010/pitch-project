"use client";

import Link from "next/link";

import { cn } from "@/lib/cn";

/** 首页对照。A、B 是前两版，其余按对应网站的营销站节奏。 */
export function PortalCompare({ current }: { current: "a" | "b" | "c" | "d" | "e" | "f" }) {
  const item = (on: boolean) => cn("rounded-full px-2.5 py-1.5 text-sm font-semibold", on ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100");
  return (
    <div className="flex w-full justify-end px-4 pt-3">
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-black/10 bg-white/95 p-1 shadow-sm">
      <Link href="/" className={item(current === "a")}>A</Link>
      <Link href="/b" className={item(current === "b")}>B</Link>
      <Link href="/c" className={item(current === "c")}>Jasper</Link>
      <Link href="/d" className={item(current === "d")}>Supabase</Link>
      <Link href="/e" className={item(current === "e")}>Deel</Link>
      <Link href="/f" className={item(current === "f")}>Antler</Link>
      </div>
    </div>
  );
}
