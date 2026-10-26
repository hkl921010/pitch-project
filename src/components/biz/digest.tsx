"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";

import { Avatar, Cover, ProjectLogo } from "@/components/ui/display";
import { INTENT_KIND_LABEL, NOTIFICATION_TYPES, SOURCE_LABEL } from "@/data/constants";
import { formatDate, formatDateTime, nowMs } from "@/data/time";
import type { Article, DB, Intent, Notification, Person, PitchEvent, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { notifyPrefsOf } from "@/store/app-store";
import {
  anonymousProfile,
  currentDemoDay,
  eventStatus,
  followerCount,
  getPerson,
  getProject,
  intentsReceived,
  intentsSent,
  manageableProjects,
  projectCompletion,
  requesterView,
  watchUpdates,
} from "@/store/selectors";

export type DigestRole = "founder" | "investor" | "general";

export const DIGEST_ROLE_LABEL: Record<DigestRole, string> = {
  founder: "创始人版",
  investor: "投资人版",
  general: "精选版",
};

/** 预览别人的版本时，用这些演示身份的数据生成。 */
export const DIGEST_SAMPLE: Record<DigestRole, string> = {
  founder: "u-linchuan",
  investor: "u-zhoumin",
  general: "u-chenyi",
};

export function digestRoleOf(db: DB, person: Person): DigestRole {
  if (person.role === "investor") return "investor";
  if (manageableProjects(db, person.id).length) return "founder";
  return "general";
}

const DAY = 86_400_000;

/** 下一期发送时间：下一个周一 09:00（北京时间）。 */
export function nextDigestAt(): string {
  const t = new Date(nowMs() + 8 * 3_600_000);
  const toMon = (8 - t.getUTCDay()) % 7 || 7;
  return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate() + toMon, 1, 0)).toISOString();
}

export function digestPeriod() {
  const send = new Date(nextDigestAt()).getTime();
  return { from: new Date(send - 7 * DAY).toISOString(), to: new Date(send - DAY).toISOString(), send: new Date(send).toISOString() };
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);
const within = (iso: string, days: number) => nowMs() - new Date(iso).getTime() < days * DAY;

export interface DigestTodo {
  title: string;
  desc: string;
  href: string;
}

export type DigestData =
  | {
      kind: "founder";
      person: Person;
      project: Project;
      views: number;
      prevViews: number;
      delta?: number;
      followers: number;
      newFollows: number;
      newIntents: number;
      pending: Intent[];
      watchers: number;
      topSource?: { label: string; share: number };
      todos: DigestTodo[];
      investors: Person[];
      events: PitchEvent[];
    }
  | {
      kind: "investor";
      person: Person;
      fresh: { project: Project; count: number; latest: string }[];
      matches: Project[];
      demo?: { title: string; projects: Project[]; voted: boolean };
      slots: { id: string; start: string; topic: string; status: "requested" | "confirmed"; who?: Person }[];
      waiting: number;
      accepted: number;
      articles: Article[];
      events: PitchEvent[];
    }
  | {
      kind: "general";
      person: Person;
      pending: number;
      invites: Project[];
      hot: Project[];
      articles: Article[];
      events: PitchEvent[];
    };

function upcomingEvents(db: DB) {
  return db.events
    .filter((e) => eventStatus(e) !== "ended")
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 2);
}

