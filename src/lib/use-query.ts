"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** 把页面上的 Tab、筛选同步到 URL，刷新和分享都能还原。 */
export function useQueryParam<T extends string>(key: string, fallback: T): [T, (v: T) => void] {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const value = (sp.get(key) as T | null) ?? fallback;
  const set = useCallback(
    (v: T) => {
      const next = new URLSearchParams(sp.toString());
      if (v === fallback || !v) next.delete(key);
      else next.set(key, v);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [sp, router, pathname, key, fallback],
  );
  return [value, set];
}

/** 原型里模拟一次短暂加载，用于展示骨架屏。 */
export function useFakeLoading(dep: unknown, ms = 280) {
  const [loading, setLoading] = useState(true);
  const first = useRef(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), first.current ? ms + 120 : ms);
    first.current = false;
    return () => clearTimeout(t);
  }, [dep, ms]);
  return loading;
}
