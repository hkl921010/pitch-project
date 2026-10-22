"use client";

import { ListOrdered, Star } from "lucide-react";
import Link from "next/link";

import { Avatar, Badge, Card, ProjectLogo } from "@/components/ui/display";
import { relativeTime } from "@/data/time";
import type { CuratedList, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { getPerson, getProject, useDB } from "@/store/selectors";

/** 每个榜单最多收录的条目数。 */
export const LIST_MAX_ITEMS = 20;

/** 运营、投资人、合作方可以整理榜单；创始人和人才不建榜，避免自荐。 */
export function canCurate(viewer: Person | null): boolean {
  return !!viewer && (!!viewer.isOps || viewer.role === "investor" || viewer.role === "partner");
}

export function canManageList(list: CuratedList, viewer: Person | null): boolean {
  return !!viewer && (list.curatorId === viewer.id || !!viewer.isOps);
}

/** 个人主页上“TA 整理的榜单”。 */
export function CuratedBy({ personId, self }: { personId: string; self: boolean }) {
  const db = useDB();
  const person = getPerson(db, personId);
  const lists = db.lists.filter((l) => l.curatorId === personId);
  if (!lists.length && !(self && canCurate(person ?? null))) return null;
  return (
    <Card>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <ListOrdered size={16} className="text-gray-400" />
        {self ? "我整理的榜单" : "TA 整理的榜单"}
      </p>
      {lists.length ? (
        <ul className="flex flex-col gap-2">
          {lists.map((l) => (
            <li key={l.id}>
              <Link href={`/lists/${l.id}`} className="flex items-center justify-between gap-2 text-sm text-gray-700 hover:text-brand-700">
                <span className="truncate">{l.title}</span>
                <span className="shrink-0 text-xs text-gray-400">{l.items.length} 个 · {l.followers.length} 关注</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">把你看好的项目整理成榜单，关注的人会收到更新。</p>
      )}
      {self ? (
        <Link href="/lists?tab=mine&create=1" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
          新建榜单
        </Link>
      ) : null}
    </Card>
  );
}

/** 项目页、个人主页上的“被收录的榜单”。 */
export function ListedIn({ targetId, title = "被收录的榜单" }: { targetId: string; title?: string }) {
  const db = useDB();
  const lists = db.lists.filter((l) => l.items.some((i) => i.targetId === targetId));
  if (!lists.length) return null;
  return (
    <Card>
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <ListOrdered size={16} className="text-gray-400" />
        {title}
      </p>
      <ul className="flex flex-col gap-3">
        {lists.map((l) => {
          const it = l.items.find((i) => i.targetId === targetId)!;
          const rank = l.items.indexOf(it) + 1;
          const curator = getPerson(db, l.curatorId);
          return (
            <li key={l.id}>
              <Link href={`/lists/${l.id}`} className="group block">
                <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 group-hover:text-brand-700">
                  {l.featured ? <Star size={12} className="shrink-0 fill-highlight text-highlight-ink" /> : null}
                  <span className="truncate">{l.title}</span>
                  <span className="shrink-0 text-xs font-normal text-gray-400">第 {rank}</span>
                </span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  「{it.note}」 · {curator?.isOps ? "Pitch 运营" : curator?.name}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function ListCard({ list, className }: { list: CuratedList; className?: string }) {
  const db = useDB();
  const curator = getPerson(db, list.curatorId);
  const previews = list.items.slice(0, 4);
  return (
    <Link href={`/lists/${list.id}`} className={cn("group flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-gray-300 hover:shadow-md", className)}>
      <div className="flex items-center gap-2">
        {list.featured ? (
          <Badge tone="highlight" size="xs" icon={Star}>
            精选
          </Badge>
        ) : null}
        <Badge tone="gray" size="xs">
          {list.kind === "project" ? "项目榜单" : "人物榜单"}
        </Badge>
        <span className="ml-auto text-xs text-gray-400">{relativeTime(list.updatedAt)}更新</span>
      </div>
      <h3 className="mt-3 text-base font-semibold text-gray-900 group-hover:text-brand-700">{list.title}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-gray-500">{list.desc}</p>
      <div className="mt-4 flex items-center gap-1.5">
        {previews.map((it) => {
          if (list.kind === "project") {
            const p = getProject(db, it.targetId);
            return p ? <ProjectLogo key={it.targetId} text={p.logoText} tone={p.logoTone} size="sm" /> : null;
          }
          const p = getPerson(db, it.targetId);
          return p ? <Avatar key={it.targetId} name={p.name} tone={p.avatarTone} size="sm" /> : null;
        })}
        {list.items.length > previews.length ? <span className="ml-1 text-xs text-gray-500">+{list.items.length - previews.length}</span> : null}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          {curator ? <Avatar name={curator.name} tone={curator.avatarTone} size="xs" /> : null}
          {curator?.isOps ? "Pitch 运营策展" : `${curator?.name} 整理`}
        </span>
        <span>
          {list.items.length} 个 · {list.followers.length} 人关注
        </span>
      </div>
    </Link>
  );
}