export function buildDigest(db: DB, person: Person, role: DigestRole): DigestData | null {
  const events = upcomingEvents(db);
  const articles = [...db.articles].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 2);

  if (role === "founder") {
    const project = manageableProjects(db, person.id)[0];
    if (!project) return null;
    const v = project.stats.views;
    const views = sum(v.slice(-7));
    const prevViews = sum(v.slice(-14, -7));
    const intents = db.intents.filter((i) => i.projectId === project.id);
    const pending = intents.filter((i) => i.status === "pending");
    const invited = project.team.filter((t) => t.status === "invited").length;
    const completion = projectCompletion(project);
    const lastUpdate = [...project.updates].sort((a, b) => b.at.localeCompare(a.at))[0];
    const srcTotal = sum(Object.values(project.stats.sources));
    const top = (Object.entries(project.stats.sources) as [TrafficSource, number][]).sort((a, b) => b[1] - a[1])[0];
    const dd = currentDemoDay(db);
    const entry = dd?.entries.find((e) => e.projectId === project.id);
    const base = `/dashboard/${project.slug}`;

    const todos: DigestTodo[] = [];
    if (pending.length) todos.push({ title: `回应 ${pending.length} 条意向`, desc: "回复速度会显示在项目页上", href: `${base}?tab=intents` });
    if (invited) todos.push({ title: `${invited} 位成员还没确认`, desc: "确认后项目会出现在 TA 的主页上", href: `${base}?tab=team` });
    if (!lastUpdate || !within(lastUpdate.at, 14)) todos.push({ title: lastUpdate ? "两周没发动态了" : "发第一条动态", desc: "关注和观察你的人会收到提醒", href: `${base}?tab=updates` });
    if (dd && entry?.status === "shortlisted") todos.push({ title: `${dd.title}入围了，拉朋友投票`, desc: `目前 ${dd.votes[project.id]?.length ?? 0} 票`, href: "/demo-day" });
    else if (dd && !entry && completion.percent >= 80) todos.push({ title: `报名${dd.title}`, desc: "资料已达标，可以直接报名", href: `${base}?tab=exposure` });
    if (completion.remaining) todos.push({ title: `补全资料（还差 ${completion.remaining} 项）`, desc: `完成度 ${completion.percent}%`, href: `/p/${project.slug}/edit` });

    return {
      kind: "founder",
      person,
      project,
      views,
      prevViews,
      delta: prevViews ? Math.round(((views - prevViews) / prevViews) * 100) : undefined,
      followers: followerCount(db, "project", project.id),
      newFollows: db.follows.filter((f) => f.targetType === "project" && f.targetId === project.id && within(f.at, 7)).length,
      newIntents: intents.filter((i) => within(i.createdAt, 7)).length,
      pending,
      watchers: db.watch.filter((w) => w.projectId === project.id).length,
      topSource: top && srcTotal ? { label: SOURCE_LABEL[top[0]], share: Math.round((top[1] / srcTotal) * 100) } : undefined,
      todos: todos.slice(0, 4),
      investors: db.people.filter((p) => p.role === "investor" && p.openStatus.active && p.openStatus.investor?.tracks.includes(project.track) && !project.team.some((m) => m.personId === p.id)).slice(0, 3),
      events,
    };
  }

  if (role === "investor") {
    const tracks = person.openStatus.investor?.tracks ?? [];
    const stages = person.openStatus.investor?.stages ?? [];
    const raising = (p: Project) => p.lookingFor.find((n) => n.kind === "invest");
    const score = (p: Project) => (tracks.includes(p.track) ? 2 : 0) + (stages.some((s) => raising(p)?.sub?.startsWith(s)) ? 1 : 0);
    const watched = new Set(db.watch.filter((w) => w.userId === person.id).map((w) => w.projectId));
    const dd = currentDemoDay(db);
    const sent = intentsSent(db, person.id);
    return {
      kind: "investor",
      person,
      fresh: watchUpdates(db, person.id)
        .filter((x) => x.fresh.length)
        .map((x) => ({ project: x.project, count: x.fresh.length, latest: [...x.fresh].sort((a, b) => b.at.localeCompare(a.at))[0].title })),
      matches: db.projects
        .filter((p) => p.visibility === "public" && p.wall === "approved" && score(p) > 0 && !watched.has(p.id) && !p.team.some((m) => m.personId === person.id))
        .sort((a, b) => score(b) - score(a) || b.createdAt.localeCompare(a.createdAt))
        .slice(0, 3),
      demo: dd
        ? {
            title: dd.title,
            projects: dd.entries.filter((e) => e.status === "shortlisted").map((e) => getProject(db, e.projectId)).filter((p): p is Project => !!p),
            voted: Object.values(dd.votes).some((v) => v.includes(person.id)),
          }
        : undefined,
      slots: db.officeHours
        .filter((s) => s.hostId === person.id && (s.status === "requested" || s.status === "confirmed") && new Date(s.start).getTime() > nowMs())
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((s) => ({ id: s.id, start: s.start, topic: s.topic, status: s.status as "requested" | "confirmed", who: getPerson(db, s.bookedBy) })),
      waiting: sent.filter((i) => requesterView(i) === "waiting").length,
      accepted: sent.filter((i) => i.status === "accepted" && i.respondedAt && within(i.respondedAt, 7)).length,
      articles,
      events,
    };
  }

  return {
    kind: "general",
    person,
    pending: intentsReceived(db, person.id).filter((i) => i.status === "pending").length,
    invites: db.projects.filter((p) => p.team.some((m) => m.personId === person.id && m.status === "invited")),
    hot: db.projects
      .filter((p) => p.visibility === "public" && p.wall === "approved")
      .sort((a, b) => followerCount(db, "project", b.id) - followerCount(db, "project", a.id))
      .slice(0, 3),
    articles,
    events,
  };
}

