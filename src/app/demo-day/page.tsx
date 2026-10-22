"use client";

import { ArrowRight, BellRing, CalendarDays, Check, Clock, PlayCircle, Shuffle, Trophy, Users, Vote } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { demoState, DemoTimeline, myVotes, orderedShortlist, ShortlistCard, totalVotes, voteCount } from "@/components/biz/demo-day";
import { EXPOSURE_MIN_COMPLETION } from "@/components/biz/workspace";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, Cover, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { DEMO_VOTES } from "@/data/constants";
import { formatDate, formatDateTime } from "@/data/time";
import type { DemoDay, Project } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { currentDemoDay, getPerson, getProject, manageableProjects, projectCompletion, useDB, useViewer } from "@/store/selectors";

type Tab = "current" | "past";

export default function DemoDayPage() {
  return (
    <Suspense>
      <DemoDayView />
    </Suspense>
  );
}

function DemoDayView() {
  const db = useDB();
  const [tab, setTab] = useQueryParam<Tab>("tab", "current");
  const dd = currentDemoDay(db);
  const past = db.demoDays.filter((d) => d.status === "ended").sort((a, b) => b.month.localeCompare(a.month));

  return (
    <Page>
      {dd ? <Hero dd={dd} /> : null}
      <Tabs
        className={dd ? "mt-8" : undefined}
        value={tab}
        onChange={setTab}
        items={[
          { value: "current", label: "本期" },
          { value: "past", label: "往期", count: past.length },
        ]}
      />
      <div className="mt-6">{tab === "past" ? <Past list={past} /> : dd ? <Current dd={dd} /> : <EmptyState icon={Trophy} title="本月路演还没开放" desc="下一期开放报名时会通知你，先看看往期吧。" action={<Button onClick={() => setTab("past")}>看往期</Button>} />}</div>
    </Page>
  );
}

