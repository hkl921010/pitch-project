"use client";

import { Clock, Compass, Hourglass, ListOrdered, Search, SearchX, Users } from "lucide-react";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";

import { ListCard } from "@/components/biz/list-card";
import { NEED_ICON, NEED_TONE, needLabel } from "@/components/biz/looking-for";
import { PersonCard } from "@/components/biz/person-card";
import { ProjectCard, ProjectCardSkeleton } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Input, Select, Toggle } from "@/components/ui/form";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { ROLE_LABEL, TRACKS } from "@/data/constants";
import { relativeTime } from "@/data/time";
import type { IntentKind, Project, Role } from "@/data/types";
import { cn } from "@/lib/cn";
import { useFakeLoading, useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { acquaintances, allNeeds, followerCount, knownFollowers, manageableProjects, requesterView, useDB } from "@/store/selectors";

type Tab = "projects" | "people" | "needs" | "lists";

export default function DiscoverPage() {
  return (
    <Suspense>
      <Discover />
    </Suspense>
  );
}

function Discover() {
  const db = useDB();
  const [tab, setTab] = useQueryParam<Tab>("tab", "projects");
  const visibleProjects = db.projects.filter((p) => p.visibility === "public" && p.wall === "approved");
  const people = db.people.filter((p) => p.onboarded && !p.isOps);
  const needs = allNeeds(db);
  return (
    <Page>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-[28px]">发现</h1>
        <p className="text-[15px] text-gray-500">按“正在寻找”找项目和人，熟人关注过的会排在前面。</p>
      </div>
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "projects", label: "项目", count: visibleProjects.length },
          { value: "people", label: "人", count: people.length },
          { value: "needs", label: "需求", count: needs.length },
          { value: "lists", label: "榜单", count: db.lists.length },
        ]}
      />
      <div className="mt-6">
        {tab === "projects" ? <ProjectsTab projects={visibleProjects} /> : null}
        {tab === "people" ? <PeopleTab /> : null}
        {tab === "needs" ? <NeedsTab /> : null}
        {tab === "lists" ? <ListsTab /> : null}
      </div>
    </Page>
  );
}

const LOOKING_FILTERS: { value: "all" | IntentKind; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "invest", label: "在融资" },
  { value: "partner", label: "找合作" },
  { value: "join", label: "在招人" },
];

