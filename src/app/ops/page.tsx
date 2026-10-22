"use client";

import { AlertTriangle, BellRing, Check, Eye, Flame, Handshake, ListPlus, MessageCircle, ShieldCheck, Trophy, X } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import { LIST_MAX_ITEMS } from "@/components/biz/list-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, PageHeader, ProgressBar, ProjectLogo, Tag } from "@/components/ui/display";
import { Input, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { INTENT_KIND_LABEL, MATCH_STAGE } from "@/data/constants";
import { daysSince, formatDate, relativeTime } from "@/data/time";
import type { Conversation, DB, MatchStage, Project } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { currentDemoDay, getPerson, getProject, projectCompletion, roleText, useDB, useViewer } from "@/store/selectors";

type Tab = "match" | "hot" | "review";

/** 每期路演大约选这么多个项目入围。 */
const SHORTLIST_TARGET = 6;
const NOTE_MIN = 6;

export default function OpsPage() {
  return (
    <Suspense>
      <OpsView />
    </Suspense>
  );
}

function OpsView() {
  const db = useDB();
  const viewer = useViewer();
  const [tab, setTab] = useQueryParam<Tab>("tab", "match");

  if (!viewer?.isOps) {
    return (
      <Page narrow>
        <Card padded={false}>
          <EmptyState icon={ShieldCheck} title="运营看板只对 Pitch 运营开放" desc="需要 Pitch 帮忙推进合作？在对话里点“申请撮合”，运营会在 1 个工作日内联系双方。" action={<Button variant="primary" href="/inbox">去收件箱</Button>} />
        </Card>
      </Page>
    );
  }

  const matchPending = db.conversations.filter((c) => c.status === "match_requested").length;
  const wallPending = db.projects.filter((p) => p.wall === "pending").length;
  const ddPending = currentDemoDay(db)?.entries.filter((e) => e.status === "applied").length ?? 0;

  return (
    <Page>
      <PageHeader title="运营看板" desc="撮合即商机：接手、推进、结案都会同步到双方的对话里。上墙和路演审核随报随审。" />
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "match", label: "撮合", count: matchPending || undefined, dot: matchPending > 0 },
          { value: "hot", label: "高意向项目" },
          { value: "review", label: "上墙与路演审核", count: wallPending + ddPending || undefined, dot: wallPending + ddPending > 0 },
        ]}
      />
      <div className="mt-6">{tab === "hot" ? <HotProjects /> : tab === "review" ? <Review /> : <Matches />}</div>
    </Page>
  );
}

/* ------------------------------------------------------------------ 撮合 */

function stageOf(cv: Conversation): MatchStage | null {
  if (!cv.match?.opsOwnerId) return null;
  return cv.match.stage ?? "following";
}

/** 没申请撮合、但值得运营主动看一眼的对话。 */
function interveneSignals(db: DB, cv: Conversation): string[] {
  const intent = db.intents.find((i) => i.id === cv.intentId);
  const out: string[] = [];
  if (intent?.kind === "invest") out.push("投资意向");
  if (cv.members.every((m) => cv.contactShared[m])) out.push("已互换联系方式");
  const recent = cv.messages.filter((m) => !m.system && daysSince(m.at) <= 7).length;
  if (recent >= 4) out.push(`近 7 天 ${recent} 条消息`);
  return out;
}

