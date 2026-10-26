"use client";

import { EyeOff, Inbox, MessageCircle, Send, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState, ProjectLogo } from "@/components/ui/display";
import { ConfirmModal } from "@/components/ui/overlay";
import { Segmented } from "@/components/ui/tabs";
import { relativeTime } from "@/data/time";
import type { Intent } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { anonymousProfile, getPerson, getProject, intentKindLabel, requesterStatusLabel, requesterView, roleText, useDB } from "@/store/selectors";

function KindLine({ intent: i }: { intent: Intent }) {
  const db = useDB();
  const project = getProject(db, i.projectId);
  const job = project?.jobs.find((j) => j.id === i.jobId);
  const need = i.needId ? project?.lookingFor.find((n) => n.id === i.needId) : undefined;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone={i.kind === "invest" ? "success" : i.kind === "join" ? "brand" : i.kind === "partner" ? "blue" : "warning"} size="xs">
        {intentKindLabel(i)}
        {i.sub ? ` · ${i.sub}` : ""}
      </Badge>
      {job ? <Badge size="xs">岗位：{job.title}</Badge> : null}
      {need ? <Badge size="xs">回应：{need.title.slice(0, 16)}</Badge> : null}
      {i.anonymous && !i.revealed ? (
        <Badge size="xs" icon={EyeOff}>
          匿名
        </Badge>
      ) : null}
    </div>
  );
}

/** 收到的意向：开始聊 / 暂不考虑；匿名的显示“我也想聊”，接受后身份揭晓。 */
export function ReceivedIntentCard({ intent: i, showProject = true }: { intent: Intent; showProject?: boolean }) {
  const db = useDB();
  const router = useRouter();
  const respond = useApp((s) => s.respondIntent);
  const toast = useApp((s) => s.toast);
  const [decline, setDecline] = useState(false);
  const from = getPerson(db, i.fromId);
  const project = getProject(db, i.projectId);
  const hidden = i.anonymous && !i.revealed;
  const accept = () => {
    const cv = respond(i.id, "accept");
    toast({ tone: "success", title: hidden ? "身份已揭晓，对话已开启" : "对话已开启", body: "不消耗你的意向次数" });
    if (cv) router.push(`/inbox/${cv}`);
  };
  return (
    <div className={cn("flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-xs", i.status === "pending" ? "border-gray-200" : "border-gray-100 bg-gray-25")}>
      <div className="flex items-start gap-3">
        <Avatar name={from?.name ?? "?"} tone={from?.avatarTone ?? 0} anonymous={hidden} size="lg" />
        <div className="min-w-0 flex-1">
          {hidden ? (
            <>
              <p className="flex items-center gap-1.5 font-semibold text-gray-900">
                <EyeOff size={16} />
                匿名{roleText(from)}
              </p>
              <p className="text-sm text-gray-500">{anonymousProfile(db, from)}</p>
            </>
          ) : from ? (
            <>
              <Link href={`/u/${from.handle}`} className="font-semibold text-gray-900 hover:text-brand-700">
                {from.name}
              </Link>
              <p className="text-sm text-gray-500">
                {roleText(from)}
                {from.org ? ` · ${from.org}` : ""}
              </p>
            </>
          ) : null}
        </div>
        <span className="shrink-0 text-xs text-gray-400">{relativeTime(i.createdAt)}</span>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <KindLine intent={i} />
          {showProject && project ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <ProjectLogo text={project.logoText} tone={project.logoTone} size="xs" />
              {project.name}
            </span>
          ) : null}
        </div>
        <p className="rounded-lg bg-gray-50 px-3 py-2 text-[15px] text-gray-800">{i.message}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {i.status === "pending" ? (
          <>
            <Button size="sm" variant="primary" iconLeft={MessageCircle} onClick={accept}>
              {hidden ? "我也想聊" : "开始聊"}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setDecline(true)}>
              暂不考虑
            </Button>
            <span className="text-xs text-gray-500">{hidden ? "点“我也想聊”后双方身份同时揭晓" : "回复不消耗意向次数"}</span>
          </>
        ) : i.status === "accepted" ? (
          <Button size="sm" variant="secondary" iconLeft={MessageCircle} href={`/inbox/${i.conversationId}`}>
            打开对话
          </Button>
        ) : i.status === "declined" ? (
          <span className="text-sm text-gray-500">已选择暂不考虑 · 对方不会收到拒绝通知</span>
        ) : (
          <span className="text-sm text-gray-500">对方已撤回</span>
        )}
      </div>
      <ConfirmModal
        open={decline}
        onClose={() => setDecline(false)}
        onConfirm={() => {
          respond(i.id, "decline");
          toast({ tone: "info", title: "已标记为暂不考虑", body: "对方不会收到拒绝通知" });
        }}
        title="暂不考虑这条意向？"
        desc={
          hidden
            ? "对方不会收到拒绝通知，7 天后看到的是“暂未回应”，和没来得及回复没有区别。你也不会知道对方是谁。"
            : "对方不会收到拒绝通知，7 天后看到的是“暂未回应”，和没来得及回复没有区别。"
        }
        confirmText="暂不考虑"
      />
    </div>
  );
}

