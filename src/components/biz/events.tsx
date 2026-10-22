"use client";

import { Bell, CalendarDays, Check, CheckCircle2, Hand, LogIn, MapPin, Radio, ScanLine, Send, Users, Video } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { roleTone } from "@/components/biz/person-card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarGroup, Badge, Cover, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Segmented } from "@/components/ui/tabs";
import { formatDate, formatDateTime, formatTime, nowMs } from "@/data/time";
import type { DB, Person, PitchEvent, Project, Role } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { eventStatus, getPerson, isFollowing, roleText, useDB, useViewer } from "@/store/selectors";

export const EVENT_STATUS = {
  live: { label: "进行中", tone: "error" as const },
  upcoming: { label: "报名中", tone: "success" as const },
  ended: { label: "已结束", tone: "gray" as const },
};

/** 在场的人（签到或进入直播）以及他们所在的项目；活动本身的参与项目也算在场。 */
export function eventPresence(db: DB, ev: PitchEvent): { people: Person[]; projects: Project[] } {
  const people = ev.presentIds.map((id) => getPerson(db, id)).filter((p): p is Person => !!p);
  const present = new Set(ev.presentIds);
  const projects = db.projects.filter(
    (p) => p.visibility === "public" && (ev.projectIds.includes(p.id) || p.team.some((m) => m.status === "confirmed" && present.has(m.personId))),
  );
  return { people, projects };
}

export function eventPlace(ev: PitchEvent) {
  return ev.kind === "online" ? "线上直播" : [ev.city, ev.venue].filter(Boolean).join(" · ");
}

export function isFull(ev: PitchEvent) {
  return !!ev.capacity && ev.attendeeIds.length >= ev.capacity;
}

/** 当前进行到的议程（按原型固定时间）。 */
export function currentAgendaIndex(ev: PitchEvent): number {
  if (eventStatus(ev) !== "live") return -1;
  const now = formatTime(new Date(nowMs()).toISOString());
  let idx = -1;
  ev.agenda.forEach((a, i) => {
    if (a.time <= now) idx = i;
  });
  return idx;
}

export function EventCard({ event: ev, className }: { event: PitchEvent; className?: string }) {
  const db = useDB();
  const viewer = useViewer();
  const st = eventStatus(ev);
  const going = !!viewer && ev.attendeeIds.includes(viewer.id);
  const attendees = ev.attendeeIds.map((id) => getPerson(db, id)).filter((p): p is Person => !!p);
  return (
    <Link
      href={`/events/${ev.id}`}
      className={cn("group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs transition-all hover:border-gray-300 hover:shadow-md", className)}
    >
      <Cover tone={ev.coverTone} className="h-28">
        <span className="absolute top-3 left-3 flex w-12 flex-col items-center rounded-lg bg-white/95 py-1 text-gray-900 shadow-sm">
          <span className="text-[11px] font-medium text-gray-500">{formatDate(ev.start).split("/")[0]} 月</span>
          <span className="text-lg leading-tight font-bold">{formatDate(ev.start).split("/")[1]}</span>
        </span>
        <span className="absolute top-3 right-3 flex gap-1.5">
          {st === "live" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-600 px-2 py-0.5 text-xs font-semibold text-white">
              <Radio size={12} className="animate-pulse" />
              {ev.kind === "online" ? "直播中" : "进行中"}
            </span>
          ) : st === "ended" ? (
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">已结束</span>
          ) : isFull(ev) ? (
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">名额已满</span>
          ) : null}
        </span>
      </Cover>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge size="xs" tone={ev.kind === "online" ? "brand" : "highlight"}>
            {ev.kind === "online" ? "线上" : `线下 · ${ev.city}`}
          </Badge>
          {ev.demoDayId ? <Badge size="xs" tone="dark">月度路演</Badge> : null}
          {going ? (
            <Badge size="xs" tone="success">
              {st === "ended" ? "你参加了" : "已报名"}
            </Badge>
          ) : null}
        </div>
        <p className="line-clamp-2 font-semibold text-gray-900 group-hover:text-brand-700">{ev.title}</p>
        <p className="text-xs text-gray-500">
          {formatDateTime(ev.start)} · {ev.host}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <div className="flex items-center gap-2">
            <AvatarGroup people={attendees.map((p) => ({ name: p.name, tone: p.avatarTone }))} size="xs" max={4} />
            <span className="text-xs text-gray-500">
              {st === "live" ? `${ev.presentIds.length} 人在场` : `${ev.attendeeIds.length}${ev.capacity ? `/${ev.capacity}` : ""} 人${st === "ended" ? "参加" : "报名"}`}
            </span>
          </div>
          {ev.projectIds.length ? <span className="text-xs text-gray-500">{ev.projectIds.length} 个项目</span> : null}
        </div>
      </div>
    </Link>
  );
}

