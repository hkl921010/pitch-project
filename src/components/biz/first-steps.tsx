"use client";

import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/display";
import { ROLE_LABEL } from "@/data/constants";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { firstSteps, useDB, useViewer } from "@/store/selectors";

/** 首页顶部“你的第一步”：做完自动打勾，全部完成后不再显示。 */
export function FirstStepsCard() {
  const db = useDB();
  const viewer = useViewer();
  const openCreate = useApp((s) => s.openCreate);
  const [collapsed, setCollapsed] = useState(false);
  if (!viewer?.role) return null;
  const steps = firstSteps(db, viewer);
  const done = steps.filter((s) => s.done).length;
  if (!steps.length || done === steps.length) return null;
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-center gap-4 bg-[linear-gradient(100deg,var(--color-gray-900),var(--color-brand-800))] px-5 py-4 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-highlight">{ROLE_LABEL[viewer.role]}的第一步</p>
          <p className="mt-0.5 font-semibold">
            已完成 {done}/{steps.length}，做完这几件事，Pitch 才能帮你找到对的人
          </p>
        </div>
        <ProgressBar value={Math.round((done / steps.length) * 100)} tone="highlight" className="hidden w-40 sm:flex [&>div]:bg-white/20" />
        <button onClick={() => setCollapsed((v) => !v)} className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white" aria-label={collapsed ? "展开" : "收起"}>
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>
      {collapsed ? null : (
        <ol className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {steps.map((s, i) => (
            <li key={s.key} className={cn("flex flex-col gap-2 p-5", s.done && "bg-gray-25")}>
              <div className="flex items-center gap-2">
                <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold", s.done ? "bg-success-500 text-white" : "bg-gray-100 text-gray-600")}>
                  {s.done ? <Check size={14} strokeWidth={3} /> : i + 1}
                </span>
                <p className={cn("text-sm font-semibold", s.done ? "text-gray-400 line-through" : "text-gray-900")}>{s.title}</p>
              </div>
              <p className="text-sm text-gray-500">{s.desc}</p>
              {s.done ? (
                <span className="mt-auto text-xs font-medium text-success-700">已完成</span>
              ) : s.action === "create" ? (
                <Button size="sm" variant="primary" className="mt-auto self-start" onClick={openCreate}>
                  {s.cta}
                </Button>
              ) : s.href ? (
                <Button size="sm" variant="secondary" className="mt-auto self-start" href={s.href}>
                  {s.cta}
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
