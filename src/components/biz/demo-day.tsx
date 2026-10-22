"use client";

import { Check, Lock, Send, Shuffle, Vote } from "lucide-react";
import Link from "next/link";

import { FollowButton } from "@/components/biz/follow-button";
import { Button } from "@/components/ui/button";
import { AvatarGroup, Badge, ProjectLogo } from "@/components/ui/display";
import { CONTRIBUTION_TASKS, CURRENT_MONTH, DEMO_VOTES } from "@/data/constants";
import { formatDate, formatDateTime, isSameMonth, nowMs } from "@/data/time";
import type { DB, DemoDay, DemoDayEntry, Person, PitchEvent, Project } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { eventStatus, getPerson, getProject, useDB, useViewer } from "@/store/selectors";

export type DemoPhase = "random" | "voting" | "live" | "closed";

export interface DemoState {
  event?: PitchEvent;
  phase: DemoPhase;
  applyOpen: boolean;
  /** 随机期内不公布票数、名单随机排序。 */
  hideVotes: boolean;
  votingOpen: boolean;
}

export function demoState(db: DB, dd: DemoDay): DemoState {
  const event = db.events.find((e) => e.id === dd.eventId);
  const now = nowMs();
  const evStatus = event ? eventStatus(event) : "upcoming";
  const phase: DemoPhase = dd.status === "ended" || evStatus === "ended" ? "closed" : evStatus === "live" ? "live" : now < new Date(dd.randomUntil).getTime() ? "random" : "voting";
  return {
    event,
    phase,
    applyOpen: dd.status === "open" && now < new Date(dd.applyDeadline).getTime(),
    hideVotes: phase === "random",
    votingOpen: phase !== "closed",
  };
}

export const voteCount = (dd: DemoDay, projectId: string) => dd.votes[projectId]?.length ?? 0;
export const totalVotes = (dd: DemoDay) => Object.values(dd.votes).reduce((s, v) => s + v.length, 0);

export function myVotes(dd: DemoDay, viewerId: string | null | undefined): string[] {
  if (!viewerId) return [];
  return Object.entries(dd.votes)
    .filter(([, v]) => v.includes(viewerId))
    .map(([k]) => k);
}

/** 按“期 + 访问者 + 当天”生成的稳定随机顺序：同一个人当天刷新顺序不变，不同人看到的不同。 */
function seededRandom(key: string) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return (h >>> 0) / 4294967296;
  };
}