/** 按活动状态与身份给出主按钮：报名 / 预约提醒 / 进入直播 / 签到 / 跟进。 */
export function EventCTA({ event: ev, size = "md", block }: { event: PitchEvent; size?: "sm" | "md" | "lg"; block?: boolean }) {
  const viewer = useViewer();
  const rsvp = useApp((s) => s.rsvpEvent);
  const enter = useApp((s) => s.enterEvent);
  const toast = useApp((s) => s.toast);
  const requireLogin = useApp((s) => s.requireLogin);
  const router = useRouter();
  const st = eventStatus(ev);
  const going = !!viewer && ev.attendeeIds.includes(viewer.id);
  const present = !!viewer && ev.presentIds.includes(viewer.id);
  const cls = block ? "w-full" : undefined;
  const guard = (reason: string, fn: () => void) => (viewer ? fn() : requireLogin(reason));

  if (st === "live") {
    if (present)
      return (
        <Button size={size} className={cls} iconLeft={CheckCircle2} href={`/events/${ev.id}#presence`}>
          {ev.kind === "online" ? "你在直播间" : "已签到"}
        </Button>
      );
    return (
      <Button
        size={size}
        className={cls}
        variant="primary"
        iconLeft={ev.kind === "online" ? Video : ScanLine}
        onClick={() =>
          guard(ev.kind === "online" ? "登录后进入直播，看看现在都有谁在" : "登录后签到，看看现场都有谁", () => {
            enter(ev.id);
            toast({ tone: "success", title: ev.kind === "online" ? "已进入直播间" : "签到成功", body: "下面可以看到现在在场的人和项目" });
            if (window.location.pathname === `/events/${ev.id}`) requestAnimationFrame(() => document.getElementById("presence")?.scrollIntoView({ behavior: "smooth", block: "start" }));
            else router.push(`/events/${ev.id}#presence`);
          })
        }
      >
        {ev.kind === "online" ? "进入直播" : "扫码签到"}
      </Button>
    );
  }

  if (st === "upcoming") {
    if (going)
      return (
        <Button
          size={size}
          className={cls}
          iconLeft={Check}
          onClick={() => {
            rsvp(ev.id);
            toast({ tone: "info", title: ev.kind === "online" ? "已取消提醒" : "已取消报名" });
          }}
        >
          {ev.kind === "online" ? "已预约 · 取消" : "已报名 · 取消"}
        </Button>
      );
    if (isFull(ev))
      return (
        <Button size={size} className={cls} disabled>
          名额已满
        </Button>
      );
    return (
      <Button
        size={size}
        className={cls}
        variant="primary"
        iconLeft={ev.kind === "online" ? Bell : LogIn}
        onClick={() =>
          guard("登录后报名活动", () => {
            rsvp(ev.id);
            toast({
              tone: "success",
              title: ev.kind === "online" ? "已预约，开播前 15 分钟提醒你" : "报名成功",
              body: ev.kind === "online" ? undefined : `${formatDateTime(ev.start)} · ${ev.venue}。活动前一天会提醒你。`,
            });
          })
        }
      >
        {ev.kind === "online" ? "预约提醒" : "报名"}
      </Button>
    );
  }

  if (present)
    return (
      <Button size={size} className={cls} variant="primary" iconLeft={Send} href={`/events/${ev.id}#follow-up`}>
        跟进在场的人
      </Button>
    );
  return ev.recap ? (
    <Button size={size} className={cls} href={`/events/${ev.id}#recap`}>
      看回顾
    </Button>
  ) : null;
}

const ROLE_FILTERS: { value: "all" | Role; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "investor", label: "投资人" },
  { value: "founder", label: "创始人" },
  { value: "talent", label: "人才" },
  { value: "partner", label: "合作方" },
];

