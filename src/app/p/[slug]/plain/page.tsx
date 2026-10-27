"use client";

/**
 * 项目详情的第二版：白底，说法是简介、项目亮点、为什么是我们。
 * 单独打开是 /p/[slug]/plain。项目页里也会嵌在下面，嵌进去时不再重复记浏览。
 * 带 #need-id 或 #profile 时，单独打开的这一页会展开对应块。
 */

import { Bookmark, BookmarkCheck, ChevronDown, Eye, Globe, Link2, LayoutDashboard, Lock, MapPin, PenLine, Plus, Share2, Users } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { createContext, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { IntentBar, IntentCard } from "@/components/biz/intent-card";
import { needLabel, serviceAction } from "@/components/biz/looking-for";
import { KnownSignal, ProjectRow } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, ProgressRing, ProjectLogo, Tag, Tooltip } from "@/components/ui/display";
import { formatDate } from "@/data/time";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { badgeDefs, canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, projectCompletion, roleText, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];
const Embed = createContext(false);

export default function ProjectAltPage() {
  return (
    <Suspense>
      <AltView />
    </Suspense>
  );
}

/** 嵌进项目页时用，不再包一层页面，也不再记一次浏览。 */
export function ProjectPlainDetail() {
  return <AltView embed />;
}

