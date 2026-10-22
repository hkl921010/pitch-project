"use client";

import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CalendarDays,
  Eye,
  ExternalLink,
  Globe,
  Link2,
  LayoutDashboard,
  Lock,
  MapPin,
  Newspaper,
  PenLine,
  Plus,
  Radio,
  Share2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, type ReactNode } from "react";

import { EndorsementBlock } from "@/components/biz/endorse";
import { FeedbackSection } from "@/components/biz/feedback-section";
import { FollowButton } from "@/components/biz/follow-button";
import { Gallery } from "@/components/biz/gallery";
import { IntentBar, IntentCard } from "@/components/biz/intent-card";
import { ListedIn } from "@/components/biz/list-card";
import { NEED_ICON, NEED_TONE, needLabel } from "@/components/biz/looking-for";
import { KnownSignal, ProjectRow } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, Cover, EmptyState, ProgressRing, ProjectLogo, Tag, Tooltip } from "@/components/ui/display";
import { UPDATE_TEMPLATES } from "@/data/constants";
import { formatDate, formatDateTime, relativeTime } from "@/data/time";
import type { IntentKind, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import {
  badgeDefs,
  canEditProject,
  canManageProject,
  endorsementsFor,
  eventStatus,
  followerCount,
  getPerson,
  getProjectBySlug,
  projectCompletion,
  roleText,
  useDB,
  useViewer,
} from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectView />
    </Suspense>
  );
}

