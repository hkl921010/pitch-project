"use client";

import { Award, Check, Gift, type LucideIcon, Megaphone, PenLine, RefreshCw, Send, Vote } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { demoState } from "@/components/biz/demo-day";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, FeaturedIcon, PageHeader, ProgressBar } from "@/components/ui/display";
import { BADGES, CONTRIBUTION_TASKS, CURRENT_MONTH, MONTHLY_FREE_INTENTS, TOP_CONTRIBUTOR_TASKS } from "@/data/constants";
import { formatDate, isSameMonth, monthOf } from "@/data/time";
import type { Contribution, ContributionAction, DB, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { bestContributionMonth, currentDemoDay, followerCount, manageableProjects, personBadges, useDB, useQuota, useViewer } from "@/store/selectors";

const TASK_ICON: Record<ContributionAction, LucideIcon> = {
  vote: Vote,
  update: Megaphone,
  status_refresh: RefreshCw,
};

export default function RewardsPage() {
  return (
    <Suspense>
      <RewardsView />
    </Suspense>
  );
}

function RewardsView() {
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  if (!viewer) {
    return (
      <Page narrow>
        <PageHeader title="任务中心" desc="为路演投票、发布动态、刷新开放状态，每类每月第一次完成，意向次数 +1。" />
        <Card padded={false} className="mt-6">
          <EmptyState
            icon={Gift}
            title="登录后查看你的任务和额度"
            desc={`每月可以免费发 ${MONTHLY_FREE_INTENTS} 次意向，完成贡献任务还能多发几次。`}
            action={
              <Button variant="primary" onClick={() => requireLogin("登录后查看任务和意向次数")}>
                登录
              </Button>
            }
          />
        </Card>
      </Page>
    );
  }
  return <RewardsBody viewer={viewer} />;
}

function monthLabel(m: string) {
  const [y, mm] = m.split("-");
  return `${y} 年 ${Number(mm)} 月`;
}

function RewardsBody({ viewer }: { viewer: Person }) {
  const db = useDB();
  useHashScroll();
  const quota = useQuota()!;
  const mine = db.contributions.filter((c) => c.userId === viewer.id);
  const doneThisMonth = new Map<ContributionAction, Contribution>();
  [...mine].reverse().forEach((c) => {
    if (isSameMonth(c.at, CURRENT_MONTH) && !doneThisMonth.has(c.action)) doneThisMonth.set(c.action, c);
  });
  const tasks = taskList(db, viewer);
  const applicable = tasks.filter((t) => !t.na).length;
  const nextMonth = Number(CURRENT_MONTH.split("-")[1]) % 12 + 1;

  return (
    <Page>
      <PageHeader title="任务中心" desc="为路演投票、发布动态、刷新开放状态，每类每月第一次完成，本月意向次数 +1。" />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Send size={16} className="text-brand-600" />
                本月意向次数
              </p>
              {quota.unlimited ? (
                <>
                  <p className="mt-2 text-3xl font-semibold text-gray-900">不限次数</p>
                  <p className="mt-1 text-sm text-gray-500">你是 Pitch 会员。完成任务仍然计入徽章。</p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
                    还可发 {quota.remaining}
                    <span className="ml-1 text-base font-normal text-gray-500">/ {quota.limit} 次</span>
                  </p>
                  <ProgressBar value={(quota.used / quota.limit) * 100} tone={quota.remaining ? "brand" : "dark"} className="mt-3" />
                  <p className="mt-2 text-sm text-gray-500">
                    基础 {MONTHLY_FREE_INTENTS} 次 + 贡献奖励 {quota.bonus} 次，已用 {quota.used} 次。{nextMonth} 月 1 日重置，没用完的不累计。
                  </p>
                </>
              )}
            </div>
            <div className="min-w-0 border-t border-gray-100 pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
              <p className="flex items-center gap-2 text-sm font-medium text-gray-500">
                <Gift size={16} className="text-highlight-ink" />
                本月贡献任务
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 tabular-nums">
                {doneThisMonth.size}
                <span className="ml-1 text-base font-normal text-gray-500">/ {applicable} 项</span>
              </p>
              <ProgressBar value={(doneThisMonth.size / applicable) * 100} tone="highlight" className="mt-3" />
              <p className="mt-2 text-sm text-gray-500">
                {doneThisMonth.size >= TOP_CONTRIBUTOR_TASKS
                  ? "本月已达成“社区贡献者”。"
                  : `再完成 ${TOP_CONTRIBUTOR_TASKS - doneThisMonth.size} 项，获得“社区贡献者”徽章。`}
              </p>
            </div>
          </Card>

          <Card padded={false}>
            <div className="px-5 pt-5 sm:px-6">
              <h2 className="text-base font-semibold text-gray-900">本月任务</h2>
              <p className="text-sm text-gray-500">每类每月只计一次，做多次不会重复加。</p>
            </div>
            <ul className="mt-3 divide-y divide-gray-100">
              {tasks.map((t) => {
                const done = doneThisMonth.get(t.action);
                const Icon = TASK_ICON[t.action];
                return (
                  <li key={t.action} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:px-6">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", done ? "bg-success-50 text-success-600" : t.na ? "bg-gray-50 text-gray-400" : "bg-brand-50 text-brand-600")}>
                        {done ? <Check size={20} /> : <Icon size={20} />}
                      </span>
                      <div className="min-w-0">
                        <p className={cn("text-sm font-semibold", t.na ? "text-gray-400" : "text-gray-900")}>
                          {t.label}
                          {!quota.unlimited && !t.na ? <span className="ml-2 text-xs font-medium text-brand-700">意向 +1</span> : null}
                        </p>
                        <p className="mt-0.5 text-sm text-gray-500">{done ? `${formatDate(done.at)} · ${done.label}` : t.na ?? t.desc}</p>
                        {!done && t.hint ? <p className="mt-1 text-xs text-gray-500">{t.hint}</p> : null}
                      </div>
                    </div>
                    <div className="shrink-0 pl-13 sm:pl-0">
                      {done ? (
                        <Badge tone="success" size="sm">
                          已完成
                        </Badge>
                      ) : t.cta ? (
                        <Button size="sm" variant={t.na ? "secondary" : "primary"} href={t.cta.href} onClick={t.cta.onClick}>
                          {t.cta.label}
                        </Button>
                      ) : (
                        <Badge tone="gray" size="sm">
                          {t.na ? "暂不适用" : "暂未开放"}
                        </Badge>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <BadgesCard db={db} viewer={viewer} />
          <HistoryCard contributions={mine} />
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <p className="text-sm font-semibold text-gray-900">意向次数怎么算</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
              <li>· 浏览、关注、回复意向都免费，不消耗次数。</li>
              <li>· 非会员每月 {MONTHLY_FREE_INTENTS} 次；5 类贡献任务每类每月第一次完成 +1，最多 +5。</li>
              <li>· 撤回意向不返还次数；撤回投票、删除动态也不扣回奖励。</li>
              <li>· 每月 1 日重置，没用完的不累计到下月。</li>
              <li>· 会员不限次数。</li>
            </ul>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-gray-900">怎样才算一次贡献</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
              {CONTRIBUTION_TASKS.map((t) => (
                <li key={t.action}>
                  · <span className="text-gray-800">{t.label}</span>：{t.desc}。
                </li>
              ))}
            </ul>
          </Card>
          <Card className="bg-gray-25">
            <div className="flex items-start gap-3">
              <FeaturedIcon icon={Award} tone="gray" size="sm" />
              <p className="min-w-0 text-sm text-gray-600">徽章都由真实行为自动获得，不能购买。个人徽章显示在主页，项目徽章显示在项目页和发现页卡片上。</p>
            </div>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

interface TaskRow {
  action: ContributionAction;
  label: string;
  desc: string;
  /** 不适用的原因，比如没有项目时不能发动态。 */
  na?: string;
  hint?: string;
  cta?: { label: string; href?: string; onClick?: () => void };
}

function taskList(db: DB, viewer: Person): TaskRow[] {
  const myProjects = manageableProjects(db, viewer.id);
  const dd = currentDemoDay(db);
  const voting = dd ? demoState(db, dd).votingOpen : false;

  return CONTRIBUTION_TASKS.map((t): TaskRow => {
    const base = { action: t.action, label: t.label, desc: t.desc };
    switch (t.action) {
      case "vote":
        return voting && dd ? { ...base, hint: `${dd.title}正在投票。`, cta: { label: "去投票", href: "/demo-day" } } : { ...base, hint: "本月路演投票还没开放，开放时会通知你。" };
      case "update":
        if (!myProjects.length) {
          return viewer.role === "founder" || !viewer.role ? { ...base, na: "创建项目后才能完成", cta: { label: "创建项目", onClick: () => useApp.getState().openCreate() } } : { ...base, na: "需要有自己管理的项目" };
        }
        return { ...base, cta: { label: "去发动态", href: `/dashboard/${myProjects[0].slug}?tab=updates` } };
      case "status_refresh":
        return viewer.role ? { ...base, cta: { label: "去刷新", href: `/u/${viewer.handle}?edit=status` } } : { ...base, cta: { label: "先选身份", href: "/welcome" } };
    }
  });
}

function BadgesCard({ db, viewer }: { db: DB; viewer: Person }) {
  const has = new Set(personBadges(db, viewer));
  const best = bestContributionMonth(db, viewer.id);
  const followers = followerCount(db, "person", viewer.id);
  const personal = [
    { id: "top_contributor", progress: has.has("top_contributor") ? `${monthLabel(best.month!)}完成 ${best.count} 项` : `本月 ${new Set(db.contributions.filter((c) => c.userId === viewer.id && isSameMonth(c.at, CURRENT_MONTH)).map((c) => c.action)).size}/${TOP_CONTRIBUTOR_TASKS} 项` },
    { id: "followers_100", progress: `${Math.min(followers, 100)}/100 位关注` },
    { id: "early_member", progress: has.has("early_member") ? "2026 年前加入" : "仅限 2026 年前加入的成员" },
  ];
  const projects = manageableProjects(db, viewer.id);

  return (
    <Card id="badges" className="scroll-mt-24">
      <h2 className="text-base font-semibold text-gray-900">我的徽章</h2>
      <p className="text-sm text-gray-500">由真实行为自动获得，显示在你的主页上。</p>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {personal.map(({ id, progress }) => {
          const b = BADGES[id];
          const on = has.has(id);
          return (
            <li key={id} className={cn("flex items-start gap-3 rounded-xl border p-4", on ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-25")}>
              <Badge tone={on ? b.tone : "gray"}>{b.label}</Badge>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-gray-500">{b.desc}</span>
                <span className={cn("mt-1 block text-xs font-medium", on ? "text-success-700" : "text-gray-600")}>{on ? `已获得 · ${progress}` : progress}</span>
              </span>
            </li>
          );
        })}
      </ul>

      {projects.map((p) => (
        <div key={p.id} className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-gray-900">{p.name}的项目徽章</p>
            <Link href={`/dashboard/${p.slug}?tab=exposure`} className="shrink-0 text-sm font-semibold text-brand-700 hover:text-brand-800">
              去争取
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["pitch_featured", "demoday_shortlist", "demoday_top3", "fast_responder"].map((id) => {
              const b = BADGES[id];
              const on = p.badges.includes(id);
              return (
                <Badge key={id} tone={on ? b.tone : "gray"} className={on ? undefined : "opacity-60"}>
                  {on ? <Check size={12} className="mr-1" /> : null}
                  {b.label}
                </Badge>
              );
            })}
          </div>
        </div>
      ))}

      <Link href={`/u/${viewer.handle}`} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <PenLine size={14} />
        在主页上查看
      </Link>
    </Card>
  );
}

function HistoryCard({ contributions }: { contributions: Contribution[] }) {
  const sorted = [...contributions].sort((a, b) => b.at.localeCompare(a.at));
  const credited = new Set<string>();
  [...sorted].reverse().forEach((c) => {
    const key = `${monthOf(c.at)}-${c.action}`;
    if (!credited.has(key)) {
      credited.add(key);
      credited.add(c.id);
    }
  });
  const months = [...new Set(sorted.map((c) => monthOf(c.at)))];

  return (
    <Card>
      <h2 className="text-base font-semibold text-gray-900">贡献记录</h2>
      {sorted.length ? (
        <div className="mt-4 flex flex-col gap-5">
          {months.map((m) => {
            const items = sorted.filter((c) => monthOf(c.at) === m);
            const kinds = new Set(items.map((c) => c.action)).size;
            return (
              <div key={m}>
                <p className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
                  <span>{monthLabel(m)}</span>
                  <span>
                    {kinds} 项任务{kinds >= TOP_CONTRIBUTOR_TASKS ? " · 社区贡献者" : ""}
                  </span>
                </p>
                <ul className="flex flex-col divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {items.map((c) => {
                    const Icon = TASK_ICON[c.action];
                    return (
                      <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                        <Icon size={16} className="shrink-0 text-gray-400" />
                        <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{c.label}</span>
                        <span className="shrink-0 text-xs text-gray-400">{formatDate(c.at)}</span>
                        {credited.has(c.id) ? (
                          <span className="w-12 shrink-0 text-right text-xs font-semibold text-brand-700">+1</span>
                        ) : (
                          <span className="w-12 shrink-0 text-right text-xs text-gray-400">已计过</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-500">还没有贡献记录。从上面任意一项开始吧。</p>
      )}
    </Card>
  );
}