/** “有待办时才发”：只看需要用户回应的事。 */
export function digestHasTodo(d: DigestData): boolean {
  if (d.kind === "founder") return d.pending.length > 0 || d.todos.some((t) => t.href.endsWith("tab=team"));
  if (d.kind === "investor") return d.slots.some((s) => s.status === "requested") || d.fresh.length > 0;
  return d.pending > 0 || d.invites.length > 0;
}

/** 服务号模板消息里的几行字段。 */
export function digestSummary(d: DigestData): { title: string; fields: [string, string][]; remark: string } {
  if (d.kind === "founder") {
    return {
      title: "项目周报",
      fields: [
        ["项目", d.project.name],
        ["本周浏览", `${d.views}${d.delta !== undefined ? `（${d.delta >= 0 ? "+" : ""}${d.delta}%）` : ""}`],
        ["新增关注", `${d.newFollows}，共 ${d.followers}`],
        ["待回应意向", d.pending.length ? `${d.pending.length} 条` : "无"],
      ],
      remark: d.todos[0] ? `本周最值得做：${d.todos[0].title}` : "都处理完了，继续保持",
    };
  }
  if (d.kind === "investor") {
    return {
      title: "投资人周报",
      fields: [
        ["观察清单", d.fresh.length ? `${d.fresh.length} 个项目有新动态` : "没有新动态"],
        ["符合偏好的新项目", `${d.matches.length} 个`],
        ["本周答疑", d.slots.length ? `${d.slots.length} 场${d.slots.some((s) => s.status === "requested") ? "，有待确认" : ""}` : "无"],
        ["月度路演", d.demo ? `${d.demo.projects.length} 个项目入围${d.demo.voted ? "，你已投票" : ""}` : "本月未开放"],
      ],
      remark: d.fresh[0] ? `${d.fresh[0].project.name}：${d.fresh[0].latest}` : "看看本周符合你偏好的项目",
    };
  }
  return {
    title: "Pitch 每周精选",
    fields: [
      ["待你回应", d.pending + d.invites.length ? `${d.pending + d.invites.length} 件` : "无"],
      ["热门项目", d.hot.map((p) => p.name).join("、") || "暂无"],
    ],
    remark: d.articles[0] ? `本周报道：${d.articles[0].title}` : "看看本周的新项目",
  };
}

/* ------------------------------------------------------------------ 邮件 */

