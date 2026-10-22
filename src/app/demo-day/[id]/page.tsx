"use client";

import { ArrowLeft, Link2, Newspaper, PlayCircle, Quote, Trophy } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense } from "react";

import { Podium, RankBars, totalVotes } from "@/components/biz/demo-day";
import { FollowButton } from "@/components/biz/follow-button";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, ProjectLogo } from "@/components/ui/display";
import { formatDateTime } from "@/data/time";
import type { Project } from "@/data/types";
import { useApp } from "@/store/app-store";
import { currentDemoDay, getPerson, getProject, useDB } from "@/store/selectors";

export default function DemoDayReportPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  );
}

function Report() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const toast = useApp((s) => s.toast);
  const dd = db.demoDays.find((d) => d.id === id);
  const next = currentDemoDay(db);

  if (!dd) {
    return (
      <Page narrow>
        <Card className="mt-10">
          <EmptyState icon={Trophy} title="没有找到这期路演" action={<Button href="/demo-day?tab=past">看往期</Button>} />
        </Card>
      </Page>
    );
  }
  if (dd.status !== "ended") {
    return (
      <Page narrow>
        <Card className="mt-10">
          <EmptyState icon={Trophy} title={`${dd.title}还在进行中`} desc="路演夜结束后，这里会生成战报。" action={<Button variant="primary" href="/demo-day">去投票</Button>} />
        </Card>
      </Page>
    );
  }

  const ev = db.events.find((e) => e.id === dd.eventId);
  const ranked = (dd.results ?? []).map((pid) => getProject(db, pid)).filter((p): p is Project => !!p);
  const article = ev?.recap?.articleId ? db.articles.find((a) => a.id === ev.recap!.articleId) : undefined;
  const judges = (ev?.speakerIds ?? []).map((pid) => getPerson(db, pid)).filter((p): p is NonNullable<typeof p> => !!p);

  return (
    <Page>
      <Link href="/demo-day?tab=past" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} />
        往期路演
      </Link>

      <section className="mt-4 overflow-hidden rounded-2xl bg-primary text-white">
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Badge tone="highlight" size="sm">
                <Trophy size={12} className="mr-1" />
                路演战报
              </Badge>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{dd.title}</h1>
              <p className="mt-1 text-gray-300">
                {dd.theme}
                {ev ? ` · ${formatDateTime(ev.start)}` : ""}
              </p>
            </div>
            <Button
              variant="secondary"
              iconLeft={Link2}
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href).catch(() => {});
                toast({ tone: "success", title: "战报链接已复制", body: "发给朋友或朋友圈，入围项目也会被更多人看到" });
              }}
            >
              复制链接
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { l: "在线观看", v: dd.recap?.viewers.toLocaleString() ?? "—" },
              { l: "收到意向", v: dd.recap?.intents ?? "—" },
              { l: "进入撮合", v: dd.recap?.matches ?? "—" },
              { l: "总票数", v: totalVotes(dd) },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-3xl font-semibold text-highlight tabular-nums">{s.v}</p>
                <p className="mt-1 text-sm text-gray-400">{s.l}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-xl">
            <Podium dd={dd} projects={ranked.slice(0, 3)} />
          </div>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-6">
          {dd.recap?.quote ? (
            <Card className="bg-highlight-soft">
              <Quote size={20} className="text-highlight-ink" />
              <p className="mt-2 text-lg leading-relaxed font-medium text-gray-900">{dd.recap.quote}</p>
            </Card>
          ) : null}
          <Card>
            <h2 className="text-base font-semibold text-gray-900">完整排名</h2>
            <p className="mb-4 text-sm text-gray-500">路演夜结束时的票数</p>
            <RankBars dd={dd} />
          </Card>
          {ev?.recap ? (
            <Card>
              <h2 className="text-base font-semibold text-gray-900">现场回顾</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-gray-700">{ev.recap.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" iconLeft={PlayCircle} href={`/events/${ev.id}#recap`}>
                  看回放{ev.recap.replayMins ? `（${ev.recap.replayMins} 分钟）` : ""}
                </Button>
                {article ? (
                  <Button size="sm" variant="secondary" iconLeft={Newspaper} href={`/feed?tab=articles&article=${article.id}`}>
                    读报道
                  </Button>
                ) : null}
              </div>
            </Card>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Card>
            <h2 className="text-base font-semibold text-gray-900">关注这期的项目</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {ranked.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                      <span className="block truncate text-xs text-gray-500">{p.oneLiner}</span>
                    </span>
                  </Link>
                  <FollowButton quiet targetType="project" targetId={p.id} size="sm" />
                </li>
              ))}
            </ul>
          </Card>
          {judges.length ? (
            <Card>
              <h2 className="text-base font-semibold text-gray-900">评审嘉宾</h2>
              <div className="mt-3 flex flex-col gap-3">
                {judges.map((p) => (
                  <Link key={p.id} href={`/u/${p.handle}`} className="group flex items-center gap-3">
                    <Avatar name={p.name} tone={p.avatarTone} size="sm" />
                    <span className="min-w-0 truncate text-sm">
                      <span className="font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</span>
                      <span className="text-gray-500"> · {p.org}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          ) : null}
          {next ? (
            <Card className="border-gray-900">
              <p className="text-xs font-semibold text-brand-700">下一期</p>
              <h2 className="mt-1 text-base font-semibold text-gray-900">{next.title}</h2>
              <p className="text-sm text-gray-500">{next.theme}</p>
              <Button size="sm" variant="primary" href="/demo-day" className="mt-3">
                去投票或报名
              </Button>
            </Card>
          ) : null}
        </aside>
      </div>
    </Page>
  );
}
