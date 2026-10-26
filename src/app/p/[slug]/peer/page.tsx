"use client";

/**
 * 项目详情的 Peerlist App 风格。
 * 单独打开是 /p/[slug]/peer。从项目页切换进来时不再重复记浏览。
 * 带 #need-id 时展开对应合作。
 */

import { ChevronDown, ChevronUp, LayoutDashboard, Lock, PenLine } from "lucide-react";
import Link from "next/link";
import { notFound, useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

import { IntentBar } from "@/components/biz/intent-card";
import { FollowButton } from "@/components/biz/follow-button";
import { needLabel } from "@/components/biz/looking-for";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, ProgressRing, ProjectLogo } from "@/components/ui/display";
import type { IntentKind, NeedItem, Project, TrafficSource } from "@/data/types";
import { cn } from "@/lib/cn";
import { useHashScroll } from "@/lib/use-hash-scroll";
import { useApp } from "@/store/app-store";
import { badgeDefs, canEditProject, canManageProject, followerCount, getPerson, getProjectBySlug, isFollowing, projectCompletion, useDB, useViewer } from "@/store/selectors";

const SOURCES: TrafficSource[] = ["wechat", "moments", "poster", "discover", "demoday", "article", "direct"];

export default function ProjectPeerPage() {
  return (
    <Suspense>
      <PeerView />
    </Suspense>
  );
}

/** 嵌进项目页切换时用。 */
export function ProjectPeerDetail() {
  return <PeerView embed />;
}

