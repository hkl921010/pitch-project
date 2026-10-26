"use client";

/**
 * 项目详情的 Read.cv 风格：大字、细线、几乎没有卡片。
 * 单独打开是 /p/[slug]/read。从项目页切换进来时不再重复记浏览。
 * 带 #need-id 时展开对应合作。
 */

import { LayoutDashboard, Lock, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { IntentBar } from "@/components/biz/intent-card";
import { needLabel } from "@/components/biz/looking-for";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, ProgressRing } from "@/components/ui/display";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, projectCompletion, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];

export default function ProjectReadPage() {
  return (
    <Suspense>
      <ReadView />
    </Suspense>
  );
}

/** 嵌进项目页切换时用。 */
export function ProjectReadDetail() {
  return <ReadView embed />;
}

function ReadView({ embed = false }: { embed?: boolean }) {
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
  const comp = projectCompletion(p);
  const onPick = (need: NeedItem) => {
    openIntent({ type: "project", projectId: p.id, presetKind: (need.kind === "help" ? "partner" : need.kind) as IntentKind, needId: need.id });
  };

  const sheet = (
    <article className="mx-auto w-full max-w-[680px] text-[#171717]">
      <p className="text-xs tracking-wide text-[#737373]">{[p.track, p.region, `${followerCount(db, "project", p.id)} 关注`].filter(Boolean).join("  ·  ")}</p>
      <h1 className="mt-3 text-5xl leading-none font-medium tracking-tight sm:text-6xl">{p.name}</h1>
      <p className="mt-4 max-w-[36rem] text-lg leading-7 text-[#525252]">{p.oneLiner || "还没写一句话介绍"}</p>
      {owner ? <p className="mt-4 text-sm text-[#737373]">{owner.name}{owner.title ? `，${owner.title}` : ""}</p> : null}

      <ReadOffers label="合作" hint="供应链、渠道或融资。右边可以直接发起。" items={cooperations} hideAction={isMember} onPick={onPick} />
      <ReadOffers label="服务" hint="对方花钱买的。朋友、新媒体、招人，或其他。" items={services} hideAction={isMember} onPick={onPick} />

      <Section label="About">
        <p className="whitespace-pre-line text-[15px] leading-7">{p.intro || "还没写简介"}</p>
        {p.product ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#404040]">{p.product}</p> : null}
        {p.edge ? <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[#404040]">{p.edge}</p> : null}
        {p.profile ? <More text={p.profile} /> : null}
      </Section>

      {p.highlights?.filter(Boolean).length ? (
        <Section label="Highlights">
          <ul className="flex flex-col">
            {p.highlights.filter(Boolean).map((item) => (
              <li key={item} className="border-b border-[#efefef] py-3 text-sm last:border-b-0">{item}</li>
            ))}
          </ul>
        </Section>
      ) : null}

      {images.length ? (
        <Section label="Selected work">
          <div className="flex flex-col gap-8">
            {images.map((image) => (
              <figure key={image.id}>
                <img src={image.image} alt={image.caption} className="w-full" />
                <figcaption className="mt-2 text-xs text-[#737373]">{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {team.length ? (
        <Section label="People">
          <ul>
            {team.map((member) => {
              const person = getPerson(db, member.personId);
              if (!person) return null;
              return (
                <li key={member.personId} className="flex items-baseline justify-between gap-4 border-b border-[#efefef] py-3 text-sm last:border-b-0">
                  <Link href={`/u/${person.handle}`} className="font-medium hover:underline">{person.name}</Link>
                  <span className="text-[#737373]">{member.title}</span>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
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
                这版按 Read.cv 来排。
                {p.visibility === "link" ? <BadgeLock /> : p.wall === "approved" ? <Badge tone="success" size="xs" className="ml-2">已上发现页</Badge> : null}
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
        <div className="mb-8 text-sm">
          <Link href={`/p/${p.slug}?layout=read`} className="text-gray-500 hover:text-gray-900">回到项目页切换</Link>
        </div>
        {sheet}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function BadgeLock() {
  return <Badge tone="gray" size="xs" icon={Lock} className="ml-2">仅持链接可见</Badge>;
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="text-xs tracking-wide text-[#a3a3a3]">{label}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function More({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4">
      <button type="button" className="text-sm underline" onClick={() => setOpen((v) => !v)}>{open ? "收起" : "继续读"}</button>
      {open ? <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-[#404040]">{text}</p> : null}
    </div>
  );
}

function ReadOffers({ label, hint, items, hideAction, onPick }: { label: string; hint: string; items: NeedItem[]; hideAction?: boolean; onPick: (need: NeedItem) => void }) {
  if (!items.length) return null;
  return (
    <Section label={label}>
      <p className="-mt-1 mb-1 text-sm text-[#737373]">{hint}</p>
      <div>
        {items.map((need) => (
          <NeedLine key={need.id} need={need} onAction={() => onPick(need)} hideAction={hideAction} />
        ))}
      </div>
    </Section>
  );
}

function NeedLine({ need: n, onAction, hideAction }: { need: NeedItem; onAction: () => void; hideAction?: boolean }) {
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
    <div id={`need-${n.id}`} className="scroll-mt-24 border-b border-[#efefef] py-4">
      <div className="flex items-start justify-between gap-4">
        <button type="button" className="min-w-0 flex-1 text-left" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <span className="block text-sm font-medium">{n.title}</span>
          <span className="mt-0.5 block text-sm text-[#737373]">{needLabel(n)}{n.summary ? ` · ${n.summary}` : ""}</span>
        </button>
        {hideAction ? null : (
          <button type="button" className="shrink-0 border-b border-[#171717] pb-0.5 text-sm font-medium" onClick={onAction}>
            我想合作
          </button>
        )}
      </div>
      {open ? (
        <div className="mt-3 max-w-[36rem] space-y-2 text-sm leading-6 text-[#404040]">
          {n.detail ? <p className="whitespace-pre-line">{n.detail}</p> : null}
          {n.terms ? <p className="whitespace-pre-line">{n.terms}</p> : null}
          {n.story ? <p className="whitespace-pre-line text-[#737373]">{n.story}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
