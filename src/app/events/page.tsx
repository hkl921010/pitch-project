"use client";

import { CalendarDays, Radio } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import { EventCard, EventCTA, eventPlace, eventPresence } from "@/components/biz/events";
import { Page } from "@/components/shell/page";
import { AvatarGroup, Cover, EmptyState, PageHeader } from "@/components/ui/display";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { useQueryParam } from "@/lib/use-query";
import { eventStatus, useDB, useViewer } from "@/store/selectors";

type Tab = "upcoming" | "mine" | "past";
type Kind = "all" | "online" | "offline";

export default function EventsPage() {
  return (
    <Suspense>
      <Events />
    </Suspense>
  );
}

function Events() {
  const db = useDB();
  const viewer = useViewer();
  const [tab, setTab] = useQueryParam<Tab>("tab", "upcoming");
  const [kind, setKind] = useState<Kind>("all");

  const live = db.events.filter((e) => eventStatus(e) === "live");
  const byKind = db.events.filter((e) => kind === "all" || e.kind === kind);
  const upcoming = byKind.filter((e) => eventStatus(e) === "upcoming").sort((a, b) => a.start.localeCompare(b.start));
  const past = byKind.filter((e) => eventStatus(e) === "ended").sort((a, b) => b.start.localeCompare(a.start));
  const mine = viewer ? byKind.filter((e) => e.attendeeIds.includes(viewer.id)).sort((a, b) => b.start.localeCompare(a.start)) : [];
  const list = tab === "upcoming" ? upcoming : tab === "past" ? past : mine;

  return (
    <Page>
      <PageHeader title="活动" desc="线上直播和线下聚会。签到或进入直播后，可以看到现在在场的人和项目，会后一键跟进。" />

      {live.length ? (
        <section className="mt-6 flex flex-col gap-3">
          {live.map((ev) => {
            const { people, projects } = eventPresence(db, ev);
            return (
              <div key={ev.id} className="flex flex-col overflow-hidden rounded-xl border border-error-200 bg-white shadow-xs sm:flex-row">
                <Link href={`/events/${ev.id}`} className="relative block sm:w-64 sm:shrink-0">
                  <Cover tone={ev.coverTone} className="h-24 sm:h-full">
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-error-600 px-2 py-0.5 text-xs font-semibold text-white">
                      <Radio size={12} className="animate-pulse" />
                      {ev.kind === "online" ? "正在直播" : "正在进行"}
                    </span>
                  </Cover>
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  <Link href={`/events/${ev.id}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 hover:text-brand-700">{ev.title}</p>
                    <p className="mt-0.5 text-sm text-gray-500">{eventPlace(ev)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <AvatarGroup people={people.map((p) => ({ name: p.name, tone: p.avatarTone }))} size="xs" max={5} />
                      <span className="text-xs text-gray-600">
                        {people.length} 人 · {projects.length} 个项目在场
                      </span>
                    </div>
                  </Link>
                  <EventCTA event={ev} />
                </div>
              </div>
            );
          })}
        </section>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          className="flex-1"
          value={tab}
          onChange={setTab}
          items={[
            { value: "upcoming", label: "即将开始", count: upcoming.length },
            ...(viewer ? [{ value: "mine" as const, label: "我报名的", count: mine.length }] : []),
            { value: "past", label: "往期", count: past.length },
          ]}
        />
        <Segmented
          size="sm"
          value={kind}
          onChange={setKind}
          items={[
            { value: "all", label: "全部" },
            { value: "online", label: "线上" },
            { value: "offline", label: "线下" },
          ]}
        />
      </div>

      {list.length ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={CalendarDays}
            title={tab === "mine" ? "还没有报名活动" : tab === "past" ? "没有往期活动" : "暂时没有即将开始的活动"}
            desc={tab === "mine" ? "报名后会出现在这里，活动前一天提醒你" : kind !== "all" ? "换个类型看看" : "新活动发布后会出现在这里"}
          />
        </div>
      )}
    </Page>
  );
}
