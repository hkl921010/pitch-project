"use client";

import { Mail, Rss } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import { ArticleCard, ArticleReader, buildFeed, feedKey, FollowedEmpty, NewsCard, relatedProjectIds, UpdateCard, type FeedItem } from "@/components/biz/feed";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, ProjectLogo } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { relativeTime } from "@/data/time";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { getProject, useDB, useViewer } from "@/store/selectors";

type Tab = "all" | "following" | "articles" | "news";
const PAGE = 8;

export default function FeedPage() {
  return (
    <Suspense>
      <Feed />
    </Suspense>
  );
}

function Feed() {
  const db = useDB();
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  const [tab, setTab] = useQueryParam<Tab>("tab", "all");
  const [articleId, setArticleId] = useQueryParam<string>("article", "");
  const [tag, setTag] = useState("");
  const [limit, setLimit] = useState(PAGE);

  const all = buildFeed(db);
  const { mine, followed } = relatedProjectIds(db, viewer?.id ?? null);
  const tags = [...new Set(db.news.map((n) => n.tag))];
  const items: FeedItem[] =
    tab === "following"
      ? all.filter((i) => (i.type === "update" && followed.has(i.project.id)) || (i.type === "news" && !!i.news.projectId && (followed.has(i.news.projectId) || mine.has(i.news.projectId))) || (i.type === "article" && i.article.projectIds.some((id) => followed.has(id))))
      : tab === "articles"
        ? all.filter((i) => i.type === "article")
        : tab === "news"
          ? all.filter((i) => i.type === "news" && (!tag || i.news.tag === tag))
          : all;
  const shown = items.slice(0, limit);
  const article = db.articles.find((a) => a.id === articleId);
  const switchTab = (t: Tab) => {
    if (t === "following" && !viewer) return requireLogin("登录后查看你关注的项目动态");
    setTab(t);
    setLimit(PAGE);
  };

  const myFollowed = [...followed]
    .map((id) => getProject(db, id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({ p, last: [...p.updates].sort((a, b) => b.at.localeCompare(a.at))[0] }))
    .sort((a, b) => (b.last?.at ?? "").localeCompare(a.last?.at ?? ""))
    .slice(0, 5);

  return (
    <Page>
      <PageHeader title="信息流" desc="项目动态、Pitch 报道和行业快讯。和你的项目、你关注的项目有关的内容会特别标出。" />

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <Tabs
            value={tab}
            onChange={switchTab}
            items={[
              { value: "all", label: "推荐" },
              { value: "following", label: "关注" },
              { value: "articles", label: "Pitch 报道", count: db.articles.length },
              { value: "news", label: "行业快讯", count: db.news.length },
            ]}
          />

          {tab === "news" ? (
            <div className="scrollbar-none mt-4 flex gap-2 overflow-x-auto">
              {["", ...tags].map((t) => (
                <button
                  key={t || "all"}
                  type="button"
                  onClick={() => {
                    setTag(t);
                    setLimit(PAGE);
                  }}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1 text-sm font-medium",
                    tag === t ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}
                >
                  {t || "全部"}
                </button>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-4">
            {shown.length ? (
              shown.map((i) =>
                i.type === "update" ? (
                  <UpdateCard key={feedKey(i)} project={i.project} update={i.update} />
                ) : i.type === "article" ? (
                  <ArticleCard key={feedKey(i)} article={i.article} onOpen={() => setArticleId(i.article.id)} />
                ) : (
                  <NewsCard
                    key={feedKey(i)}
                    news={i.news}
                    related={i.news.projectId ? (mine.has(i.news.projectId) ? "mine" : followed.has(i.news.projectId) ? "followed" : undefined) : undefined}
                  />
                ),
              )
            ) : tab === "following" ? (
              <FollowedEmpty />
            ) : (
              <EmptyState icon={Rss} title="暂时没有内容" desc={tag ? "换个标签看看" : undefined} />
            )}
            {items.length > shown.length ? (
              <Button className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
                加载更多（还有 {items.length - shown.length} 条）
              </Button>
            ) : shown.length > 3 ? (
              <p className="py-2 text-center text-xs text-gray-400">没有更多了</p>
            ) : null}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          {viewer ? (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">我关注的项目</h2>
                {viewer.role === "investor" ? (
                  <Link href="/watchlist" className="text-sm font-semibold text-brand-700">
                    观察清单
                  </Link>
                ) : null}
              </div>
              {myFollowed.length ? (
                <ul className="flex flex-col gap-3">
                  {myFollowed.map(({ p, last }) => (
                    <li key={p.id}>
                      <Link href={`/p/${p.slug}`} className="group flex items-center gap-3">
                        <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</span>
                          <span className="block truncate text-xs text-gray-500">{last ? `${relativeTime(last.at)} · ${last.title}` : "还没有动态"}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">关注项目后，这里会显示它们最近的动态。</p>
              )}
            </Card>
          ) : (
            <Card>
              <h2 className="text-base font-semibold text-gray-900">只看你关心的</h2>
              <p className="mt-1 text-sm text-gray-500">登录后关注项目，它们的动态会集中到“关注”里。</p>
              <Button size="sm" variant="primary" className="mt-3" onClick={() => requireLogin("登录后关注项目")}>
                登录
              </Button>
            </Card>
          )}

          <Card>
            <h2 className="text-base font-semibold text-gray-900">每周一份周报</h2>
            <p className="mt-1 text-sm text-gray-500">
              {viewer?.role === "investor" ? "观察清单的动态、符合偏好的新项目和本周路演。" : viewer?.role === "founder" ? "你的项目数据、收到的意向和本周值得做的事。" : "本周值得看的项目、报道和活动。"}
            </p>
            <Button size="sm" iconLeft={Mail} href="/digest/preview" className="mt-3">
              预览周报
            </Button>
          </Card>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-gray-900">快讯标签</h2>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTab("news");
                    setTag(t);
                    setLimit(PAGE);
                  }}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-gray-300"
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        </aside>
      </div>

      <ArticleReader article={article} onClose={() => setArticleId("")} />
    </Page>
  );
}
