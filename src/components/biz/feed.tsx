"use client";

import { Bookmark, Clock, HandHeart, Newspaper, Send, Sparkles } from "lucide-react";
import Link from "next/link";

import { FollowButton } from "@/components/biz/follow-button";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Cover, ProjectLogo } from "@/components/ui/display";
import { Drawer } from "@/components/ui/overlay";
import { UPDATE_TEMPLATES } from "@/data/constants";
import { formatDate, relativeTime } from "@/data/time";
import type { Article, DB, NewsItem, Project, ProjectUpdate } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { getPerson, getProject, useDB, useViewer } from "@/store/selectors";

export type FeedItem =
  | { type: "update"; at: string; project: Project; update: ProjectUpdate }
  | { type: "article"; at: string; article: Article }
  | { type: "news"; at: string; news: NewsItem };

export function feedKey(i: FeedItem) {
  return i.type === "update" ? `u-${i.update.id}` : i.type === "article" ? `a-${i.article.id}` : `n-${i.news.id}`;
}

/** 公开项目的动态 + 报道 + 快讯，按时间倒序。 */
export function buildFeed(db: DB): FeedItem[] {
  const updates: FeedItem[] = db.projects
    .filter((p) => p.visibility === "public")
    .flatMap((p) => p.updates.map((u) => ({ type: "update" as const, at: u.at, project: p, update: u })));
  const articles: FeedItem[] = db.articles.map((a) => ({ type: "article" as const, at: a.at, article: a }));
  const news: FeedItem[] = db.news.map((n) => ({ type: "news" as const, at: n.at, news: n }));
  return [...updates, ...articles, ...news].sort((a, b) => b.at.localeCompare(a.at));
}

/** 与当前用户有关的项目：自己是成员、关注、或在观察清单里。 */
export function relatedProjectIds(db: DB, viewerId: string | null) {
  const mine = new Set<string>();
  const followed = new Set<string>();
  if (!viewerId) return { mine, followed };
  db.projects.forEach((p) => {
    if (p.team.some((m) => m.personId === viewerId && m.status === "confirmed")) mine.add(p.id);
  });
  db.follows.forEach((f) => f.userId === viewerId && f.targetType === "project" && followed.add(f.targetId));
  db.watch.forEach((w) => w.userId === viewerId && followed.add(w.projectId));
  return { mine, followed };
}