export function SentIntentCard({ intent: i }: { intent: Intent }) {
  const db = useDB();
  const withdraw = useApp((s) => s.withdrawIntent);
  const toast = useApp((s) => s.toast);
  const [confirm, setConfirm] = useState(false);
  const project = getProject(db, i.projectId);
  const to = getPerson(db, i.toId);
  const st = requesterStatusLabel(i);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex items-start gap-3">
        {project ? (
          <Link href={`/p/${project.slug}`}>
            <ProjectLogo text={project.logoText} tone={project.logoTone} size="lg" />
          </Link>
        ) : (
          <Avatar name={to?.name ?? "?"} tone={to?.avatarTone ?? 0} size="lg" />
        )}
        <div className="min-w-0 flex-1">
          <Link href={project ? `/p/${project.slug}` : `/u/${to?.handle}`} className="font-semibold text-gray-900 hover:text-brand-700">
            {project ? project.name : to?.name}
          </Link>
          <p className="truncate text-sm text-gray-500">{project ? `${to?.name} · ${project.oneLiner}` : `${roleText(to)} · ${to?.title}`}</p>
        </div>
        <Badge tone={st.tone} dot>
          {st.label}
        </Badge>
      </div>
      <KindLine intent={i} />
      <p className="text-sm text-gray-700">{i.message}</p>
      <div className="flex items-center gap-2">
        <span className="mr-auto text-xs text-gray-400">
          {relativeTime(i.createdAt)}发出{i.anonymous ? (i.revealed ? " · 已揭晓身份" : " · 匿名") : ""}
        </span>
        {requesterView(i) === "waiting" || requesterView(i) === "no_response" ? (
          <Button size="xs" variant="tertiary" iconLeft={Undo2} onClick={() => setConfirm(true)}>
            撤回
          </Button>
        ) : null}
        {i.status === "accepted" && i.conversationId ? (
          <Button size="xs" variant="primary" iconLeft={MessageCircle} href={`/inbox/${i.conversationId}`}>
            打开对话
          </Button>
        ) : null}
      </div>
      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          withdraw(i.id);
          toast({ tone: "info", title: "已撤回", body: "对方将不再看到这条意向" });
        }}
        title="撤回这条意向？"
        desc="撤回后对方不再看到。已使用的本月次数不退回。"
        confirmText="撤回"
        danger
      />
    </div>
  );
}

/** 收到的意向列表：待回应 / 已处理。 */
export function ReceivedIntentList({ intents, showProject = true, emptyAction }: { intents: Intent[]; showProject?: boolean; emptyAction?: React.ReactNode }) {
  const [f, setF] = useState<"pending" | "done">("pending");
  const pending = intents.filter((i) => i.status === "pending");
  const done = intents.filter((i) => i.status !== "pending");
  const list = (f === "pending" ? pending : done).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="flex flex-col gap-4">
      <Segmented
        size="sm"
        value={f}
        onChange={setF}
        items={[
          { value: "pending", label: "待回应", count: pending.length },
          { value: "done", label: "已处理", count: done.length },
        ]}
      />
      {list.length ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {list.map((i) => (
            <ReceivedIntentCard key={i.id} intent={i} showProject={showProject} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white">
          <EmptyState
            compact
            icon={Inbox}
            title={f === "pending" ? "没有待回应的意向" : "还没有处理过的意向"}
            desc={f === "pending" ? "完善“正在寻找”、发布动态，会带来更多意向" : undefined}
            action={emptyAction}
          />
        </div>
      )}
    </div>
  );
}

export function SentIntentList({ intents }: { intents: Intent[] }) {
  const list = [...intents].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return list.length ? (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {list.map((i) => (
        <SentIntentCard key={i.id} intent={i} />
      ))}
    </div>
  ) : (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white">
      <EmptyState compact icon={Send} title="还没有发出过意向" desc="去发现页找一个项目，看清对方怎么合作" action={<Button size="sm" variant="primary" href="/discover">去发现页</Button>} />
    </div>
  );
}
