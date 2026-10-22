"use client";

import { ChevronDown, ChevronUp, PenLine, Quote, ShieldCheck, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState } from "@/components/ui/display";
import { ChipSelect, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { PERSON_DIMENSIONS, PROJECT_DIMENSIONS } from "@/data/constants";
import { relativeTime } from "@/data/time";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { endorsementDimensions, endorsementsFor, getPerson, investorEndorsers, roleText, useDB } from "@/store/selectors";

/** 按维度汇总的署名背书：“出海渠道 · 3 人背书”，展开看每一条。 */
export function EndorsementBlock({ targetType, targetId, targetName, canEndorse }: { targetType: "project" | "person"; targetId: string; targetName: string; canEndorse: boolean }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const requireLogin = useApp((s) => s.requireLogin);
  const remove = useApp((s) => s.removeEndorsement);
  const toast = useApp((s) => s.toast);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const list = endorsementsFor(db, targetType, targetId);
  const dims = endorsementDimensions(list);
  const mine = list.filter((e) => e.fromId === viewerId);
  const investors = targetType === "person" ? investorEndorsers(db, targetId) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-gray-600">
          <b className="text-gray-900">{new Set(list.map((e) => e.fromId)).size}</b> 人署名背书
          {investors ? (
            <span className="ml-2 inline-flex items-center gap-1 font-medium text-brand-700">
              <ShieldCheck size={14} />其中 {investors} 位投资人
            </span>
          ) : null}
        </p>
        {canEndorse ? (
          <Button
            size="sm"
            variant="secondary"
            iconLeft={PenLine}
            className="ml-auto"
            onClick={() => (viewerId ? setOpen(true) : requireLogin("登录后可以写背书"))}
          >
            {mine.length ? "再写一条" : "写背书"}
          </Button>
        ) : null}
      </div>
      {dims.length ? (
        <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200">
          {dims.map((d) => {
            const isOpen = expanded === d.dimension;
            const top = d.items.slice(0, 5).map((e) => getPerson(db, e.fromId)).filter(Boolean);
            return (
              <div key={d.dimension}>
                <button onClick={() => setExpanded(isOpen ? null : d.dimension)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-25">
                  <ThumbsUp size={16} className="text-brand-600" />
                  <span className="font-semibold text-gray-900">{d.dimension}</span>
                  <span className="text-sm text-gray-500">· {d.count} 人背书</span>
                  <span className="ml-auto flex -space-x-1.5">
                    {top.map((p) => (
                      <Avatar key={p!.id} name={p!.name} tone={p!.avatarTone} size="xs" className="rounded-full ring-2 ring-white" />
                    ))}
                  </span>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </button>
                {isOpen ? (
                  <ul className="flex flex-col gap-3 px-4 pb-4">
                    {d.items.map((e) => {
                      const from = getPerson(db, e.fromId);
                      if (!from) return null;
                      return (
                        <li key={e.id} className="flex gap-3 rounded-lg bg-gray-50 p-3">
                          <Avatar name={from.name} tone={from.avatarTone} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm">
                              <Link href={`/u/${from.handle}`} className="font-semibold text-gray-900 hover:text-brand-700">
                                {from.name}
                              </Link>
                              <span className="ml-1.5 text-xs text-gray-500">
                                {roleText(from)}
                                {from.org ? ` · ${from.org}` : ""} · {relativeTime(e.at)}
                              </span>
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              <Quote size={12} className="mr-1 inline -translate-y-0.5 text-gray-400" />
                              {e.text}
                            </p>
                          </div>
                          {e.fromId === viewerId ? (
                            <button
                              className="self-start text-xs text-gray-400 hover:text-error-600"
                              onClick={() => {
                                remove(e.id);
                                toast({ tone: "info", title: "已撤回这条背书" });
                              }}
                            >
                              撤回
                            </button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300">
          <EmptyState
            compact
            icon={ThumbsUp}
            title="还没有人背书"
            desc={canEndorse ? `如果你和${targetName}合作过、或者认可TA的能力，写一句署名背书吧` : "背书来自合作过的人，只能由他人填写"}
          />
        </div>
      )}
      <EndorseModal open={open} onClose={() => setOpen(false)} targetType={targetType} targetId={targetId} targetName={targetName} />
    </div>
  );
}

export function EndorseModal({ open, onClose, targetType, targetId, targetName }: { open: boolean; onClose: () => void; targetType: "project" | "person"; targetId: string; targetName: string }) {
  const add = useApp((s) => s.addEndorsement);
  const toast = useApp((s) => s.toast);
  const [dim, setDim] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const dims = targetType === "person" ? PERSON_DIMENSIONS : PROJECT_DIMENSIONS;
  const err = tried && !dim.length ? "选一个你最认可的维度" : tried && text.trim().length < 8 ? "至少写 8 个字，说说具体的事" : undefined;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`为${targetName}写一条背书`}
      desc="背书会署上你的名字公开展示，只能写正向评价。写一条可以完成本月的贡献任务。"
      footer={
        <>
          <Button onClick={onClose}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (!dim.length || text.trim().length < 8) return;
              add({ targetType, targetId, dimension: dim[0], text: text.trim() });
              toast({ tone: "success", title: "背书已发布", body: `${dim[0]} · 已署名展示` });
              setDim([]);
              setText("");
              setTried(false);
              onClose();
            }}
          >
            署名发布
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">你最认可的维度</span>
          <ChipSelect options={dims} value={dim} onChange={setDim} />
        </div>
        <Textarea
          label="说一件具体的事"
          placeholder={targetType === "person" ? "例如：帮我们打通了泰国 Central 的户外专区" : "例如：单店模型扎实，3 个月回本在新加坡非常少见"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxCount={120}
          rows={3}
          error={err}
        />
        <p className={cn("rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500")}>
          <Badge tone="gray" size="xs" className="mr-1">规则</Badge>
          背书只做正向信号，没有差评和踩；你可以随时撤回自己写的背书。
        </p>
      </div>
    </Modal>
  );
}