export function UpdateCard({ project: p, update: u }: { project: Project; update: ProjectUpdate }) {
  const db = useDB();
  const viewer = useViewer();
  const cheer = useApp((s) => s.cheerUpdate);
  const openIntent = useApp((s) => s.openIntent);
  const requireLogin = useApp((s) => s.requireLogin);
  const author = getPerson(db, u.authorId);
  const cheers = u.cheers ?? [];
  const cheered = !!viewer && cheers.includes(viewer.id);
  const isMember = !!viewer && p.team.some((m) => m.personId === viewer.id);
  const tpl = UPDATE_TEMPLATES[u.template];
  const intentKind = u.template === "hiring" ? "join" : u.template === "funding" || p.lookingFor.some((n) => n.kind === "invest") ? (viewer?.role === "investor" ? "invest" : "partner") : "partner";

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex items-start gap-3">
        <Link href={`/p/${p.slug}`} className="shrink-0">
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/p/${p.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">
              {p.name}
            </Link>
            <Badge size="xs" tone={u.template === "funding" ? "highlight" : u.template === "hiring" ? "success" : "brand"}>
              {tpl.label}
            </Badge>
            <span className="text-xs text-gray-400">
              {author?.name} · {relativeTime(u.at)}
            </span>
          </div>
          <p className="mt-1.5 font-semibold text-gray-900">{u.title}</p>
          {u.body ? <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{u.body}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {isMember ? (
              <span className="inline-flex h-8 items-center gap-1.5 px-1 text-sm text-gray-500">
                <HandHeart size={16} />
                {cheers.length ? `${cheers.length} 人鼓励` : "还没有人鼓励"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => (viewer ? cheer(p.id, u.id) : requireLogin("登录后可以给项目加油"))}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-semibold transition-colors",
                  cheered ? "border-brand-200 bg-brand-50 text-brand-700" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
                )}
                aria-pressed={cheered}
              >
                <HandHeart size={16} />
                鼓励{cheers.length ? ` ${cheers.length}` : ""}
              </button>
            )}
            {!isMember ? (
              <>
                <FollowButton quiet targetType="project" targetId={p.id} size="sm" />
                {p.lookingFor.length || u.template === "hiring" ? (
                  <Button size="sm" variant="tertiary" iconLeft={Send} onClick={() => (viewer ? openIntent({ type: "project", projectId: p.id, presetKind: intentKind }) : requireLogin("登录后可以表达意向"))}>
                    {u.template === "hiring" ? "我想加入" : "表达意向"}
                  </Button>
                ) : null}
              </>
            ) : (
              <span className="text-xs text-gray-400">你的项目</span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export function ArticleCard({ article: a, onOpen }: { article: Article; onOpen: () => void }) {
  const db = useDB();
  const projects = a.projectIds.map((id) => getProject(db, id)).filter((p): p is Project => !!p);
  return (
    <article className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs hover:border-gray-300">
      <button type="button" onClick={onOpen} className="flex w-full flex-col text-left sm:flex-row">
        <Cover tone={a.coverTone} className="h-36 sm:h-auto sm:w-56 sm:shrink-0" label={a.column} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4 sm:p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-700">
            <Newspaper size={12} />
            Pitch 报道 · {a.column}
          </p>
          <p className="text-lg leading-snug font-semibold text-gray-900 group-hover:text-brand-700">{a.title}</p>
          <p className="line-clamp-2 text-sm text-gray-600">{a.summary}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
            {a.author} · {formatDate(a.at)} · <Clock size={12} /> {a.readMins} 分钟
          </p>
        </div>
      </button>
      {projects.length ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-2.5 sm:px-5">
          <span className="text-xs text-gray-500">文中项目</span>
          {projects.map((p) => (
            <Link key={p.id} href={`/p/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 py-0.5 pr-2.5 pl-0.5 text-xs font-medium text-gray-700 hover:border-gray-300">
              <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" className="rounded-full" />
              {p.name}
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export function NewsCard({ news: n, related }: { news: NewsItem; related?: "mine" | "followed" }) {
  const db = useDB();
  const p = n.projectId ? getProject(db, n.projectId) : undefined;
  return (
    <article className={cn("rounded-xl border bg-white p-4 shadow-xs", related ? "border-highlight-ink/25" : "border-gray-200")}>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        <Badge size="xs">{n.tag}</Badge>
        <span>{n.source}</span>
        <span>· {relativeTime(n.at)}</span>
        {related ? (
          <Badge size="xs" tone="highlight" className="ml-auto">
            <Sparkles size={10} className="mr-0.5" />
            {related === "mine" ? "和你的项目相关" : "和你关注的项目相关"}
          </Badge>
        ) : null}
      </p>
      <p className="mt-2 font-semibold text-gray-900">{n.title}</p>
      {n.summary ? <p className="mt-1 text-sm text-gray-600">{n.summary}</p> : null}
      {p ? (
        <Link href={`/p/${p.slug}`} className="mt-3 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm hover:bg-gray-100">
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" />
          <span className="min-w-0 flex-1 truncate text-gray-700">
            相关项目 <span className="font-semibold text-gray-900">{p.name}</span> · {p.oneLiner}
          </span>
        </Link>
      ) : null}
    </article>
  );
}

/** 报道阅读：原型里只展示导语和文中项目。 */
export function ArticleReader({ article: a, onClose }: { article: Article | undefined; onClose: () => void }) {
  const db = useDB();
  const viewer = useViewer();
  const openIntent = useApp((s) => s.openIntent);
  const requireLogin = useApp((s) => s.requireLogin);
  const projects = a ? a.projectIds.map((id) => getProject(db, id)).filter((p): p is Project => !!p) : [];
  const more = a ? db.articles.filter((x) => x.id !== a.id).slice(0, 2) : [];
  return (
    <Drawer open={!!a} onClose={onClose} title={a ? `Pitch 报道 · ${a.column}` : ""} width={560}>
      {a ? (
        <div className="flex flex-col gap-5">
          <Cover tone={a.coverTone} className="h-44 rounded-xl" />
          <div>
            <h2 className="text-2xl leading-snug font-semibold text-gray-900">{a.title}</h2>
            <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Avatar name={a.author} tone={3} size="xs" />
              {a.author} · {formatDate(a.at)} · {a.readMins} 分钟阅读
            </p>
          </div>
          <p className="border-l-4 border-highlight pl-4 text-[17px] leading-8 text-gray-800">{a.summary}</p>
          <p className="rounded-lg bg-gray-50 p-3 text-xs text-gray-500">原型只展示导语。正式版在这里放全文，文中提到的项目会以卡片嵌入。</p>
          {projects.length ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-900">文中项目</p>
              {projects.map((p) => {
                const member = !!viewer && p.team.some((m) => m.personId === viewer.id);
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                    <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <ProjectLogo text={p.logoText} tone={p.logoTone} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                        <span className="block truncate text-xs text-gray-500">{p.oneLiner}</span>
                      </span>
                    </Link>
                    {!member ? (
                      <div className="flex shrink-0 gap-2">
                        <FollowButton quiet targetType="project" targetId={p.id} size="sm" />
                        <Button
                          size="sm"
                          variant="primary"
                          iconOnly={Send}
                          aria-label={`向${p.name}表达意向`}
                          onClick={() => (viewer ? openIntent({ type: "project", projectId: p.id, presetKind: viewer.role === "investor" ? "invest" : "partner", prefill: `读了 Pitch 的报道「${a.title}」，` }) : requireLogin("登录后可以表达意向"))}
                        />
                      </div>
                    ) : (
                      <Badge size="xs">你的项目</Badge>
                    )}
                  </div>
                );
              })}
            </div>
          ) : null}
          {more.length ? (
            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5">
              <p className="text-sm font-semibold text-gray-900">更多报道</p>
              {more.map((x) => (
                <Link key={x.id} href={`/feed?tab=articles&article=${x.id}`} className="group flex gap-3">
                  <Cover tone={x.coverTone} className="h-14 w-20 shrink-0 rounded-lg" />
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-brand-700">{x.title}</span>
                    <span className="text-xs text-gray-500">
                      {x.column} · {x.readMins} 分钟
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}

export function FollowedEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <Bookmark size={24} className="text-gray-400" />
      <p className="font-semibold text-gray-900">还没有关注的项目</p>
      <p className="max-w-sm text-sm text-gray-500">关注项目后，它们的动态会集中出现在这里，并在发布时提醒你。</p>
      <Button size="sm" variant="primary" href="/discover">
        去发现页
      </Button>
    </div>
  );
}