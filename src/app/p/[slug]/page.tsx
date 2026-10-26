"use client";

import { Bookmark, BookmarkCheck, ChevronDown, Eye, Globe, Link2, LayoutDashboard, Lock, MapPin, PenLine, Plus, Share2, Users } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { ProjectAirbnbDetail } from "@/app/p/[slug]/airbnb/page";
import { ProjectLumaDetail } from "@/app/p/[slug]/luma/page";
import { ProjectMiniDetail } from "@/app/p/[slug]/mini/page";
import { ProjectPeerDetail } from "@/app/p/[slug]/peer/page";
import { ProjectPlainDetail } from "@/app/p/[slug]/plain/page";
import { ProjectReadDetail } from "@/app/p/[slug]/read/page";
import { IntentBar, IntentCard } from "@/components/biz/intent-card";
import { needIcon, needLabel, needTone, serviceAction } from "@/components/biz/looking-for";
import { KnownSignal, ProjectRow } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Avatar, Badge, Card, EmptyState, ProgressRing, ProjectLogo, Tag, Tooltip } from "@/components/ui/display";
import { TONES } from "@/data/constants";
import { formatDate } from "@/data/time";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { badgeDefs, canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, projectCompletion, roleText, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];
const LAYOUTS = ["now", "plain", "mini", "peer", "luma", "read", "airbnb"] as const;
type DetailLayout = (typeof LAYOUTS)[number];

export default function ProjectPage() {
  return (
    <Suspense>
      <ProjectView />
    </Suspense>
  );
}

