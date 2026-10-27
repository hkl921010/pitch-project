"use client";

import { Compass, Hourglass, Search, SearchX, Users } from "lucide-react";
import { Suspense, useMemo, useState } from "react";

import { PersonCard } from "@/components/biz/person-card";
import { ProjectCard, ProjectCardSkeleton } from "@/components/biz/project-card";
import { AcademyFrame } from "@/components/shell/academy-frame";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Input, Select, Toggle } from "@/components/ui/form";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { COOP_LABEL, COOP_ORDER, ROLE_LABEL, TRACKS } from "@/data/constants";
import type { CoopKind, Project, Role } from "@/data/types";
import { cn } from "@/lib/cn";
import { useFakeLoading, useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { acquaintances, followerCount, knownFollowers, manageableProjects, useDB } from "@/store/selectors";

type Tab = "projects" | "people";

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
  return (
    <AcademyFrame eyebrow="发现" title="找项目，找人" desc="熟人关注过的会排在前面。">
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "projects", label: "项目", count: visibleProjects.length },
          { value: "people", label: "人", count: people.length },
        ]}
      />
      <div className="mt-6">
        {tab === "projects" ? <ProjectsTab projects={visibleProjects} /> : null}
        {tab === "people" ? <PeopleTab /> : null}
      </div>
    </AcademyFrame>
  );
}

const LOOKING_FILTERS: { value: "all" | CoopKind; label: string }[] = [
  { value: "all", label: "全部" },
  ...COOP_ORDER.map((value) => ({ value, label: COOP_LABEL[value] })),
];

function ProjectsTab({ projects }: { projects: Project[] }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const [q, setQ] = useState("");
  const [track, setTrack] = useQueryParam<string>("track", "all");
  const [looking, setLooking] = useQueryParam<"all" | CoopKind>("looking", "all");
  const [region, setRegion] = useState("all");
  const [sort, setSort] = useState<"known" | "active" | "followers" | "new">("known");
  const loading = useFakeLoading(`${track}-${looking}-${region}-${sort}`);

  const regions = useMemo(() => [...new Set(projects.flatMap((p) => p.region.split(" · ")))], [projects]);
  const mine = viewerId ? manageableProjects(db, viewerId) : [];
  const pendingMine = mine.filter((p) => p.wall === "pending" || p.wall === "none" || p.wall === "rejected");

  const lastActive = (p: Project) => p.updates[0]?.at ?? p.createdAt;
  const list = projects
    .filter((p) => track === "all" || p.track === track)
    .filter((p) => looking === "all" || p.lookingFor.some((n) => n.coop === looking))
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
        <div key={p.id} className="flex flex-col gap-3 border border-black/10 bg-[#f7fbf3] p-4 sm:flex-row sm:items-center">
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
                "flex h-9 shrink-0 items-center gap-1.5 border px-3 text-sm font-medium transition-colors",
                on ? "border-black bg-black text-white" : "border-black/10 bg-white text-gray-600 hover:border-black",
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
