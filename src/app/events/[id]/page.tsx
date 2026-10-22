"use client";

import { ArrowLeft, CalendarX, FileText, Lock, PlayCircle, Radio, Share2, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, type ReactNode } from "react";

import { currentAgendaIndex, EVENT_STATUS, EventCTA, EventMeta, eventPresence, PresencePanel } from "@/components/biz/events";
import { FollowButton } from "@/components/biz/follow-button";
import { roleTone } from "@/components/biz/person-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarGroup, Badge, Card, Cover, EmptyState, ProjectLogo } from "@/components/ui/display";
import type { Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { eventStatus, getPerson, roleText, useDB, useViewer } from "@/store/selectors";

export default function EventDetailPage() {
  return (
    <Suspense>
      <EventDetail />
    </Suspense>
  );
}

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const viewer = useViewer();
  const toast = useApp((s) => s.toast);
  const ev = db.events.find((e) => e.id === id);

  if (!ev) {
    return (
      <Page narrow>
        <EmptyState icon={CalendarX} title="找不到这场活动" desc="可能已经取消，或者链接有误" action={<Button href="/events">看看其他活动</Button>} />
      </Page>
    );
  }

  const st = eventStatus(ev);
  const present = !!viewer && ev.presentIds.includes(viewer.id);
  const { people, projects } = eventPresence(db, ev);
  const speakers = ev.speakerIds.map((x) => getPerson(db, x)).filter((p): p is Person => !!p);
  const attendees = ev.attendeeIds.map((x) => getPerson(db, x)).filter((p): p is Person => !!p);
  const participating = db.projects.filter((p) => ev.projectIds.includes(p.id));
  const agendaNow = currentAgendaIndex(ev);
  const article = ev.recap?.articleId ? db.articles.find((a) => a.id === ev.recap!.articleId) : undefined;
  const dd = ev.demoDayId ? db.demoDays.find((d) => d.id === ev.demoDayId) : undefined;

  return (
    <Page>
      <Link href="/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
        <ArrowLeft size={16} />
        全部活动
      </Link>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
        <Cover tone={ev.coverTone} className="h-32 sm:h-44">
          <span className="absolute top-4 left-4 flex gap-2">
            {st === "live" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-error-600 px-2.5 py-1 text-xs font-semibold text-white">
                <Radio size={12} className="animate-pulse" />
                {ev.kind === "online" ? "正在直播" : "正在进行"}
              </span>
            ) : (
              <span className="rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">{EVENT_STATUS[st].label}</span>
            )}
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800">{ev.kind === "online" ? "线上" : `线下 · ${ev.city}`}</span>
          </span>
        </Cover>
        <div className="flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500">{ev.host}</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900 sm:text-[30px] sm:leading-tight">{ev.title}</h1>
            <div className="mt-4">
              <EventMeta event={ev} />
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 lg:items-end">
            <div className="flex gap-2">
              <EventCTA event={ev} size="lg" />
              <Button
                size="lg"
                iconOnly={Share2}
                aria-label="分享活动"
                onClick={() => {
                  void navigator.clipboard?.writeText(`https://pitch.cn/events/${ev.id}`).catch(() => {});
                  toast({ tone: "success", title: "活动链接已复制" });
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <AvatarGroup people={(st === "live" ? people : attendees).map((p) => ({ name: p.name, tone: p.avatarTone }))} size="sm" max={6} />
              <span className="text-sm text-gray-500">{st === "live" ? `${ev.presentIds.length} 人在场` : `${ev.attendeeIds.length} 人${st === "ended" ? "参加" : "报名"}`}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {st === "live" ? (
            <Card id="presence" className={cn("scroll-mt-24", present && "border-error-200")}>
              <SectionTitle
                title={ev.kind === "online" ? "现在在直播间" : "现在在现场"}
                desc={present ? "名单实时更新。看到感兴趣的，直接打招呼或表达意向，对方接受后就能在站内聊。" : undefined}
                live
              />
              {present ? (
                <PresencePanel event={ev} mode="live" />
              ) : (
                <div className="relative overflow-hidden rounded-xl border border-dashed border-gray-300 p-6">
                  <div className="pointer-events-none flex flex-wrap gap-3 opacity-40 blur-[3px]" aria-hidden>
                    {people.slice(0, 8).map((p) => (
                      <span key={p.id} className="flex items-center gap-2">
                        <Avatar name={p.name} tone={p.avatarTone} size="sm" />
                        <span className="text-sm">{p.name}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col items-center gap-3 text-center">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                      <Lock size={14} />
                      {ev.kind === "online" ? "进入直播后" : "签到后"}可以看到现在在场的 {people.length} 人和 {projects.length} 个项目
                    </p>
                    <EventCTA event={ev} />
                  </div>
                </div>
              )}
            </Card>
          ) : null}

          {st === "ended" && present ? (
            <Card id="follow-up" className="scroll-mt-24 border-brand-200">
              <SectionTitle title="活动后跟进" desc="你在这场活动里遇到的人和项目。48 小时内跟进，回复率最高。" />
              <PresencePanel event={ev} mode="followup" />
            </Card>
          ) : null}

          {st === "ended" && ev.recap ? (
            <Card id="recap" className="scroll-mt-24">
              <SectionTitle title="活动回顾" />
              <p className="text-[15px] leading-7 text-gray-700">{ev.recap.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {ev.recap.replayMins ? (
                  <Button iconLeft={PlayCircle} onClick={() => toast({ tone: "info", title: "原型里不播放回放", body: `完整回放 ${ev.recap!.replayMins} 分钟` })}>
                    看回放 · {ev.recap.replayMins} 分钟
                  </Button>
                ) : null}
                {article ? (
                  <Button iconLeft={FileText} href={`/feed?tab=articles&article=${article.id}`}>
                    {article.title}
                  </Button>
                ) : null}
                {dd ? (
                  <Button iconLeft={Trophy} href={`/demo-day/${dd.id}`}>
                    路演战报
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}

          <Card>
            <SectionTitle title="关于活动" />
            <p className="text-[15px] leading-7 text-gray-700">{ev.desc}</p>
            {ev.agenda.length ? (
              <ol className="mt-5 flex flex-col">
                {ev.agenda.map((a, i) => (
                  <li key={a.time} className="relative flex gap-4 pb-4 last:pb-0">
                    {i < ev.agenda.length - 1 ? <span className="absolute top-5 left-[5px] h-full w-px bg-gray-200" /> : null}
                    <span className={cn("relative mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2", i === agendaNow ? "border-error-600 bg-error-600 ring-4 ring-error-100" : i < agendaNow ? "border-gray-300 bg-gray-300" : "border-gray-300 bg-white")} />
                    <span className="w-12 shrink-0 text-sm font-semibold text-gray-900 tabular-nums">{a.time}</span>
                    <span className={cn("text-sm", i === agendaNow ? "font-semibold text-gray-900" : i < agendaNow ? "text-gray-400" : "text-gray-700")}>
                      {a.title}
                      {i === agendaNow ? <Badge size="xs" tone="error" className="ml-2">进行中</Badge> : null}
                    </span>
                  </li>
                ))}
              </ol>
            ) : null}
          </Card>

          {participating.length ? (
            <Card>
              <SectionTitle title={ev.demoDayId ? "路演项目" : "参与的项目"} desc={st === "upcoming" ? "活动当天可以在现场或直播间直接表达意向" : undefined} />
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {participating.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                    <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <ProjectLogo text={p.logoText} tone={p.logoTone} size="md" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                        <span className="block truncate text-xs text-gray-500">{p.oneLiner}</span>
                      </span>
                    </Link>
                    <FollowButton quiet targetType="project" targetId={p.id} size="xs" />
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {speakers.length ? (
            <Card>
              <SectionTitle title={ev.demoDayId ? "评审嘉宾" : "嘉宾"} />
              <ul className="flex flex-col gap-3">
                {speakers.map((p) => (
                  <li key={p.id}>
                    <Link href={`/u/${p.handle}`} className="flex items-center gap-3">
                      <Avatar name={p.name} tone={p.avatarTone} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-gray-900">{p.name}</span>
                          <Badge size="xs" tone={roleTone(p)}>
                            {roleText(p)}
                          </Badge>
                        </span>
                        <span className="block truncate text-xs text-gray-500">{[p.title, p.org].filter(Boolean).join(" · ")}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {dd && st !== "ended" ? (
            <Card className="border-highlight-ink/20 bg-highlight-soft/40">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Trophy size={16} />
                {dd.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">投票、报名和入围名单在路演页。</p>
              <Button size="sm" variant="primary" href="/demo-day" className="mt-3">
                去路演页
              </Button>
            </Card>
          ) : null}

          <Card>
            <SectionTitle title={st === "ended" ? "参加的人" : "报名的人"} />
            <ul className="flex flex-col gap-2.5">
              {attendees.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <Link href={`/u/${p.handle}`} className="flex items-center gap-2.5">
                    <Avatar name={p.name} tone={p.avatarTone} size="sm" online={st === "live" && ev.presentIds.includes(p.id)} />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-700">
                      <span className="font-medium text-gray-900">{p.name}</span> · {roleText(p)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {attendees.length > 8 ? <p className="mt-3 text-xs text-gray-500">还有 {attendees.length - 8} 人</p> : null}
            {!attendees.length ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Users size={16} />
                还没有人报名
              </p>
            ) : null}
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function SectionTitle({ title, desc, live, action }: { title: string; desc?: string; live?: boolean; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          {live ? <span className="h-2 w-2 animate-pulse rounded-full bg-error-500" /> : null}
          {title}
        </h2>
        {desc ? <p className="text-sm text-gray-500">{desc}</p> : null}
      </div>
      {action}
    </div>
  );
}
