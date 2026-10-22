"use client";

import { Bell, BellOff, BellRing, Bookmark, BookmarkPlus, Check, CheckCheck, ChevronDown, Compass, Lock, LogIn, MessageCircle, PencilLine, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader, ProjectLogo } from "@/components/ui/display";
import { Textarea } from "@/components/ui/form";
import { ConfirmModal, Dropdown, MenuItem } from "@/components/ui/overlay";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { UPDATE_TEMPLATES, WATCH_REMIND } from "@/data/constants";
import { formatDate, relativeTime } from "@/data/time";
import type { DB, Project, ProjectUpdate, WatchItem, WatchRemind } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { useDB, useViewer, watchUpdates } from "@/store/selectors";

type Filter = "all" | "fresh" | "noted";
type Sort = "fresh" | "added";

const REMIND_ICON: Record<WatchRemind, typeof Bell> = { all: BellRing, key: Bell, off: BellOff };

export default function WatchlistPage() {
  return (
    <Suspense>
      <Watchlist />
    </Suspense>
  );
}

function Watchlist() {
  const db = useDB();
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  const markAll = useApp((s) => s.markAllWatchSeen);
  const toast = useApp((s) => s.toast);
  const [filter, setFilter] = useQueryParam<Filter>("filter", "all");
  const [sort, setSort] = useState<Sort>("fresh");

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, []);

  if (!viewer) {
    return (
      <Page>
        <EmptyState icon={LogIn} title="登录后查看你的观察清单" action={<Button variant="primary" onClick={() => requireLogin("登录后查看你的观察清单")}>登录</Button>} />
      </Page>
    );
  }
  if (viewer.role !== "investor") {
    return (
      <Page narrow>
        <EmptyState
          icon={Bookmark}
          title="观察清单是给投资人的工具"
          desc="可以写只有自己能看到的备注，并按项目设置提醒。你可以关注感兴趣的项目，它们发布动态时同样会通知你。"
          action={<Button variant="primary" href="/discover">去发现页</Button>}
        />
      </Page>
    );
  }

  const all = watchUpdates(db, viewer.id);
  const freshCount = all.filter((x) => x.fresh.length).length;
  const notedCount = all.filter((x) => x.item.note.trim()).length;
  const contacted = all.filter((x) => relationOf(db, viewer.id, x.project).kind !== "none").length;
  const rows = all
    .filter((x) => (filter === "fresh" ? x.fresh.length > 0 : filter === "noted" ? !!x.item.note.trim() : true))
    .sort((a, b) =>
      sort === "added"
        ? b.item.addedAt.localeCompare(a.item.addedAt)
        : Number(b.fresh.length > 0) - Number(a.fresh.length > 0) || lastUpdateAt(b.project).localeCompare(lastUpdateAt(a.project)),
    );

  return (
    <Page>
      <PageHeader
        title="观察清单"
        desc={
          <span className="inline-flex items-center gap-1.5">
            <Lock size={14} />
            只有你能看到。项目方只知道“有几位投资人收藏了”，看不到是谁，也看不到备注。
          </span>
        }
        actions={
          <>
            <Button
              iconLeft={CheckCheck}
              disabled={!freshCount}
              onClick={() => {
                markAll();
                toast({ tone: "success", title: "已全部标为已读" });
              }}
            >
              全部标为已读
            </Button>
            <Button variant="primary" iconLeft={Compass} href="/discover">
              发现更多项目
            </Button>
          </>
        }
      />

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        <SummaryTile label="观察中" value={all.length} />
        <SummaryTile label="有新动态" value={freshCount} highlight={freshCount > 0} />
        <SummaryTile label="已接触" value={contacted} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <Tabs
              className="flex-1"
              value={filter}
              onChange={setFilter}
              items={[
                { value: "all", label: "全部", count: all.length },
                { value: "fresh", label: "有新动态", count: freshCount, dot: freshCount > 0 },
                { value: "noted", label: "有备注", count: notedCount },
              ]}
            />
            <Segmented
              size="sm"
              value={sort}
              onChange={setSort}
              items={[
                { value: "fresh", label: "新动态优先" },
                { value: "added", label: "最近加入" },
              ]}
            />
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {rows.length ? (
              rows.map((x) => <WatchCard key={x.project.id} item={x.item} project={x.project} fresh={x.fresh} />)
            ) : all.length ? (
              <EmptyState compact icon={Check} title={filter === "fresh" ? "都看过了" : "还没有写备注的项目"} desc={filter === "fresh" ? "项目发布新动态后会出现在这里" : "备注只有你能看到，适合记下下次要问的问题"} />
            ) : (
              <EmptyState
                icon={Bookmark}
                title="还没有收藏项目"
                desc="在项目页点“加入观察清单”。项目有新动态会提醒你，备注只有你能看到。"
                action={<Button variant="primary" href="/discover">去发现页</Button>}
              />
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Suggestions />
          <Card>
            <h2 className="text-base font-semibold text-gray-900">提醒方式</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {(Object.keys(WATCH_REMIND) as WatchRemind[]).map((k) => {
                const Icon = REMIND_ICON[k];
                return (
                  <li key={k} className="flex items-start gap-2.5 text-sm">
                    <Icon size={16} className="mt-0.5 shrink-0 text-gray-400" />
                    <span>
                      <span className="font-medium text-gray-900">{WATCH_REMIND[k].label}</span>
                      <span className="text-gray-500"> · {WATCH_REMIND[k].desc}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-gray-500">每周一的投资人周报会汇总清单里所有项目的动态。</p>
            <Button size="sm" variant="link" href="/digest/preview?role=investor" className="mt-2">
              预览周报
            </Button>
          </Card>
        </aside>
      </div>
    </Page>
  );
}

function SummaryTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-white p-4 shadow-xs sm:p-5", highlight ? "border-brand-200" : "border-gray-200")}>
      <p className="text-xs font-medium text-gray-500 sm:text-sm">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold sm:text-3xl", highlight ? "text-brand-700" : "text-gray-900")}>{value}</p>
    </div>
  );
}

function lastUpdateAt(p: Project) {
  return p.updates.reduce((m, u) => (u.at > m ? u.at : m), "");
}

type Relation = { kind: "none" } | { kind: "intent"; status: "pending" | "declined" } | { kind: "conversation"; id: string };

/** 投资人和项目之间最近一次接触（只看投资人自己发起的、未撤回的意向）。 */
function relationOf(db: DB, viewerId: string, p: Project): Relation {
  const intent = db.intents.find((i) => i.fromId === viewerId && i.projectId === p.id && i.status !== "withdrawn");
  if (!intent) return { kind: "none" };
  if (intent.conversationId) return { kind: "conversation", id: intent.conversationId };
  return { kind: "intent", status: intent.status === "declined" ? "declined" : "pending" };
}

function WatchCard({ item, project: p, fresh }: { item: WatchItem; project: Project; fresh: ProjectUpdate[] }) {
  const db = useDB();
  const viewer = useViewer()!;
  const openIntent = useApp((s) => s.openIntent);
  const markSeen = useApp((s) => s.markWatchSeen);
  const setRemind = useApp((s) => s.setWatchRemind);
  const toggleWatch = useApp((s) => s.toggleWatch);
  const toast = useApp((s) => s.toast);
  const [confirm, setConfirm] = useState(false);
  const rel = relationOf(db, viewer.id, p);
  const raising = p.lookingFor.find((n) => n.kind === "invest");
  const latest = [...p.updates].sort((a, b) => b.at.localeCompare(a.at))[0];
  const remind = item.remind ?? "all";
  const RemindIcon = REMIND_ICON[remind];

  const remove = () => {
    toggleWatch(p.id);
    toast({ tone: "info", title: `已把${p.name}移出观察清单` });
  };

  return (
    <Card id={`w-${p.id}`} className={cn("scroll-mt-24", fresh.length && "border-brand-200")}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-start gap-3">
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-gray-900 hover:text-brand-700">{p.name}</span>
              {fresh.length ? <Badge tone="brand" size="xs">{fresh.length} 条新动态</Badge> : null}
              {raising ? <Badge tone="highlight" size="xs">在融 · {raising.sub || "融资"}</Badge> : null}
            </div>
            <p className="text-xs text-gray-500">
              {p.track} · {p.region}
            </p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">{p.oneLiner}</p>
          </div>
        </Link>
        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-end">
          {rel.kind === "conversation" ? (
            <Button size="sm" iconLeft={MessageCircle} href={`/inbox/${rel.id}`}>
              对话中
            </Button>
          ) : rel.kind === "intent" ? (
            <Badge tone={rel.status === "declined" ? "gray" : "warning"}>{rel.status === "declined" ? "已发意向 · 暂未回应" : "已发意向 · 等待回应"}</Badge>
          ) : (
            <Button size="sm" variant="primary" iconLeft={Send} onClick={() => openIntent({ type: "project", projectId: p.id, presetKind: "invest" })}>
              表达投资意向
            </Button>
          )}
        </div>
      </div>

      {fresh.length ? (
        <div className="mt-4 rounded-lg border border-brand-100 bg-brand-25 p-3">
          <ul className="flex flex-col gap-2.5">
            {fresh.slice(0, 3).map((u) => (
              <li key={u.id} className="flex min-w-0 items-start gap-2">
                <Badge size="xs" tone="brand" className="mt-0.5 shrink-0">
                  {UPDATE_TEMPLATES[u.template].label}
                </Badge>
                <Link href={`/p/${p.slug}#updates`} className="min-w-0 flex-1 text-sm">
                  <span className="font-medium text-gray-900">{u.title}</span>
                  {u.body ? <span className="text-gray-600"> · {u.body}</span> : null}
                </Link>
                <span className="shrink-0 text-xs text-gray-400">{relativeTime(u.at)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-gray-500">{fresh.length > 3 ? `还有 ${fresh.length - 3} 条，去项目页查看` : "自你上次查看后发布"}</span>
            <Button size="xs" variant="link" iconLeft={Check} onClick={() => markSeen(p.id)}>
              标为已读
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-500">
          {latest ? (
            <>
              最近动态：{latest.title} · {relativeTime(latest.at)}
            </>
          ) : (
            "还没有发布过动态"
          )}
        </p>
      )}

      <NoteBox item={item} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <span className="text-xs text-gray-400">{formatDate(item.addedAt)} 加入观察清单</span>
        <div className="flex items-center gap-1">
          <Dropdown
            width={240}
            trigger={() => (
              <button type="button" className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
                <RemindIcon size={14} />
                {WATCH_REMIND[remind].label}
                <ChevronDown size={12} />
              </button>
            )}
          >
            {(close) =>
              (Object.keys(WATCH_REMIND) as WatchRemind[]).map((k) => (
                <MenuItem
                  key={k}
                  icon={REMIND_ICON[k]}
                  active={k === remind}
                  desc={WATCH_REMIND[k].desc}
                  onClick={() => {
                    setRemind(p.id, k);
                    toast({ tone: "success", title: `提醒方式：${WATCH_REMIND[k].label}` });
                    close();
                  }}
                >
                  {WATCH_REMIND[k].label}
                </MenuItem>
              ))
            }
          </Dropdown>
          <Button size="xs" variant="tertiary" iconLeft={Trash2} onClick={() => (item.note.trim() ? setConfirm(true) : remove())}>
            移出
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        danger
        title={`把${p.name}移出观察清单？`}
        desc="你写的私人备注会一起删除，无法恢复。"
        confirmText="移出"
        onConfirm={remove}
      />
    </Card>
  );
}

function NoteBox({ item }: { item: WatchItem }) {
  const save = useApp((s) => s.setWatchNote);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.note);

  if (editing) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <Textarea
          autoFocus
          rows={3}
          maxCount={200}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="比如：单店模型好，等渠道验证后再看估值。下次重点问：选址。"
          hint="只有你能看到"
        />
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            onClick={() => {
              setDraft(item.note);
              setEditing(false);
            }}
          >
            取消
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              save(item.projectId, draft.trim());
              setEditing(false);
            }}
          >
            保存备注
          </Button>
        </div>
      </div>
    );
  }

  if (!item.note.trim()) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft("");
          setEditing(true);
        }}
        className="mt-4 flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2.5 text-left text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700"
      >
        <BookmarkPlus size={16} />
        写一条私人备注，记下判断和下次要问的问题
      </button>
    );
  }

  return (
    <div className="group mt-4 rounded-lg bg-highlight-soft/60 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <Lock size={14} className="mt-0.5 shrink-0 text-highlight-ink/70" />
        <p className="min-w-0 flex-1 text-sm whitespace-pre-wrap text-gray-800">{item.note}</p>
        <button
          type="button"
          aria-label="编辑备注"
          onClick={() => {
            setDraft(item.note);
            setEditing(true);
          }}
          className="shrink-0 rounded p-1 text-gray-500 hover:bg-white/60 hover:text-gray-800"
        >
          <PencilLine size={14} />
        </button>
      </div>
      {item.noteAt ? <p className="mt-1 pl-[22px] text-xs text-gray-500">私人备注 · {relativeTime(item.noteAt)}编辑</p> : null}
    </div>
  );
}

