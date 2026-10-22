"use client";

import { ChevronLeft, ChevronRight, ImagePlus } from "lucide-react";
import { useState } from "react";

import { Cover } from "@/components/ui/display";
import { Modal } from "@/components/ui/overlay";
import type { GalleryItem } from "@/data/types";
import { cn } from "@/lib/cn";

/** 封面图集：大图 + 缩略图，点击放大浏览。没有图时用封面色调占位。 */
export function Gallery({ items, coverTone, editableHref }: { items: GalleryItem[]; coverTone: number; editableHref?: string }) {
  const [idx, setIdx] = useState<number | null>(null);
  if (!items.length) {
    return (
      <Cover tone={coverTone} className="flex h-48 items-center justify-center rounded-xl sm:h-64">
        {editableHref ? (
          <a href={editableHref} className="relative inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-white">
            <ImagePlus size={16} />
            上传封面与产品图
          </a>
        ) : null}
      </Cover>
    );
  }
  const main = items[0];
  const rest = items.slice(1, 4);
  return (
    <>
      <div className={cn("grid grid-cols-1 gap-2", rest.length ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]" : "")}>
        <button onClick={() => setIdx(0)} className="block overflow-hidden rounded-xl">
          <Cover tone={main.tone} label={main.caption} labelAt="right" className="h-52 transition-transform hover:scale-[1.01] sm:h-72">
            {items.length > 1 ? (
              <span className="absolute top-3 right-3 rounded-md bg-black/35 px-2 py-0.5 text-xs font-medium text-white tabular-nums backdrop-blur-sm sm:hidden">1 / {items.length}</span>
            ) : null}
          </Cover>
        </button>
        {rest.length ? (
          <div className="hidden grid-rows-3 gap-2 sm:grid">
            {rest.map((g, i) => (
              <button key={g.id} onClick={() => setIdx(i + 1)} className="relative block overflow-hidden rounded-xl">
                <Cover tone={g.tone} label={g.caption} className="h-full min-h-[66px]" />
                {i === rest.length - 1 && items.length > 4 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-semibold text-white">+{items.length - 4}</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <Modal open={idx !== null} onClose={() => setIdx(null)} size="xl" title={idx !== null ? items[idx].caption : ""} desc={idx !== null ? `${idx + 1} / ${items.length}` : ""}>
        {idx !== null ? (
          <div className="relative">
            <Cover tone={items[idx].tone} className="h-[50vh] rounded-xl" />
            <button
              onClick={() => setIdx((idx - 1 + items.length) % items.length)}
              className="absolute top-1/2 left-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white"
              aria-label="上一张"
            >
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => setIdx((idx + 1) % items.length)} className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white" aria-label="下一张">
              <ChevronRight size={20} />
            </button>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
