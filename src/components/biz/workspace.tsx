"use client";

import {
  ArrowRight,
  Award,
  Bookmark,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  Download,
  Hourglass,
  Inbox,
  Lightbulb,
  ListOrdered,
  Megaphone,
  PencilLine,
  Share2,
  Trophy,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { LookingForChips } from "@/components/biz/looking-for";
import { Button } from "@/components/ui/button";
import { AreaChart, BarList } from "@/components/ui/charts";
import { Badge, Card, Cover, EmptyState, FeaturedIcon, ProgressRing, ProjectLogo, Stat, Tag } from "@/components/ui/display";
import { Input, Textarea } from "@/components/ui/form";
import { Segmented } from "@/components/ui/tabs";
import { BADGES, SOURCE_LABEL } from "@/data/constants";
import { ago, daysSince, effectiveNow, formatDate, formatDateTime } from "@/data/time";
import type { Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { currentDemoDay, followerCount, getPerson, projectCompletion, useDB } from "@/store/selectors";

export type WorkspaceTab = "overview" | "intents" | "team" | "updates" | "feedback" | "exposure" | "share";

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

/** 达到这个完成度才能申请上发现页和报名月度路演。 */
export const EXPOSURE_MIN_COMPLETION = 80;

/* ------------------------------------------------------------------ 概览 */

export function OverviewPanel({ project, manage, onTab }: { project: Project; manage: boolean; onTab: (t: WorkspaceTab) => void }) {
  const db = useDB();
  const views = project.stats.views;
  const last7 = sum(views.slice(-7));
  const prev7 = sum(views.slice(-14, -7));
  const delta = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : undefined;
  const labels = views.map((_, i) => formatDate(ago(views.length - 1 - i)));

  const followers = followerCount(db, "project", project.id);
  const newFollows = db.follows.filter((f) => f.targetType === "project" && f.targetId === project.id && daysSince(f.at) < 7).length;
  const intents = db.intents.filter((i) => i.projectId === project.id);
  const pending = intents.filter((i) => i.status === "pending");
  const convs = db.conversations.filter((c) => c.projectId === project.id);
  const matches = convs.filter((c) => c.match);
  const watchers = db.watch.filter((w) => w.projectId === project.id).length;
  const feedbackTodo = db.feedback.filter((f) => f.projectId === project.id && !f.reply && !f.helpful).length;
  const invited = project.team.filter((t) => t.status === "invited").length;
  const completion = projectCompletion(project);
  const lastUpdate = project.updates[0];

  const sources = (Object.keys(SOURCE_LABEL) as TrafficSource[])
    .map((k) => ({ key: k, label: SOURCE_LABEL[k], value: project.stats.sources[k] ?? 0 }))
    .sort((a, b) => b.value - a.value);
  const totalSrc = sum(sources.map((s) => s.value));
  const shared = (project.stats.sources.wechat ?? 0) + (project.stats.sources.moments ?? 0) + (project.stats.sources.poster ?? 0);

  const todos: { key: string; icon: LucideIcon; title: string; desc: string; go: () => void; href?: string }[] = [];
  if (manage && pending.length)
    todos.push({ key: "intents", icon: Inbox, title: `回应 ${pending.length} 条意向`, desc: "回复速度会显示在项目页上，影响对方的判断", go: () => onTab("intents") });
  if (feedbackTodo) todos.push({ key: "feedback", icon: Lightbulb, title: `处理 ${feedbackTodo} 条建议`, desc: "标记有用或回复，对方会收到通知", go: () => onTab("feedback") });
  if (completion.remaining)
    todos.push({ key: "edit", icon: PencilLine, title: `补全资料（还差 ${completion.remaining} 项）`, desc: `完成度 ${completion.percent}%，${EXPOSURE_MIN_COMPLETION}% 以上可申请上发现页`, go: () => {}, href: `/p/${project.slug}/edit` });
  if (manage && invited) todos.push({ key: "team", icon: UserPlus, title: `${invited} 位成员还没确认`, desc: "确认后项目才会出现在 TA 的主页上", go: () => onTab("team") });
  if (!lastUpdate || daysSince(lastUpdate.at) > 14)
    todos.push({ key: "updates", icon: Megaphone, title: lastUpdate ? "两周没发动态了" : "发第一条动态", desc: "用模板 30 秒发一条，关注者会收到提醒", go: () => onTab("updates") });
  if (manage && project.wall === "none" && completion.percent >= EXPOSURE_MIN_COMPLETION)
    todos.push({ key: "wall", icon: Compass, title: "申请上发现页", desc: "资料已达标，审核通过后所有人都能在发现页看到你", go: () => onTab("exposure") });
  if (shared === 0) todos.push({ key: "share", icon: Share2, title: "把项目页转发给 3 个朋友", desc: "第一批关注通常来自熟人", go: () => onTab("share") });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <Stat label="近 7 天浏览" value={last7} delta={delta} hint={prev7 ? `上周 ${prev7}` : "数据从今天开始累计"} />
        </Card>
        <Card>
          <Stat label="关注" value={followers} hint={newFollows ? `本周新增 ${newFollows}` : "本周暂无新增"} />
        </Card>
        <Card>
          <Stat label="收到意向" value={intents.length} hint={pending.length ? <span className="font-medium text-brand-700">{pending.length} 条待回应</span> : intents.length ? "全部已处理" : "写清“正在寻找”会带来意向"} />
        </Card>
        <Card>
          <Stat label="对话" value={convs.length} hint={matches.length ? `${matches.length} 段进入 Pitch 撮合` : "接受意向后自动创建"} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900">浏览趋势</h3>
                <p className="text-sm text-gray-500">近 14 天项目页浏览次数</p>
              </div>
              {delta !== undefined ? (
                <Badge tone={delta >= 0 ? "success" : "gray"}>{delta >= 0 ? `比上周多 ${delta}%` : `比上周少 ${Math.abs(delta)}%`}</Badge>
              ) : null}
            </div>
            <AreaChart data={views} labels={labels} />
          </Card>

          <Card>
            <h3 className="text-base font-semibold text-gray-900">从浏览到撮合</h3>
            <p className="text-sm text-gray-500">累计数据，看看哪一步掉得最多</p>
            <Funnel
              steps={[
                { label: "近 14 天浏览", value: sum(views) },
                { label: "关注", value: followers },
                { label: "意向", value: intents.length },
                { label: "对话", value: convs.length },
                { label: "撮合", value: matches.length },
              ]}
            />
          </Card>

          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-gray-900">流量来源</h3>
                <p className="text-sm text-gray-500">
                  转发带来 {totalSrc ? Math.round((shared / totalSrc) * 100) : 0}%（微信好友、朋友圈、海报）
                </p>
              </div>
              <Button size="sm" variant="secondary" iconLeft={Share2} onClick={() => onTab("share")}>
                生成分享物料
              </Button>
            </div>
            {totalSrc ? (
              <BarList items={sources.filter((s) => s.value > 0).map((s) => ({ label: s.label, value: s.value, hint: `${s.value} 次` }))} />
            ) : (
              <EmptyState compact icon={Share2} title="还没有访问" desc="复制链接发给朋友，来源会显示在这里" />
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <h3 className="text-base font-semibold text-gray-900">现在最值得做的事</h3>
            {todos.length ? (
              <ul className="mt-3 flex flex-col gap-1">
                {todos.slice(0, 5).map((t) => {
                  const body = (
                    <>
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600">
                        <t.icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">{t.title}</span>
                        <span className="block text-xs text-gray-500">{t.desc}</span>
                      </span>
                      <ArrowRight size={16} className="mt-2 shrink-0 text-gray-400" />
                    </>
                  );
                  const cls = "flex w-full items-start gap-3 rounded-lg p-2 text-left hover:bg-gray-50";
                  return (
                    <li key={t.key}>
                      {t.href ? (
                        <Link href={t.href} className={cls}>
                          {body}
                        </Link>
                      ) : (
                        <button onClick={t.go} className={cls}>
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-success-50 p-3 text-sm text-success-700">
                <CheckCircle2 size={16} />
                都处理完了，周报会在周一早上发给你
              </div>
            )}
          </Card>

          <Card className="flex items-center gap-4">
            <ProgressRing value={completion.percent} size={56} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">资料完成度</p>
              <p className="text-xs text-gray-500">{completion.remaining ? `还差 ${completion.remaining} 项` : "已全部完成"}</p>
            </div>
            <Button size="sm" variant="secondary" href={`/p/${project.slug}/edit`}>
              {completion.remaining ? "去完善" : "编辑"}
            </Button>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <FeaturedIcon icon={Bookmark} tone="brand" size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">{watchers ? `${watchers} 位投资人把你加入了观察清单` : "还没有投资人收藏"}</p>
                <p className="mt-0.5 text-xs text-gray-500">只显示人数，不显示是谁。你发动态时他们会收到提醒。</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-25">
            <p className="text-sm font-semibold text-gray-900">每周一的项目周报</p>
            <p className="mt-1 text-xs text-gray-500">浏览、关注、意向和来源的周变化，通过服务号和邮件发给创始人。</p>
            <Button size="sm" variant="link" iconRight={ArrowRight} href="/digest/preview?role=founder" className="mt-2">
              预览本周周报
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, steps[0].value);
  return (
    <ol className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5 sm:gap-0">
      {steps.map((s, i) => {
        const prev = steps[i - 1]?.value;
        const rate = i > 0 && prev ? Math.round((s.value / prev) * 100) : null;
        return (
          <li key={s.label} className="flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-2 sm:border-l sm:border-gray-100 sm:px-3 sm:first:border-l-0 sm:first:pl-0">
            <span className="w-20 shrink-0 text-xs font-medium text-gray-500 sm:w-auto">{s.label}</span>
            <span className="w-12 shrink-0 text-lg font-semibold text-gray-900 tabular-nums sm:w-auto sm:text-2xl">{s.value}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 sm:flex-none">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(4, (s.value / max) * 100)}%` }} />
            </div>
            <span className="w-14 shrink-0 text-right text-xs text-gray-500 sm:w-auto sm:text-left">{rate !== null ? `转化 ${rate}%` : " "}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ 曝光：上墙、路演、榜单、徽章 */

export function ExposurePanel({ project, onTab }: { project: Project; onTab: (t: WorkspaceTab) => void }) {
  const db = useDB();
  const applyWall = useApp((s) => s.applyWall);
  const applyDemoDay = useApp((s) => s.applyDemoDay);
  const toast = useApp((s) => s.toast);
  const completion = projectCompletion(project);
  const ready = completion.percent >= EXPOSURE_MIN_COMPLETION;
  const dd = currentDemoDay(db);
  const entry = dd?.entries.find((e) => e.projectId === project.id);
  const closed = dd ? effectiveNow() > new Date(dd.applyDeadline).getTime() : true;
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const noteError = tried && note.trim().length < 10 ? "至少 10 个字，让评审知道你想讲什么" : undefined;
  const lists = db.lists.filter((l) => l.items.some((it) => it.targetId === project.id));
  const past = db.demoDays.filter((d) => d.status === "ended" && d.entries.some((e) => e.projectId === project.id));

  const votes = dd && entry ? dd.votes[project.id]?.length ?? 0 : 0;
  const rank =
    dd && entry?.status === "shortlisted"
      ? dd.entries
          .filter((e) => e.status === "shortlisted")
          .map((e) => ({ id: e.projectId, v: dd.votes[e.projectId]?.length ?? 0 }))
          .sort((a, b) => b.v - a.v)
          .findIndex((x) => x.id === project.id) + 1
      : 0;

  const Requirement = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
    <li className="flex items-start gap-2 text-sm">
      <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", ok ? "bg-success-500 text-white" : "border border-gray-300")}>
        {ok ? <Check size={11} strokeWidth={3} /> : null}
      </span>
      <span className={ok ? "text-gray-500" : "text-gray-800"}>{children}</span>
    </li>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={Compass} tone="brand" />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900">上发现页</h3>
            <p className="text-sm text-gray-500">审核只决定是否出现在发现页、榜单和推荐里；公开页一直可以访问。</p>
          </div>
          <WallBadge wall={project.wall} />
        </div>

        {project.wall === "approved" ? (
          <div className="rounded-lg border border-success-200 bg-success-25 p-4 text-sm text-success-800">
            所有人都能在发现页看到 {project.name}。近期从发现页来的浏览：<b>{project.stats.sources.discover}</b> 次。
            <Link href="/discover" className="ml-1 font-semibold text-success-700 underline-offset-2 hover:underline">
              去发现页看看
            </Link>
          </div>
        ) : project.wall === "pending" ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-25 p-4 text-sm text-warning-800">
            <Hourglass size={18} className="mt-0.5 shrink-0 text-warning-600" />
            <span>已提交，运营会在 1 个工作日内处理，结果会通过通知告诉你。审核期间公开页照常可访问。</span>
          </div>
        ) : (
          <>
            {project.wall === "rejected" ? (
              <div className="flex items-start gap-3 rounded-lg border border-error-200 bg-error-25 p-4 text-sm text-error-700">
                <XCircle size={18} className="mt-0.5 shrink-0" />
                <span>
                  <b>上次未通过：</b>
                  {project.wallNote || "资料还不够完整"}。按建议修改后可以重新申请。
                </span>
              </div>
            ) : null}
            <ul className="flex flex-col gap-2">
              <Requirement ok={ready}>
                资料完成度达到 {EXPOSURE_MIN_COMPLETION}%（当前 {completion.percent}%）
                {!ready ? (
                  <Link href={`/p/${project.slug}/edit`} className="ml-1 font-semibold text-brand-700">
                    去完善
                  </Link>
                ) : null}
              </Requirement>
              <Requirement ok={project.visibility === "public"}>可见范围为公开{project.visibility === "link" ? "（申请后会自动改为公开）" : ""}</Requirement>
            </ul>
            <Button
              variant="primary"
              className="self-start"
              disabled={!ready}
              onClick={() => {
                applyWall(project.id);
                toast({ tone: "success", title: "已提交上墙申请", body: "1 个工作日内会有结果" });
              }}
            >
              {project.wall === "rejected" ? "重新申请" : "申请上发现页"}
            </Button>
          </>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={Trophy} tone="highlight" />
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-gray-900">月度路演</h3>
            <p className="text-sm text-gray-500">{dd ? `${dd.title} · ${dd.theme}` : "本月暂无开放的路演"}</p>
          </div>
          {entry ? <EntryBadge status={entry.status} /> : null}
        </div>

        {!dd ? (
          <p className="text-sm text-gray-500">下一期开放报名时会通知你。</p>
        ) : entry?.status === "shortlisted" ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">当前票数</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">{votes}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">入围项目中排名</p>
                <p className="text-xl font-semibold text-gray-900 tabular-nums">第 {rank} 名</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">开放后前几天名单随机排序，之后按票数排序。投票会为投票人换得意向次数。</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="primary" href="/demo-day">
                去路演页
              </Button>
              <Button size="sm" variant="secondary" iconLeft={Share2} onClick={() => onTab("share")}>
                分享拉票
              </Button>
            </div>
          </div>
        ) : entry?.status === "applied" ? (
          <div className="rounded-lg border border-gray-200 bg-gray-25 p-4 text-sm text-gray-700">
            <p>
              已报名，运营会在 {formatDateTime(dd.applyDeadline)} 报名截止后公布入围名单。
            </p>
            <p className="mt-2 text-gray-500">你想讲：{entry.pitchNote}</p>
          </div>
        ) : entry?.status === "rejected" ? (
          <div className="rounded-lg border border-gray-200 bg-gray-25 p-4 text-sm text-gray-700">
            本期未入围{entry.opsNote ? `：${entry.opsNote}` : ""}。下个月可以再报名，入围与否不影响项目页。
          </div>
        ) : closed ? (
          <p className="text-sm text-gray-500">本期报名已截止，下一期开放时会通知你。</p>
        ) : (
          <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              <Requirement ok={ready}>资料完成度达到 {EXPOSURE_MIN_COMPLETION}%（当前 {completion.percent}%）</Requirement>
              <Requirement ok>报名截止 {formatDateTime(dd.applyDeadline)}</Requirement>
            </ul>
            <Textarea
              rows={2}
              label="你想在路演上讲什么"
              maxCount={60}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="比如：新加坡首店 3 个月回本的模型，以及瓶装茶进 KA 的计划"
              error={noteError}
              disabled={!ready}
            />
            <Button
              variant="primary"
              className="self-start"
              disabled={!ready}
              onClick={() => {
                setTried(true);
                if (note.trim().length < 10) return;
                applyDemoDay(dd.id, project.id, note.trim());
                toast({ tone: "success", title: "报名成功", body: "截止后公布入围名单，结果会通知你" });
              }}
            >
              报名{dd.title}
            </Button>
          </div>
        )}

        {past.length ? (
          <div className="border-t border-gray-100 pt-3 text-xs text-gray-500">
            参加过：{past.map((d) => d.title).join("、")}
          </div>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={ListOrdered} tone="blue" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">被收录的榜单</h3>
            <p className="text-sm text-gray-500">由运营和投资人策展，收录理由会显示在榜单上</p>
          </div>
        </div>
        {lists.length ? (
          <ul className="flex flex-col divide-y divide-gray-100">
            {lists.map((l) => {
              const curator = getPerson(db, l.curatorId);
              const it = l.items.find((x) => x.targetId === project.id)!;
              return (
                <li key={l.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href={`/lists/${l.id}`} className="text-sm font-semibold text-gray-900 hover:text-brand-700">
                    {l.title}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {curator?.name} 策展 · {l.followers.length} 人关注
                  </p>
                  {it.note ? <p className="mt-1 text-sm text-gray-600">“{it.note}”</p> : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compact icon={ListOrdered} title="还没有被收录" desc="上发现页后，策展人更容易看到你" />
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <FeaturedIcon icon={Award} tone="success" />
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900">项目徽章</h3>
            <p className="text-sm text-gray-500">由真实行为自动获得，显示在项目页和发现页卡片上</p>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {["pitch_featured", "demoday_shortlist", "demoday_top3", "fast_responder"].map((id) => {
            const b = BADGES[id];
            const has = project.badges.includes(id);
            return (
              <li key={id} className={cn("flex items-center gap-3 rounded-lg border p-3", has ? "border-gray-200" : "border-dashed border-gray-200 bg-gray-25")}>
                <Badge tone={has ? b.tone : "gray"}>{b.label}</Badge>
                <span className="min-w-0 flex-1 text-xs text-gray-500">{b.desc}</span>
                {has ? <Check size={16} className="shrink-0 text-success-600" /> : <span className="shrink-0 text-xs text-gray-400">未获得</span>}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

export function WallBadge({ wall }: { wall: Project["wall"] }) {
  switch (wall) {
    case "approved":
      return <Badge tone="success" dot>已上发现页</Badge>;
    case "pending":
      return <Badge tone="warning" dot>审核中</Badge>;
    case "rejected":
      return <Badge tone="error" dot>未通过</Badge>;
    default:
      return <Badge tone="gray">未上发现页</Badge>;
  }
}

function EntryBadge({ status }: { status: "applied" | "shortlisted" | "rejected" }) {
  if (status === "shortlisted") return <Badge tone="highlight">已入围</Badge>;
  if (status === "applied") return <Badge tone="warning" dot>待筛选</Badge>;
  return <Badge tone="gray">未入围</Badge>;
}

/* ------------------------------------------------------------------ 分享物料 */

const CHANNELS = [
  { value: "wechat", label: "微信好友" },
  { value: "moments", label: "朋友圈" },
  { value: "poster", label: "海报" },
] as const;
type Channel = (typeof CHANNELS)[number]["value"];

function copyText(text: string) {
  void navigator.clipboard?.writeText(text).catch(() => {});
}

export function SharePanel({ project }: { project: Project }) {
  const db = useDB();
  const recordView = useApp((s) => s.recordView);
  const toast = useApp((s) => s.toast);
  const [channel, setChannel] = useState<Channel>("wechat");
  const link = `https://pitch.cn/p/${project.slug}?from=${channel}`;
  const owner = getPerson(db, project.ownerId);

  const copies = useMemo(() => {
    const invest = project.lookingFor.find((n) => n.kind === "invest");
    const partner = project.lookingFor.find((n) => n.kind === "partner");
    const join = project.lookingFor.find((n) => n.kind === "join");
    const out: { key: string; label: string; text: string }[] = [
      {
        key: "intro",
        label: "介绍",
        text: `我们在做「${project.name}」：${project.oneLiner}。项目页上有完整的介绍和最新进展，欢迎看看、给点建议。`,
      },
    ];
    if (invest) out.push({ key: "invest", label: "融资", text: `「${project.name}」正在${invest.title}。${project.oneLiner}。对${project.track}感兴趣的朋友，可以在项目页直接表达意向。` });
    if (partner) out.push({ key: "partner", label: "合作", text: `「${project.name}」在找${partner.sub ? `${partner.sub}合作：` : ""}${partner.title}。有资源的朋友欢迎在项目页联系我们。` });
    if (join) out.push({ key: "join", label: "招人", text: `「${project.name}」在招${join.title}。${project.oneLiner}。想一起做的朋友，项目页上可以直接表达意向。` });
    return out;
  }, [project]);
  const [copyKey, setCopyKey] = useState(copies[0].key);
  const copy = copies.find((c) => c.key === copyKey) ?? copies[0];

  const shareStats = CHANNELS.map((c) => ({ ...c, count: project.stats.sources[c.value] ?? 0 }));

  /** 原型里没有真实访客：复制链接后模拟一位好友点开，让工作台的来源数据联动起来。 */
  const simulateVisit = (ch: Channel) => {
    setTimeout(() => {
      recordView(project.id, ch);
      toast({ tone: "info", title: `1 位朋友通过${SOURCE_LABEL[ch]}打开了项目页`, body: "演示数据：来源已计入工作台概览" });
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">带来源的分享链接</h3>
            <p className="text-sm text-gray-500">不同渠道用不同链接，工作台能分清流量从哪来</p>
          </div>
          <Segmented<Channel> value={channel} onChange={setChannel} items={CHANNELS.map((c) => ({ value: c.value, label: c.label }))} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={link} wrapperClassName="min-w-0 flex-1" className="font-mono text-sm" />
            <Button
              variant="primary"
              iconLeft={Copy}
              onClick={() => {
                copyText(link);
                toast({ tone: "success", title: "链接已复制", body: `发到${SOURCE_LABEL[channel]}吧` });
                simulateVisit(channel);
              }}
            >
              复制链接
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {shareStats.map((s) => (
              <div key={s.value} className={cn("rounded-lg border p-3", s.value === channel ? "border-brand-200 bg-brand-25" : "border-gray-200")}>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-semibold text-gray-900 tabular-nums">{s.count}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">转发文案</h3>
              <p className="text-sm text-gray-500">按“正在寻找”自动生成，可以改了再发</p>
            </div>
            <Segmented size="sm" value={copy.key} onChange={setCopyKey} items={copies.map((c) => ({ value: c.key, label: c.label }))} />
          </div>
          <CopyEditor key={`${copy.key}-${channel}`} initial={`${copy.text}\n${link}`} onCopy={() => simulateVisit(channel)} />
        </Card>
      </div>

      <Card className="flex flex-col items-center gap-4">
        <div className="self-stretch">
          <h3 className="text-base font-semibold text-gray-900">项目海报</h3>
          <p className="text-sm text-gray-500">适合发朋友圈和社群，扫码直达项目页</p>
        </div>
        <Poster project={project} ownerName={owner?.name ?? ""} />
        <div className="flex w-full gap-2">
          <Button
            variant="primary"
            iconLeft={Download}
            className="flex-1"
            onClick={() => {
              toast({ tone: "success", title: "海报已保存", body: "原型中不会真的下载文件" });
              simulateVisit("poster");
            }}
          >
            保存海报
          </Button>
          <Button
            variant="secondary"
            iconOnly={Copy}
            aria-label="复制海报链接"
            onClick={() => {
              copyText(`https://pitch.cn/p/${project.slug}?from=poster`);
              toast({ tone: "success", title: "海报链接已复制" });
            }}
          />
        </div>
      </Card>
    </div>
  );
}

function CopyEditor({ initial, onCopy }: { initial: string; onCopy: () => void }) {
  const toast = useApp((s) => s.toast);
  const [text, setText] = useState(initial);
  return (
    <div className="flex flex-col gap-3">
      <Textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} />
      <Button
        variant="secondary"
        iconLeft={Copy}
        className="self-start"
        onClick={() => {
          copyText(text);
          toast({ tone: "success", title: "文案已复制" });
          onCopy();
        }}
      >
        复制文案
      </Button>
    </div>
  );
}

function Poster({ project, ownerName }: { project: Project; ownerName: string }) {
  return (
    <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
      <Cover tone={project.coverTone} className="h-32" />
      <div className="relative px-5 pb-5">
        <ProjectLogo text={project.logoText} tone={project.logoTone} size="lg" className="-mt-7 ring-4 ring-white" />
        <p className="mt-3 text-lg font-semibold text-gray-900">{project.name}</p>
        <p className="mt-1 text-sm text-gray-600">{project.oneLiner}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Tag>{project.track}</Tag>
          {project.tags.slice(0, 2).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
        {project.lookingFor.length ? (
          <div className="mt-3">
            <LookingForChips needs={project.lookingFor} max={2} size="xs" />
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-3 border-t border-dashed border-gray-200 pt-4">
          <FakeQR seed={project.slug} />
          <div className="min-w-0 text-xs text-gray-500">
            <p className="font-semibold text-gray-900">长按识别，查看项目</p>
            <p className="mt-0.5">{ownerName} 邀请你在 Pitch 上看看</p>
            <p className="mt-1.5 inline-flex items-center gap-1 rounded bg-gray-900 px-1.5 py-0.5 text-[10px] font-bold text-highlight">PITCH</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 占位二维码：按 slug 生成稳定的点阵，三个角是定位块。 */
function FakeQR({ seed }: { seed: string }) {
  const n = 21;
  const cells = useMemo(() => {
    let h = 0;
    for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const out: boolean[] = [];
    for (let i = 0; i < n * n; i++) {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      h >>>= 0;
      out.push(h % 2 === 0);
    }
    return out;
  }, [seed]);
  const finder = (x: number, y: number) => {
    const inBox = (ox: number, oy: number) => x >= ox && x < ox + 7 && y >= oy && y < oy + 7;
    for (const [ox, oy] of [
      [0, 0],
      [n - 7, 0],
      [0, n - 7],
    ]) {
      if (inBox(ox, oy)) {
        const dx = x - ox;
        const dy = y - oy;
        return dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4) ? 1 : 0;
      }
    }
    return -1;
  };
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-16 w-16 shrink-0" shapeRendering="crispEdges" aria-label="项目二维码">
      <rect width={n} height={n} fill="white" />
      {cells.map((on, i) => {
        const x = i % n;
        const y = Math.floor(i / n);
        const f = finder(x, y);
        return (f === 1 || (f === -1 && on)) ? <rect key={i} x={x} y={y} width={1} height={1} fill="#18181b" /> : null;
      })}
    </svg>
  );
}
