"use client";

/**
 * 项目详情的 Airbnb 房源页风格：大图、一行亮点、主理人。
 * 单独打开是 /p/[slug]/airbnb。从项目页切换进来时不再重复记浏览。
 * 带 #need-id 时展开对应合作。
 */

import { ChevronDown, LayoutDashboard, Lock, PenLine } from "lucide-react";
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

export default function ProjectAirbnbPage() {
  return (
    <Suspense>
      <AirbnbView />
    </Suspense>
  );
}

/** 嵌进项目页切换时用。 */
export function ProjectAirbnbDetail() {
  return <AirbnbView embed />;
}

function AirbnbView({ embed = false }: { embed?: boolean }) {
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
  const images = p.gallery.filter((g) => g.image);
  const hero = images[0];
  const rest = images.slice(1, 5);
  const highlights = (p.highlights?.filter(Boolean) ?? []).slice(0, 4);
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);
  const ask = (need: NeedItem) => {
    if (isMember) return;
    openIntent({ type: "project", projectId: p.id, presetKind: (need.kind === "help" ? "partner" : need.kind) as IntentKind, needId: need.id });
  };

  const sheet = (
    <article className="mx-auto w-full max-w-[920px] text-[#222]">
      <h1 className="text-[26px] leading-tight font-semibold tracking-tight">{p.name}</h1>
      <p className="mt-1 text-sm text-[#717171]">{[p.track, p.region, `${followerCount(db, "project", p.id)} 人关注`].filter(Boolean).join(" · ")}</p>
      <Gallery hero={hero?.image || p.coverImage || p.logoImage} rest={rest.map((g) => g.image!)} logoText={p.logoText} logoTone={p.logoTone} />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4 border-b border-[#ebebeb] pb-6">
            <div>
              <h2 className="text-xl font-semibold">{p.oneLiner || "还没写一句话介绍"}</h2>
              <p className="mt-1 text-sm text-[#717171]">{p.tags.slice(0, 3).join(" · ") || p.track}</p>
            </div>
            {owner ? <Avatar name={owner.name} tone={owner.avatarTone} size="lg" /> : null}
          </div>
          <StayOffers title="合作" hint="供应链、渠道或融资" items={cooperations} hideAction={isMember} onPick={ask} />
          <StayOffers title="服务" hint="对方花钱买的" items={services} hideAction={isMember} onPick={ask} />
          {highlights.length ? (
            <ul className="divide-y divide-[#ebebeb] border-b border-[#ebebeb]">
              {highlights.map((item) => (
                <li key={item} className="py-4 text-[15px] leading-6">{item}</li>
              ))}
            </ul>
          ) : null}
          <section className="border-b border-[#ebebeb] py-6">
            <p className="text-[15px] leading-7 whitespace-pre-line">{p.intro || "还没写简介"}</p>
            {p.product ? <p className="mt-3 text-[15px] leading-7 whitespace-pre-line">{p.product}</p> : null}
            {p.edge ? <p className="mt-3 text-[15px] leading-7 whitespace-pre-line">{p.edge}</p> : null}
            {p.profile ? <More text={p.profile} /> : null}
          </section>
          {owner ? (
            <section className="flex items-center gap-4 border-t border-[#ebebeb] py-6">
              <Avatar name={owner.name} tone={owner.avatarTone} size="lg" />
              <div>
                <p className="font-semibold">主理人 {owner.name}</p>
                <p className="text-sm text-[#717171]">{owner.title || owner.org || "项目发起人"}{badges[0] ? ` · ${badges[0].label}` : ""}</p>
              </div>
            </section>
          ) : null}
          {team.length > 1 ? (
            <div className="flex flex-wrap gap-3 pb-2">
              {team.map((member) => {
                const person = getPerson(db, member.personId);
                if (!person) return null;
                return (
                  <Link key={member.personId} href={`/u/${person.handle}`} className="text-sm text-[#222] underline decoration-[#ddd] underline-offset-4">
                    {person.name}
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
        {cooperations.length || services.length ? (
          <aside className="hidden h-fit rounded-xl border border-[#ddd] p-6 shadow-[0_6px_16px_rgba(0,0,0,0.08)] lg:sticky lg:top-28 lg:block">
            <StayOffers title="合作" hint="供应链、渠道或融资" items={cooperations} hideAction={isMember} onPick={ask} compact />
            <StayOffers title="服务" hint="对方花钱买的" items={services} hideAction={isMember} onPick={ask} compact />
          </aside>
        ) : null}
      </div>
    </article>
  );

  if (embed) return sheet;
  return (
    <>
      {canEdit ? (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
            <div className="flex items-center gap-3">
              <ProgressRing value={comp.percent} size={36} stroke={4}><span className="text-[10px]">{comp.percent}</span></ProgressRing>
              <p className="text-sm text-gray-700">
                这版按 Airbnb 房源页来排。
                {p.visibility === "link" ? <Badge tone="gray" size="xs" icon={Lock} className="ml-2">仅持链接可见</Badge> : p.wall === "approved" ? <Badge tone="success" size="xs" className="ml-2">已上发现页</Badge> : null}
              </p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button size="sm" variant="secondary" iconLeft={PenLine} href={`/p/${p.slug}/edit`}>编辑资料</Button>
              {manage ? <Button size="sm" variant="primary" iconLeft={LayoutDashboard} href={`/dashboard/${p.slug}`}>工作台</Button> : null}
            </div>
          </div>
        </div>
      ) : null}
      <Page className="pb-28 lg:pb-8">
        <div className="mb-4 text-sm">
          <Link href={`/p/${p.slug}?layout=airbnb`} className="text-gray-500 hover:text-gray-900">回到项目页切换</Link>
        </div>
        {sheet}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function Gallery({ hero, rest, logoText, logoTone }: { hero?: string; rest: string[]; logoText: string; logoTone: number }) {
  if (!hero && !rest.length) {
    return <div className="mt-4 flex h-48 items-center justify-center rounded-2xl bg-[#f7f7f7]"><ProjectLogo text={logoText} tone={logoTone} size="xl" /></div>;
  }
  return (
    <div className="mt-4 grid h-[280px] grid-cols-1 gap-2 overflow-hidden rounded-2xl sm:h-[360px] sm:grid-cols-4">
      <div className={cn("overflow-hidden bg-[#f7f7f7]", rest.length ? "sm:col-span-2 sm:row-span-2" : "sm:col-span-4")}>
        {hero ? <img src={hero} alt="" className="h-full w-full object-cover" /> : null}
      </div>
      {rest.slice(0, 4).map((src) => (
        <div key={src} className="hidden overflow-hidden bg-[#f7f7f7] sm:block">
          <img src={src} alt="" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function More({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      <button type="button" className="text-sm font-semibold underline" onClick={() => setOpen((v) => !v)}>{open ? "收起" : "显示更多"}</button>
      {open ? <p className="mt-3 whitespace-pre-line text-[15px] leading-7">{text}</p> : null}
    </div>
  );
}

function StayOffers({ title, hint, items, hideAction, onPick, compact }: { title: string; hint: string; items: NeedItem[]; hideAction?: boolean; onPick: (need: NeedItem) => void; compact?: boolean }) {
  if (!items.length) return null;
  return (
    <section className={compact ? "mt-4 first:mt-0" : "border-b border-[#ebebeb] py-6"}>
      <h2 className={compact ? "text-base font-semibold" : "text-xl font-semibold"}>{title}</h2>
      <p className="mt-0.5 text-sm text-[#717171]">{hint}</p>
      <div className="mt-2">
        {items.map((need) => (
          <NeedRow key={need.id} need={need} onAction={() => onPick(need)} hideAction={hideAction} compact={compact} />
        ))}
      </div>
    </section>
  );
}

function NeedRow({ need: n, onAction, hideAction, compact }: { need: NeedItem; onAction: () => void; hideAction?: boolean; compact?: boolean }) {
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
    <div id={compact ? undefined : `need-${n.id}`} className="scroll-mt-24 border-b border-[#ebebeb] py-3 last:border-b-0">
      <div className="flex items-start gap-3">
        <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span className="block text-xs text-[#717171]">{needLabel(n)}</span>
          <span className="mt-0.5 block font-medium">{n.title}</span>
          {n.summary ? <span className="mt-0.5 block text-sm text-[#717171]">{n.summary}</span> : null}
        </button>
        {hideAction ? null : (
          <button type="button" className="shrink-0 rounded-lg bg-[#222] px-3 py-1.5 text-xs font-semibold text-white" onClick={onAction}>
            我想合作
          </button>
        )}
      </div>
      {open && !compact ? (
        <div className="mt-3 space-y-2 text-sm leading-6 text-[#484848]">
          {n.detail ? <p className="whitespace-pre-line">{n.detail}</p> : null}
          {n.terms ? <p className="whitespace-pre-line">{n.terms}</p> : null}
          {n.story ? <p className="whitespace-pre-line">{n.story}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