function PeerView({ embed = false }: { embed?: boolean }) {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const db = useDB();
  const viewer = useViewer();
  const recordView = useApp((s) => s.recordView);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const openIntent = useApp((s) => s.openIntent);
  const project = getProjectBySlug(db, slug);
  const counted = useRef(false);
  useHashScroll([slug]);
  const isMember = !!viewer && !!project?.team.some((t) => t.personId === viewer.id && t.status === "confirmed");
  const following = !!project && isFollowing(db, viewer?.id ?? null, "project", project.id);

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
  const needs = p.lookingFor.filter((n) => n.coop || n.service);
  const images = p.gallery.filter((g) => g.image);
  const badges = badgeDefs(p.badges);
  const comp = projectCompletion(p);
  const followers = followerCount(db, "project", p.id);
  const first = needs.find((n) => n.coop) ?? needs[0];

  const onUpvote = () => {
    if (isMember) return;
    if (!viewer) {
      requireLogin("登录后即可关注，项目有新动态会通知你");
      return;
    }
    toggleFollow("project", p.id);
    if (!following) toast({ tone: "success", title: "已关注", body: "项目发布动态时会通知你" });
  };

  const sheet = (
    <div className="mx-auto w-full max-w-[640px] text-[#0d0d0d]">
      <header className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          {p.logoImage || p.coverImage ? (
            <img src={p.logoImage || p.coverImage} alt="" className="h-full w-full object-cover" />
          ) : (
            <ProjectLogo text={p.logoText} tone={p.logoTone} size="lg" className="h-full w-full rounded-none" />
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-tight">{p.name}</h1>
              <p className="mt-1 text-sm leading-5 text-[#64748b]">{p.oneLiner || "还没写一句话介绍"}</p>
            </div>
            <button
              type="button"
              onClick={onUpvote}
              disabled={isMember}
              aria-label={following ? "取消关注" : "关注"}
              className={cn(
                "flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border bg-white text-xs font-semibold",
                following ? "border-[#1e874b] text-[#00aa45]" : "border-[#e2e8f0] text-[#0d0d0d]",
              )}
            >
              <ChevronUp size={16} />
              <span className="mt-0.5 tabular-nums">{followers}</span>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {owner ? <Avatar name={owner.name} tone={owner.avatarTone} size="xs" /> : null}
            <span className="font-medium">{owner?.name}</span>
            <span className="text-[#94a3b8]">·</span>
            <span className="text-[#64748b]">{p.track}</span>
            {p.region ? <span className="text-[#64748b]">{p.region}</span> : null}
            {badges.map((b) => (
              <Badge key={b.id} tone={b.tone} size="xs">
                {b.label}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="my-5 h-px bg-[#e2e8f0]" />

      <section>
        <h2 className="text-sm font-semibold">关于</h2>
        <div className="mt-2 space-y-3 text-[15px] leading-7">
          {p.intro ? <p className="whitespace-pre-line">{p.intro}</p> : <p className="text-[#94a3b8]">还没写简介</p>}
          {p.product ? <p className="whitespace-pre-line text-[#334155]">{p.product}</p> : null}
          {p.edge ? <p className="whitespace-pre-line text-[#334155]">{p.edge}</p> : null}
        </div>
        {p.profile ? <More text={p.profile} /> : null}
      </section>

      {p.highlights?.filter(Boolean).length ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">亮点</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {p.highlights.filter(Boolean).map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-6 text-[#334155]">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#00aa45]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {images.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">图片</h2>
          <div className="scrollbar-none mt-3 flex gap-3 overflow-x-auto pb-1">
            {images.map((image) => (
              <figure key={image.id} className="w-56 shrink-0">
                <img src={image.image} alt={image.caption} className="h-36 w-full rounded-xl border border-[#e2e8f0] object-cover" />
                <figcaption className="mt-1.5 truncate text-xs text-[#64748b]">{image.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-semibold">标签</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {[p.track, ...p.tags].filter(Boolean).map((tag) => (
            <span key={tag} className="rounded-lg border border-[#e2e8f0] px-2.5 py-1 text-xs text-[#334155]">
              {tag}
            </span>
          ))}
        </div>
      </section>

      {needs.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">合作</h2>
          <div className="mt-1">
            {needs.map((need) => (
              <NeedRow
                key={need.id}
                need={need}
                action={isMember ? undefined : "我想合作"}
                onAction={() => openIntent({ type: "project", projectId: p.id, presetKind: (need.kind === "help" ? "partner" : need.kind) as IntentKind, needId: need.id })}
              />
            ))}
          </div>
        </section>
      ) : null}

      {team.length ? (
        <section className="mt-6">
          <h2 className="text-sm font-semibold">团队</h2>
          <div className="mt-3 flex flex-col gap-3">
            {team.map((member) => {
              const person = getPerson(db, member.personId);
              if (!person) return null;
              return (
                <Link key={member.personId} href={`/u/${person.handle}`} className="flex items-center gap-3">
                  <Avatar name={person.name} tone={person.avatarTone} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{person.name}</span>
                    <span className="block truncate text-xs text-[#64748b]">{member.title}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {first && !isMember ? (
        <button
          type="button"
          className="mt-8 flex h-10 w-full items-center justify-center rounded-xl border border-[#1e874b] bg-[#00aa45] text-sm font-semibold text-white"
          onClick={() => openIntent({ type: "project", projectId: p.id, presetKind: (first.kind === "help" ? "partner" : first.kind) as IntentKind, needId: first.id })}
        >
          我想合作
        </button>
      ) : null}
    </div>
  );

  if (embed) return sheet;

  return (
    <>
      {canEdit ? (
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-8">
            <div className="flex items-center gap-3">
              <ProgressRing value={comp.percent} size={36} stroke={4}>
                <span className="text-[10px]">{comp.percent}</span>
              </ProgressRing>
              <p className="text-sm text-gray-700">
                这版按 Peerlist App 来排。
                {p.visibility === "link" ? (
                  <Badge tone="gray" size="xs" icon={Lock} className="ml-2">
                    仅持链接可见
                  </Badge>
                ) : p.wall === "approved" ? (
                  <Badge tone="success" size="xs" className="ml-2">
                    已上发现页
                  </Badge>
                ) : null}
              </p>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              <Button size="sm" variant="secondary" iconLeft={PenLine} href={`/p/${p.slug}/edit`}>
                编辑资料
              </Button>
              {manage ? (
                <Button size="sm" variant="primary" iconLeft={LayoutDashboard} href={`/dashboard/${p.slug}`}>
                  工作台
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
      <Page className="pb-28 lg:pb-8">
        <div className="mb-4 text-sm">
          <Link href={`/p/${p.slug}?layout=peer`} className="text-gray-500 hover:text-gray-900">
            回到项目页切换
          </Link>
        </div>
        {sheet}
      </Page>
      <IntentBar project={p} follow={<FollowButton targetType="project" targetId={p.id} size="md" />} />
    </>
  );
}

function More({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      if (decodeURIComponent(window.location.hash.slice(1)) === "profile") setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  return (
    <div id="profile" className="scroll-mt-24 mt-3">
      <button type="button" className="text-sm font-semibold text-[#00aa45]" onClick={() => setOpen((v) => !v)}>
        {open ? "收起" : "更多"}
      </button>
      {open ? <p className="mt-2 text-[15px] leading-7 whitespace-pre-line text-[#334155]">{text}</p> : null}
    </div>
  );
}

function NeedRow({ need: n, action, onAction }: { need: NeedItem; action?: string; onAction: () => void }) {
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
    <div id={`need-${n.id}`} className="scroll-mt-24 border-b border-[#e2e8f0] py-3 last:border-b-0">
      <button type="button" className="flex w-full items-start gap-3 text-left" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{n.title}</span>
          <span className="mt-0.5 block text-xs text-[#64748b]">{needLabel(n)}{n.summary ? ` · ${n.summary}` : ""}</span>
        </span>
        <ChevronDown size={16} className={cn("mt-1 shrink-0 text-[#94a3b8] transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="mt-3 space-y-2 text-sm leading-6 text-[#334155]">
          {n.detail ? <p className="whitespace-pre-line">{n.detail}</p> : null}
          {n.terms ? <p className="whitespace-pre-line">{n.terms}</p> : null}
          {n.story ? <p className="whitespace-pre-line text-[#64748b]">{n.story}</p> : null}
          {action ? (
            <button type="button" className="pt-1 text-sm font-semibold text-[#00aa45]" onClick={onAction}>
              {action}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

