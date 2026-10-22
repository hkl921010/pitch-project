"use client";

import { useEffect } from "react";

/** 带锚点进入页面时滚到对应区块。内容在数据恢复后才渲染，所以短暂轮询等目标出现。 */
export function useHashScroll(deps: unknown[] = []) {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const attempt = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      else if (tries++ < 20) timer = setTimeout(attempt, 50);
    };
    timer = setTimeout(attempt, 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