function ProjectsTab({ projects }: { projects: Project[] }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const [q, setQ] = useState("");
  const [track, setTrack] = useQueryParam<string>("track", "all");
  const [looking, setLooking] = useQueryParam<"all" | IntentKind>("looking", "all");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<"known" | "active" | "followers" | "new">("known");
  const loading = useFakeLoading(`${track}-${looking}-${region}-${sort}`);

  const regions = useMemo(() => [...new Set(projects.flatMap((p) => p.region.split(" · ")))], [projects]);
  const mine = viewerId ? manageableProjects(db, viewerId) : [];
  const pendingMine = mine.filter((p) => p.wall === "pending" || p.wall === "none" || p.wall === "rejected");

  const lastActive = (p: Project) => p.updates[0]?.at ?? p.createdAt;
  const list = projects
    .filter((p) => track === "all" || p.track === track)
    .filter((p) => looking === "all" || p.lookingFor.some((n) => n.kind === looking) || (looking === "join" && p.jobs.length > 0))
    .filter((p) => region === "all" || p.region.includes(region))
    .filter((p) => !q.trim() || `${p.name}${p.oneLiner}${p.tags.join("")}${p.track}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === "followers") return followerCount(db, "project", b.id) - followerCount(db, "project", a.id);
      if (sort === "new") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "known") {
        const d = knownFollowers(db, viewerId, "project", b.id).length - knownFollowers(db, viewerId, "project", a.id).length;
        if (d) return d;
      }
      return lastActive(b).localeCompare(lastActive(a));
    });
  const hasFilter = track !== "all" || looking !== "all" || region !== "all" || q.trim();

  return (
    <div className="flex flex-col gap-5">
      {pendingMine.map((p) => (
        <div key={p.id} className="flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4 sm:flex-row sm:items-center">
          <span className="flex items-center gap-3">
            <ProjectLogo text={p.logoText} tone={p.logoTone} size="sm" />
            <span className="text-sm text-gray-700">
              {p.wall === "pending" ? (
                <>
                  <b>{p.name}</b> 正在审核上发现页，通常 1 个工作日内完成。公开页已经可以分享。
                </>
              ) : p.wall === "rejected" ? (
                <>
                  <b>{p.name}</b> 暂未通过上墙审核：{p.wallNote ?? "资料不够完整"}。
                </>
              ) : (
                <>
                  <b>{p.name}</b> 还没有出现在发现页{p.visibility === "link" ? "（目前仅持链接可见）" : ""}。
                </>
              )}
            </span>
          </span>
          <Button size="sm" variant="secondary" className="sm:ml-auto" href={`/dashboard/${p.slug}?tab=exposure`} iconLeft={p.wall === "pending" ? Hourglass : undefined}>
            {p.wall === "pending" ? "查看进度" : "申请上发现页"}
          </Button>
        </div>
      ))}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input icon={Search} placeholder="搜项目名、一句话、标签" value={q} onChange={(e) => setQ(e.target.value)} wrapperClassName="lg:w-80" inputSize="sm" />
        <Segmented value={looking} onChange={setLooking} items={LOOKING_FILTERS} size="sm" />
        <div className="flex gap-3 lg:ml-auto">
          <Select selectSize="sm" value={region} onChange={(e) => setRegion(e.target.value)} options={[{ value: "all", label: "全部地区" }, ...regions.map((r) => ({ value: r, label: r }))]} wrapperClassName="flex-1 lg:w-36" />
          <Select
            selectSize="sm"
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            options={[
              { value: "known", label: "熟人关注优先" },
              { value: "active", label: "最近有动态" },
              { value: "followers", label: "关注最多" },
              { value: "new", label: "最新创建" },
            ]}
            wrapperClassName="flex-1 lg:w-40"
          />
        </div>
      </div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {["all", ...TRACKS].map((t) => {
          const n = t === "all" ? projects.length : projects.filter((p) => p.track === t).length;
          if (!n && t !== "all") return null;
          const on = track === t;
          return (
            <button
              key={t}
              onClick={() => setTrack(t)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
                on ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              )}
            >
              {t === "all" ? "全部赛道" : t}
              <span className={cn("text-xs", on ? "text-gray-300" : "text-gray-400")}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length ? (
        <>
          <p className="text-sm text-gray-500">共 {list.length} 个项目</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </>
      ) : (
        <Card padded={false}>
          <EmptyState
            icon={SearchX}
            title="没有符合条件的项目"
            desc={hasFilter ? "换个赛道或放宽“正在寻找”的条件试试" : "还没有项目上发现页"}
            action={
              hasFilter ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setTrack("all");
                    setLooking("all");
                    setRegion("all");
                    setQ("");
                  }}
                >
                  清空筛选
                </Button>
              ) : null
            }
          />
        </Card>
      )}
    </div>
  );
}

function PeopleTab() {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const [role, setRole] = useQueryParam<"all" | Role>("role", "all");
  const [openOnly, setOpenOnly] = useState(false);
  const [q, setQ] = useState("");
  const loading = useFakeLoading(`${role}-${openOnly}`);
  const known = acquaintances(db, viewerId);
  const list = db.people
    .filter((p) => p.onboarded && !p.isOps && p.id !== viewerId)
    .filter((p) => role === "all" || p.role === role)
    .filter((p) => !openOnly || p.openStatus.active)
    .filter((p) => !q.trim() || `${p.name}${p.title}${p.org}${p.openStatus.headline}`.includes(q.trim()))
    .sort((a, b) => Number(known.has(b.id)) - Number(known.has(a.id)) || Number(b.openStatus.active) - Number(a.openStatus.active));
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Input icon={Search} placeholder="搜名字、机构、开放状态" value={q} onChange={(e) => setQ(e.target.value)} wrapperClassName="lg:w-80" inputSize="sm" />
        <Segmented
          size="sm"
          value={role}
          onChange={setRole}
          items={[{ value: "all", label: "全部" }, ...(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, label: ROLE_LABEL[r] }))]}
        />
        <div className="lg:ml-auto">
          <Toggle size="sm" checked={openOnly} onChange={setOpenOnly} label="只看开放中" />
        </div>
      </div>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState icon={Users} title="没有找到符合条件的人" desc="试试关闭“只看开放中”，或换个身份" />
        </Card>
      )}
    </div>
  );
}

const NEED_FILTERS: { value: "all" | IntentKind; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "invest", label: "融资" },
  { value: "partner", label: "合作" },
  { value: "join", label: "招人" },
  { value: "help", label: "求助" },
];

const NEED_ACTION: Record<IntentKind, string> = { invest: "我想投资", partner: "我能合作", join: "我想加入", help: "我能帮上忙", other: "聊聊" };

function NeedsTab() {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const openIntent = useApp((s) => s.openIntent);
  const [kind, setKind] = useQueryParam<"all" | IntentKind>("kind", "all");
  const [owner, setOwner] = useState<"all" | "project" | "person">("all");
  const loading = useFakeLoading(`${kind}-${owner}`);
  const list = allNeeds(db)
    .filter((n) => kind === "all" || n.need.kind === kind)
    .filter((n) => owner === "all" || n.need.ownerType === owner);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Segmented size="sm" value={kind} onChange={setKind} items={NEED_FILTERS.map((f) => ({ ...f, count: f.value === "all" ? undefined : allNeeds(db).filter((n) => n.need.kind === f.value).length }))} />
        <Segmented
          size="sm"
          className="sm:ml-auto"
          value={owner}
          onChange={setOwner}
          items={[
            { value: "all", label: "全部来源" },
            { value: "project", label: "项目" },
            { value: "person", label: "个人" },
          ]}
        />
      </div>
      <p className="text-sm text-gray-500">汇总了项目的“正在寻找”和个人主页上的需求（原心愿墙）。表达意向后，对方接受即可站内对话。</p>
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : list.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {list.map(({ need, project, person }) => {
            const Icon = NEED_ICON[need.kind];
            const isMine = need.ownerType === "person" ? person?.id === viewerId : !!project && project.team.some((t) => t.personId === viewerId && t.status === "confirmed");
            const pending = db.intents.find((i) => i.fromId === viewerId && requesterView(i) === "waiting" && (i.needId === need.id || (project && i.projectId === project.id)));
            return (
              <div key={need.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", NEED_TONE[need.kind])}>
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge tone="gray" size="xs">
                        {needLabel(need)}
                      </Badge>
                      {need.fromWish ? (
                        <Badge tone="highlight" size="xs">
                          来自心愿墙
                        </Badge>
                      ) : null}
                      <span className="text-xs text-gray-400">{relativeTime(need.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-gray-900">{need.title}</p>
                    {need.detail ? <p className="mt-1 line-clamp-2 text-sm text-gray-600">{need.detail}</p> : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3 border-t border-gray-100 pt-4">
                  {project ? (
                    <Link href={`/p/${project.slug}`} className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-700 hover:text-brand-700">
                      <ProjectLogo text={project.logoText} tone={project.logoTone} size="xs" />
                      <span className="truncate font-medium">{project.name}</span>
                    </Link>
                  ) : person ? (
                    <Link href={`/u/${person.handle}`} className="flex min-w-0 flex-1 items-center gap-2 text-sm text-gray-700 hover:text-brand-700">
                      <Avatar name={person.name} tone={person.avatarTone} size="xs" />
                      <span className="truncate font-medium">{person.name}</span>
                      <span className="truncate text-xs text-gray-400">{person.title}</span>
                    </Link>
                  ) : null}
                  {isMine ? (
                    <Badge tone="brand">我发布的</Badge>
                  ) : pending ? (
                    <Button size="xs" variant="secondary" disabled iconLeft={Clock}>
                      等待回应
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() =>
                        project
                          ? openIntent({ type: "project", projectId: project.id, presetKind: need.kind === "help" ? "partner" : need.kind, needId: need.id })
                          : person
                            ? openIntent({ type: "need", needId: need.id, personId: person.id })
                            : undefined
                      }
                    >
                      {NEED_ACTION[need.kind]}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card padded={false}>
          <EmptyState icon={Compass} title="这个分类下暂时没有需求" desc="换个分类看看，或者在你的主页写下你正在寻找的" action={<Button variant="secondary" onClick={() => setKind("all")}>看全部需求</Button>} />
        </Card>
      )}
    </div>
  );
}

function ListsTab() {
  const db = useDB();
  const lists = [...db.lists].sort((a, b) => Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt));
  return lists.length ? (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">由 Pitch 运营和社区成员策展，每周更新。</p>
        <Button size="sm" variant="link" href="/lists" iconRight={ListOrdered}>
          榜单首页
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lists.map((l) => (
          <ListCard key={l.id} list={l} />
        ))}
      </div>
    </div>
  ) : (
    <Card padded={false}>
      <EmptyState icon={ListOrdered} title="还没有榜单" />
    </Card>
  );
}