function AltView({ embed = false }: { embed?: boolean }) {
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
    if (embed || !project || counted.current) return;
    counted.current = true;
    if (!isMember) {
      const from = sp.get("from") as TrafficSource | null;
      recordView(project.id, from && SOURCES.includes(from) ? from : "direct");
    }
    if (watching) markSeen(project.id);
  }, [embed, project, isMember, sp, recordView, watching, markSeen]);

  if (!project) {
    if (embed) return null;
    notFound();
  }
  const p = project;
  const owner = getPerson(db, p.ownerId);
  const canEdit = canEditProject(p, viewer?.id ?? null);
  const manage = canManageProject(p, viewer?.id ?? null);
  const team = p.team.filter((t) => t.status === "confirmed" || manage);
  const cooperations = p.lookingFor.filter((n) => n.coop);
  const services = p.lookingFor.filter((n) => n.service);
  const similar = db.projects
    .filter((x) => x.id !== p.id && x.visibility === "public" && x.wall === "approved" && (x.track === p.track || x.tags.some((t) => p.tags.includes(t))))
    .slice(0, 4);
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);
  const highlights = p.highlights?.filter(Boolean) ?? [];

  const share = () => {
    navigator.clipboard?.writeText(`https://pitch.cn/p/${p.slug}?from=wechat`).catch(() => {});
    toast({ tone: "success", title: "链接已复制", body: "带来源标记，转发后能在工作台看到微信带来的浏览" });
  };

  const sheet = (
    <Embed.Provider value={embed}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <header className="flex flex-col gap-5 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <ProjectLogo text={p.logoText} tone={p.logoTone} image={p.logoImage} size="xl" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{p.name}</h1>
                    {badges.map((b) => (
                      <Tooltip key={b.id} content={b.desc}>
                        <Badge tone={b.tone}>{b.label}</Badge>
                      </Tooltip>
                    ))}
                  </div>
                  <p className="mt-1.5 text-base text-gray-600">{p.oneLiner}</p>
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
                      <a className="inline-flex items-center gap-1 hover:text-gray-800" href={`https://${p.website}`} target="_blank" rel="noreferrer">
                        <Globe size={14} />
                        {p.website}
                      </a>
                    ) : null}
                    <span className="inline-flex items-center gap-1">
                      <Users size={14} />
                      {followerCount(db, "project", p.id)} 关注
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isMember ? <FollowButton targetType="project" targetId={p.id} size="md" /> : null}
                  {viewer?.role === "investor" ? (
                    <Button variant="secondary" iconLeft={watching ? BookmarkCheck : Bookmark} onClick={() => {
                      toggleWatch(p.id);
                      toast({ tone: "success", title: watching ? "已移出观察清单" : "已加入观察清单", body: watching ? undefined : "项目更新时会提醒你，可以在清单里写私人备注" });
                    }}>
                      {watching ? "已在观察清单" : "加入观察清单"}
                    </Button>
                  ) : null}
                  <Button variant="secondary" iconOnly={Share2} aria-label="分享" onClick={share} />
                </div>
              </div>
              <KnownSignal targetType="project" targetId={p.id} />
            </header>

            <Block title="简介">
              {p.intro || p.product ? (
                <div className="flex flex-col gap-4">
                  {p.intro ? <p className="text-sm leading-6 whitespace-pre-line text-gray-800">{p.intro}</p> : null}
                  {p.product ? (
                    <div>
                      <p className="text-xs text-gray-400">产品</p>
                      <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-800">{p.product}</p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#about`} title="简介还是空的" cta="去写简介" desc="先用几句话讲清这个项目是做什么的" />
              )}
            </Block>

            {highlights.length || p.edge ? (
              <div className="grid grid-cols-1 border-t border-gray-100 sm:grid-cols-2">
                {highlights.length ? (
                  <Block title="项目亮点" className={cn("border-t-0", p.edge ? "sm:border-r sm:border-gray-100" : "sm:col-span-2")}>
                    <ol className="flex flex-col gap-3">
                      {highlights.map((item, i) => (
                        <li key={item} className="flex gap-3 text-sm leading-6 text-gray-800">
                          <span className="w-5 shrink-0 tabular-nums text-gray-400">{String(i + 1).padStart(2, "0")}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </Block>
                ) : null}
                {p.edge ? (
                  <Block title="为什么是我们" className={highlights.length ? "sm:border-t-0" : "border-t-0 sm:col-span-2"}>
                    <p className="text-sm leading-6 whitespace-pre-line text-gray-800">{p.edge}</p>
                  </Block>
                ) : null}
              </div>
            ) : null}

            <More project={p} />

            <Block title="合作方式" desc="每条都能直接发起，点开再看条件。">
              {cooperations.length ? (
                <div className="-mx-5 sm:-mx-7">
                  {cooperations.map((n) => (
                    <DealRow
                      key={n.id}
                      need={n}
                      rightLabel="合作条件"
                      leftLabel="合作对象"
                      action={isMember ? undefined : coopAction(n)}
                      onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: (n.kind === "help" ? "partner" : n.kind) as IntentKind, needId: n.id })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#looking`} title="还没写合作方式" cta="去写" desc="写清要供应链、渠道还是融资" />
              )}
            </Block>

            {services.length || canEdit ? (
              <Block title="需要的服务" desc="自己出钱买的。每条都能直接发起，点开再看怎么收费。">
                {services.length ? (
                  <div className="-mx-5 sm:-mx-7">
                    {services.map((n) => (
                      <DealRow
                        key={n.id}
                        need={n}
                        rightLabel="收费方式"
                        leftLabel="要做什么"
                        action={isMember || !n.service ? undefined : serviceAction(n.service)}
                        onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: "partner", needId: n.id })}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#services`} title="还没写需要的服务" cta="去写" desc="比如找朋友介绍、新媒体，或招人" />
                )}
              </Block>
            ) : null}

            <Block title="团队" desc="确认之后，项目会出现在成员的个人主页上。">
              <div className="flex flex-col">
                {team.map((m) => {
                  const person = getPerson(db, m.personId);
                  if (!person) return null;
                  return (
                    <Link key={m.personId} href={`/u/${person.handle}`} className="flex items-center gap-3 border-t border-gray-100 py-3 first:border-t-0 first:pt-0">
                      <Avatar name={person.name} tone={person.avatarTone} size="md" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          {person.name}
                          {m.status === "invited" ? (
                            <Badge tone="warning" size="xs">
                              待确认
                            </Badge>
                          ) : null}
                        </span>
                        <span className="block truncate text-sm text-gray-500">{m.title}</span>
                      </span>
                      <span className="hidden text-xs text-gray-400 sm:block">{roleText(person)}</span>
                    </Link>
                  );
                })}
                {manage ? (
                  <Link href={`/dashboard/${p.slug}?tab=team`} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900">
                    <Plus size={14} />
                    邀请成员
                  </Link>
                ) : null}
              </div>
            </Block>
          </article>

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
    </Embed.Provider>
  );

  if (embed) return sheet;

  return (
    <>
      {canEdit ? (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
            <div className="flex items-center gap-3">
              <ProgressRing value={comp.percent} size={36} stroke={4}>
                <span className="text-[10px]">{comp.percent}</span>
              </ProgressRing>
              <p className="text-sm text-gray-700">
                这是简介亮点这一版，数据还是这一份。
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
        <div className="mb-4 text-sm">
          <Link href={`/p/${p.slug}?layout=plain`} className="text-gray-500 hover:text-gray-900">
            回到项目页切换
          </Link>
        </div>
        {sheet}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function Block({ title, desc, className, children }: { title: string; desc?: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("border-t border-gray-100 px-5 py-6 sm:px-7", className)}>
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      {desc ? <p className="mt-0.5 text-xs text-gray-400">{desc}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** 更长的介绍和图片。默认收起，地址带 #profile 时打开。 */
function More({ project: p }: { project: Project }) {
  const images = p.gallery.filter((g) => g.image);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === "profile") setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  if (!p.profile && !images.length) return null;
  const preview = (p.profile ?? "").split("\n").map((line) => line.trim()).find(Boolean) ?? "点开看图片";
  return (
    <section id="profile" className="scroll-mt-24 border-t border-gray-100">
      <button type="button" className="flex w-full items-center gap-3 px-5 py-4 text-left sm:px-7" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-900">补充说明</span>
          {open ? null : <span className="mt-0.5 block truncate text-sm text-gray-500">{preview}</span>}
        </span>
        <ChevronDown size={16} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="px-5 pb-6 sm:px-7">
          {p.profile ? <p className="text-sm leading-6 whitespace-pre-line text-gray-800">{p.profile}</p> : null}
          {images.length ? (
            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", p.profile && "mt-4")}>
              {images.map((g) => (
                <figure key={g.id} className="overflow-hidden rounded-lg border border-gray-200">
                  <img src={g.image} alt={g.caption} className="w-full" />
                  <figcaption className="px-3 py-2 text-xs text-gray-500">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

/** 一条合作或服务。按钮一直露在外面；点开才看对象和条件。 */
function DealRow({
  need: n,
  leftLabel,
  rightLabel,
  action,
  onAction,
}: {
  need: NeedItem;
  leftLabel: string;
  rightLabel: string;
  action?: string;
  onAction: () => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === `need-${n.id}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [n.id]);
  return (
    <div id={`need-${n.id}`} className="scroll-mt-24 border-t border-gray-100 px-5 py-4 sm:px-7">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span className="w-20 shrink-0 pt-0.5 text-xs text-gray-400">{needLabel(n)}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-gray-900">{n.title}</span>
            {n.summary ? <span className="mt-0.5 block text-sm text-gray-600">{n.summary}</span> : null}
          </span>
        </div>
        {action ? (
          <Button size="sm" variant="primary" className="shrink-0" onClick={onAction}>
            {action}
          </Button>
        ) : null}
      </div>
      <button type="button" className="mt-2 ml-24 inline-flex items-center gap-1 text-xs text-gray-500" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        {open ? "收起" : "展开"}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 ml-24">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">{leftLabel}</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-800">{n.detail || "还没写。"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{rightLabel}</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-800">{n.terms || "还没写。"}</p>
            </div>
          </div>
          {n.story ? <p className="mt-3 text-sm leading-6 whitespace-pre-line text-gray-600">{n.story}</p> : null}
          {n.storyImages?.length ? (
            <div className="mt-3 grid grid-cols-1 gap-3">
              {n.storyImages.map((img) => (
                <figure key={img.src} className="overflow-hidden rounded-lg border border-gray-200">
                  <img src={img.src} alt={img.caption} className="w-full" />
                  <figcaption className="px-3 py-2 text-xs text-gray-500">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function coopAction(n: NeedItem) {
  if (n.sub === "点位") return "我想投这个点位";
  if (n.sub === "股权") return "我想聊股权";
  if (n.coop === "funding") return "我想聊这笔融资";
  if (n.coop === "supply") return "我能供货";
  if (n.coop === "channel") return "我有渠道";
  return "我能合作";
}

function StatsMini({ project: p }: { project: Project }) {
  const db = useDB();
  const views = p.stats.views.reduce((a, b) => a + b, 0);
  return (
    <Card className="grid grid-cols-3 divide-x divide-gray-100 p-0" padded={false}>
      {[
        { label: "关注", value: followerCount(db, "project", p.id) },
        { label: "合作", value: p.lookingFor.filter((n) => n.coop).length },
        { label: "近两周浏览", value: views },
      ].map((s) => (
        <div key={s.label} className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-semibold text-gray-900 tabular-nums">{s.value}</span>
          <span className="text-xs text-gray-500">{s.label}</span>
        </div>
      ))}
    </Card>
  );
}

function EmptyBox({ canEdit, href, title, desc, cta }: { canEdit: boolean; href: string; title: string; desc: string; cta: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-200">
      <EmptyState compact icon={canEdit ? PenLine : Eye} title={canEdit ? title : "项目方还没有填写"} desc={canEdit ? desc : "关注项目，更新时会通知你"} action={canEdit ? <Button size="sm" variant="primary" href={href}>{cta}</Button> : null} />
    </div>
  );
}