function Matches() {
  const db = useDB();
  const [taking, setTaking] = useState<Conversation | null>(null);
  const [updating, setUpdating] = useState<Conversation | null>(null);
  const [initiating, setInitiating] = useState<Conversation | null>(null);

  const requested = db.conversations.filter((c) => c.status === "match_requested").sort((a, b) => a.match!.at.localeCompare(b.match!.at));
  const following = db.conversations.filter((c) => stageOf(c) === "following" || stageOf(c) === "met");
  const closed = db.conversations.filter((c) => stageOf(c) === "won" || stageOf(c) === "lost");
  const candidates = db.conversations
    .filter((c) => c.status === "active" && !c.match)
    .map((c) => ({ c, signals: interveneSignals(db, c) }))
    .filter((x) => x.signals.length);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="待接手" value={requested.length} tone={requested.length ? "warning" : undefined} />
        <Kpi label="跟进中" value={following.length} />
        <Kpi label="已成交" value={closed.filter((c) => stageOf(c) === "won").length} />
        <Kpi label="可主动介入" value={candidates.length} />
      </div>

      <section>
        <SectionTitle title="待接手" desc="用户在对话里申请的撮合，接手后双方会在对话顶部看到你的说明。" />
        {requested.length ? (
          <div className="flex flex-col gap-3">
            {requested.map((c) => (
              <MatchCard key={c.id} cv={c} action={<Button size="sm" variant="primary" iconLeft={Handshake} onClick={() => setTaking(c)}>接手</Button>} />
            ))}
          </div>
        ) : (
          <Empty text="没有待接手的撮合申请。" />
        )}
      </section>

      <section>
        <SectionTitle title="跟进中" desc="每次推进都写一句，双方会收到通知，对话里也会留下记录。" />
        {following.length ? (
          <div className="flex flex-col gap-3">
            {following.map((c) => (
              <MatchCard key={c.id} cv={c} showLog action={<Button size="sm" variant="secondary" onClick={() => setUpdating(c)}>更新进展</Button>} />
            ))}
          </div>
        ) : (
          <Empty text="没有跟进中的撮合。" />
        )}
      </section>

      <section>
        <SectionTitle title="可以主动介入" desc="还没申请撮合，但出现了投资意向、互换联系方式或聊得很密的对话。" />
        {candidates.length ? (
          <div className="flex flex-col gap-3">
            {candidates.map(({ c, signals }) => (
              <MatchCard
                key={c.id}
                cv={c}
                signals={signals}
                action={
                  <Button size="sm" variant="secondary" onClick={() => setInitiating(c)}>
                    主动介入
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <Empty text="暂时没有需要主动介入的对话。" />
        )}
      </section>

      {closed.length ? (
        <section>
          <SectionTitle title="已结案" />
          <div className="flex flex-col gap-3">
            {closed.map((c) => (
              <MatchCard key={c.id} cv={c} showLog />
            ))}
          </div>
        </section>
      ) : null}

      <NoteModal
        open={!!taking}
        onClose={() => setTaking(null)}
        title="接手撮合"
        desc="写一句你接下来会做什么，双方会在对话顶部看到。"
        placeholder="例如：已约 10 月 28 日深圳线下见面，并联系 2 位跟投人"
        confirm="接手"
        onConfirm={(note) => {
          useApp.getState().takeMatch(taking!.id, note);
          useApp.getState().toast({ tone: "success", title: "已接手", body: "双方已收到通知" });
        }}
      />
      <NoteModal
        open={!!initiating}
        onClose={() => setInitiating(null)}
        title="主动加入撮合"
        desc="双方会收到通知，对话状态变为“Pitch 跟进中”。写清楚你能帮什么。"
        placeholder="例如：看到你们聊得很顺，Pitch 可以帮忙安排线下会面"
        confirm="加入"
        onConfirm={(note) => {
          useApp.getState().opsInitiateMatch(initiating!.id, note);
          useApp.getState().toast({ tone: "success", title: "已加入撮合", body: "双方已收到通知" });
        }}
      />
      <UpdateMatchModal cv={updating} onClose={() => setUpdating(null)} />
    </div>
  );
}

function MatchCard({ cv, action, signals, showLog }: { cv: Conversation; action?: React.ReactNode; signals?: string[]; showLog?: boolean }) {
  const db = useDB();
  const [a, b] = cv.members.map((m) => getPerson(db, m));
  const project = getProject(db, cv.projectId);
  const intent = db.intents.find((i) => i.id === cv.intentId);
  const requester = getPerson(db, cv.match?.requestedBy);
  const stage = stageOf(cv);
  const lastAt = cv.messages.at(-1)?.at ?? cv.createdAt;
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {[a, b].map((p, i) =>
              p ? (
                <Link key={p.id} href={`/u/${p.handle}`} className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:text-brand-700">
                  {i === 1 ? <span className="mr-0.5 text-gray-300">↔</span> : null}
                  <Avatar name={p.name} tone={p.avatarTone} size="xs" />
                  {p.name}
                  <span className="text-xs font-normal text-gray-500">{roleText(p)}</span>
                </Link>
              ) : null,
            )}
          </div>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
            {project ? (
              <Link href={`/p/${project.slug}`} className="inline-flex items-center gap-1 hover:text-gray-700">
                <ProjectLogo text={project.logoText} tone={project.logoTone} size="xs" />
                {project.name}
              </Link>
            ) : null}
            {intent ? <span>{INTENT_KIND_LABEL[intent.kind]}意向{intent.sub ? ` · ${intent.sub}` : ""}</span> : null}
            <span>{cv.messages.filter((m) => !m.system).length} 条消息</span>
            <span>开始于 {formatDate(cv.createdAt)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {stage ? (
            <Badge tone={MATCH_STAGE[stage].tone} size="sm">
              {MATCH_STAGE[stage].label}
            </Badge>
          ) : cv.match ? (
            <Badge tone="warning" size="sm">
              {daysSince(cv.match.at) >= 1 ? `已等 ${daysSince(cv.match.at)} 天` : "今天申请"}
            </Badge>
          ) : null}
        </div>
      </div>

      {signals?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {signals.map((s) => (
            <Tag key={s}>{s}</Tag>
          ))}
        </div>
      ) : null}

      {cv.match ? (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
          <p className="text-gray-700">
            <span className="text-xs text-gray-500">{cv.match.byOps ? "运营主动介入" : `${requester?.name} 申请`} · {relativeTime(cv.match.at)}</span>
            <span className="mt-0.5 block">“{cv.match.note}”</span>
          </p>
          {cv.match.opsOwnerId && cv.match.opsNote && cv.match.opsNote !== cv.match.note ? (
            <p className="mt-2 border-t border-gray-200 pt-2 text-gray-700">
              <span className="text-xs text-gray-500">最新进展 · {getPerson(db, cv.match.opsOwnerId)?.name}</span>
              <span className="mt-0.5 block">{cv.match.opsNote}</span>
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-500">
          最近消息：{relativeTime(lastAt)}。介入前运营看不到对话内容，加入撮合后才能查看。
        </p>
      )}

      {showLog && cv.match?.log?.length ? (
        <div className="mt-3">
          <button onClick={() => setOpen(!open)} className="text-xs font-semibold text-gray-500 hover:text-gray-700">
            {open ? "收起记录" : `跟进记录（${cv.match.log.length}）`}
          </button>
          {open ? (
            <ol className="mt-2 flex flex-col gap-2 border-l border-gray-200 pl-4">
              {cv.match.log.map((l, i) => (
                <li key={i} className="text-sm text-gray-700">
                  <span className="mr-2 text-xs text-gray-400">{formatDate(l.at)}</span>
                  {l.text}
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {action}
        {cv.match ? (
          <Button size="sm" variant="tertiary" iconLeft={MessageCircle} href={`/inbox/${cv.id}`}>
            查看对话
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function UpdateMatchModal({ cv, onClose }: { cv: Conversation | null; onClose: () => void }) {
  const update = useApp((s) => s.updateMatch);
  const toast = useApp((s) => s.toast);
  const [stage, setStage] = useState<MatchStage>("met");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const err = note.trim().length < NOTE_MIN ? `至少 ${NOTE_MIN} 个字，双方会看到` : undefined;
  const close = () => {
    setNote("");
    setTried(false);
    setStage("met");
    onClose();
  };
  return (
    <Modal
      open={!!cv}
      onClose={close}
      title="更新撮合进展"
      desc="双方会收到通知，对话里也会留下一条记录。"
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (!cv || err) return;
              update(cv.id, stage, note.trim());
              toast({ tone: "success", title: `已更新为“${MATCH_STAGE[stage].label}”`, body: "双方已收到通知" });
              close();
            }}
          >
            更新
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Segmented value={stage} onChange={setStage} items={(Object.keys(MATCH_STAGE) as MatchStage[]).map((k) => ({ value: k, label: MATCH_STAGE[k].label }))} />
        <Textarea
          label="进展说明"
          required
          rows={3}
          maxCount={80}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={stage === "won" ? "例如：已签 TS，领投 500 万" : stage === "lost" ? "例如：估值没谈拢，双方同意先保持联系" : "例如：10/28 深圳线下见面，双方都到了"}
          error={tried ? err : undefined}
        />
      </div>
    </Modal>
  );
}

function NoteModal({
  open,
  onClose,
  title,
  desc,
  placeholder,
  confirm,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  desc: string;
  placeholder: string;
  confirm: string;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const err = note.trim().length < NOTE_MIN ? `至少 ${NOTE_MIN} 个字，双方会看到` : undefined;
  const close = () => {
    setNote("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      desc={desc}
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (err) return;
              onConfirm(note.trim());
              close();
            }}
          >
            {confirm}
          </Button>
        </>
      }
    >
      <Textarea label="说明" required rows={3} maxCount={80} value={note} onChange={(e) => setNote(e.target.value)} placeholder={placeholder} error={tried ? err : undefined} />
    </Modal>
  );
}

/* ------------------------------------------------------------------ 高意向项目 */

interface Heat {
  project: Project;
  intents: number;
  invest: number;
  stale: number;
  watchers: number;
  views: number;
  prevViews: number;
  matches: number;
  score: number;
}

function heatOf(db: DB, p: Project): Heat {
  const recent = db.intents.filter((i) => i.projectId === p.id && daysSince(i.createdAt) <= 14);
  const stale = db.intents.filter((i) => i.projectId === p.id && i.status === "pending" && daysSince(i.createdAt) >= 2).length;
  const watchers = db.watch.filter((w) => w.projectId === p.id).length;
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const views = sum(p.stats.views.slice(-7));
  const prevViews = sum(p.stats.views.slice(-14, -7));
  const matches = db.conversations.filter((c) => c.projectId === p.id && c.match).length;
  const invest = recent.filter((i) => i.kind === "invest").length;
  return { project: p, intents: recent.length, invest, stale, watchers, views, prevViews, matches, score: recent.length * 3 + invest * 2 + watchers * 2 + views / 200 };
}

function HotProjects() {
  const db = useDB();
  const [listing, setListing] = useState<Project | null>(null);
  const rows = db.projects
    .filter((p) => p.visibility === "public")
    .map((p) => heatOf(db, p))
    .filter((h) => h.intents || h.watchers)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">按近 14 天收到的意向（投资意向加权）、投资人观察和浏览排序。意向积压的项目提醒一下，值得推荐的收进榜单。</p>
      {rows.length ? (
        <div className="flex flex-col gap-3">
          {rows.map((h, i) => (
            <HotRow key={h.project.id} h={h} rank={i + 1} onList={() => setListing(h.project)} />
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState icon={Flame} title="近 14 天还没有项目收到意向" />
        </Card>
      )}
      <AddToListModal project={listing} onClose={() => setListing(null)} />
    </div>
  );
}

function HotRow({ h, rank, onList }: { h: Heat; rank: number; onList: () => void }) {
  const nudge = useApp((s) => s.nudgeProject);
  const toast = useApp((s) => s.toast);
  const db = useDB();
  const p = h.project;
  const owner = getPerson(db, p.ownerId);
  const delta = h.prevViews ? Math.round(((h.views - h.prevViews) / h.prevViews) * 100) : null;
  const nudgedToday = !!p.nudgedAt && daysSince(p.nudgedAt) < 1;

  return (
    <Card>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold", rank <= 3 ? "bg-primary text-white" : "bg-gray-100 text-gray-600")}>{rank}</span>
          <ProjectLogo text={p.logoText} tone={p.logoTone} size="md" />
          <div className="min-w-0">
            <Link href={`/p/${p.slug}`} className="block truncate text-sm font-semibold text-gray-900 hover:text-brand-700">
              {p.name}
            </Link>
            <p className="truncate text-xs text-gray-500">
              {p.track} · {owner?.name}
              {p.wall !== "approved" ? " · 未上发现页" : ""}
            </p>
          </div>
        </div>
        <dl className="grid shrink-0 grid-cols-4 gap-4 text-center lg:w-[360px]">
          <Metric label="14 天意向" value={h.intents} hint={h.invest ? `投资 ${h.invest}` : undefined} />
          <Metric label="投资人观察" value={h.watchers} />
          <Metric label="7 天浏览" value={h.views.toLocaleString()} hint={delta !== null ? `${delta >= 0 ? "+" : ""}${delta}%` : undefined} />
          <Metric label="撮合" value={h.matches} />
        </dl>
      </div>
      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn("flex items-center gap-1.5 text-sm", h.stale ? "text-warning-700" : "text-gray-500")}>
          {h.stale ? <AlertTriangle size={16} className="shrink-0" /> : <Check size={16} className="shrink-0 text-success-600" />}
          {h.stale ? `${h.stale} 条意向超过 2 天没回应` : "意向都在 2 天内回应了"}
          {p.responseHours !== null ? <span className="text-gray-400">· 平均 {p.responseHours} 小时回复</span> : null}
        </p>
        <div className="flex flex-wrap gap-2">
          {h.stale ? (
            <Button
              size="sm"
              variant="secondary"
              iconLeft={BellRing}
              disabled={nudgedToday}
              onClick={() => {
                nudge(p.id, h.stale);
                toast({ tone: "success", title: `已提醒${owner?.name}`, body: "对方会收到通知，并跳到意向收件箱" });
              }}
            >
              {nudgedToday ? "今天已提醒" : "提醒回应"}
            </Button>
          ) : null}
          <Button size="sm" variant="secondary" iconLeft={ListPlus} disabled={p.wall !== "approved"} onClick={onList}>
            收进榜单
          </Button>
          <Button size="sm" variant="tertiary" iconLeft={Eye} href={`/p/${p.slug}`}>
            看项目
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-gray-900 tabular-nums">{value}</dd>
      {hint ? <dd className="truncate text-xs text-gray-500">{hint}</dd> : null}
    </div>
  );
}

function AddToListModal({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const db = useDB();
  const viewer = useViewer();
  const curate = useApp((s) => s.curateList);
  const toast = useApp((s) => s.toast);
  const [listId, setListId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const lists = project ? db.lists.filter((l) => l.kind === "project" && l.curatorId === viewer?.id && !l.items.some((i) => i.targetId === project.id) && l.items.length < LIST_MAX_ITEMS) : [];
  const err = !listId ? "选一个榜单" : !note.trim() ? "写一句收录理由" : note.length > 40 ? "最多 40 字" : undefined;
  const close = () => {
    setListId(null);
    setNote("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={!!project}
      onClose={close}
      title={`把${project?.name ?? ""}收进榜单`}
      desc="项目负责人和关注榜单的人会收到通知。"
      footer={
        lists.length ? (
          <>
            <Button onClick={close}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                setTried(true);
                if (err || !project || !listId) return;
                curate(listId, { add: { targetId: project.id, note: note.trim() } });
                toast({ tone: "success", title: "已收录", body: "已通知项目负责人和关注榜单的人" });
                close();
              }}
            >
              收录
            </Button>
          </>
        ) : undefined
      }
    >
      {lists.length ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            {lists.map((l) => (
              <button
                key={l.id}
                type="button"
                aria-pressed={listId === l.id}
                onClick={() => setListId(l.id)}
                className={cn("flex items-center justify-between gap-3 rounded-lg border p-3 text-left", listId === l.id ? "border-brand-600 shadow-[0_0_0_1px_var(--color-brand-600)]" : "border-gray-200 hover:border-gray-300")}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">{l.title}</span>
                  <span className="block text-xs text-gray-500">
                    {l.items.length} 个 · {l.followers.length} 人关注{l.featured ? " · 运营精选" : ""}
                  </span>
                </span>
                {listId === l.id ? <Check size={16} className="shrink-0 text-brand-600" /> : null}
              </button>
            ))}
          </div>
          <Input label="收录理由" required value={note} onChange={(e) => setNote(e.target.value)} maxCount={40} placeholder="例如：14 天收到 3 条投资意向，单店模型扎实" error={tried ? err : undefined} />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3">
          <p className="text-sm text-gray-600">你策展的项目榜单都已收录它或已满 {LIST_MAX_ITEMS} 条。新建一个榜单再收录吧。</p>
          <Button size="sm" variant="primary" href="/lists?create=1">
            新建榜单
          </Button>
        </div>
      )}
    </Modal>
  );
}

/* ------------------------------------------------------------------ 审核 */

const REJECT_REASONS = ["资料不完整，补充介绍和产品", "缺少可验证的进展或数据", "疑似重复项目", "不是早期创业项目"];

function Review() {
  const db = useDB();
  const [rejecting, setRejecting] = useState<{ kind: "wall" | "demo"; project: Project } | null>(null);
  const pending = db.projects.filter((p) => p.wall === "pending");
  const rejected = db.projects.filter((p) => p.wall === "rejected");
  const dd = currentDemoDay(db);
  const applied = dd?.entries.filter((e) => e.status === "applied") ?? [];
  const shortlisted = dd?.entries.filter((e) => e.status === "shortlisted") ?? [];
  const review = useApp((s) => s.reviewWall);
  const reviewDD = useApp((s) => s.reviewDemoDayEntry);
  const toast = useApp((s) => s.toast);

  return (
    <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
      <section className="min-w-0">
        <SectionTitle title={`上墙审核（${pending.length}）`} desc="通过后项目出现在发现页；不通过要写原因，项目方可以改完再申请。公开页不受影响。" />
        {pending.length ? (
          <div className="flex flex-col gap-3">
            {pending.map((p) => (
              <ReviewCard
                key={p.id}
                project={p}
                actions={
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      iconLeft={Check}
                      onClick={() => {
                        review(p.id, true);
                        toast({ tone: "success", title: `${p.name}已上发现页`, body: "已通知项目方" });
                      }}
                    >
                      通过
                    </Button>
                    <Button size="sm" variant="secondary" iconLeft={X} onClick={() => setRejecting({ kind: "wall", project: p })}>
                      不通过
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <Empty text="没有待审核的项目。" />
        )}
        {rejected.length ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-gray-500">未通过，等项目方修改后重新申请</p>
            <ul className="flex flex-col gap-2">
              {rejected.map((p) => (
                <li key={p.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
                  <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-gray-900">{p.name}</span>
                    <span className="block truncate text-xs text-gray-500">{p.wallNote || "未写原因"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="min-w-0">
        {dd ? (
          <>
            <SectionTitle title={`${dd.title}报名（${applied.length}）`} desc={`已入围 ${shortlisted.length} 个，每期选 ${SHORTLIST_TARGET} 个左右。看进展、完成度和赛道多样性。`} />
            <ProgressBar value={(shortlisted.length / SHORTLIST_TARGET) * 100} tone="highlight" className="mb-4" />
            {applied.length ? (
              <div className="flex flex-col gap-3">
                {applied.map((e) => {
                  const p = getProject(db, e.projectId);
                  if (!p) return null;
                  const sameTrack = shortlisted.filter((x) => getProject(db, x.projectId)?.track === p.track).length;
                  return (
                    <ReviewCard
                      key={p.id}
                      project={p}
                      extra={
                        <>
                          <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                            <span className="text-xs text-gray-500">路演想讲 · {relativeTime(e.appliedAt)}报名</span>
                            <span className="mt-0.5 block">{e.pitchNote}</span>
                          </p>
                          {sameTrack ? <p className="mt-2 text-xs text-warning-700">已入围项目里有 {sameTrack} 个同赛道（{p.track}）</p> : null}
                        </>
                      }
                      actions={
                        <>
                          <Button
                            size="sm"
                            variant="primary"
                            iconLeft={Trophy}
                            onClick={() => {
                              reviewDD(dd.id, p.id, "shortlisted");
                              toast({ tone: "success", title: `${p.name}已入围`, body: "已通知项目方，获得“路演入围”徽章" });
                            }}
                          >
                            入围
                          </Button>
                          <Button size="sm" variant="secondary" iconLeft={X} onClick={() => setRejecting({ kind: "demo", project: p })}>
                            本期不入围
                          </Button>
                        </>
                      }
                    />
                  );
                })}
              </div>
            ) : (
              <Empty text="没有待评审的报名。" />
            )}
            {shortlisted.length ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-medium text-gray-500">已入围</p>
                <div className="flex flex-wrap gap-2">
                  {shortlisted.map((e) => {
                    const p = getProject(db, e.projectId);
                    return p ? (
                      <Link key={p.id} href={`/p/${p.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white py-0.5 pr-3 pl-0.5 text-sm font-medium text-gray-700 hover:border-gray-300">
                        <ProjectLogo text={p.logoText} tone={p.logoTone} size="xs" className="rounded-full" />
                        {p.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </div>
            ) : null}
          </>
        ) : (
          <Empty text="本月路演还没开放报名。" />
        )}
      </section>

      <RejectModal
        target={rejecting}
        onClose={() => setRejecting(null)}
        onConfirm={(reason) => {
          if (!rejecting) return;
          if (rejecting.kind === "wall") review(rejecting.project.id, false, reason);
          else if (dd) reviewDD(dd.id, rejecting.project.id, "rejected", reason);
          toast({ tone: "info", title: rejecting.kind === "wall" ? "已退回" : "已标为本期不入围", body: "已通知项目方和原因" });
        }}
      />
    </div>
  );
}

function ReviewCard({ project, actions, extra }: { project: Project; actions: React.ReactNode; extra?: React.ReactNode }) {
  const db = useDB();
  const owner = getPerson(db, project.ownerId);
  const c = projectCompletion(project);
  const missing = c.items.filter((i) => !i.done);
  return (
    <Card>
      <div className="flex items-start gap-3">
        <ProjectLogo text={project.logoText} tone={project.logoTone} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/p/${project.slug}`} className="block truncate text-sm font-semibold text-gray-900 hover:text-brand-700">
            {project.name}
          </Link>
          <p className="truncate text-xs text-gray-500">
            {project.track} · {project.region} · {owner?.name} · 创建于 {formatDate(project.createdAt)}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">{project.oneLiner}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar value={c.percent} tone={c.percent >= 80 ? "success" : "brand"} className="flex-1" />
        <span className="shrink-0 text-xs font-medium text-gray-700 tabular-nums">完成度 {c.percent}%</span>
      </div>
      {missing.length ? <p className="mt-1.5 text-xs text-gray-500">还缺：{missing.map((m) => m.label).join("、")}</p> : null}
      {extra}
      <div className="mt-4 flex flex-wrap gap-2">
        {actions}
        <Button size="sm" variant="tertiary" iconLeft={Eye} href={`/p/${project.slug}`}>
          看公开页
        </Button>
      </div>
    </Card>
  );
}

function RejectModal({ target, onClose, onConfirm }: { target: { kind: "wall" | "demo"; project: Project } | null; onClose: () => void; onConfirm: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  const [tried, setTried] = useState(false);
  const needs = target?.kind === "wall";
  const err = needs && !reason.trim() ? "写一句原因，项目方知道该改什么" : undefined;
  const close = () => {
    setReason("");
    setTried(false);
    onClose();
  };
  return (
    <Modal
      open={!!target}
      onClose={close}
      size="sm"
      title={target?.kind === "wall" ? `${target.project.name}暂不上发现页` : `${target?.project.name ?? ""}本期不入围`}
      desc={target?.kind === "wall" ? "原因会发给项目方，改完可以重新申请。" : "会通知项目方，下个月可以再报名。原因选填。"}
      footer={
        <>
          <Button onClick={close}>取消</Button>
          <Button
            variant="destructive"
            onClick={() => {
              setTried(true);
              if (err) return;
              onConfirm(reason.trim());
              close();
            }}
          >
            确认
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {(target?.kind === "wall" ? REJECT_REASONS : ["本期同赛道项目较多", "进展还不够，建议下期再报", "路演想讲的内容不够具体"]).map((r) => (
            <Tag key={r} active={reason === r} onClick={() => setReason(r)}>
              {r}
            </Tag>
          ))}
        </div>
        <Textarea label={needs ? "原因" : "原因（选填）"} required={needs} rows={2} maxCount={60} value={reason} onChange={(e) => setReason(e.target.value)} error={tried ? err : undefined} />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ 公共 */

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "warning" }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "warning" ? "text-warning-600" : "text-gray-900")}>{value}</p>
    </Card>
  );
}

function SectionTitle({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      {desc ? <p className="text-sm text-gray-500">{desc}</p> : null}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">{text}</p>;
}