function EmailSection({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="border-t border-gray-100 px-5 py-6 sm:px-8">
      <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
      {desc ? <p className="mt-0.5 text-sm text-gray-500">{desc}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmailButton({ href, children, quiet }: { href: string; children: ReactNode; quiet?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold",
        quiet ? "border border-gray-300 text-gray-700 hover:bg-gray-50" : "bg-primary text-white hover:bg-gray-800",
      )}
    >
      {children}
    </Link>
  );
}

function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "up" | "down" }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 p-3 sm:p-4">
      <p className="truncate text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">{value}</p>
      {hint ? <p className={cn("mt-0.5 truncate text-xs", tone === "up" ? "text-success-700" : tone === "down" ? "text-gray-500" : "text-gray-500")}>{hint}</p> : null}
    </div>
  );
}

function Row({ href, left, title, desc, right }: { href: string; left: ReactNode; title: ReactNode; desc?: ReactNode; right?: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg py-2.5 hover:bg-gray-50 sm:px-2">
      <span className="shrink-0">{left}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700">{title}</span>
        {desc ? <span className="block truncate text-xs text-gray-500">{desc}</span> : null}
      </span>
      {right ?? <ChevronRight size={16} className="shrink-0 text-gray-400" />}
    </Link>
  );
}

function EventRows({ events }: { events: PitchEvent[] }) {
  if (!events.length) return <p className="text-sm text-gray-500">近期没有活动。</p>;
  return (
    <div className="flex flex-col">
      {events.map((e) => (
        <Row
          key={e.id}
          href={`/events/${e.id}`}
          left={
            <span className="flex h-10 w-10 flex-col items-center justify-center rounded-lg border border-gray-200 text-center leading-none">
              <span className="text-[10px] text-gray-500">{new Date(e.start).getMonth() + 1} 月</span>
              <span className="text-sm font-semibold text-gray-900">{new Date(e.start).getDate()}</span>
            </span>
          }
          title={e.title}
          desc={`${e.kind === "online" ? "线上" : e.city ?? "线下"} · ${formatDateTime(e.start)}`}
        />
      ))}
    </div>
  );
}

function ArticleRows({ articles }: { articles: Article[] }) {
  return (
    <div className="flex flex-col">
      {articles.map((a) => (
        <Row key={a.id} href={`/feed?tab=articles&article=${a.id}`} left={<Cover tone={a.coverTone} className="h-10 w-10 rounded-lg" />} title={a.title} desc={`${a.column} · ${a.readMins} 分钟`} />
      ))}
    </div>
  );
}

export function DigestEmailBody({ db, data }: { db: DB; data: DigestData }) {
  const period = digestPeriod();
  const p = data.person;
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-xs ring-1 ring-gray-200">
      <div className="flex items-center justify-between bg-primary px-5 py-4 sm:px-8">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-highlight text-sm font-black text-primary">P</span>
          <span className="font-bold text-white">Pitch 周报</span>
        </span>
        <span className="text-xs text-gray-400">
          {formatDate(period.from)} – {formatDate(period.to)}
        </span>
      </div>

      <div className="px-5 pt-7 pb-6 sm:px-8">
        <p className="text-sm text-gray-500">{p.name}，早上好</p>
        <h2 className="mt-1 text-xl leading-snug font-semibold text-gray-900 sm:text-2xl">
          {data.kind === "founder"
            ? `${data.project.name}这周被 ${data.views} 人次看到${data.pending.length ? `，有 ${data.pending.length} 条意向在等你` : ""}`
            : data.kind === "investor"
              ? data.fresh.length
                ? `观察清单里 ${data.fresh.length} 个项目有新动态`
                : `本周有 ${data.matches.length} 个符合你偏好的项目`
              : data.pending + data.invites.length
                ? `有 ${data.pending + data.invites.length} 件事在等你回应`
                : "本周值得看的项目、需求和活动"}
        </h2>
      </div>

      {data.kind === "founder" ? <FounderEmail db={db} d={data} /> : data.kind === "investor" ? <InvestorEmail d={data} /> : <GeneralEmail d={data} />}

      <div className="border-t border-gray-100 bg-gray-25 px-5 py-6 text-xs leading-relaxed text-gray-500 sm:px-8">
        <p>
          你收到这封邮件，是因为在 Pitch 开启了{DIGEST_ROLE_LABEL[digestRoleOf(db, p)]}周报。每周一 09:00 发送，统计截至上周日。
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          <Link href="/digest" className="font-semibold text-gray-700 underline underline-offset-2">
            调整频率和内容
          </Link>
          <Link href="/digest?unsubscribe=email" className="underline underline-offset-2">
            退订邮件周报
          </Link>
          <Link href="/notifications" className="underline underline-offset-2">
            通知中心
          </Link>
        </p>
      </div>
    </div>
  );
}

