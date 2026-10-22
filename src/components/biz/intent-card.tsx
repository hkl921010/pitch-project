"use client";

import { Banknote, Clock, Handshake, HelpCircle, MessageCircle, Send, UserPlus, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card } from "@/components/ui/display";
import { ConfirmModal } from "@/components/ui/overlay";
import { INTENT_KIND_LABEL } from "@/data/constants";
import { relativeTime } from "@/data/time";
import type { IntentKind, Project } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { canManageProject, getPerson, requesterView, responseLabel, roleText, useDB, useQuota, useViewer } from "@/store/selectors";

const KIND_BUTTONS: { kind: IntentKind; label: string; icon: typeof Banknote }[] = [
  { kind: "invest", label: "我想投资", icon: Banknote },
  { kind: "partner", label: "我想合作", icon: Handshake },
  { kind: "join", label: "我想加入", icon: UserPlus },
  { kind: "other", label: "其他", icon: HelpCircle },
];

/** 项目页右侧的意向卡：统一入口，替代原来的“查看联系方式 / 发起连接”。 */
export function IntentCard({ project }: { project: Project }) {
  const db = useDB();
  const viewer = useViewer();
  const openIntent = useApp((s) => s.openIntent);
  const withdraw = useApp((s) => s.withdrawIntent);
  const toast = useApp((s) => s.toast);
  const quota = useQuota();
  const [confirm, setConfirm] = useState(false);
  const owner = getPerson(db, project.ownerId);
  const resp = responseLabel(project.responseHours);
  const isMember = !!viewer && project.team.some((t) => t.personId === viewer.id && t.status === "confirmed");
  const manage = canManageProject(project, viewer?.id ?? null);
  const mine = viewer ? db.intents.filter((i) => i.fromId === viewer.id && i.projectId === project.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
  const latest = mine[0];
  const view = latest ? requesterView(latest) : null;
  const seeking = new Set(project.lookingFor.map((n) => n.kind));
  if (project.jobs.length) seeking.add("join");

  if (isMember) {
    const pending = db.intents.filter((i) => i.projectId === project.id && i.status === "pending").length;
    return (
      <Card className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-900">{manage ? "这是你的项目" : "你是项目成员"}</p>
        <p className="text-sm text-gray-600">访客在这里表达投资、合作、加入团队的意向，你在工作台统一处理。</p>
        {manage ? (
          <Link href={`/dashboard/${project.slug}?tab=intents`} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-brand-300">
            <Send size={18} className="text-brand-600" />
            <span className="flex-1 text-sm text-gray-700">
              <b className="text-gray-900">{pending}</b> 条意向待回应
            </span>
            {pending ? <span className="h-2 w-2 rounded-full bg-error-500" /> : null}
          </Link>
        ) : null}
        <Badge tone={resp.tone} icon={Zap} className="self-start">
          {resp.label}
        </Badge>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {owner ? <Avatar name={owner.name} tone={owner.avatarTone} size="md" /> : null}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">和 {owner?.name} 聊聊</p>
          <p className="truncate text-xs text-gray-500">
            {roleText(owner)} · {project.name}
          </p>
        </div>
      </div>
      <Badge tone={resp.tone} icon={Zap} className="self-start">
        {resp.label}
      </Badge>

      {latest && view === "waiting" ? (
        <div className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-25 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-brand-800">
            <Clock size={16} />
            {latest.anonymous ? "匿名意向等待回应" : "意向已发出，等待回应"}
          </p>
          <p className="text-sm text-gray-600">
            {relativeTime(latest.createdAt)}表达了「{INTENT_KIND_LABEL[latest.kind]}」意向。对方接受后会自动开启对话。
          </p>
          <div className="flex gap-2">
            <Button size="xs" variant="secondary" href="/me/intents">
              查看
            </Button>
            <Button size="xs" variant="tertiary" onClick={() => setConfirm(true)}>
              撤回
            </Button>
          </div>
          <ConfirmModal
            open={confirm}
            onClose={() => setConfirm(false)}
            onConfirm={() => {
              withdraw(latest.id);
              toast({ tone: "info", title: "已撤回意向", body: "对方将不再看到这条意向" });
            }}
            title="撤回这条意向？"
            desc="撤回后对方不再看到。已使用的本月次数不退回。"
            confirmText="撤回"
            danger
          />
        </div>
      ) : view === "accepted" && latest?.conversationId ? (
        <div className="flex flex-col gap-3 rounded-lg border border-success-200 bg-success-50 p-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-success-700">
            <MessageCircle size={16} />
            对话进行中
          </p>
          <Button size="sm" variant="primary" href={`/inbox/${latest.conversationId}`}>
            打开对话
          </Button>
        </div>
      ) : (
        <>
          {view === "no_response" ? <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">你上次的意向暂未得到回应。项目有新进展时可以再试一次。</p> : null}
          <div className="grid grid-cols-2 gap-2">
            {KIND_BUTTONS.map((b) => {
              const hot = seeking.has(b.kind);
              const Icon = b.icon;
              return (
                <button
                  key={b.kind}
                  onClick={() => openIntent({ type: "project", projectId: project.id, presetKind: b.kind })}
                  className={cn(
                    "relative flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors focus-visible:focus-ring",
                    hot ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50",
                  )}
                >
                  <Icon size={18} className={hot ? "text-highlight" : "text-gray-500"} />
                  <span className="text-sm font-semibold">{b.label}</span>
                  {hot ? <span className="text-[11px] text-gray-300">项目正在寻找</span> : null}
                </button>
              );
            })}
          </div>
        </>
      )}
      <p className="text-xs text-gray-500">
        {!viewer
          ? "登录后即可表达意向，浏览和关注免费。"
          : quota?.unlimited
            ? "会员不限次数。可以选择匿名，对方愿意聊时才揭晓身份。"
            : quota && quota.remaining > 0
              ? `本月还可发 ${quota.remaining} 次意向（回复不消耗）。可以选择匿名。`
              : null}
        {viewer && quota && !quota.unlimited && quota.remaining <= 0 ? (
          <>
            本月意向次数已用完。
            <Link href="/rewards" className="font-semibold text-brand-700 hover:underline">
              完成贡献任务每项 +1
            </Link>
          </>
        ) : null}
      </p>
    </Card>
  );
}

/** 移动端底部固定条：关注 + 表达意向。 */
export function IntentBar({ project, follow }: { project: Project; follow: React.ReactNode }) {
  const viewerId = useApp((s) => s.viewerId);
  const openIntent = useApp((s) => s.openIntent);
  const isMember = !!viewerId && project.team.some((t) => t.personId === viewerId && t.status === "confirmed");
  if (isMember) return null;
  const preset: IntentKind = project.lookingFor[0]?.kind === "help" ? "partner" : project.lookingFor[0]?.kind ?? "partner";
  return (
    <div className="fixed inset-x-0 bottom-[60px] z-50 flex gap-3 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
      {follow}
      <Button variant="primary" className="flex-1" iconLeft={Send} onClick={() => openIntent({ type: "project", projectId: project.id, presetKind: preset })}>
        表达意向
      </Button>
    </div>
  );
}
