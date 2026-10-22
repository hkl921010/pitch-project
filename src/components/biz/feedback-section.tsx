"use client";

import { Eye, EyeOff, Lightbulb, Lock, MessageSquareReply, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState } from "@/components/ui/display";
import { ChipSelect, Textarea } from "@/components/ui/form";
import { FEEDBACK_CATEGORIES } from "@/data/constants";
import { relativeTime } from "@/data/time";
import type { FeedbackCategory, Project } from "@/data/types";
import { useApp } from "@/store/app-store";
import { canManageProject, getPerson, useDB } from "@/store/selectors";

/** 项目页“给建议”区：默认只有项目方能看到，项目方可以选择公开并回复。 */
export function FeedbackSection({ project }: { project: Project }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const add = useApp((s) => s.addFeedback);
  const toast = useApp((s) => s.toast);
  const requireLogin = useApp((s) => s.requireLogin);
  const [cat, setCat] = useState<string[]>(["产品"]);
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const manage = canManageProject(project, viewerId);
  const isMember = project.team.some((t) => t.personId === viewerId && t.status === "confirmed");
  const all = db.feedback.filter((f) => f.projectId === project.id);
  const visible = manage ? all : all.filter((f) => f.isPublic || f.fromId === viewerId);
  const error = tried && text.trim().length < 10 ? "至少 10 个字，具体的建议对创始人更有帮助" : undefined;

  return (
    <div className="flex flex-col gap-5">
      {!isMember ? (
        <div className="rounded-xl border border-gray-200 bg-gray-25 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Lightbulb size={16} className="text-warning-600" />
            <p className="text-sm font-semibold text-gray-900">给 {project.name} 提一条建议</p>
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500">
              <Lock size={12} />
              默认只有项目方能看到
            </span>
          </div>
          <ChipSelect options={FEEDBACK_CATEGORIES} value={cat} onChange={(v) => setCat(v.length ? v : cat)} size="sm" />
          <Textarea
            wrapperClassName="mt-3"
            rows={3}
            placeholder="比如：吉隆坡的写字楼午餐时段很集中，建议首店选在 KLCC 附近"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxCount={300}
            error={error}
            onFocus={() => !viewerId && requireLogin("登录后可以给项目提建议")}
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Sparkles size={12} className="text-highlight-ink" />
              写一条有内容的建议，本月意向次数 +1
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                if (!viewerId) return requireLogin("登录后可以给项目提建议");
                setTried(true);
                if (text.trim().length < 10) return;
                add(project.id, cat[0] as FeedbackCategory, text.trim());
                setText("");
                setTried(false);
                toast({ tone: "success", title: "建议已发送给项目方", body: "项目方觉得有用时会标记并回复你" });
              }}
            >
              发送建议
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4 text-sm text-gray-700">
          <MessageSquareReply size={18} className="text-brand-600" />
          <span className="flex-1">
            共收到 <b>{all.length}</b> 条建议，其中 <b>{all.filter((f) => !f.isPublic).length}</b> 条仅你可见。
          </span>
          {manage ? (
            <Button size="sm" variant="secondary" href={`/dashboard/${project.slug}?tab=feedback`}>
              管理建议
            </Button>
          ) : null}
        </div>
      )}

      {visible.length ? (
        <ul className="flex flex-col gap-4">
          {visible.map((f) => {
            const from = getPerson(db, f.fromId);
            return (
              <li key={f.id} className="flex gap-3">
                <Avatar name={from?.name ?? "?"} tone={from?.avatarTone ?? 0} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/u/${from?.handle}`} className="font-semibold text-gray-900 hover:text-brand-700">
                      {from?.name}
                    </Link>
                    <Badge size="xs">{f.category}</Badge>
                    {f.helpful ? <Badge tone="success" size="xs">项目方觉得有用</Badge> : null}
                    {!f.isPublic ? (
                      <Badge tone="gray" size="xs" icon={EyeOff}>
                        {f.fromId === viewerId ? "仅你和项目方可见" : "仅项目方可见"}
                      </Badge>
                    ) : manage ? (
                      <Badge tone="blue" size="xs" icon={Eye}>
                        已公开
                      </Badge>
                    ) : null}
                    <span className="text-xs text-gray-400">{relativeTime(f.at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">{f.text}</p>
                  {f.reply ? (
                    <div className="mt-2 rounded-lg border-l-2 border-brand-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      <span className="font-semibold text-gray-900">项目方回复：</span>
                      {f.reply}
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Lightbulb} title="还没有公开的建议" desc="项目方把有价值的建议公开后会显示在这里" />
      )}
    </div>
  );
}