function FounderEmail({ db, d }: { db: DB; d: Extract<DigestData, { kind: "founder" }> }) {
  const base = `/dashboard/${d.project.slug}`;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-5 pb-6 sm:grid-cols-4 sm:px-8">
        <Kpi label="浏览" value={d.views} hint={d.delta !== undefined ? `${d.delta >= 0 ? "比上周 +" : "比上周 "}${d.delta}%` : "首周数据"} tone={d.delta !== undefined && d.delta >= 0 ? "up" : "down"} />
        <Kpi label="新增关注" value={d.newFollows} hint={`共 ${d.followers}`} />
        <Kpi label="新意向" value={d.newIntents} hint={d.pending.length ? `${d.pending.length} 条待回应` : "全部已处理"} />
        <Kpi label="观察清单" value={d.watchers} hint="位投资人收藏" />
      </div>
      {d.topSource ? (
        <p className="mx-5 mb-6 rounded-lg bg-highlight-soft px-4 py-3 text-sm text-gray-700 sm:mx-8">
          {d.topSource.share}% 的访问来自<span className="font-semibold text-gray-900">{d.topSource.label}</span>。{d.topSource.label === "发现页" ? "上墙后的曝光正在起作用。" : "转发给更多朋友，会带来第一批关注。"}
        </p>
      ) : null}

      {d.pending.length ? (
        <EmailSection title="等你回应的意向" desc="回复不消耗意向次数，项目页会显示你的回复速度">
          <div className="flex flex-col">
            {d.pending.slice(0, 3).map((i) => {
              const from = getPerson(db, i.fromId);
              const hidden = i.anonymous && !i.revealed;
              return (
                <Row
                  key={i.id}
                  href={`${base}?tab=intents`}
                  left={hidden ? <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs text-gray-500">匿</span> : <Avatar name={from?.name ?? "?"} tone={from?.avatarTone ?? 0} size="sm" />}
                  title={`${hidden ? "匿名" : from?.name} · ${INTENT_KIND_LABEL[i.kind]}`}
                  desc={hidden ? anonymousProfile(db, from) : `「${i.message}」`}
                />
              );
            })}
          </div>
          <div className="mt-3">
            <EmailButton href={`${base}?tab=intents`}>去回应</EmailButton>
          </div>
        </EmailSection>
      ) : null}

      <EmailSection title="本周值得做的事">
        {d.todos.length ? (
          <ol className="flex flex-col gap-1">
            {d.todos.map((t, i) => (
              <li key={t.title}>
                <Link href={t.href} className="group flex items-start gap-3 rounded-lg py-2 hover:bg-gray-50 sm:px-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700">{t.title}</span>
                    <span className="block text-xs text-gray-500">{t.desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-gray-500">都处理完了。发一条动态，让关注你的人知道你们的进展。</p>
        )}
      </EmailSection>

      {d.investors.length ? (
        <EmailSection title={`关注「${d.project.track}」的投资人`} desc="他们的开放状态里写着这个赛道，可以从项目页的“正在寻找”吸引他们">
          <div className="flex flex-col">
            {d.investors.map((p) => {
              const reached = db.intents.some((i) => i.fromId === p.id && i.projectId === d.project.id && !(i.anonymous && !i.revealed));
              return (
                <Row
                  key={p.id}
                  href={`/u/${p.handle}`}
                  left={<Avatar name={p.name} tone={p.avatarTone} size="sm" />}
                  title={`${p.name} · ${p.org}`}
                  desc={p.openStatus.headline}
                  right={reached ? <span className="shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700">已表达意向</span> : undefined}
                />
              );
            })}
          </div>
        </EmailSection>
      ) : null}

      <EmailSection title="近期活动">
        <EventRows events={d.events} />
      </EmailSection>

      <div className="border-t border-gray-100 px-5 py-6 sm:px-8">
        <EmailButton href={base}>打开项目工作台</EmailButton>
      </div>
    </>
  );
}

function InvestorEmail({ d }: { d: Extract<DigestData, { kind: "investor" }> }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-5 pb-6 sm:grid-cols-4 sm:px-8">
        <Kpi label="有新动态" value={d.fresh.length} hint="观察清单" />
        <Kpi label="符合偏好" value={d.matches.length} hint="新项目" />
        <Kpi label="答疑" value={d.slots.length} hint={d.slots.some((s) => s.status === "requested") ? "有待确认" : "本周"} />
        <Kpi label="意向" value={d.waiting} hint={d.accepted ? `${d.accepted} 条被接受` : "等待回应"} />
      </div>

      <EmailSection title="观察清单的新动态" desc="只有你能看到这份清单">
        {d.fresh.length ? (
          <div className="flex flex-col">
            {d.fresh.map((f) => (
              <Row
                key={f.project.id}
                href={`/watchlist#w-${f.project.id}`}
                left={<ProjectLogo text={f.project.logoText} tone={f.project.logoTone} size="sm" />}
                title={f.project.name}
                desc={f.latest}
                right={<span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">{f.count} 条新</span>}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">清单里的项目这周没有新动态。</p>
        )}
      </EmailSection>

      <EmailSection
        title="符合你偏好的项目"
        desc={`赛道（${d.person.openStatus.investor?.tracks.join("、") || "未设置"}）或在融轮次（${d.person.openStatus.investor?.stages.join("、") || "未设置"}）符合你的开放状态，不含已在观察清单里的`}
      >
        {d.matches.length ? (
          <div className="flex flex-col">
            {d.matches.map((p) => {
              const r = p.lookingFor.find((n) => n.kind === "invest");
              return (
                <Row
                  key={p.id}
                  href={`/p/${p.slug}`}
                  left={<ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />}
                  title={`${p.name} · ${p.track}`}
                  desc={p.oneLiner}
                  right={r?.sub ? <span className="shrink-0 rounded-full bg-highlight-soft px-2 py-0.5 text-xs font-semibold text-highlight-ink">在融 · {r.sub}</span> : undefined}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            暂时没有新的匹配项目。<Link href={`/u/${d.person.handle}?edit=status`} className="font-semibold text-brand-700">调整投资偏好</Link>
          </p>
        )}
      </EmailSection>

      {d.slots.length ? (
        <EmailSection title="你的答疑时段">
          <div className="flex flex-col">
            {d.slots.map((s) => (
              <Row
                key={s.id}
                href="/office-hours?tab=hosting"
                left={<Avatar name={s.who?.name ?? "?"} tone={s.who?.avatarTone ?? 0} size="sm" />}
                title={`${s.who?.name ?? "有人"} · ${s.topic}`}
                desc={formatDateTime(s.start)}
                right={<span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", s.status === "requested" ? "bg-warning-50 text-warning-700" : "bg-success-50 text-success-700")}>{s.status === "requested" ? "待你确认" : "已确认"}</span>}
              />
            ))}
          </div>
        </EmailSection>
      ) : null}

      {d.demo ? (
        <EmailSection title={d.demo.title} desc={d.demo.voted ? "你已投票，结果公布时会通知你" : "入围项目已公布，投票也算一项贡献任务"}>
          <div className="flex flex-wrap gap-2">
            {d.demo.projects.map((p) => (
              <Link key={p.id} href={`/p/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-700 hover:border-gray-300">
                <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" className="rounded-full" />
                {p.name}
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <EmailButton href="/demo-day" quiet>
              {d.demo.voted ? "查看路演" : "去投票"}
            </EmailButton>
          </div>
        </EmailSection>
      ) : null}

      <EmailSection title="Pitch 报道">
        <ArticleRows articles={d.articles} />
      </EmailSection>

      <EmailSection title="近期活动">
        <EventRows events={d.events} />
      </EmailSection>

      <div className="border-t border-gray-100 px-5 py-6 sm:px-8">
        <EmailButton href="/watchlist">打开观察清单</EmailButton>
      </div>
    </>
  );
}

function GeneralEmail({ d }: { d: Extract<DigestData, { kind: "general" }> }) {
  return (
    <>
      {d.pending + d.invites.length ? (
        <EmailSection title="等你回应">
          <div className="flex flex-col">
            {d.invites.map((p) => (
              <Row key={p.id} href="/me/intents?tab=invites" left={<ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />} title={`${p.name}邀请你成为成员`} desc="确认后项目会出现在你的主页上" />
            ))}
            {d.pending ? <Row href="/me/intents?tab=received" left={<span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">{d.pending}</span>} title={`${d.pending} 条意向等你回应`} desc="回应不消耗意向次数" /> : null}
          </div>
        </EmailSection>
      ) : null}

      <EmailSection title="本周最受关注的项目">
        <div className="flex flex-col">
          {d.hot.map((p) => (
            <Row key={p.id} href={`/p/${p.slug}`} left={<ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />} title={p.name} desc={p.oneLiner} />
          ))}
        </div>
      </EmailSection>

      <EmailSection title="Pitch 报道">
        <ArticleRows articles={d.articles} />
      </EmailSection>

      <EmailSection title="近期活动">
        <EventRows events={d.events} />
      </EmailSection>

      <div className="border-t border-gray-100 px-5 py-6 sm:px-8">
        <EmailButton href="/discover">去发现页看看</EmailButton>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ 服务号 */

const PUSH_TITLE: Partial<Record<Notification["type"], string>> = {
  intent: "新意向提醒",
  conversation: "新消息提醒",
  member: "成员邀请提醒",
  officehours: "答疑预约提醒",
  update: "项目动态提醒",
  demoday: "月度路演提醒",
  reward: "任务奖励提醒",
};

function TemplateCard({ title, time, fields, remark, onOpen, href, preview }: { title: string; time: string; fields: [string, string][]; remark?: string; onOpen?: () => void; href?: string; preview?: boolean }) {
  const footer = (
    <span className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5 text-sm text-gray-700">
      详情
      <ChevronRight size={16} className="text-gray-400" />
    </span>
  );
  return (
    <div className={cn("overflow-hidden rounded-lg bg-white", preview && "ring-2 ring-highlight")}>
      <div className="px-4 pt-3.5 pb-3">
        <p className="text-[15px] font-semibold text-gray-900">{title}</p>
        <p className="mt-0.5 text-xs text-gray-400">{time}</p>
        <dl className="mt-3 flex flex-col gap-1.5 text-sm">
          {fields.map(([k, v]) => (
            <div key={k} className="flex gap-3">
              <dt className="w-[5.5em] shrink-0 text-gray-500">{k}</dt>
              <dd className="min-w-0 flex-1 text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
        {remark ? <p className="mt-2.5 text-sm text-brand-700">{remark}</p> : null}
      </div>
      {onOpen ? (
        <button type="button" onClick={onOpen} className="block w-full text-left hover:bg-gray-50">
          {footer}
        </button>
      ) : href ? (
        <Link href={href} className="block hover:bg-gray-50">
          {footer}
        </Link>
      ) : null}
    </div>
  );
}

/** 手机外框：服务号会话或周报 H5。 */
export function PhoneFrame({ title, onBack, children, footer, scrollToEnd }: { title: string; onBack?: () => void; children: ReactNode; footer?: ReactNode; scrollToEnd?: boolean }) {
  const body = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = body.current;
    if (el) el.scrollTop = scrollToEnd ? el.scrollHeight : 0;
  }, [scrollToEnd, title]);
  return (
    <div className="mx-auto flex h-[720px] w-full max-w-[390px] flex-col overflow-hidden bg-[#ededed] sm:rounded-[2.25rem] sm:border-[10px] sm:border-gray-900 sm:shadow-xl">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-300/70 bg-[#ededed] px-3">
        {onBack ? (
          <button type="button" onClick={onBack} aria-label="返回会话" className="rounded p-1 text-gray-800 hover:bg-gray-200">
            <ChevronLeft size={22} />
          </button>
        ) : (
          <ChevronLeft size={22} className="text-gray-800" />
        )}
        <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-gray-900">{title}</p>
        <MoreHorizontal size={20} className="text-gray-800" />
      </div>
      <div ref={body} className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </div>
      {footer}
    </div>
  );
}

export function WechatThread({ db, data, onOpen }: { db: DB; data: DigestData; onOpen: () => void }) {
  const prefs = notifyPrefsOf(db, data.person.id);
  const pushes = db.notifications
    .filter((n) => n.userId === data.person.id && n.pushed)
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-4);
  const s = digestSummary(data);
  const period = digestPeriod();
  return (
    <div className="flex flex-col gap-4 px-3 py-4">
      {pushes.map((n) => (
        <div key={n.id} className="flex flex-col gap-2">
          <p className="text-center text-xs text-gray-400">{formatDateTime(n.at)}</p>
          {n.link.startsWith("/digest/preview") ? (
            <TemplateCard title={`${s.title}（测试）`} time={formatDateTime(n.at)} fields={s.fields} remark={s.remark} onOpen={onOpen} />
          ) : (
            <TemplateCard title={PUSH_TITLE[n.type] ?? "Pitch 通知"} time={formatDateTime(n.at)} fields={[["内容", n.title], ["详情", n.body]]} href={n.link} />
          )}
        </div>
      ))}
      <div className="flex flex-col gap-2">
        <p className="text-center text-xs text-gray-400">{formatDateTime(period.send)}（下一期，预览）</p>
        {prefs.frequency === "off" || !prefs.wechatOn ? (
          <p className="mx-auto rounded bg-gray-300/60 px-2 py-1 text-xs text-gray-600">{prefs.frequency === "off" ? "已关闭周报，这一期不会发送" : "服务号推送已关闭，这一期不会发送"}</p>
        ) : null}
        <TemplateCard title={s.title} time={`${formatDate(period.from)} – ${formatDate(period.to)}`} fields={s.fields} remark={s.remark} onOpen={onOpen} preview />
      </div>
      <p className="px-6 text-center text-[11px] leading-relaxed text-gray-400">
        {prefs.instant.length
          ? `${prefs.instant.map((t) => NOTIFICATION_TYPES[t].label).join("、")}会即时推送到这里，其余只进站内通知中心，并汇总进周报。`
          : "已关闭全部即时提醒，只有周报会推送到这里。"}
      </p>
    </div>
  );
}

export function WechatMenu({ person }: { person: Person }) {
  return (
    <div className="grid shrink-0 grid-cols-3 border-t border-gray-300/70 bg-[#f7f7f7] text-center text-sm text-gray-800">
      <Link href={`/u/${person.handle}`} className="py-3 hover:bg-gray-100">
        我的主页
      </Link>
      <Link href="/discover" className="border-x border-gray-300/70 py-3 hover:bg-gray-100">
        发现
      </Link>
      <Link href="/digest" className="py-3 hover:bg-gray-100">
        提醒设置
      </Link>
    </div>
  );
}
