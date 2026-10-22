"use client";

import { Check, ChevronDown, RotateCcw, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/display";
import { Dropdown } from "@/components/ui/overlay";
import { DEMO_PERSONAS } from "@/data/seed";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { getPerson, useDB } from "@/store/selectors";

/** 演示身份切换器：原型专用，正式产品中不存在。 */
export function PersonaSwitcher({ compact }: { compact?: boolean }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const setViewer = useApp((s) => s.setViewer);
  const resetDemo = useApp((s) => s.resetDemo);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const current = DEMO_PERSONAS.find((p) => p.key === (viewerId ?? "guest"));
  const label = current?.label ?? (viewerId ? getPerson(db, viewerId)?.name : null) ?? "游客";

  return (
    <Dropdown
      width={288}
      trigger={(open) => (
        <button
          className={cn(
            "flex h-9 items-center gap-2 rounded-lg border border-dashed border-brand-300 bg-brand-25 pr-2 pl-2.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50",
            open && "bg-brand-50",
          )}
          title="演示身份切换（原型专用）"
        >
          <UserRound size={16} />
          {compact ? null : <span className="hidden xl:inline">演示：</span>}
          <span className="max-w-[72px] truncate">{label}</span>
          <ChevronDown size={14} />
        </button>
      )}
    >
      {(close) => (
        <div>
          <div className="border-b border-gray-100 px-4 pt-2 pb-2.5">
            <p className="text-xs font-semibold text-brand-700">演示身份切换</p>
            <p className="mt-0.5 text-xs text-gray-500">原型专用。切换后同一页面会呈现不同视角。</p>
          </div>
          <div className="py-1">
            {DEMO_PERSONAS.map((p) => {
              const person = p.key === "guest" ? null : getPerson(db, p.key);
              const on = (viewerId ?? "guest") === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => {
                    setViewer(p.key === "guest" ? null : p.key);
                    close();
                    toast({ tone: "info", title: `已切换为「${p.label}」`, body: p.desc });
                    if (p.key === "u-newbie" && person && !person.onboarded) router.push("/welcome");
                  }}
                  className={cn("mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-md px-2.5 py-2 text-left hover:bg-gray-50", on && "bg-gray-50")}
                >
                  {person ? <Avatar name={person.name} tone={person.avatarTone} size="sm" /> : <Avatar name="?" anonymous size="sm" />}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">{p.label}</span>
                    <span className="block truncate text-xs text-gray-500">{p.desc}</span>
                  </span>
                  {on ? <Check size={16} className="text-brand-600" /> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                resetDemo();
                close();
                toast({ tone: "success", title: "演示数据已重置", body: "所有操作恢复到初始状态" });
              }}
              className="mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RotateCcw size={16} className="text-gray-500" />
              重置演示数据
            </button>
          </div>
        </div>
      )}
    </Dropdown>
  );
}
