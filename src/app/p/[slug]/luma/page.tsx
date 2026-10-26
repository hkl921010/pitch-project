"use client";

/**
 * 项目详情的 Luma 活动页风格。
 * 单独打开是 /p/[slug]/luma。从项目页切换进来时不再重复记浏览。
 * 带 #need-id 时展开对应合作。
 */

import { ChevronDown, LayoutDashboard, Lock, MapPin, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { IntentBar } from "@/components/biz/intent-card";
import { needLabel } from "@/components/biz/looking-for";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, ProgressRing, ProjectLogo } from "@/components/ui/display";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { badgeDefs, canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, projectCompletion, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];

export default function ProjectLumaPage() {
  return (
    <Suspense>
      <LumaView />
    </Suspense>
  );
}

/** 嵌进项目页切换时用。 */
export function ProjectLumaDetail() {
  return <LumaView embed />;
}

function LumaView({ embed = false }: { embed?: boolean }) {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const db = useDB();
  const viewer = useViewer();
  const recordView = useApp((s) => s.recordView);
  const openIntent = useApp((s) => s.openIntent);
  const project = getProjectBySlug(db, slug);
  const counted = useRef(false);
  useHashScroll([slug]);
  const isMember = !!viewer && !!project?.team.some((t) => t.personId === viewer.id && t.status === "confirmed");

  useEffect(() => {
    if (embed || !project || counted.current) return;
    counted.current = true;
    if (!isMember) {
      const from = sp.get("from") as TrafficSource | null;
      recordView(project.id, from && SOURCES.includes(from) ? from : "direct");
    }
  }, [embed, project, isMember, sp, recordView]);

  if (!project) {
    if (embed) return null;
    notFound();
  }
  const p = project;
  const owner = getPerson(db, p.ownerId);
  const canEdit = canEditProject(p, viewer?.id ?? null);
  const manage = canManageProject(p, viewer?.id ?? null);
  const team = p.team.filter((t) => t.status === "confirmed" || manage);
  const cooperations = p.lookingFor.filter((n) => n.coop);
  const services = p.lookingFor.filter((n) => n.service);
  const cover = p.coverImage || p.gallery.find((g) => g.image)?.image || p.logoImage;
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);
  const onPick = (need: NeedItem) => {
    openIntent({ type: "project", projectId: p.id, presetKind: (need.kind === "help" ? "partner" : need.kind) as IntentKind, needId: need.id });
  };

  const sheet = (
    <div className="mx-auto w-full max-w-[680px] rounded-[28px] bg-[#f3f4f6] p-2 sm:p-3">
      <article className="overflow-hidden rounded-[24px] bg-white text-[#111]">
        <div className="relative aspect-[16/9] bg-[#ececec]">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><ProjectLogo text={p.logoText} tone={p.logoTone} image={p.logoImage} size="xl" /></div>}
        </div>
        <div className="px-5 py-6 sm:px-7">
          <h1 className="text-[28px] leading-tight font-semibold tracking-tight">{p.name}</h1>
          <p className="mt-2 text-base text-[#3f3f46]">{p.oneLiner || "还没写一句话介绍"}</p>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#eee] text-[#71717a]">
              <MapPin size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold">{p.region || "地区待定"}</span>
              <span className="block text-sm text-[#71717a]">{p.track}{p.tags[0] ? ` · ${p.tags[0]}` : ""}</span>
            </span>
          </div>
          {owner ? (
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={owner.name} tone={owner.avatarTone} size="sm" />
              <span className="text-sm">
                <span className="text-[#71717a]">由 </span>
                <span className="font-semibold">{owner.name}</span>
                <span className="text-[#71717a]"> 发起</span>
              </span>
              {badges[0] ? <Badge tone={badges[0].tone} size="xs">{badges[0].label}</Badge> : null}
            </div>
          ) : null}
          <LumaOffers title="合作" hint="找供应链、渠道或融资" items={cooperations} hideAction={isMember} onPick={onPick} />
          <LumaOffers title="服务" hint="对方花钱买的：朋友、新媒体、招人，或其他" items={services} hideAction={isMember} onPick={onPick} />
          <section className="mt-8">
            <h2 className="text-base font-semibold">关于</h2>
            <p className="mt-2 text-[15px] leading-7 whitespace-pre-line text-[#3f3f46]">{p.intro || p.profile || "还没写简介"}</p>
            {p.product ? <p className="mt-3 text-[15px] leading-7 whitespace-pre-line text-[#3f3f46]">{p.product}</p> : null}
            {p.edge ? <p className="mt-3 text-[15px] leading-7 whitespace-pre-line text-[#3f3f46]">{p.edge}</p> : null}
          </section>
          {team.length ? (
            <section className="mt-8">
              <h2 className="text-base font-semibold">一起的人</h2>
              <p className="mt-1 text-sm text-[#71717a]">{followerCount(db, "project", p.id)} 人关注</p>
              <div className="mt-3 flex flex-wrap gap-4">
                {team.map((member) => {
                  const person = getPerson(db, member.personId);
                  if (!person) return null;
                  return (
                    <Link key={member.personId} href={`/u/${person.handle}`} className="flex w-16 flex-col items-center gap-1.5 text-center">
                      <Avatar name={person.name} tone={person.avatarTone} size="md" />
                      <span className="w-full truncate text-xs font-medium">{person.name}</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>
      </article>
    </div>
  );

  if (embed) return sheet;
  return (
    <>
      {canEdit ? <OwnerBar project={p} comp={comp.percent} manage={manage} /> : null}
      <Page className="pb-28 lg:pb-8">
        <BackLink slug={p.slug} layout="luma" />
        {sheet}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function LumaOffers({ title, hint, items, hideAction, onPick }: { title: string; hint: string; items: NeedItem[]; hideAction?: boolean; onPick: (need: NeedItem) => void }) {
  if (!items.length) return null;
  return (
    <section className="mt-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-[#71717a]">{hint}</p>
      <div className="mt-2">
        {items.map((need) => (
          <NeedRow key={need.id} need={need} onAction={() => onPick(need)} hideAction={hideAction} />
        ))}
      </div>
    </section>
  );
}

function NeedRow({ need: n, onAction, hideAction }: { need: NeedItem; onAction: () => void; hideAction?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === `need-${n.id}`) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [n.id]);
  return (
    <div id={`need-${n.id}`} className="scroll-mt-24 border-b border-[#f4f4f5] py-3">
      <div className="flex items-center gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span className="block text-xs text-[#71717a]">{needLabel(n)}</span>
          <span className="mt-0.5 block text-sm font-semibold">{n.title}</span>
          <span className="mt-0.5 block text-sm text-[#71717a]">{n.summary || "点开看条件"}</span>
        </button>
        {hideAction ? null : (
          <button type="button" className="shrink-0 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white" onClick={onAction}>
            我想合作
          </button>
        )}
      </div>
      {open ? (
        <div className="mt-2 space-y-2 text-sm leading-6 text-[#3f3f46]">
          {n.detail ? <p className="whitespace-pre-line">{n.detail}</p> : null}
          {n.terms ? <p className="whitespace-pre-line">{n.terms}</p> : null}
          {n.story ? <p className="whitespace-pre-line text-[#71717a]">{n.story}</p> : null}
        </div>
      ) : null}
      <button type="button" className="mt-1 inline-flex items-center gap-1 text-xs text-[#71717a]" onClick={() => setOpen((v) => !v)}>
        {open ? "收起" : "看条件"}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
    </div>
  );
}

function BackLink({ slug, layout }: { slug: string; layout: string }) {
  return (
    <div className="mb-4 text-sm">
      <Link href={`/p/${slug}?layout=${layout}`} className="text-gray-500 hover:text-gray-900">回到项目页切换</Link>
    </div>
  );
}

function OwnerBar({ project: p, comp, manage }: { project: Project; comp: number; manage: boolean }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
        <div className="flex items-center gap-3">
          <ProgressRing value={comp} size={36} stroke={4}><span className="text-[10px]">{comp}</span></ProgressRing>
          <p className="text-sm text-gray-700">
            这版按 Luma 活动页来排。
            {p.visibility === "link" ? <Badge tone="gray" size="xs" icon={Lock} className="ml-2">仅持链接可见</Badge> : p.wall === "approved" ? <Badge tone="success" size="xs" className="ml-2">已上发现页</Badge> : null}
          </p>
        </div>
        <div className="flex gap-2 sm:ml-auto">
          <Button size="sm" variant="secondary" iconLeft={PenLine} href={`/p/${p.slug}/edit`}>编辑资料</Button>
          {manage ? <Button size="sm" variant="primary" iconLeft={LayoutDashboard} href={`/dashboard/${p.slug}`}>工作台</Button> : null}
        </div>
      </div>
    </div>
  );
}