export function orderedShortlist(dd: DemoDay, state: DemoState, viewerId: string | null | undefined): DemoDayEntry[] {
  const list = dd.entries.filter((e) => e.status === "shortlisted");
  if (state.hideVotes) {
    const rnd = seededRandom(`${dd.id}:${viewerId ?? "guest"}:${formatDate(new Date(nowMs()).toISOString())}`);
    return list
      .map((e) => ({ e, k: rnd() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.e);
  }
  if (dd.results) return dd.results.map((id) => list.find((e) => e.projectId === id)).filter((e): e is DemoDayEntry => !!e);
  return [...list].sort((a, b) => voteCount(dd, b.projectId) - voteCount(dd, a.projectId));
}

/* ------------------------------------------------------------------ 时间线 */

export function DemoTimeline({ dd, state }: { dd: DemoDay; state: DemoState }) {
  const now = nowMs();
  const ev = state.event;
  const steps = [
    { label: "报名与入围", desc: `随报随审，${formatDate(dd.applyDeadline)} 截止`, end: new Date(dd.applyDeadline).getTime() },
    { label: "随机排序期", desc: `至 ${formatDate(dd.randomUntil)}，不公布票数`, end: new Date(dd.randomUntil).getTime() },
    { label: "按票数排序", desc: ev ? `至 ${formatDate(ev.start)} 路演开始` : "路演开始前", end: ev ? new Date(ev.start).getTime() : Infinity },
    { label: "路演夜", desc: ev ? `${formatDateTime(ev.start)} 线上` : "线上直播", end: ev ? new Date(ev.end).getTime() : Infinity },
    { label: "结果与战报", desc: "前三名获得徽章", end: Infinity },
  ];
  // 报名和投票并行：当前阶段取投票这条线
  const current = state.phase === "random" ? 1 : state.phase === "voting" ? 2 : state.phase === "live" ? 3 : 4;
  return (
    <ol className="grid grid-cols-1 gap-3 sm:grid-cols-5 sm:gap-0">
      {steps.map((s, i) => {
        const done = i === 0 ? now > s.end : i < current;
        const active = i === current || (i === 0 && state.applyOpen);
        return (
          <li key={s.label} className="flex items-start gap-3 sm:flex-col sm:gap-2 sm:pr-4">
            <div className="flex items-center gap-2 sm:w-full">
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  active ? "bg-primary text-highlight" : done ? "bg-success-500 text-white" : "border border-gray-300 bg-white text-gray-500",
                )}
              >
                {done && !active ? <Check size={13} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("hidden h-px flex-1 sm:block", i === steps.length - 1 ? "bg-transparent" : done ? "bg-success-300" : "bg-gray-200")} />
            </div>
            <div className="min-w-0">
              <p className={cn("text-sm font-semibold", active ? "text-gray-900" : "text-gray-600")}>
                {s.label}
                {active ? <span className="ml-1.5 text-xs font-medium text-brand-700">进行中</span> : null}
              </p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ 入围卡片 */

export function ShortlistCard({ dd, state, entry, rank }: { dd: DemoDay; state: DemoState; entry: DemoDayEntry; rank?: number }) {
  const db = useDB();
  const viewer = useViewer();
  const vote = useApp((s) => s.voteDemoDay);
  const openIntent = useApp((s) => s.openIntent);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const p = getProject(db, entry.projectId);
  if (!p) return null;
  const mine = myVotes(dd, viewer?.id);
  const voted = mine.includes(p.id);
  const isMember = !!viewer && p.team.some((m) => m.personId === viewer.id);
  const outOfVotes = !voted && mine.length >= DEMO_VOTES;
  const team = p.team.filter((m) => m.status === "confirmed").map((m) => getPerson(db, m.personId)).filter((x): x is Person => !!x);
  const votes = voteCount(dd, p.id);

  const onVote = () => {
    if (!viewer) return requireLogin("登录后可以为项目投票");
    const firstThisMonth = !voted && !db.contributions.some((c) => c.userId === viewer.id && c.action === "vote" && isSameMonth(c.at, CURRENT_MONTH));
    vote(dd.id, p.id);
    if (voted) toast({ tone: "info", title: `已撤回投给${p.name}的票`, body: `还剩 ${DEMO_VOTES - mine.length + 1} 票` });
    else
      toast({
        tone: "success",
        title: `已投给${p.name}`,
        body: firstThisMonth ? `贡献任务完成，意向次数 +${CONTRIBUTION_TASKS.find((t) => t.action === "vote")?.reward ?? 1}。还剩 ${DEMO_VOTES - mine.length - 1} 票` : `还剩 ${DEMO_VOTES - mine.length - 1} 票`,
      });
  };

  return (
    <article className={cn("rounded-xl border bg-white p-4 shadow-xs sm:p-5", voted ? "border-brand-300" : "border-gray-200")}>
      <div className="flex items-start gap-3 sm:gap-4">
        {rank ? (
          <span className={cn("mt-2 w-6 shrink-0 text-center text-lg font-bold tabular-nums", rank <= 3 ? "text-gray-900" : "text-gray-400")}>{rank}</span>
        ) : (
          <span className="mt-2.5 flex w-6 shrink-0 justify-center text-gray-300" title="随机排序">
            <Shuffle size={16} />
          </span>
        )}
        <Link href={`/p/${p.slug}`} className="shrink-0">
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="lg" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/p/${p.slug}`} className="text-base font-semibold text-gray-900 hover:text-brand-700">
              {p.name}
            </Link>
            <Badge size="xs">{p.track}</Badge>
            {isMember ? <Badge size="xs" tone="brand">你的项目</Badge> : null}
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{p.oneLiner}</p>
          {entry.pitchNote ? (
            <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <span className="text-gray-500">路演想讲：</span>
              {entry.pitchNote}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {team.length ? <AvatarGroup people={team.map((t) => ({ name: t.name, tone: t.avatarTone }))} size="xs" max={3} /> : null}
            <span className="text-xs text-gray-500">{p.region}</span>
          </div>
        </div>
        <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
          {state.hideVotes ? (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <Lock size={12} />
              票数 {formatDate(dd.randomUntil)} 公布
            </span>
          ) : (
            <>
              <span className="text-2xl font-semibold text-gray-900 tabular-nums">{votes}</span>
              <span className="text-xs text-gray-500">票</span>
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3 sm:pl-[88px]">
        {state.votingOpen ? (
          <Button
            size="sm"
            variant={voted ? "secondary" : "primary"}
            iconLeft={voted ? Check : Vote}
            disabled={isMember || outOfVotes}
            title={isMember ? "不能给自己的项目投票" : outOfVotes ? `${DEMO_VOTES} 票已用完，撤回一票后可以改投` : undefined}
            onClick={onVote}
            aria-pressed={voted}
          >
            {isMember ? "不能投自己" : voted ? "已投 · 撤回" : outOfVotes ? "票已用完" : "投一票"}
          </Button>
        ) : null}
        {!isMember ? (
          <>
            <FollowButton quiet targetType="project" targetId={p.id} size="sm" />
            <Button
              size="sm"
              variant="tertiary"
              iconLeft={Send}
              onClick={() =>
                viewer
                  ? openIntent({ type: "project", projectId: p.id, presetKind: viewer.role === "investor" ? "invest" : "partner", prefill: `在 Pitch ${dd.title}看到你们，` })
                  : requireLogin("登录后可以表达意向")
              }
            >
              表达意向
            </Button>
          </>
        ) : (
          <Button size="sm" variant="tertiary" href={`/dashboard/${p.slug}?tab=share`}>
            分享拉票
          </Button>
        )}
        <span className="ml-auto text-sm text-gray-500 sm:hidden">{state.hideVotes ? `票数 ${formatDate(dd.randomUntil)} 公布` : `${votes} 票`}</span>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ 战报 */

export function Podium({ dd, projects }: { dd: DemoDay; projects: Project[] }) {
  const order = [1, 0, 2].filter((i) => projects[i]);
  const heights = ["sm:h-40", "sm:h-28", "sm:h-20"];
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      {order.map((i) => {
        const p = projects[i];
        return (
          <Link key={p.id} href={`/p/${p.slug}`} className={cn("group flex flex-col items-center", i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3", i === 0 ? "order-1" : i === 1 ? "order-2" : "order-3")}>
            <ProjectLogo text={p.logoText} tone={p.logoTone} size={i === 0 ? "xl" : "lg"} />
            <p className="mt-2 text-center font-semibold text-white group-hover:text-highlight">{p.name}</p>
            <p className="text-sm text-gray-400">{voteCount(dd, p.id)} 票</p>
            <div className={cn("mt-3 flex h-12 w-full items-start justify-center rounded-t-xl pt-2 text-xl font-black", heights[i], i === 0 ? "bg-highlight text-gray-900" : "bg-white/10 text-white")}>{i + 1}</div>
          </Link>
        );
      })}
    </div>
  );
}

export function RankBars({ dd }: { dd: DemoDay }) {
  const db = useDB();
  const ids = dd.results ?? dd.entries.filter((e) => e.status === "shortlisted").map((e) => e.projectId);
  const max = Math.max(1, ...ids.map((id) => voteCount(dd, id)));
  return (
    <ol className="flex flex-col gap-3">
      {ids.map((id, i) => {
        const p = getProject(db, id);
        if (!p) return null;
        const v = voteCount(dd, id);
        return (
          <li key={id}>
            <Link href={`/p/${p.slug}`} className="group flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-sm font-semibold text-gray-500 tabular-nums">{i + 1}</span>
              <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</span>
                  <span className="shrink-0 text-sm text-gray-600 tabular-nums">{v} 票</span>
                </span>
                <span className="mt-1 block h-2 overflow-hidden rounded-full bg-gray-100">
                  <span className={cn("block h-full rounded-full", i === 0 ? "bg-highlight" : "bg-brand-500")} style={{ width: `${(v / max) * 100}%` }} />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
