"use client";

import { MapPin, Users } from "lucide-react";
import Link from "next/link";

import { Avatar, AvatarGroup, Badge, ProjectLogo, Skeleton, Tag } from "@/components/ui/display";
import { BADGES } from "@/data/constants";
import type { Project } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { endorsementsFor, followerCount, getPerson, knownFollowers, useDB } from "@/store/selectors";
import { FollowButton } from "./follow-button";
import { LookingForChips } from "./looking-for";

/** 熟人信号：“林川、周敏 等 3 位你认识的人关注了”。 */
export function KnownSignal({ targetType, targetId, className }: { targetType: "project" | "person"; targetId: string; className?: string }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const known = knownFollowers(db, viewerId, targetType, targetId);
  if (!known.length) return null;
  const names = known.slice(0, 2).map((p) => p.name).join("、");
  return (
    <div className={cn("flex items-center gap-2 text-xs text-gray-600", className)}>
      <AvatarGroup people={known.map((p) => ({ name: p.name, tone: p.avatarTone }))} size="xs" max={3} more={0} />
      <span className="truncate">
        <span className="font-medium text-gray-800">{names}</span>
        {known.length > 2 ? ` 等 ${known.length} 位` : ""} 你认识的人关注或背书过
      </span>
    </div>
  );
}

export function ProjectCard({ project: p, className, hideFollow }: { project: Project; className?: string; hideFollow?: boolean }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const owner = getPerson(db, p.ownerId);
  const followers = followerCount(db, "project", p.id);
  const endorsements = endorsementsFor(db, "project", p.id).length;
  const isMine = p.team.some((t) => t.personId === viewerId && t.status === "confirmed");
  const topBadge = p.badges.map((b) => BADGES[b]).find(Boolean);

  return (
    <Link
      href={`/p/${p.slug}`}
      className={cn("group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-gray-300 hover:shadow-md", className)}
    >
      <div className="flex items-start gap-3">
        <ProjectLogo text={p.logoText} tone={p.logoTone} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</h3>
            {topBadge ? <Badge tone={topBadge.tone} size="xs">{topBadge.label}</Badge> : null}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{p.oneLiner}</p>
        </div>
        {!hideFollow && !isMine ? <FollowButton targetType="project" targetId={p.id} size="xs" /> : null}
        {isMine ? <Badge tone="brand" size="xs">我的项目</Badge> : null}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Tag>{p.track}</Tag>
        <span className="inline-flex items-center gap-0.5 text-xs text-gray-500">
          <MapPin size={12} />
          {p.region}
        </span>
      </div>
      {p.lookingFor.length ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-gray-400">正在寻找</p>
          <LookingForChips needs={p.lookingFor} />
        </div>
      ) : null}
      <div className="mt-auto pt-4">
        <KnownSignal targetType="project" targetId={p.id} className="mb-3" />
        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            {owner ? <Avatar name={owner.name} tone={owner.avatarTone} size="xs" /> : null}
            <span className="truncate">{owner?.name}</span>
          </span>
          <span className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Users size={12} />
              {followers} 关注
            </span>
            {endorsements ? <span>{endorsements} 背书</span> : null}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-4/5" />
        </div>
      </div>
      <Skeleton className="mt-4 h-5 w-1/3" />
      <Skeleton className="mt-4 h-3 w-full" />
    </div>
  );
}

/** 紧凑行：用于侧栏、相似项目、榜单。 */
export function ProjectRow({ project: p, meta, right }: { project: Project; meta?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/p/${p.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <ProjectLogo text={p.logoText} tone={p.logoTone} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 hover:text-brand-700">{p.name}</p>
          <p className="truncate text-xs text-gray-500">{meta ?? p.oneLiner}</p>
        </div>
      </Link>
      {right}
    </div>
  );
}
