"use client";

import { AlertCircle, CheckCircle2, FileUp, Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { BP_SAMPLE, bpFieldsFound, type BPExtract } from "@/data/ai-prefill";
import { cn } from "@/lib/cn";

type State = { kind: "idle" } | { kind: "reading"; name: string; progress: number } | { kind: "done"; name: string } | { kind: "error"; message: string };

const OK_EXT = /\.(pdf|ppt|pptx|key)$/i;

/** 上传 BP → AI 读取 → 回填。原型里用固定示例代替真实解析。 */
export function BPUpload({ onExtract, compact, className }: { onExtract: (x: BPExtract) => void; compact?: boolean; className?: string }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const ref = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const start = (name: string, size: number) => {
    if (!OK_EXT.test(name)) return setState({ kind: "error", message: "请上传 PDF、PPT 或 Keynote 格式的 BP" });
    if (size > 30 * 1_048_576) return setState({ kind: "error", message: "文件超过 30 MB，可以先导出一个精简版" });
    setState({ kind: "reading", name, progress: 8 });
    timer.current = setInterval(() => {
      setState((s) => {
        if (s.kind !== "reading") return s;
        const next = s.progress + 18;
        if (next >= 100) {
          if (timer.current) clearInterval(timer.current);
          setTimeout(() => onExtract(BP_SAMPLE), 0);
          return { kind: "done", name: s.name };
        }
        return { ...s, progress: next };
      });
    }, 260);
  };

  return (
    <div className={className}>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.ppt,.pptx,.key"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) start(f.name, f.size);
          e.target.value = "";
        }}
      />
      {state.kind === "reading" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-brand-200 bg-brand-25 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
            <Loader2 size={16} className="animate-spin" />
            AI 正在读取 {state.name}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-brand-600 transition-all duration-200" style={{ width: `${state.progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">提取项目名称、一句话介绍、赛道、介绍、产品、优势和正在寻找…</p>
        </div>
      ) : state.kind === "done" ? (
        <div className="flex flex-col gap-2 rounded-xl border border-success-200 bg-success-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-success-700">
            <CheckCircle2 size={16} />
            已从 {state.name} 中提取 {bpFieldsFound(BP_SAMPLE).length} 项内容
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bpFieldsFound(BP_SAMPLE).map((f) => (
              <span key={f} className="rounded-md border border-success-200 bg-white px-2 py-0.5 text-xs text-success-700">
                {f}
              </span>
            ))}
          </div>
          <p className="text-xs text-gray-600">
            都可以再改。
            <button onClick={() => ref.current?.click()} className="font-semibold text-success-700 hover:underline">
              换一份 BP
            </button>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) start(f.name, f.size);
          }}
          className={cn(
            "group flex w-full items-center gap-4 rounded-xl border border-dashed text-left transition-colors",
            compact ? "p-3" : "p-4",
            state.kind === "error" ? "border-error-300 bg-error-50" : "border-gray-300 bg-white hover:border-brand-300 hover:bg-brand-25",
          )}
        >
          <span className={cn("flex shrink-0 items-center justify-center rounded-lg", compact ? "h-9 w-9" : "h-10 w-10", state.kind === "error" ? "bg-error-100 text-error-600" : "bg-brand-50 text-brand-600")}>
            {state.kind === "error" ? <AlertCircle size={20} /> : <FileUp size={20} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
              <Sparkles size={14} className="text-brand-600" />
              上传 BP，AI 帮你填
            </span>
            <span className={cn("block text-xs", state.kind === "error" ? "text-error-600" : "text-gray-500")}>
              {state.kind === "error" ? state.message : "点击或拖入 PDF / PPT，约 3 秒。BP 本身不会公开"}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
