"use client";

import {
  ArrowRight,
  Bell,
  CalendarClock,
  ChevronRight,
  Compass,
  Eye,
  Inbox,
  MessageCircle,
  Mic,
  Radio,
  Send,
  Shield,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import { FirstStepsCard } from "@/components/biz/first-steps";
import { slotPhase } from "@/components/biz/office-hours";
import { PersonRow } from "@/components/biz/person-card";
import { ProjectCard, ProjectRow } from "@/components/biz/project-card";
import { FollowButton } from "@/components/biz/follow-button";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/ui/charts";
import { Avatar, Badge, Card, Cover, EmptyState, ProgressRing, ProjectLogo, SectionHeader } from "@/components/ui/display";
import { formatDate, formatDateTime, relativeTime } from "@/data/time";
import type { Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import {
  currentDemoDay,
  eventStatus,
  followerCount,
  getPerson,
  getProject,
  manageableProjects,
  pendingIntentCount,
  projectCompletion,
  roleText,
  unreadConversations,
  useDB,
  useQuota,
  useViewer,
  watchUpdates,
} from "@/store/selectors";

export default function Home() {
  const viewer = useViewer();
  if (!viewer) return <GuestLanding />;
  return <RoleHome viewer={viewer} />;
}

function greeting() {
  const h = new Date().getHours();
  return h < 6 ? "夜深了" : h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好";
}

function RoleHome({ viewer }: { viewer: Person }) {
  const quota = useQuota();
  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{formatDateTime(new Date().toISOString()).split(" ").slice(0, 2).join(" ")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">
            {greeting()}，{viewer.name}
          </h1>
        </div>
        {quota ? (
          <Link href="/rewards" className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-xs hover:bg-gray-50 sm:self-auto">
            <Send size={16} className="text-brand-600" />
            {quota.unlimited ? (
              <span className="font-medium text-gray-700">会员 · 意向不限次数</span>
            ) : (
              <span className="text-gray-600">
                本月还可发 <b className="text-gray-900">{quota.remaining}</b> 次意向
              </span>
            )}
            <ChevronRight size={14} className="text-gray-400" />
          </Link>
        ) : null}
      </div>

      {!viewer.onboarded ? (
        <Card className="mt-6 flex flex-col items-start gap-4 border-brand-200 bg-brand-25 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600 ring-8 ring-brand-50">
            <Sparkles size={22} />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">花 30 秒告诉我们你是谁</p>
            <p className="text-sm text-gray-600">选择身份后，首页会给出最适合你的第一步，主页也会自动生成。</p>
          </div>
          <Button variant="primary" href="/welcome" iconRight={ArrowRight}>
            开始设置
          </Button>
        </Card>
      ) : null}

      <div className="mt-6">
        <FirstStepsCard />
      </div>

      <TodoStrip viewer={viewer} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-8">
          {viewer.isOps ? <OpsHome /> : null}
          {viewer.role === "founder" ? <FounderHome viewer={viewer} /> : null}
          {viewer.role === "investor" ? <InvestorHome viewer={viewer} /> : null}
          {viewer.role === "talent" ? <TalentHome /> : null}
          {viewer.role === "partner" ? <PartnerHome /> : null}
          {!viewer.role && !viewer.isOps ? <Featured /> : null}
        </div>
        <aside className="flex flex-col gap-6">
          <Happening />
          <Articles />
        </aside>
      </div>
    </Page>
  );
}

function TodoStrip({ viewer }: { viewer: Person }) {
  const db = useDB();
  const intents = pendingIntentCount(db, viewer.id);
  const unread = unreadConversations(db, viewer.id);
  const invites = db.projects.filter((p) => p.team.some((t) => t.personId === viewer.id && t.status === "invited")).length;
  const oh = db.officeHours.filter((s) => s.hostId === viewer.id && slotPhase(s) === "requested").length;
  const items = [
    { n: intents, label: "条意向等你回应", href: "/me/intents?tab=received", icon: Send },
    { n: unread, label: "个对话有新消息", href: "/inbox", icon: MessageCircle },
    { n: invites, label: "个项目邀请你加入", href: "/me/intents?tab=invites", icon: UserPlus },
    { n: oh, label: "个答疑预约待确认", href: "/office-hours?tab=hosting", icon: CalendarClock },
  ].filter((i) => i.n > 0);
  if (!items.length) return null;
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <Link key={it.href} href={it.href} className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-brand-300">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-50 text-error-600">
              <Icon size={20} />
            </span>
            <p className="flex-1 text-sm text-gray-600">
              <b className="mr-1 text-lg text-gray-900">{it.n}</b>
              {it.label}
            </p>
            <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-600" />
          </Link>
        );
      })}
    </div>
  );
}