/** 符合投资偏好、已上发现页、还没收藏的项目。 */
function Suggestions() {
  const db = useDB();
  const viewer = useViewer()!;
  const toggleWatch = useApp((s) => s.toggleWatch);
  const toast = useApp((s) => s.toast);
  const tracks = viewer.openStatus.investor?.tracks ?? [];
  const watched = new Set(db.watch.filter((w) => w.userId === viewer.id).map((w) => w.projectId));
  const list = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved" && tracks.includes(p.track) && !watched.has(p.id)).slice(0, 4);

  return (
    <Card>
      <h2 className="text-base font-semibold text-gray-900">符合你偏好的项目</h2>
      <p className="text-xs text-gray-500">{tracks.length ? `按关注赛道：${tracks.slice(0, 3).join("、")}${tracks.length > 3 ? " 等" : ""}` : "设置投资偏好后，这里会推荐项目"}</p>
      {list.length ? (
        <ul className="mt-4 flex flex-col gap-3">
          {list.map((p) => (
            <li key={p.id} className="flex items-center gap-3">
              <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
                <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                  <span className="block truncate text-xs text-gray-500">{p.oneLiner}</span>
                </span>
              </Link>
              <Button
                size="xs"
                iconOnly={BookmarkPlus}
                aria-label={`把${p.name}加入观察清单`}
                onClick={() => {
                  toggleWatch(p.id);
                  toast({ tone: "success", title: `已把${p.name}加入观察清单` });
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-gray-500">{tracks.length ? "符合偏好的项目都已在清单里" : ""}</p>
      )}
      <Button size="sm" variant="link" href={`/u/${viewer.handle}?edit=status`} className="mt-3">
        调整投资偏好
      </Button>
    </Card>
  );
}
