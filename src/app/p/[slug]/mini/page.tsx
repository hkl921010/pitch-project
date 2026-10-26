"use client";

/**
 * 项目详情的第三版，排版对齐 Pitch 小程序。
 * 单独打开是 /p/[slug]/mini。项目页里也会嵌在下面，嵌进去时不再重复记浏览。
 * 带 #need-id 时展开对应合作；带 #profile 时展开「更多项目信息」。
 */

import { Bookmark, BookmarkCheck, ChevronUp, FileText, Globe, Handshake, Lightbulb, Link2, LayoutDashboard, Lock, Mail, MessageCircle, PenLine, Phone, Share2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { createContext, Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { IntentBar, IntentCard } from "@/components/biz/intent-card";
import { needLabel, serviceAction } from "@/components/biz/looking-for";
import { ProjectRow } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, ProgressRing, ProjectLogo } from "@/components/ui/display";
import { formatDate } from "@/data/time";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { badgeDefs, canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, projectCompletion, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];
const Embed = createContext(false);

/** 叠卡由浅到深，和子程序 expandable-detail-cards 的五档一致。 */
const STACK_TONES = [
  { bg: "bg-zinc-100", light: false },
  { bg: "bg-[hsl(240_5%_93%)]", light: false },
  { bg: "bg-[hsl(240_4%_85%)]", light: false },
  { bg: "bg-[hsl(60_2%_52%)]", light: true },
  { bg: "bg-zinc-900", light: true },
] as const;

export default function ProjectAltPage() {
  return (
    <Suspense>
      <AltView />
    </Suspense>
  );
}

/** 嵌进项目页时用，不再包一层页面，也不再记一次浏览。 */
export function ProjectMiniDetail() {
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
  const needs = p.lookingFor.filter((n) => n.coop || n.service);
  const images = p.gallery.filter((g) => g.image);
  const cards = projectCards(p);
  const tabs = [
    cards.length ? { id: "pdp-proj", label: "项目", icon: Lightbulb } : null,
    images.length ? { id: "pdp-files", label: "附件", icon: FileText } : null,
    needs.length ? { id: "pdp-coop", label: "合作", icon: Handshake } : null,
  ].filter((tab): tab is { id: string; label: string; icon: LucideIcon } => !!tab);
  const similar = db.projects
    .filter((x) => x.id !== p.id && x.visibility === "public" && x.wall === "approved" && (x.track === p.track || x.tags.some((t) => p.tags.includes(t))))
    .slice(0, 4);
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);
  const contacts: { key: string; icon: LucideIcon; label: string; value?: string; href?: string }[] = [
    { key: "phone", icon: Phone, label: "电话", value: p.contact.phone },
    { key: "wechat", icon: MessageCircle, label: "微信", value: p.contact.wechat },
    { key: "email", icon: Mail, label: "邮箱", value: p.contact.email },
    { key: "web", icon: Globe, label: "网站", value: p.website, href: p.website ? `https://${p.website}` : undefined },
  ];

  const share = () => {
    navigator.clipboard?.writeText(`https://pitch.cn/p/${p.slug}?from=wechat`).catch(() => {});
    toast({ tone: "success", title: "链接已复制", body: "带来源标记，转发后能在工作台看到微信带来的浏览" });
  };
  const copyContact = (item: (typeof contacts)[number]) => {
    if (!item.value) {
      toast({ tone: "info", title: `还没填${item.label}` });
      return;
    }
    if (item.href) {
      window.open(item.href, "_blank", "noopener,noreferrer");
      return;
    }
    navigator.clipboard?.writeText(item.value).catch(() => {});
    toast({ tone: "success", title: `已复制${item.label}`, body: item.value });
  };

  const grid = (
    <Embed.Provider value={embed}>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <header className="pb-7">
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-[26px] leading-tight font-bold text-gray-950">{p.name}</h1>
                    {badges.map((b) => (
                      <Badge key={b.id} tone={b.tone} size="xs">
                        {b.label}
                      </Badge>
                    ))}
                  </div>
                  {owner?.org ? <p className="mt-1.5 text-sm leading-snug text-gray-500">{owner.org}</p> : null}
                  <div className="mt-3 flex items-center gap-[11px]">
                    {contacts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button key={item.key} type="button" aria-label={item.label} title={item.value || `还没填${item.label}`} className={cn("text-gray-900", !item.value && "opacity-30")} onClick={() => copyContact(item)}>
                          <Icon size={20} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[19px] border border-gray-200 bg-gray-50 shadow-[0_3px_10px_rgba(0,0,0,0.1)]">
                  {p.logoImage || p.coverImage ? (
                    <img src={p.logoImage || p.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ProjectLogo text={p.logoText} tone={p.logoTone} size="xl" className="h-full w-full rounded-none" />
                  )}
                </div>
              </div>
              <p className={cn("mt-4 text-[15px] leading-snug", p.oneLiner ? "text-gray-900" : "text-gray-400")}>{p.oneLiner || "暂未填写一句话介绍"}</p>
            </header>

            <div className="h-px bg-gray-200" />

            <IntroText text={p.intro} />

            <div className="flex flex-wrap gap-2 py-3">
              <Chip>{p.track}</Chip>
              {p.tags.map((tag) => (
                <Chip key={tag}>{tag}</Chip>
              ))}
              {p.region ? <Chip>📍 {p.region}</Chip> : null}
            </div>

            {tabs.length > 1 ? <PillTabs tabs={tabs} /> : null}

            {cards.length ? (
              <section id="pdp-proj" className="scroll-mt-24 pt-3.5">
                <h2 className="py-3 text-base font-semibold text-gray-950">项目</h2>
                <StackCards cards={cards} />
              </section>
            ) : null}

            {images.length ? (
              <section id="pdp-files" className="scroll-mt-24 pt-3.5">
                <h2 className="pt-3 pb-1 text-base font-semibold tracking-tight text-gray-950">展示附件</h2>
                <p className="pb-3 text-sm leading-relaxed text-gray-400">品牌介绍、产品手册等对外展示资料。</p>
                <div className="grid grid-cols-3 gap-2.5 pb-1">
                  {images.map((image) => (
                    <figure key={image.id} className="aspect-square overflow-hidden rounded-[14px] border border-gray-200 bg-gray-50">
                      <img src={image.image} alt={image.caption} className="h-full w-full object-cover" />
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {needs.length ? (
              <section id="pdp-coop" className="scroll-mt-24 pt-3.5">
                <h2 className="pt-3 pb-3 text-base font-semibold tracking-tight text-gray-950">合作需求</h2>
                <div className="flex flex-col gap-2">
                  {needs.map((need) => (
                    <CoopBox
                      key={need.id}
                      need={need}
                      action={isMember ? undefined : need.service ? serviceAction(need.service) : coopAction(need)}
                      onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: (need.kind === "help" ? "partner" : need.kind) as IntentKind, needId: need.id })}
                    />
                  ))}
                </div>
              </section>
            ) : canEdit ? (
              <div className="mt-6 rounded-xl border border-dashed border-gray-200">
                <EmptyState compact icon={PenLine} title="还没写合作需求" desc="写清要供应链、渠道还是融资" action={<Button size="sm" variant="primary" href={`/p/${p.slug}/edit#looking`}>去写</Button>} />
              </div>
            ) : null}
          </div>

          <aside className="flex flex-col gap-6">
            <div className="hidden items-center gap-2 lg:flex">
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
                  {similar.map((item) => (
                    <ProjectRow key={item.id} project={item} meta={`${item.track} · ${followerCount(db, "project", item.id)} 关注`} />
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

  if (embed) return grid;

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
                这版按小程序的项目详情来排。
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
          <Link href={`/p/${p.slug}?layout=mini`} className="text-gray-500 hover:text-gray-900">
            回到项目页切换
          </Link>
        </div>
        {grid}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

/** 小程序首页简介：默认三行，超出才出现「更多」。 */
function IntroText({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || open) return;
    setOverflow(el.scrollHeight > el.clientHeight + 2);
  }, [text, open]);
  return (
    <div className="pt-4">
      <p ref={ref} className={cn("text-sm leading-[1.82] break-words whitespace-pre-line text-gray-600", !open && "line-clamp-3")}>
        {text || "暂未填写项目简介"}
      </p>
      {text && overflow ? (
        <button type="button" className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-gray-700" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : "更多"}
          <ChevronUp size={14} className={cn("transition-transform", !open && "rotate-180")} />
        </button>
      ) : null}
    </div>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-zinc-100 px-3 py-1 text-xs text-gray-700">{children}</span>;
}

function PillTabs({ tabs }: { tabs: { id: string; label: string; icon: LucideIcon }[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  return (
    <div className="sticky top-16 z-20 -mx-1 flex gap-1 bg-white/95 py-1.5 backdrop-blur">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            className="flex items-center gap-1 px-2 py-2 text-sm text-gray-900"
            onClick={() => {
              setActive(tab.id);
              document.getElementById(tab.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            <Icon size={18} />
            <span className="relative font-medium">
              {tab.label}
              {on ? <span className="absolute right-[-2px] bottom-0 left-[-2px] -z-10 h-1.5 -rotate-3 rounded-sm bg-highlight" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function projectCards(p: Project) {
  const advantage = [p.edge, ...(p.highlights ?? [])].map((line) => line.trim()).filter(Boolean).join("\n");
  const cards = [
    advantage ? { id: "advantage", emoji: "🏆", title: "独特优势 + 主要成就", body: advantage } : null,
    p.product.trim() ? { id: "product", emoji: "📦", title: "核心产品 + 市场价", body: p.product } : null,
    p.profile?.trim() ? { id: "profile", emoji: "✨", title: "更多项目信息", body: p.profile } : null,
  ];
  return cards.filter((card): card is { id: string; emoji: string; title: string; body: string } => !!card);
}

function toneAt(index: number, total: number) {
  if (total <= 1) return STACK_TONES[0];
  const picked = Math.round((index * (STACK_TONES.length - 1)) / (total - 1));
  return STACK_TONES[Math.min(picked, STACK_TONES.length - 1)];
}

/** 叠在一起的项目卡片。点一张展开正文，后面的卡片盖住前面一张的下沿。 */
function StackCards({ cards }: { cards: { id: string; emoji: string; title: string; body: string }[] }) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === "profile") setOpenIds((ids) => (ids.includes("profile") ? ids : [...ids, "profile"]));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <div className="mb-4 flex flex-col">
      {cards.map((card, index) => {
        const open = openIds.includes(card.id);
        const last = index === cards.length - 1;
        const tone = toneAt(index, cards.length);
        return (
          <button
            key={card.id}
            id={card.id === "profile" ? "profile" : undefined}
            type="button"
            style={{ zIndex: index + 1 }}
            className={cn(
              "relative px-4 pt-5 text-left transition-[margin,padding] duration-300",
              "rounded-t-[24px]",
              last && "rounded-b-[24px]",
              !last && !open && "-mb-7 pb-10",
              !last && open && "-mb-4 pb-8",
              last && "pb-5",
              tone.bg,
              tone.light ? "text-white" : "text-gray-950",
            )}
            aria-expanded={open}
            onClick={() => setOpenIds((ids) => (ids.includes(card.id) ? ids.filter((id) => id !== card.id) : [...ids, card.id]))}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className="text-sm leading-none">{card.emoji}</span>
                <span className="truncate text-[15px] font-medium">{card.title}</span>
              </span>
              <ChevronUp size={18} className={cn("shrink-0 opacity-35 transition-transform", open && "rotate-180 opacity-60")} />
            </span>
            {open ? <span className={cn("mt-3 block text-sm leading-6 whitespace-pre-line", tone.light ? "text-white/85" : "text-gray-600")}>{card.body}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/** 合作需求。收起看标题和一句话，点开看对象、条件和动作。 */
function CoopBox({ need: n, action, onAction }: { need: NeedItem; action?: string; onAction: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === `need-${n.id}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [n.id]);
  const left = n.service ? "要做什么" : "合作对象";
  const right = n.service ? "收费方式" : "合作条件";
  return (
    <div id={`need-${n.id}`} className="scroll-mt-24 rounded-xl border border-gray-200 bg-white px-3 py-3">
      <button type="button" className="flex w-full items-start gap-3 text-left" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-gray-950">{n.title}</span>
          <span className="mt-0.5 block text-xs text-gray-400">{needLabel(n)}</span>
        </span>
        <ChevronUp size={16} className={cn("mt-0.5 shrink-0 text-gray-400 transition-transform", !open && "rotate-180")} />
      </button>
      {n.summary ? <p className="mt-2 text-sm leading-6 whitespace-pre-line text-gray-600">{n.summary}</p> : null}
      {open ? (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs text-gray-400">{left}</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-800">{n.detail || "还没写。"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{right}</p>
              <p className="mt-1 text-sm leading-6 whitespace-pre-line text-gray-800">{n.terms || "还没写。"}</p>
            </div>
          </div>
          {n.story ? <p className="mt-3 text-sm leading-6 whitespace-pre-line text-gray-600">{n.story}</p> : null}
          {n.storyImages?.length ? (
            <div className="mt-3 grid grid-cols-1 gap-2">
              {n.storyImages.map((img) => (
                <figure key={img.src} className="overflow-hidden rounded-[14px] border border-gray-200">
                  <img src={img.src} alt={img.caption} className="w-full" />
                  <figcaption className="px-2 py-1.5 text-xs text-gray-500">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          {action ? (
            <Button size="sm" variant="primary" className="mt-3" onClick={onAction}>
              {action}
            </Button>
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
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center gap-0.5 py-4">
          <span className="text-xl font-semibold text-gray-900 tabular-nums">{item.value}</span>
          <span className="text-xs text-gray-500">{item.label}</span>
        </div>
      ))}
    </Card>
  );
}