function ProjectView() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const db = useDB();
  const viewer = useViewer();
  const recordView = useApp((s) => s.recordView);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const markSeen = useApp((s) => s.markWatchSeen);
  const toast = useApp((s) => s.toast);
  const openIntent = useApp((s) => s.openIntent);
  const project = getProjectBySlug(db, slug);
  const counted = useRef(false);
  useHashScroll([slug]);
  const isMember = !!viewer && !!project?.team.some((t) => t.personId === viewer.id && t.status === "confirmed");
  const watching = !!viewer && db.watch.some((w) => w.userId === viewer.id && w.projectId === project?.id);

  useEffect(() => {
    if (!project || counted.current) return;
    counted.current = true;
    if (!isMember) {
      const from = sp.get("from") as TrafficSource | null;
      recordView(project.id, from && SOURCES.includes(from) ? from : "direct");
    }
    if (watching) markSeen(project.id);
  }, [project, isMember, sp, recordView, watching, markSeen]);

  if (!project) notFound();
  const p = project;
  const owner = getPerson(db, p.ownerId);
  const canEdit = canEditProject(p, viewer?.id ?? null);
  const manage = canManageProject(p, viewer?.id ?? null);
  const team = p.team.filter((t) => t.status === "confirmed" || manage);
  const articles = db.articles.filter((a) => a.projectIds.includes(p.id));
  const events = db.events.filter((e) => e.projectIds.includes(p.id));
  const similar = db.projects
    .filter((x) => x.id !== p.id && x.visibility === "public" && x.wall === "approved" && (x.track === p.track || x.tags.some((t) => p.tags.includes(t))))
    .slice(0, 4);
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);

  const share = () => {
    navigator.clipboard?.writeText(`https://pitch.cn/p/${p.slug}?from=wechat`).catch(() => {});
    toast({ tone: "success", title: "链接已复制", body: "带来源标记，转发后能在工作台看到微信带来的浏览" });
  };

  return (
    <>
      {canEdit ? (
        <div className="border-b border-brand-200 bg-brand-25">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
            <div className="flex items-center gap-3">
              <ProgressRing value={comp.percent} size={36} stroke={4}>
                <span className="text-[10px]">{comp.percent}</span>
              </ProgressRing>
              <p className="text-sm text-gray-700">
                这是你的项目公开页，访客看到的就是这个样子。
                {p.visibility === "link" ? (
                  <Badge tone="gray" size="xs" icon={Lock} className="ml-2">
                    仅持链接可见
                  </Badge>
                ) : p.wall === "approved" ? (
                  <Badge tone="success" size="xs" className="ml-2">
                    已上发现页
                  </Badge>
                ) : p.wall === "pending" ? (
                  <Badge tone="warning" size="xs" className="ml-2">
                    上墙审核中
                  </Badge>
                ) : (
                  <Badge tone="gray" size="xs" className="ml-2">
                    未上发现页
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button size="sm" variant="secondary" iconLeft={PenLine} href={`/p/${p.slug}/edit`}>
                编辑资料
              </Button>
              {manage ? (
                <Button size="sm" variant="primary" iconLeft={LayoutDashboard} href={`/dashboard/${p.slug}`}>
                  工作台
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <Page className="pb-28 lg:pb-8">
        <Gallery items={p.gallery} coverTone={p.coverTone} editableHref={canEdit ? `/p/${p.slug}/edit#gallery` : undefined} />

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="2xl" className="relative z-10 -mt-16 ring-4 ring-white sm:-mt-14" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">{p.name}</h1>
              {badges.map((b) => (
                <Tooltip key={b.id} content={b.desc}>
                  <Badge tone={b.tone}>{b.label}</Badge>
                </Tooltip>
              ))}
            </div>
            <p className="mt-1.5 text-lg text-gray-600">{p.oneLiner}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <Tag>{p.track}</Tag>
              {p.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} />
                {p.region || "未填写地区"}
              </span>
              {p.website ? (
                <a className="inline-flex items-center gap-1 hover:text-brand-700" href={`https://${p.website}`} target="_blank" rel="noreferrer">
                  <Globe size={14} />
                  {p.website}
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Users size={14} />
                {followerCount(db, "project", p.id)} 关注
              </span>
            </div>
            <KnownSignal targetType="project" targetId={p.id} className="mt-3" />
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMember ? <FollowButton targetType="project" targetId={p.id} size="md" /> : null}
            {viewer?.role === "investor" ? (
              <Button
                variant="secondary"
                iconLeft={watching ? BookmarkCheck : Bookmark}
                onClick={() => {
                  toggleWatch(p.id);
                  toast({ tone: "success", title: watching ? "已移出观察清单" : "已加入观察清单", body: watching ? undefined : "项目更新时会提醒你，可以在清单里写私人备注" });
                }}
              >
                {watching ? "已在观察清单" : "加入观察清单"}
              </Button>
            ) : null}
            <Button variant="secondary" iconOnly={Share2} aria-label="分享" onClick={share} />
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-10">
            <Section id="looking" title="正在寻找" desc="直接表达意向，对方接受后即可站内对话">
              {p.lookingFor.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {p.lookingFor.map((n) => {
                    const Icon = NEED_ICON[n.kind];
                    return (
                      <div key={n.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
                        <div className="flex items-start gap-3">
                          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border", NEED_TONE[n.kind])}>
                            <Icon size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-500">{needLabel(n)}</p>
                            <p className="font-semibold text-gray-900">{n.title}</p>
                            {n.detail ? <p className="mt-0.5 text-sm text-gray-600">{n.detail}</p> : null}
                          </div>
                        </div>
                        {!isMember ? (
                          <Button
                            size="xs"
                            variant="secondary"
                            className="self-start"
                            onClick={() => openIntent({ type: "project", projectId: p.id, presetKind: (n.kind === "help" ? "partner" : n.kind) as IntentKind, needId: n.id })}
                          >
                            {n.kind === "invest" ? "我想投资" : n.kind === "join" ? "我想加入" : "我能帮上忙"}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#looking`} title="还没写正在寻找什么" cta="写下正在寻找" desc="写清楚要融资、渠道还是合伙人，对的人才会来找你" />
              )}
            </Section>

            <Section id="about" title="关于项目">
              {p.intro || p.product || p.edge ? (
                <div className="flex flex-col gap-6">
                  {[
                    { title: "在做什么", body: p.intro },
                    { title: "在卖什么", body: p.product },
                    { title: "凭什么", body: p.edge },
                  ]
                    .filter((x) => x.body)
                    .map((x) => (
                      <div key={x.title}>
                        <h3 className="text-sm font-semibold text-gray-900">{x.title}</h3>
                        <p className="mt-1.5 text-[15px] leading-7 whitespace-pre-line text-gray-700">{x.body}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#about`} title="项目介绍还是空的" cta="补充介绍" desc="上传 BP，AI 可以帮你一键生成" />
              )}
            </Section>

            <Section id="team" title="团队" desc="成员确认后，项目会出现在TA的个人主页上">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {team.map((m) => {
                  const person = getPerson(db, m.personId);
                  if (!person) return null;
                  return (
                    <Link key={m.personId} href={`/u/${person.handle}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300">
                      <Avatar name={person.name} tone={person.avatarTone} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold text-gray-900">
                          {person.name}
                          {m.status === "invited" ? (
                            <Badge tone="warning" size="xs">
                              待TA确认
                            </Badge>
                          ) : null}
                        </p>
                        <p className="truncate text-sm text-gray-500">{m.title}</p>
                        <p className="truncate text-xs text-gray-400">{roleText(person)}</p>
                      </div>
                    </Link>
                  );
                })}
                {manage ? (
                  <Link href={`/dashboard/${p.slug}?tab=team`} className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 p-4 text-sm font-semibold text-gray-600 hover:border-brand-300 hover:text-brand-700">
                    <Plus size={16} />
                    邀请成员
                  </Link>
                ) : null}
              </div>
            </Section>

            {p.jobs.length ? (
              <Section id="jobs" title="在招岗位" desc={`${p.jobs.length} 个岗位`}>
                <div className="flex flex-col divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
                  {p.jobs.map((j) => (
                    <div key={j.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <Briefcase size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">
                          {j.title}
                          <Badge tone={j.type === "合伙人" ? "highlight" : "gray"} size="xs" className="ml-2">
                            {j.type}
                          </Badge>
                        </p>
                        <p className="text-sm text-gray-500">
                          {j.location} · {j.desc}
                        </p>
                      </div>
                      {!isMember ? (
                        <Button size="sm" variant="secondary" onClick={() => openIntent({ type: "project", projectId: p.id, presetKind: "join", jobId: j.id })}>
                          我想加入
                        </Button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            <Section
              id="updates"
              title="动态"
              desc="项目的每一步进展，关注者和观察清单会收到提醒"
              action={
                canEdit ? (
                  <Button size="sm" variant="secondary" iconLeft={Plus} href={`/dashboard/${p.slug}?tab=updates`}>
                    发布动态
                  </Button>
                ) : null
              }
            >
              {p.updates.length ? (
                <ol className="relative flex flex-col gap-6 border-l border-gray-200 pl-6">
                  {p.updates.map((u) => {
                    const author = getPerson(db, u.authorId);
                    return (
                      <li key={u.id} className="relative">
                        <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <Badge tone="brand" size="xs">
                            {UPDATE_TEMPLATES[u.template].label}
                          </Badge>
                          <span>{formatDate(u.at)}</span>
                          <span>· {author?.name}</span>
                        </div>
                        <p className="mt-1.5 font-semibold text-gray-900">{u.title}</p>
                        <p className="mt-1 text-[15px] text-gray-700">{u.body}</p>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/dashboard/${p.slug}?tab=updates`} title="还没有动态" cta="发第一条动态" desc="用模板 30 秒发一条：上线、融资、招人、获奖、数据里程碑" />
              )}
            </Section>

            <Section id="endorse" title="背书" desc="署名、按维度计数，只有正向信号">
              <EndorsementBlock targetType="project" targetId={p.id} targetName={p.name} canEndorse={!isMember} />
            </Section>

            <Section id="feedback" title="建议区" desc="给项目提建议，默认只有项目方能看到">
              <FeedbackSection project={p} />
            </Section>

            {articles.length ? (
              <Section id="press" title="Pitch 报道">
                <div className="flex flex-col gap-3">
                  {articles.map((a) => (
                    <Link key={a.id} href={`/feed?tab=articles&article=${a.id}`} className="group flex gap-4 rounded-xl border border-gray-200 bg-white p-3 hover:border-gray-300">
                      <Cover tone={a.coverTone} className="h-20 w-32 shrink-0 rounded-lg" />
                      <div className="min-w-0 py-1">
                        <p className="text-xs font-medium text-brand-700">
                          <Newspaper size={12} className="mr-1 inline" />
                          {a.column}
                        </p>
                        <p className="mt-1 font-semibold text-gray-900 group-hover:text-brand-700">{a.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-sm text-gray-500">{a.summary}</p>
                      </div>
                      <ExternalLink size={16} className="ml-auto shrink-0 self-center text-gray-400" />
                    </Link>
                  ))}
                </div>
              </Section>
            ) : null}

            {events.length ? (
              <Section id="events" title="参与的活动">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {events.map((e) => {
                    const st = eventStatus(e);
                    return (
                      <Link key={e.id} href={`/events/${e.id}`} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 hover:border-gray-300">
                        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", st === "live" ? "bg-error-50 text-error-600" : "bg-gray-100 text-gray-600")}>
                          {st === "live" ? <Radio size={18} /> : <CalendarDays size={18} />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{e.title}</p>
                          <p className="text-xs text-gray-500">
                            {st === "live" ? "正在直播" : st === "upcoming" ? formatDateTime(e.start) : `${formatDate(e.start)} 已结束`} · {e.kind === "online" ? "线上" : e.city}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </Section>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="hidden lg:block">
              <div className="flex flex-col gap-6 lg:sticky lg:top-24">
                <IntentCard project={p} />
                <StatsMini project={p} />
              </div>
            </div>
            <div className="lg:hidden">
              <StatsMini project={p} />
            </div>
            <ListedIn targetId={p.id} />
            {similar.length ? (
              <Card>
                <p className="mb-4 text-sm font-semibold text-gray-900">相似项目</p>
                <div className="flex flex-col gap-4">
                  {similar.map((s) => (
                    <ProjectRow key={s.id} project={s} meta={`${s.track} · ${followerCount(db, "project", s.id)} 关注`} />
                  ))}
                </div>
              </Card>
            ) : null}
            {owner ? (
              <p className="text-center text-xs text-gray-400">
                {formatDate(p.createdAt)} 创建 · 由 {owner.name} 维护 ·{" "}
                <button onClick={share} className="inline-flex items-center gap-0.5 hover:text-gray-600">
                  <Link2 size={12} />
                  复制链接
                </button>
              </p>
            ) : null}
          </aside>
        </div>
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function StatsMini({ project: p }: { project: Project }) {
  const db = useDB();
  const views = p.stats.views.reduce((a, b) => a + b, 0);
  return (
    <Card className="grid grid-cols-3 divide-x divide-gray-100 p-0" padded={false}>
      {[
        { label: "关注", value: followerCount(db, "project", p.id) },
        { label: "背书", value: endorsementsFor(db, "project", p.id).length },
        { label: "近两周浏览", value: views, icon: Eye },
      ].map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-semibold text-gray-900 tabular-nums">{s.value}</span>
          <span className="text-xs text-gray-500">{s.label}</span>
        </div>
      ))}
    </Card>
  );
}

function Section({ id, title, desc, action, children }: { id: string; title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {desc ? <p className="mt-0.5 text-sm text-gray-500">{desc}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyBox({ canEdit, href, title, desc, cta }: { canEdit: boolean; href: string; title: string; desc: string; cta: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white">
      <EmptyState compact icon={canEdit ? PenLine : Eye} title={canEdit ? title : "项目方还没有填写"} desc={canEdit ? desc : "关注项目，更新时会通知你"} action={canEdit ? <Button size="sm" variant="primary" href={href}>{cta}</Button> : null} />
    </div>
  );
}