/** 现在在场 / 活动后跟进：同一份名单，live 时带在线点，结束后带批量关注。 */
export function PresencePanel({ event: ev, mode }: { event: PitchEvent; mode: "live" | "followup" }) {
  const db = useDB();
  const viewer = useViewer();
  const openIntent = useApp((s) => s.openIntent);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const toast = useApp((s) => s.toast);
  const [tab, setTab] = useState<"people" | "projects">("people");
  const [role, setRole] = useState<"all" | Role>("all");
  const { people, projects } = eventPresence(db, ev);
  const others = people.filter((p) => p.id !== viewer?.id && !p.isOps);
  const myProjectIds = new Set(viewer ? db.projects.filter((p) => p.team.some((m) => m.personId === viewer.id && m.status === "confirmed")).map((p) => p.id) : []);
  const otherProjects = projects.filter((p) => !myProjectIds.has(p.id));
  const shownPeople = role === "all" ? others : others.filter((p) => p.role === role);
  const prefill = mode === "live" ? `在「${ev.title}」${ev.kind === "online" ? "直播间" : "现场"}看到你，` : `我们在「${ev.title}」上见过，`;
  const unfollowed = otherProjects.filter((p) => !isFollowing(db, viewer?.id ?? null, "project", p.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={tab}
          onChange={setTab}
          items={[
            { value: "people", label: "人", count: others.length },
            { value: "projects", label: "项目", count: otherProjects.length },
          ]}
        />
        {tab === "people" ? (
          <div className="scrollbar-none -mx-1 flex gap-1.5 overflow-x-auto px-1">
            {ROLE_FILTERS.map((r) => {
              const n = r.value === "all" ? others.length : others.filter((p) => p.role === r.value).length;
              if (r.value !== "all" && !n) return null;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium",
                    role === r.value ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {r.label} {n}
                </button>
              );
            })}
          </div>
        ) : mode === "followup" && unfollowed.length ? (
          <Button
            size="sm"
            onClick={() => {
              unfollowed.forEach((p) => toggleFollow("project", p.id));
              toast({ tone: "success", title: `已关注 ${unfollowed.length} 个项目`, body: "它们发布动态时会通知你" });
            }}
          >
            全部关注（{unfollowed.length}）
          </Button>
        ) : null}
      </div>

      {tab === "people" ? (
        shownPeople.length ? (
          <ul className="flex flex-col divide-y divide-gray-100">
            {shownPeople.map((p) => {
              const proj = db.projects.find((x) => x.team.some((m) => m.personId === p.id && m.status === "confirmed"));
              const talked = !!viewer && db.intents.some((i) => i.fromId === viewer.id && i.toId === p.id && i.status !== "withdrawn");
              return (
                <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Link href={`/u/${p.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={p.name} tone={p.avatarTone} online={mode === "live"} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-gray-900">{p.name}</span>
                        <Badge size="xs" tone={roleTone(p)}>
                          {roleText(p)}
                        </Badge>
                      </span>
                      <span className="block truncate text-xs text-gray-500">{proj ? `${proj.name} · ${proj.oneLiner}` : [p.title, p.org].filter(Boolean).join(" · ")}</span>
                    </span>
                  </Link>
                  {viewer ? (
                    talked ? (
                      <Badge size="xs">已打招呼</Badge>
                    ) : (
                      <Button size="sm" variant="secondary" iconLeft={Hand} onClick={() => openIntent({ type: "person", personId: p.id, presetKind: "other", prefill })}>
                        <span className="hidden sm:inline">打招呼</span>
                        <span className="sm:hidden">聊聊</span>
                      </Button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compact icon={Users} title={others.length ? "这个身份的人暂时不在" : "现在还没有其他人"} desc={others.length ? "换个筛选看看" : "签到的人会实时出现在这里"} />
        )
      ) : otherProjects.length ? (
        <ul className="flex flex-col divide-y divide-gray-100">
          {otherProjects.map((p) => {
            const here = p.team.filter((m) => ev.presentIds.includes(m.personId)).map((m) => getPerson(db, m.personId)?.name).filter(Boolean);
            return (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <ProjectLogo text={p.logoText} tone={p.logoTone} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                    <span className="block truncate text-xs text-gray-500">{here.length ? `${here.join("、")} 在场 · ${p.oneLiner}` : p.oneLiner}</span>
                  </span>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <FollowButton quiet targetType="project" targetId={p.id} size="sm" className="hidden sm:inline-flex" />
                  {viewer ? (
                    <Button size="sm" variant="secondary" iconLeft={Send} onClick={() => openIntent({ type: "project", projectId: p.id, presetKind: viewer.role === "investor" ? "invest" : "partner", prefill })}>
                      意向
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compact icon={Users} title="还没有项目在场" />
      )}
    </div>
  );
}

export function EventMeta({ event: ev }: { event: PitchEvent }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-gray-700">
      <li className="flex items-start gap-2">
        <CalendarDays size={16} className="mt-0.5 shrink-0 text-gray-400" />
        {formatDateTime(ev.start)} – {formatTime(ev.end)}
      </li>
      <li className="flex items-start gap-2">
        {ev.kind === "online" ? <Video size={16} className="mt-0.5 shrink-0 text-gray-400" /> : <MapPin size={16} className="mt-0.5 shrink-0 text-gray-400" />}
        {eventPlace(ev)}
      </li>
      <li className="flex items-start gap-2">
        <Users size={16} className="mt-0.5 shrink-0 text-gray-400" />
        {ev.attendeeIds.length} 人报名{ev.capacity ? ` · 名额 ${ev.capacity}` : " · 不限名额"}
      </li>
    </ul>
  );
}