function FounderHome({ viewer }: { viewer: Person }) {
  const db = useDB();
  const openCreate = useApp((s) => s.openCreate);
  const projects = manageableProjects(db, viewer.id);
  const tracks = new Set(projects.map((p) => p.track));
  const helpers = db.people
    .filter((p) => p.id !== viewer.id && ((p.role === "investor" && p.openStatus.investor?.tracks.some((t) => tracks.has(t))) || (p.role === "partner" && p.openStatus.offers?.length)))
    .slice(0, 5);
  return (
    <>
      <section>
        <SectionHeader title="我的项目" desc="近 7 天的数据，点进工作台看完整分析" action={<Button size="sm" variant="secondary" onClick={openCreate}>新建项目</Button>} />
        {projects.length ? (
          <div className="mt-4 flex flex-col gap-4">
            {projects.map((p) => {
              const views7 = p.stats.views.slice(-7).reduce((a, b) => a + b, 0);
              const prev7 = p.stats.views.slice(0, 7).reduce((a, b) => a + b, 0);
              const delta = prev7 ? Math.round(((views7 - prev7) / prev7) * 100) : 0;
              const intents = db.intents.filter((i) => i.projectId === p.id && i.status === "pending").length;
              const comp = projectCompletion(p);
              return (
                <Card key={p.id} padded={false}>
                  <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                    <ProjectRow project={p} meta={p.visibility === "link" ? "仅持链接可见" : p.wall === "approved" ? "已上发现页" : p.wall === "pending" ? "上墙审核中" : "未申请上发现页"} />
                    <div className="grid grid-cols-3 gap-4 sm:ml-auto sm:flex sm:items-center sm:gap-6">
                      <Metric icon={Eye} label="7 天浏览" value={views7} delta={delta} spark={p.stats.views.slice(-7)} />
                      <Metric icon={Users} label="关注" value={followerCount(db, "project", p.id)} />
                      <Metric icon={Send} label="待回应意向" value={intents} highlight={intents > 0} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 px-5 py-3">
                    <ProgressRing value={comp.percent} size={32} stroke={4}>
                      <span className="text-[9px]">{comp.percent}</span>
                    </ProgressRing>
                    <p className="flex-1 text-sm text-gray-600">
                      {comp.remaining ? (
                        <>
                          资料完成度 {comp.percent}%，还差 <b className="text-gray-900">{comp.items.find((i) => !i.done)?.label}</b> 等 {comp.remaining} 项
                        </>
                      ) : (
                        "资料已完善，可以报名月度路演"
                      )}
                    </p>
                    {comp.remaining ? (
                      <Button size="xs" variant="secondary" href={`/p/${p.slug}/edit`}>
                        去完善
                      </Button>
                    ) : null}
                    <Button size="xs" variant="primary" href={`/dashboard/${p.slug}`}>
                      工作台
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card padded={false} className="mt-4">
            <EmptyState
              icon={Sparkles}
              tone="brand"
              title="还没有项目"
              desc="只要名称、一句话和赛道，1 分钟就能拥有项目公开页，之后慢慢完善。"
              action={<Button variant="primary" onClick={openCreate}>创建项目</Button>}
            />
          </Card>
        )}
      </section>
      <section>
        <SectionHeader title="可能帮得上你的人" desc="投资偏好或可提供资源与你的项目相关" action={<Button size="sm" variant="link" href="/discover?tab=people" iconRight={ArrowRight}>更多</Button>} />
        <Card className="mt-4 flex flex-col gap-4">
          {helpers.length ? (
            helpers.map((p) => (
              <PersonRow
                key={p.id}
                person={p}
                meta={p.openStatus.headline || roleText(p)}
                right={<FollowButton targetType="person" targetId={p.id} size="xs" />}
              />
            ))
          ) : (
            <EmptyState compact icon={Users} title="暂时没有匹配的人" desc="完善项目赛道与“正在寻找”后会更准" />
          )}
        </Card>
      </section>
    </>
  );
}

function Metric({ icon: Icon, label, value, delta, spark, highlight }: { icon: typeof Eye; label: string; value: number; delta?: number; spark?: number[]; highlight?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div>
        <p className="flex items-center gap-1 text-xs text-gray-500">
          <Icon size={12} />
          {label}
        </p>
        <p className={cn("text-xl font-semibold tabular-nums", highlight ? "text-error-600" : "text-gray-900")}>
          {value}
          {delta !== undefined && delta !== 0 ? <span className={cn("ml-1 text-xs font-medium", delta > 0 ? "text-success-600" : "text-error-600")}>{delta > 0 ? "↑" : "↓"}{Math.abs(delta)}%</span> : null}
        </p>
      </div>
      {spark ? <span className="hidden sm:block"><Sparkline data={spark} width={64} height={28} /></span> : null}
    </div>
  );
}

function InvestorHome({ viewer }: { viewer: Person }) {
  const db = useDB();
  const updates = watchUpdates(db, viewer.id).filter((w) => w.fresh.length);
  const tracks = viewer.openStatus.investor?.tracks ?? [];
  const watched = new Set(db.watch.filter((w) => w.userId === viewer.id).map((w) => w.projectId));
  const matches = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved" && tracks.includes(p.track) && !watched.has(p.id)).slice(0, 4);
  return (
    <>
      <section>
        <SectionHeader title="观察清单有更新" desc="自你上次查看后发布了新动态的项目" action={<Button size="sm" variant="link" href="/watchlist" iconRight={ArrowRight}>观察清单</Button>} />
        <Card className="mt-4 flex flex-col divide-y divide-gray-100" padded={false}>
          {updates.length ? (
            updates.map(({ project, fresh }) => (
              <Link key={project.id} href={`/p/${project.slug}#updates`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-25">
                <ProjectLogo text={project.logoText} tone={project.logoTone} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {project.name}
                    <Badge tone="error" size="xs" className="ml-2">
                      {fresh.length} 条新动态
                    </Badge>
                  </p>
                  <p className="truncate text-sm text-gray-500">{fresh[0].title}</p>
                </div>
                <span className="text-xs text-gray-400">{relativeTime(fresh[0].at)}</span>
              </Link>
            ))
          ) : (
            <EmptyState compact icon={Bell} title="暂时没有新动态" desc="收藏的项目发布动态后会出现在这里，也会写进周一的周报" action={<Button size="sm" href="/discover">发现更多项目</Button>} />
          )}
        </Card>
      </section>
      <section>
        <SectionHeader title="符合你偏好的项目" desc={tracks.length ? `赛道：${tracks.join("、")}` : "设置投资偏好后会更准"} action={<Button size="sm" variant="link" href="/discover" iconRight={ArrowRight}>全部</Button>} />
        {matches.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {matches.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <Card padded={false} className="mt-4">
            <EmptyState compact icon={Compass} title="暂时没有新的匹配项目" desc="符合偏好的项目都已在你的观察清单里" action={<Button size="sm" href={`/u/${viewer.handle}?edit=status`}>调整偏好</Button>} />
          </Card>
        )}
      </section>
    </>
  );
}

function SeekingProjects({ title, desc }: { title: string; desc: string }) {
  const db = useDB();
  const projects = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved" && p.lookingFor.some((n) => n.coop || n.service)).slice(0, 4);
  return (
    <section>
      <SectionHeader title={title} desc={desc} action={<Button size="sm" variant="link" href="/discover" iconRight={ArrowRight}>全部项目</Button>} />
      {projects.length ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <Card padded={false} className="mt-4">
          <EmptyState compact icon={Compass} title="暂时没有公开项目" action={<Button size="sm" href="/discover">去发现页</Button>} />
        </Card>
      )}
    </section>
  );
}

function TalentHome() {
  return <SeekingProjects title="正在寻找合作的项目" desc="打开项目页，看清对方要供应链、渠道还是融资" />;
}

function PartnerHome() {
  return <SeekingProjects title="可以合作的项目" desc="打开项目页，看清对方愿意怎么合作、愿意付多少" />;
}

function OpsHome() {
  const db = useDB();
  const wall = db.projects.filter((p) => p.wall === "pending").length;
  const match = db.conversations.filter((c) => c.status === "match_requested").length;
  const dd = currentDemoDay(db)?.entries.filter((e) => e.status === "applied").length ?? 0;
  return (
    <section>
      <SectionHeader title="运营待办" action={<Button size="sm" variant="primary" href="/ops" iconLeft={Shield}>打开看板</Button>} />
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { n: match, label: "撮合申请待处理", href: "/ops?tab=match" },
          { n: wall, label: "项目待上墙审核", href: "/ops?tab=review" },
          { n: dd, label: "路演报名待审核", href: "/ops?tab=review" },
        ].map((x) => (
          <Link key={x.label} href={x.href} className="rounded-xl border border-gray-200 bg-white p-5 shadow-xs hover:border-brand-300">
            <p className="text-3xl font-semibold text-gray-900">{x.n}</p>
            <p className="mt-1 text-sm text-gray-500">{x.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Featured() {
  const db = useDB();
  const list = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved").slice(0, 4);
  return (
    <section>
      <SectionHeader title="本周值得关注的项目" action={<Button size="sm" variant="link" href="/discover" iconRight={ArrowRight}>发现更多</Button>} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {list.map((p) => (
          <ProjectCard key={p.id} project={p} />
        ))}
      </div>
    </section>
  );
}

function Happening() {
  const db = useDB();
  const live = db.events.find((e) => eventStatus(e) === "live");
  const next = db.events.filter((e) => eventStatus(e) === "upcoming").sort((a, b) => a.start.localeCompare(b.start))[0];
  const dd = currentDemoDay(db);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-gray-900">正在发生</h2>
      {live ? (
        <Link href={`/events/${live.id}`} className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs hover:border-brand-300">
          <Cover tone={live.coverTone} className="h-20">
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-error-600 px-2 py-0.5 text-xs font-semibold text-white">
              <Radio size={12} className="animate-pulse" />
              正在直播
            </span>
          </Cover>
          <div className="p-4">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700">{live.title}</p>
            <p className="mt-1 text-xs text-gray-500">{live.presentIds.length} 人在场 · {live.projectIds.length} 个项目</p>
          </div>
        </Link>
      ) : null}
      {dd ? (
        <Link href="/demo-day" className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-brand-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-highlight text-gray-900">
            <Trophy size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-700">{dd.title}</p>
            <p className="text-xs text-gray-500">
              {dd.entries.filter((e) => e.status === "shortlisted").length} 个项目入围 · 报名截止 {formatDate(dd.applyDeadline)}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      ) : null}
      {next ? (
        <Link href={`/events/${next.id}`} className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-xs hover:border-brand-300">
          <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border border-gray-200 text-gray-700">
            <Mic size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700">{next.title}</p>
            <p className="text-xs text-gray-500">
              {formatDateTime(next.start)} · {next.kind === "online" ? "线上" : next.city}
            </p>
          </div>
        </Link>
      ) : null}
    </section>
  );
}

function Articles() {
  const db = useDB();
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Pitch 报道</h2>
        <Link href="/feed?tab=articles" className="text-xs font-semibold text-brand-700">
          全部
        </Link>
      </div>
      {[...db.articles]
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, 3)
        .map((a) => (
          <Link key={a.id} href={`/feed?tab=articles&article=${a.id}`} className="group flex gap-3">
            <Cover tone={a.coverTone} className="h-14 w-20 shrink-0 rounded-lg" />
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-brand-700">{a.title}</p>
              <p className="mt-0.5 text-xs text-gray-500">
                {a.column} · {a.readMins} 分钟
              </p>
            </div>
          </Link>
        ))}
    </section>
  );
}

function GuestLanding() {
  const db = useDB();
  const requireLogin = useApp((s) => s.requireLogin);
  const list = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved").slice(0, 6);
  const people = db.people.filter((p) => p.role === "investor").slice(0, 5);
  return (
    <div>
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_80%_0%,var(--color-brand-100),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:py-20">
          <div>
            <Badge tone="highlight" size="md">
              每月一场线上路演 · 11 月报名中
            </Badge>
            <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-tight text-gray-900 sm:text-5xl">
              让对的人，
              <br />
              <span className="mark-highlight">找到你的项目</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">1 分钟创建项目主页，写下你正在寻找的投资、渠道和合伙人。投资人、合作方看到后直接表达意向，站内就能聊。</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" variant="primary" onClick={() => requireLogin("登录后创建你的项目")}>
                创建项目主页
              </Button>
              <Button size="lg" variant="secondary" href="/discover" iconRight={ArrowRight}>
                先逛逛项目
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {people.map((p) => (
                  <Avatar key={p.id} name={p.name} tone={p.avatarTone} size="sm" className="rounded-full ring-2 ring-white" />
                ))}
              </div>
              <p className="text-sm text-gray-600">
                <b className="text-gray-900">1,200+</b> 位投资人和合作方在这里看项目
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {list.slice(0, 4).map((p, i) => (
              <ProjectCard key={p.id} project={p} className={cn(i % 2 === 1 && "sm:translate-y-6")} hideFollow />
            ))}
          </div>
        </div>
      </section>
      <Page>
        <div className="grid gap-6 py-6 sm:grid-cols-3">
          {[
            { icon: Sparkles, title: "1 分钟上线", desc: "名称、一句话、赛道，立刻有公开主页；上传 BP 让 AI 帮你填剩下的。" },
            { icon: Send, title: "统一意向", desc: "投资、合作、加入团队，一个按钮表达；可匿名，对方愿意聊才揭晓身份。" },
            { icon: Inbox, title: "站内对话与撮合", desc: "接受意向即开聊，一键互换联系方式；需要时申请 Pitch 撮合。" },
          ].map((f) => (
            <div key={f.title} className="flex flex-col gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-xs">
                <f.icon size={22} />
              </span>
              <p className="text-lg font-semibold text-gray-900">{f.title}</p>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
        <SectionHeader className="mt-10" title="最近活跃的项目" action={<Button variant="link" href="/discover" iconRight={ArrowRight}>全部项目</Button>} />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Happening />
          <Articles />
        </div>
      </Page>
    </div>
  );
}