function Hero({ dd }: { dd: DemoDay }) {
  const db = useDB();
  const viewer = useViewer();
  const rsvp = useApp((s) => s.rsvpEvent);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const st = demoState(db, dd);
  const ev = st.event;
  const shortlisted = dd.entries.filter((e) => e.status === "shortlisted").length;
  const applied = dd.entries.filter((e) => e.status === "applied").length;
  const going = !!viewer && !!ev?.attendeeIds.includes(viewer.id);

  return (
    <section className="overflow-hidden rounded-2xl bg-primary text-white">
      <div className="grid grid-cols-1 gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <Badge tone="highlight" size="sm">
            <Trophy size={12} className="mr-1" />
            Pitch 月度路演 · {dd.month.replace("-", " 年 ")} 月
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{dd.title}</h1>
          <p className="mt-2 text-lg text-gray-300">{dd.theme}</p>
          {ev ? (
            <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={16} />
                {formatDateTime(ev.start)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <PlayCircle size={16} />
                线上直播 · 每个项目 6 分钟展示 + 4 分钟问答
              </span>
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {ev ? (
              <Button
                variant={going ? "secondary" : "primary"}
                className={going ? undefined : "bg-highlight text-gray-900 hover:bg-highlight/90"}
                iconLeft={going ? Check : BellRing}
                onClick={() => {
                  if (!viewer) return requireLogin("登录后可以预约直播提醒");
                  rsvp(ev.id);
                  toast({ tone: going ? "info" : "success", title: going ? "已取消预约" : "已预约直播提醒", body: going ? undefined : `开始前 30 分钟通过服务号提醒你` });
                }}
              >
                {going ? "已预约 · 取消" : "预约直播提醒"}
              </Button>
            ) : null}
            {ev ? (
              <Button variant="secondary" href={`/events/${ev.id}`} iconRight={ArrowRight}>
                活动详情
              </Button>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 self-start">
          {[
            { label: "已入围", value: shortlisted, hint: "随报随审" },
            { label: "待评审", value: applied, hint: `${formatDate(dd.applyDeadline)} 报名截止` },
            { label: "总票数", value: st.hideVotes ? "—" : totalVotes(dd), hint: st.hideVotes ? `${formatDate(dd.randomUntil)} 公布` : "实时" },
            { label: "预约观看", value: ev?.attendeeIds.length ?? 0, hint: "人" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="text-xs text-gray-400">{s.hint}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10 bg-white px-6 py-5 text-gray-900 sm:px-8">
        <DemoTimeline dd={dd} state={st} />
      </div>
    </section>
  );
}

function Current({ dd }: { dd: DemoDay }) {
  const db = useDB();
  const viewer = useViewer();
  const st = demoState(db, dd);
  const list = orderedShortlist(dd, st, viewer?.id);
  const applied = dd.entries.filter((e) => e.status === "applied").length;
  const ev = st.event;
  const judges = (ev?.speakerIds ?? []).map((id) => getPerson(db, id)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {st.hideVotes ? (
          <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4">
            <Shuffle size={18} className="mt-0.5 shrink-0 text-brand-600" />
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-brand-800">随机排序期：{formatDateTime(dd.randomUntil)} 前</p>
              <p className="text-brand-700">名单对每个人随机排序，也不公布票数，避免先入围的项目占便宜、大家跟着票数投。之后按票数排序。</p>
            </div>
          </div>
        ) : null}
        {list.length ? (
          list.map((e, i) => <ShortlistCard key={e.projectId} dd={dd} state={st} entry={e} rank={st.hideVotes ? undefined : i + 1} />)
        ) : (
          <Card>
            <EmptyState icon={Trophy} title="入围名单还没公布" desc="运营随报随审，第一批入围项目会很快出现在这里。" />
          </Card>
        )}
        {applied ? (
          <p className="flex items-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
            <Clock size={16} className="shrink-0" />
            另有 {applied} 个项目已报名、等待评审。报名信息只有项目方和运营能看到。
          </p>
        ) : null}
      </div>

      <aside className="flex min-w-0 flex-col gap-6">
        <MyVotes dd={dd} />
        <ApplyCard dd={dd} />
        {judges.length ? (
          <Card>
            <h2 className="text-base font-semibold text-gray-900">评审嘉宾</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {judges.map((p) => (
                <li key={p.id}>
                  <Link href={`/u/${p.handle}`} className="group flex items-center gap-3">
                    <Avatar name={p.name} tone={p.avatarTone} size="md" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {p.title} · {p.org}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

function MyVotes({ dd }: { dd: DemoDay }) {
  const db = useDB();
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  const st = demoState(db, dd);
  const mine = myVotes(dd, viewer?.id);
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900">我的票</h2>
        {viewer ? (
          <span className="text-sm text-gray-500">
            还剩 <span className="font-semibold text-gray-900 tabular-nums">{DEMO_VOTES - mine.length}</span> / {DEMO_VOTES}
          </span>
        ) : null}
      </div>
      {!viewer ? (
        <>
          <p className="mt-1 text-sm text-gray-500">每人每期 {DEMO_VOTES} 票，登录后就能投。</p>
          <Button size="sm" variant="primary" className="mt-3" onClick={() => requireLogin("登录后可以为项目投票")}>
            登录投票
          </Button>
        </>
      ) : (
        <>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {Array.from({ length: DEMO_VOTES }, (_, i) => (
              <span key={i} className={cn("h-2 flex-1 rounded-full", i < mine.length ? "bg-brand-600" : "bg-gray-200")} />
            ))}
          </div>
          {mine.length ? (
            <ul className="mt-3 flex flex-col gap-2">
              {mine.map((id) => {
                const p = getProject(db, id);
                return p ? (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" />
                    <span className="min-w-0 flex-1 truncate text-gray-800">{p.name}</span>
                    {!st.hideVotes ? <span className="text-xs text-gray-500 tabular-nums">{voteCount(dd, id)} 票</span> : null}
                  </li>
                ) : null;
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-gray-500">还没投票。本月第一次投票可以完成贡献任务，意向次数 +1。</p>
          )}
          <p className="mt-3 text-xs text-gray-400">路演结束前可以撤回改投，不能投自己参与的项目。</p>
        </>
      )}
    </Card>
  );
}

/** 报名入口：只对能管理项目的人显示自己项目的状态；其他人看到报名条件。 */
function ApplyCard({ dd }: { dd: DemoDay }) {
  const db = useDB();
  const viewer = useViewer();
  const st = demoState(db, dd);
  const projects: Project[] = viewer ? manageableProjects(db, viewer.id) : [];
  return (
    <Card>
      <h2 className="text-base font-semibold text-gray-900">报名</h2>
      {projects.length ? (
        <ul className="mt-3 flex flex-col gap-3">
          {projects.map((p) => {
            const entry = dd.entries.find((e) => e.projectId === p.id);
            const c = projectCompletion(p);
            const status = entry
              ? entry.status === "shortlisted"
                ? { label: "已入围", tone: "success" as const }
                : entry.status === "applied"
                  ? { label: "待评审", tone: "warning" as const }
                  : { label: "本期未入围", tone: "gray" as const }
              : !st.applyOpen
                ? { label: "报名已截止", tone: "gray" as const }
                : c.percent >= EXPOSURE_MIN_COMPLETION
                  ? { label: "可以报名", tone: "brand" as const }
                  : { label: `完成度 ${c.percent}%`, tone: "gray" as const };
            return (
              <li key={p.id} className="flex items-center gap-3">
                <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                  <Badge size="xs" tone={status.tone}>
                    {status.label}
                  </Badge>
                </span>
                <Button size="sm" variant={entry ? "secondary" : "primary"} href={entry?.status === "shortlisted" ? `/dashboard/${p.slug}?tab=share` : `/dashboard/${p.slug}?tab=exposure`}>
                  {entry?.status === "shortlisted" ? "拉票" : entry ? "查看" : c.percent >= EXPOSURE_MIN_COMPLETION ? "报名" : "去完善"}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <ul className={cn("flex flex-col gap-2 text-sm text-gray-600", projects.length ? "mt-4 border-t border-gray-100 pt-4" : "mt-3")}>
        <li className="flex gap-2">
          <Check size={16} className="mt-0.5 shrink-0 text-success-600" />
          项目资料完成度达到 {EXPOSURE_MIN_COMPLETION}%，可见范围为公开
        </li>
        <li className="flex gap-2">
          <Check size={16} className="mt-0.5 shrink-0 text-success-600" />
          每个项目每期报名一次，{formatDateTime(dd.applyDeadline)} 截止
        </li>
        <li className="flex gap-2">
          <Users size={16} className="mt-0.5 shrink-0 text-gray-400" />
          运营随报随审，按进展、完成度和赛道多样性选出 6 个左右
        </li>
        <li className="flex gap-2">
          <Vote size={16} className="mt-0.5 shrink-0 text-gray-400" />
          路演夜结束时票数最高的前三名获得“月度路演前三”徽章
        </li>
      </ul>
      {!viewer ? (
        <p className="mt-4 text-xs text-gray-500">创建项目后，从项目工作台的“曝光”里报名。</p>
      ) : !projects.length && (viewer.role === "founder" || !viewer.role) ? (
        <Button size="sm" variant="secondary" className="mt-4" onClick={() => useApp.getState().openCreate()}>
          创建项目
        </Button>
      ) : null}
    </Card>
  );
}

function Past({ list }: { list: DemoDay[] }) {
  const db = useDB();
  if (!list.length) return <EmptyState icon={Trophy} title="还没有往期路演" />;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {list.map((dd) => {
        const ev = db.events.find((e) => e.id === dd.eventId);
        const top = (dd.results ?? []).slice(0, 3).map((id) => getProject(db, id)).filter((p): p is Project => !!p);
        return (
          <Card key={dd.id} padded={false} className="overflow-hidden">
            <Cover tone={ev?.coverTone ?? 0} className="h-24" label={dd.theme} />
            <div className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{dd.title}</h3>
                {ev ? <span className="text-sm text-gray-500">{formatDate(ev.start)}</span> : null}
              </div>
              {dd.recap ? (
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "在线观看", v: dd.recap.viewers.toLocaleString() },
                    { l: "意向", v: dd.recap.intents },
                    { l: "撮合", v: dd.recap.matches },
                  ].map((s) => (
                    <div key={s.l} className="rounded-lg bg-gray-50 py-2.5">
                      <p className="text-lg font-semibold text-gray-900 tabular-nums">{s.v}</p>
                      <p className="text-xs text-gray-500">{s.l}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              <ol className="mt-4 flex flex-col gap-2">
                {top.map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2.5 text-sm">
                    <span className={cn("flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold", i === 0 ? "bg-highlight text-gray-900" : "bg-gray-100 text-gray-600")}>{i + 1}</span>
                    <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" />
                    <Link href={`/p/${p.slug}`} className="min-w-0 flex-1 truncate font-medium text-gray-800 hover:text-brand-700">
                      {p.name}
                    </Link>
                    <span className="text-xs text-gray-500 tabular-nums">{voteCount(dd, p.id)} 票</span>
                  </li>
                ))}
              </ol>
              <div className="mt-5 flex flex-wrap gap-2">
                <Button size="sm" variant="primary" href={`/demo-day/${dd.id}`}>
                  看战报
                </Button>
                {ev?.recap ? (
                  <Button size="sm" variant="secondary" iconLeft={PlayCircle} href={`/events/${ev.id}#recap`}>
                    回放
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