function ProjectView() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const layoutParam = sp.get("layout");
  const layout: DetailLayout = LAYOUTS.includes(layoutParam as DetailLayout) ? (layoutParam as DetailLayout) : "now";
  const setLayout = (next: DetailLayout) => {
    const params = new URLSearchParams(sp.toString());
    if (next === "now") params.delete("layout");
    else params.set("layout", next);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
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
  const cooperations = p.lookingFor.filter((n) => n.coop);
  const services = p.lookingFor.filter((n) => n.service);
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
        <div className="sticky top-16 z-30 -mx-4 mb-6 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
          <Segmented<DetailLayout>
            value={layout}
            onChange={setLayout}
            items={[
              { value: "now", label: "现在这版" },
              { value: "plain", label: "简介亮点" },
              { value: "mini", label: "小程序" },
              { value: "peer", label: "Peerlist" },
              { value: "luma", label: "Luma" },
              { value: "read", label: "Read.cv" },
              { value: "airbnb", label: "Airbnb" },
            ]}
          />
        </div>
        {layout === "now" ? (
          <>
        <IntroHero
          project={p}
          badges={badges}
          followers={followerCount(db, "project", p.id)}
          canEdit={canEdit}
          isMember={isMember}
          watching={watching}
          showWatch={viewer?.role === "investor"}
          onWatch={() => {
            toggleWatch(p.id);
            toast({ tone: "success", title: watching ? "已移出观察清单" : "已加入观察清单", body: watching ? undefined : "项目更新时会提醒你，可以在清单里写私人备注" });
          }}
          onShare={share}
        />

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex min-w-0 flex-col gap-10">
            <ProjectAbout project={p} />

            <Section id="looking" title="寻找合作" desc="点开看找谁、怎么合作。">
              {cooperations.length ? (
                <div className="flex flex-col gap-4">
                  {cooperations.map((n) => (
                    <NeedArticle
                      key={n.id}
                      need={n}
                      payLabel="怎么合作"
                      action={isMember ? undefined : coopAction(n)}
                      onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: (n.kind === "help" ? "partner" : n.kind) as IntentKind, needId: n.id })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#looking`} title="还没写寻找合作" cta="写下合作" desc="写清要供应链、渠道还是融资，以及怎么合作" />
              )}
            </Section>

            {services.length || canEdit ? (
              <Section id="services" title="寻找服务" desc="自己花钱买的。点开看要什么、怎么收费。">
                {services.length ? (
                  <div className="flex flex-col gap-4">
                    {services.map((n) => (
                      <NeedArticle
                        key={n.id}
                        need={n}
                        payLabel="怎么收费"
                        action={isMember || !n.service ? undefined : serviceAction(n.service)}
                        onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: "partner", needId: n.id })}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#services`} title="还没写寻找服务" cta="写下服务" desc="比如找朋友介绍、新媒体代运营，或招人" />
                )}
              </Section>
            ) : null}

            <Section id="team" title="团队" desc="成员确认后，项目会出现在 TA 的个人主页上">
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
          </>
        ) : layout === "plain" ? (
          <ProjectPlainDetail />
        ) : layout === "mini" ? (
          <ProjectMiniDetail />
        ) : layout === "peer" ? (
          <ProjectPeerDetail />
        ) : layout === "luma" ? (
          <ProjectLumaDetail />
        ) : layout === "read" ? (
          <ProjectReadDetail />
        ) : (
          <ProjectAirbnbDetail />
        )}
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

/** 一条合作或服务。收起只看标题和一句话；点开才看找谁、怎么合作。地址带 #need-id 时直接打开。 */
function NeedArticle({ need: n, payLabel, action, onAction }: { need: NeedItem; payLabel: string; action?: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === `need-${n.id}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [n.id]);
  const Icon = needIcon(n);
  return (
    <article id={`need-${n.id}`} className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", needTone(n))}>
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="text-xs text-gray-500">{needLabel(n)}</span>
          <span className="mt-0.5 block text-base font-semibold text-gray-900">{n.title}</span>
          {n.summary ? <span className="mt-0.5 block truncate text-sm text-gray-600">{n.summary}</span> : null}
        </span>
        <ChevronDown size={18} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-gray-100 sm:grid-cols-2">
            <Fact label="找谁" text={n.detail || "还没写找谁。"} />
            <Fact label={payLabel} text={n.terms || "还没写。"} />
          </div>
          {n.story ? <p className="mt-3 text-sm leading-6 whitespace-pre-line text-gray-600">{n.story}</p> : null}
          {n.storyImages?.length ? (
            <div className="mt-3 grid grid-cols-1 gap-3">
              {n.storyImages.map((img) => (
                <figure key={img.src} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <img src={img.src} alt={img.caption} className="w-full" />
                  <figcaption className="px-3 py-2 text-sm text-gray-600">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          {action ? (
            <Button size="sm" variant="primary" className="mt-4" onClick={onAction}>
              {action}
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function Fact({ label, text }: { label: string; text: string }) {
  return (
    <div className="bg-gray-50 px-3.5 py-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-900">{text}</p>
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

/** 项目简介。有长文或图片才出现，放在寻找合作前面。默认收起，点开才看；地址带 #profile 时直接打开。 */
function ProjectAbout({ project: p }: { project: Project }) {
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
  const preview = (p.profile ?? "").split("\n").map((line) => line.trim()).find(Boolean) ?? "点开看项目图片";
  return (
    <section id="profile" className="scroll-mt-24 overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <button type="button" className="flex w-full items-center gap-3 px-4 py-4 text-left sm:px-5" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-gray-900">项目简介</span>
          {open ? null : <span className="mt-0.5 block truncate text-sm text-gray-500">{preview}</span>}
        </span>
        {!open && images.length ? (
          <span className="hidden shrink-0 items-center gap-1 sm:flex" aria-hidden>
            {images.slice(0, 3).map((g) => (
              <img key={g.id} src={g.image} alt="" className="h-10 w-14 rounded-md object-cover" />
            ))}
          </span>
        ) : null}
        <ChevronDown size={18} className={cn("shrink-0 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="border-t border-gray-100 px-4 py-4 sm:px-5">
          {p.profile ? <p className="text-sm leading-6 whitespace-pre-line text-gray-800">{p.profile}</p> : null}
          {images.length ? (
            <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", p.profile && "mt-4")}>
              {images.map((g) => (
                <figure key={g.id} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                  <img src={g.image} alt={g.caption} className="w-full" />
                  <figcaption className="bg-white px-3 py-2 text-sm text-gray-600">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function IntroHero({
  project: p,
  badges,
  followers,
  canEdit,
  isMember,
  watching,
  showWatch,
  onWatch,
  onShare,
}: {
  project: Project;
  badges: { id: string; label: string; desc: string; tone: "gray" | "brand" | "success" | "warning" | "error" | "blue" | "highlight" | "dark" }[];
  followers: number;
  canEdit: boolean;
  isMember: boolean;
  watching: boolean;
  showWatch: boolean;
  onWatch: () => void;
  onShare: () => void;
}) {
  const tone = TONES[p.coverTone % TONES.length];
  const about = [
    { title: "在做什么", body: p.intro },
    { title: "在卖什么", body: p.product },
    { title: "凭什么", body: p.edge },
  ].filter((x) => x.body);
  return (
    <section className="overflow-hidden rounded-2xl" style={{ background: `linear-gradient(135deg, ${tone.from} 0%, ${tone.to} 100%)` }}>
      <div className="flex flex-col gap-6 p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <ProjectLogo text={p.logoText} tone={p.logoTone} image={p.logoImage} size="2xl" className="ring-4 ring-white/80" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{p.name}</h1>
              {badges.map((b) => (
                <Tooltip key={b.id} content={b.desc}>
                  <Badge tone={b.tone}>{b.label}</Badge>
                </Tooltip>
              ))}
            </div>
            <p className="mt-1.5 text-lg text-white/90">{p.oneLiner}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
              <Tag>{p.track}</Tag>
              {p.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              <span className="inline-flex items-center gap-1">
                <MapPin size={14} />
                {p.region || "未填写地区"}
              </span>
              {p.website ? (
                <a className="inline-flex items-center gap-1 hover:text-white" href={`https://${p.website}`} target="_blank" rel="noreferrer">
                  <Globe size={14} />
                  {p.website}
                </a>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Users size={14} />
                {followers} 关注
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isMember ? <FollowButton targetType="project" targetId={p.id} size="md" /> : null}
            {showWatch ? (
              <Button variant="secondary" iconLeft={watching ? BookmarkCheck : Bookmark} onClick={onWatch}>
                {watching ? "已在观察清单" : "加入观察清单"}
              </Button>
            ) : null}
            <Button variant="secondary" iconOnly={Share2} aria-label="分享" onClick={onShare} />
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 sm:p-6">
          {about.length ? (
            <div className="flex flex-col gap-5">
              {about.map((x) => (
                <div key={x.title}>
                  <h2 className="text-sm font-semibold text-gray-900">{x.title}</h2>
                  <p className="mt-1.5 text-[15px] leading-7 whitespace-pre-line text-gray-700">{x.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyBox canEdit={canEdit} href={`/p/${p.slug}/edit#about`} title="项目介绍还是空的" cta="补充介绍" desc="先写清在做什么、在卖什么、凭什么" />
          )}
          <KnownSignal targetType="project" targetId={p.id} className="mt-5" />
        </div>
      </div>
    </section>
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
