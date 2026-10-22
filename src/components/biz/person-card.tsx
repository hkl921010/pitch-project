"use client";

import { ShieldCheck } from "lucide-react";
import Link from "next/link";

import { Avatar, Badge, ProjectLogo } from "@/components/ui/display";
import { ROLE_LABEL } from "@/data/constants";
import type { Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { investorEndorsers, projectsOf, roleText, useDB } from "@/store/selectors";
import { FollowButton } from "./follow-button";
import { LookingForChips } from "./looking-for";
import { KnownSignal } from "./project-card";

export function roleTone(p: Person): "brand" | "success" | "blue" | "warning" | "gray" {
  if (p.isOps) return "gray";
  return p.role === "founder" ? "brand" : p.role === "investor" ? "success" : p.role === "talent" ? "blue" : p.role === "partner" ? "warning" : "gray";
}

/** “被 N 位投资人背书”：身份自选不做认证，用这个做软认证。 */
export function SoftVerify({ personId, className }: { personId: string; className?: string }) {
  const db = useDB();
  const n = investorEndorsers(db, personId);
  if (!n) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-brand-700", className)}>
      <ShieldCheck size={14} />被 {n} 位投资人背书
    </span>
  );
}

/** 开放状态一句话，例如“开放：天使轮 · 出海消费”。 */
export function OpenStatusLine({ person, className }: { person: Person; className?: string }) {
  if (!person.openStatus.active || !person.openStatus.headline) return null;
  return (
    <p className={cn("flex items-start gap-1.5 text-sm text-gray-700", className)}>
      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success-500 ring-4 ring-success-50" />
      <span className="line-clamp-2">{person.openStatus.headline}</span>
    </p>
  );
}

export function PersonCard({ person: p, className }: { person: Person; className?: string }) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const projects = projectsOf(db, p.id);
  return (
    <Link href={`/u/${p.handle}`} className={cn("group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-gray-300 hover:shadow-md", className)}>
      <div className="flex items-start gap-3">
        <Avatar name={p.name} tone={p.avatarTone} size="lg" verified={investorEndorsers(db, p.id) > 0} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-gray-900 group-hover:text-brand-700">{p.name}</h3>
            <Badge tone={roleTone(p)} size="xs">{roleText(p)}</Badge>
          </div>
          <p className="truncate text-sm text-gray-500">{[p.title, p.org].filter(Boolean).join(" · ") || p.city}</p>
        </div>
        {p.id !== viewerId ? <FollowButton targetType="person" targetId={p.id} size="xs" /> : null}
      </div>
      <OpenStatusLine person={p} className="mt-3" />
      {p.lookingFor.length ? (
        <div className="mt-3">
          <LookingForChips needs={p.lookingFor} max={2} />
        </div>
      ) : null}
      <div className="mt-auto flex flex-col gap-3 pt-4">
        <SoftVerify personId={p.id} />
        <KnownSignal targetType="person" targetId={p.id} />
        {projects.length ? (
          <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
            {projects.slice(0, 3).map(({ project }) => (
              <span key={project.id} className="flex min-w-0 items-center gap-1.5 text-xs text-gray-600">
                <ProjectLogo text={project.logoText} tone={project.logoTone} size="xs" />
                <span className="truncate">{project.name}</span>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

export function PersonRow({ person: p, meta, right, size = "md" }: { person: Person; meta?: React.ReactNode; right?: React.ReactNode; size?: "sm" | "md" }) {
  return (
    <div className="flex items-center gap-3">
      <Link href={`/u/${p.handle}`} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar name={p.name} tone={p.avatarTone} size={size} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 hover:text-brand-700">
            {p.name}
            {p.role && !meta ? <span className="ml-1.5 text-xs font-normal text-gray-500">{ROLE_LABEL[p.role]}</span> : null}
          </p>
          <p className="truncate text-xs text-gray-500">{meta ?? ([p.title, p.org].filter(Boolean).join(" · ") || roleText(p))}</p>
        </div>
      </Link>
      {right}
    </div>
  );
}
