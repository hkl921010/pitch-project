"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Globe,
  ImagePlus,
  Link2,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { BPUpload } from "@/components/biz/bp-upload";
import { kindFromCoop, LookingForChips } from "@/components/biz/looking-for";
import { ProjectCard } from "@/components/biz/project-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, Cover, EmptyState, ProgressRing, ProjectLogo, Tag } from "@/components/ui/display";
import { ChipSelect, Field, Input, RadioCards, Select, Textarea } from "@/components/ui/form";
import { ConfirmModal, Drawer } from "@/components/ui/overlay";
import { Segmented } from "@/components/ui/tabs";
import { bpAsPrefill, type BPExtract } from "@/data/ai-prefill";
import { COOP_LABEL, COOP_ORDER, REGIONS, SERVICE_LABEL, SERVICE_ORDER, STAGES, TONES, TRACKS } from "@/data/constants";
import type { CoopKind, NeedItem, Project, ServiceKind } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { canEditProject, getProjectBySlug, projectCompletion, useDB, useViewer } from "@/store/selectors";

const EDITABLE = ["name", "oneLiner", "track", "region", "tags", "website", "visibility", "logoText", "logoTone", "coverTone", "gallery", "intro", "product", "edge", "lookingFor", "contact"] as const;
type Draft = Pick<Project, (typeof EDITABLE)[number]>;

const pick = (p: Project): Draft => Object.fromEntries(EDITABLE.map((k) => [k, structuredClone(p[k])])) as Draft;

const SECTIONS = [
  { id: "basic", label: "基本信息" },
  { id: "gallery", label: "Logo 与图集" },
  { id: "about", label: "关于项目" },
  { id: "looking", label: "寻找合作" },
  { id: "services", label: "寻找服务" },
  { id: "contact", label: "联系方式" },
];

/** 完成度清单项 → 编辑页锚点（团队、动态在工作台完成） */
const ITEM_TARGET: Record<string, { anchor?: string; href?: (slug: string) => string }> = {
  logo: { anchor: "about" },
  intro: { anchor: "about" },
  product: { anchor: "about" },
  edge: { anchor: "about" },
  looking: { anchor: "looking" },
  contact: { anchor: "contact" },
  team: { href: (s) => `/dashboard/${s}?tab=team` },
  update: { href: (s) => `/dashboard/${s}?tab=updates` },
};

export default function EditProjectPage() {
  return (
    <Suspense>
      <EditView />
    </Suspense>
  );
}

function EditView() {
  const { slug } = useParams<{ slug: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const db = useDB();
  const viewer = useViewer();
  const update = useApp((s) => s.updateProject);
  const toast = useApp((s) => s.toast);
  const requireLogin = useApp((s) => s.requireLogin);
  const project = getProjectBySlug(db, slug);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [tried, setTried] = useState(false);
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrolled = useRef(false);

  useEffect(() => {
    if (project && !draft) setDraft(pick(project));
  }, [project, draft]);

  useEffect(() => {
    if (!draft || scrolled.current) return;
    scrolled.current = true;
    const id = window.location.hash.slice(1);
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }, [draft]);

  const dirty = useMemo(() => !!project && !!draft && JSON.stringify(pick(project)) !== JSON.stringify(draft), [project, draft]);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!viewer) {
    return (
      <Page narrow>
        <EmptyState icon={Lock} title="登录后编辑项目" action={<Button variant="primary" onClick={() => requireLogin("登录后编辑项目")}>登录</Button>} />
      </Page>
    );
  }
  if (!project) {
    return (
      <Page narrow>
        <EmptyState icon={Lock} title="项目不存在" action={<Button href="/discover">去发现页</Button>} />
      </Page>
    );
  }
  if (!canEditProject(project, viewer.id)) {
    return (
      <Page narrow>
        <EmptyState
          icon={Lock}
          title="只有项目成员可以编辑"
          desc="编辑权限由项目创建者在工作台分配"
          action={
            <Button href={`/p/${project.slug}`} iconLeft={ArrowLeft}>
              回到项目页
            </Button>
          }
        />
      </Page>
    );
  }
  if (!draft) return null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => (d ? { ...d, [k]: v } : d));
  const merged: Project = { ...project, ...draft };
  const completion = projectCompletion(merged);

  const errors = {
    name: !draft.name.trim() ? "项目名称不能为空" : undefined,
    oneLiner: !draft.oneLiner.trim() ? "一句话介绍不能为空" : undefined,
    needs: draft.lookingFor.some((n) => (!n.coop && !n.service) || !n.title.trim() || !(n.terms ?? "").trim()),
  };
  const valid = !errors.name && !errors.oneLiner && !errors.needs;

  const save = (then?: string) => {
    setTried(true);
    if (!valid) {
      toast({ tone: "error", title: "还有必填项没写", body: "红色标出的地方补上就能保存" });
      return false;
    }
    update(project.id, { ...draft, logoText: draft.logoText.trim() || draft.name.trim().slice(0, 1) });
    toast({ tone: "success", title: "已保存", body: "公开页已同步更新" });
    if (then) router.push(then);
    return true;
  };

  const go = (href: string) => (dirty ? setLeaveTo(href) : router.push(href));

  const applyBP = (x: BPExtract) => {
    const pre = bpAsPrefill(x);
    setDraft((d) =>
      d
        ? {
            ...d,
            intro: d.intro || pre.intro!,
            product: d.product || pre.product!,
            edge: d.edge || pre.edge!,
            website: d.website || pre.website,
            tags: d.tags.length ? d.tags : pre.tags!,
            lookingFor: d.lookingFor.length ? d.lookingFor : pre.lookingFor!.map((n) => ({ ...n, id: `n-${Math.random().toString(36).slice(2, 8)}`, ownerId: project.id, createdAt: new Date().toISOString() })),
          }
        : d,
    );
    toast({ tone: "success", title: "AI 已补全空白项", body: "已填写的内容不会被覆盖" });
  };

  const publicUrl = `pitch.cn/p/${project.slug}`;

  return (
    <Page>
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <button onClick={() => go(`/p/${project.slug}`)} className="mb-2 flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} />
            {project.name}
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl">编辑项目资料</h1>
          <p className="mt-1 text-sm text-gray-500">保存后公开页立即更新。团队成员和动态在工作台管理。</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {dirty ? <Badge tone="warning" dot>有未保存的修改</Badge> : <Badge tone="success" icon={Check}>已保存</Badge>}
          <Button variant="secondary" iconLeft={Eye} onClick={() => go(`/p/${project.slug}`)}>
            查看公开页
          </Button>
          <Button variant="primary" iconLeft={Save} onClick={() => save()} disabled={!dirty}>
            保存
          </Button>
        </div>
      </div>

      {sp.get("new") ? (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 p-4 sm:flex-row sm:items-center">
          <CheckCircle2 size={22} className="shrink-0 text-success-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-success-800">{project.name} 的公开页已生成，现在就可以分享</p>
            <p className="text-sm text-success-700">资料越完整，被投资人和合作方找到的机会越大。照着完成度清单一项项补全吧。</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant="secondary"
              iconLeft={Copy}
              onClick={() => {
                void navigator.clipboard?.writeText(`https://${publicUrl}?from=wechat`);
                toast({ tone: "success", title: "链接已复制", body: "发到微信群试试" });
              }}
            >
              复制链接
            </Button>
            <Button size="sm" variant="secondary" iconLeft={Eye} onClick={() => go(`/p/${project.slug}`)}>
              看看公开页
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6 pb-28 md:pb-10">
          <nav className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-800">
                {s.label}
              </a>
            ))}
          </nav>

          <Section id="basic" title="基本信息" desc="出现在公开页头部和发现页卡片上">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="项目名称" required maxCount={20} value={draft.name} onChange={(e) => set("name", e.target.value)} error={tried ? errors.name : undefined} />
              <Select label="赛道" value={draft.track} onChange={(e) => set("track", e.target.value)} options={TRACKS.map((t) => ({ value: t, label: t }))} />
            </div>
            <Input label="一句话介绍" required maxCount={40} value={draft.oneLiner} onChange={(e) => set("oneLiner", e.target.value)} error={tried ? errors.oneLiner : undefined} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select label="主要市场" value={draft.region} onChange={(e) => set("region", e.target.value)} placeholder="选择地区" options={REGIONS.map((t) => ({ value: t, label: t }))} />
              <Input label="官网" icon={Globe} value={draft.website ?? ""} onChange={(e) => set("website", e.target.value)} placeholder="选填" />
            </div>
            <TagEditor tags={draft.tags} onChange={(v) => set("tags", v)} />
            <Field label="可见范围">
              <RadioCards<Project["visibility"]>
                value={draft.visibility}
                onChange={(v) => set("visibility", v)}
                options={[
                  { value: "public", title: "公开", desc: "可申请上发现页和月度路演", icon: Globe },
                  { value: "link", title: "仅持链接可见", desc: "不出现在发现页，链接仍可访问", icon: Link2 },
                ]}
              />
            </Field>
          </Section>

          <Section id="gallery" title="Logo 与图集" desc="第一张图是封面；最多 6 张">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex items-center gap-4">
                <ProjectLogo text={draft.logoText || draft.name.slice(0, 1)} tone={draft.logoTone} size="2xl" />
                <Input label="Logo 文字" value={draft.logoText} onChange={(e) => set("logoText", e.target.value.slice(0, 2))} hint="1–2 个字" wrapperClassName="w-28" />
              </div>
              <Field label="Logo 颜色" className="flex-1">
                <ToneSwatches value={draft.logoTone} onChange={(v) => set("logoTone", v)} />
              </Field>
            </div>
            <GalleryEditor items={draft.gallery} onChange={(v) => set("gallery", v)} />
          </Section>

          <Section id="about" title="关于项目" desc="三段话讲清楚：在做什么、在卖什么、凭什么" extra={<BPUpload onExtract={applyBP} compact className="w-full sm:w-[300px]" />}>
            <Textarea
              label="在做什么"
              rows={5}
              maxCount={400}
              value={draft.intro}
              onChange={(e) => set("intro", e.target.value)}
              hint={draft.intro.trim().length < 30 ? `至少 30 字才算完成（还差 ${30 - draft.intro.trim().length} 字）` : "讲清楚现在做到了哪一步，最好带数据"}
              placeholder="我们为谁解决什么问题，现在做到了什么程度"
            />
            <Textarea label="在卖什么" rows={3} maxCount={200} value={draft.product} onChange={(e) => set("product", e.target.value)} placeholder="产品形态、价格、谁在买" />
            <Textarea label="凭什么" rows={3} maxCount={200} value={draft.edge} onChange={(e) => set("edge", e.target.value)} placeholder="团队背景、成本或数据上的优势" />
          </Section>

          <Section id="looking" title="寻找合作" desc="供应链、渠道或融资。每条写清在找什么，以及愿意付出什么。">
            <NeedsEditor group="coop" needs={draft.lookingFor} projectId={project.id} onChange={(v) => set("lookingFor", v)} showErrors={tried} />
          </Section>

          <Section id="services" title="寻找服务" desc="自己花钱买的：朋友、新媒体、招人，或其他。写清要什么，以及愿意付多少。">
            <NeedsEditor group="service" needs={draft.lookingFor} projectId={project.id} onChange={(v) => set("lookingFor", v)} showErrors={tried} />
          </Section>

          <Section id="contact" title="联系方式" desc="不会公开展示。对话中由你决定是否分享给对方">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="微信" icon={MessageCircle} value={draft.contact.wechat ?? ""} onChange={(e) => set("contact", { ...draft.contact, wechat: e.target.value })} />
              <Input label="手机" icon={Phone} value={draft.contact.phone ?? ""} onChange={(e) => set("contact", { ...draft.contact, phone: e.target.value })} />
              <Input label="邮箱" icon={Mail} value={draft.contact.email ?? ""} onChange={(e) => set("contact", { ...draft.contact, email: e.target.value })} />
            </div>
          </Section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 flex flex-col gap-4">
            <CompletionCard completion={completion} slug={project.slug} />
            <PreviewCard project={merged} />
          </div>
        </aside>
      </div>

      <div className="lg:hidden">
        <CompletionCard completion={completion} slug={project.slug} />
      </div>

      {/* 移动端底部操作条（位于底部导航上方） */}
      <div className="fixed inset-x-0 bottom-[60px] z-40 flex items-center gap-2 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:hidden">
        <span className="mr-auto text-xs text-gray-500">{dirty ? "有未保存的修改" : `完成度 ${completion.percent}%`}</span>
        <Button size="sm" variant="secondary" iconLeft={Eye} onClick={() => setPreviewOpen(true)}>
          预览
        </Button>
        <Button size="sm" variant="primary" iconLeft={Save} onClick={() => save()} disabled={!dirty}>
          保存
        </Button>
      </div>

      <Drawer open={previewOpen} onClose={() => setPreviewOpen(false)} title="实时预览" width={420}>
        <PreviewCard project={merged} bare />
      </Drawer>

      <ConfirmModal
        open={!!leaveTo}
        onClose={() => setLeaveTo(null)}
        title="有未保存的修改"
        desc="保存后再离开？不保存的话，这次的修改会丢失。"
        confirmText="保存并离开"
        onConfirm={() => {
          if (leaveTo) save(leaveTo);
        }}
      >
        <button
          onClick={() => {
            const to = leaveTo;
            setLeaveTo(null);
            if (to) router.push(to);
          }}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          不保存，直接离开
        </button>
      </ConfirmModal>
    </Page>
  );
}

/* ------------------------------------------------------------------ */

function Section({ id, title, desc, extra, children }: { id: string; title: string; desc?: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {desc ? <p className="text-sm text-gray-500">{desc}</p> : null}
          </div>
          {extra}
        </div>
        {children}
      </Card>
    </section>
  );
}

function ToneSwatches({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TONES.map((t, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          aria-label={`颜色 ${i + 1}`}
          className={cn("h-8 w-8 rounded-full ring-offset-2 transition-shadow", value === i ? "ring-2 ring-gray-900" : "hover:ring-2 hover:ring-gray-300")}
          style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
        />
      ))}
    </div>
  );
}

function TagEditor({ tags, onChange }: { tags: string[]; onChange: (v: string[]) => void }) {
  const [v, setV] = useState("");
  const add = () => {
    const t = v.trim().replace(/[,，]/g, "");
    if (t && !tags.includes(t) && tags.length < 5) onChange([...tags, t]);
    setV("");
  };
  return (
    <Field label="标签" hint="回车添加，最多 5 个；用于相似项目和搜索">
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2 py-1.5 shadow-xs focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-100">
        {tags.map((t) => (
          <Tag key={t}>
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} className="text-gray-400 hover:text-gray-600" aria-label={`删除${t}`}>
              <X size={12} />
            </button>
          </Tag>
        ))}
        {tags.length < 5 ? (
          <input
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === ",") && !e.nativeEvent.isComposing) {
                e.preventDefault();
                add();
              }
              if (e.key === "Backspace" && !v && tags.length) onChange(tags.slice(0, -1));
            }}
            onBlur={add}
            placeholder={tags.length ? "" : "比如：出海、DTC、订阅制"}
            className="min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-gray-400"
          />
        ) : null}
      </div>
    </Field>
  );
}

function GalleryEditor({ items, onChange }: { items: Project["gallery"]; onChange: (v: Project["gallery"]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-3">
      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, 6 - items.length);
          onChange([...items, ...files.map((f) => ({ id: `g-${Math.random().toString(36).slice(2, 8)}`, caption: f.name.replace(/\.[^.]+$/, ""), tone: Math.floor(Math.random() * TONES.length) }))]);
          e.target.value = "";
        }}
      />
      {items.length === 0 ? (
        <button type="button" onClick={() => ref.current?.click()} className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 p-8 text-center hover:border-brand-300 hover:bg-brand-25">
          <ImagePlus size={24} className="text-brand-600" />
          <span className="text-sm font-semibold text-gray-800">上传封面与产品图</span>
          <span className="text-xs text-gray-500">门店、产品、团队照片都可以。原型中以色块代替图片</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((g, i) => (
            <div key={g.id} className="group flex flex-col gap-1.5">
              <div className="relative">
                <Cover tone={g.tone} label={g.caption} className="aspect-[4/3] rounded-lg" />
                {i === 0 ? (
                  <Badge size="xs" tone="dark" className="absolute top-2 left-2">
                    封面
                  </Badge>
                ) : null}
                <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                  {i > 0 ? (
                    <button
                      type="button"
                      onClick={() => onChange([g, ...items.filter((x) => x.id !== g.id)])}
                      className="rounded-md bg-white/90 p-1.5 text-gray-700 shadow-sm hover:bg-white"
                      aria-label="设为封面"
                      title="设为封面"
                    >
                      <Star size={14} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((x) => x.id !== g.id))}
                    className="rounded-md bg-white/90 p-1.5 text-error-600 shadow-sm hover:bg-white"
                    aria-label="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <input
                value={g.caption}
                onChange={(e) => onChange(items.map((x) => (x.id === g.id ? { ...x, caption: e.target.value } : x)))}
                className="rounded-md border border-transparent px-1.5 py-1 text-xs text-gray-700 outline-none hover:border-gray-200 focus:border-brand-300"
                placeholder="图片说明"
              />
            </div>
          ))}
          {items.length < 6 ? (
            <button type="button" onClick={() => ref.current?.click()} className="flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-700">
              <Plus size={18} />
              添加图片
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

const COOP_PLACEHOLDER: Record<CoopKind, { title: string; detail: string; terms: string }> = {
  supply: { title: "比如：冷泡瓶装茶代工", detail: "要什么类型的工厂或货", terms: "首单多少、怎么结算、双方各负责什么" },
  channel: { title: "比如：东南亚便利店与商超", detail: "要引进哪个市场、什么渠道", terms: "给多少分成，进场后谁负责铺货" },
  funding: { title: "比如：天使+轮，用于 8 家门店", detail: "希望投资方有什么背景", terms: "融多少、估值多少、这笔钱对应多少结果" },
};

const SERVICE_PLACEHOLDER: Record<ServiceKind, { title: string; detail: string; terms: string }> = {
  friend: { title: "比如：熟悉吉隆坡商场招商的朋友", detail: "能介绍什么人、什么资源", terms: "介绍成功怎么付，比如按次咨询费" },
  media: { title: "比如：泰国社媒代运营", detail: "要什么样的内容团队", terms: "按月多少钱，双方各做什么" },
  hiring: { title: "比如：新加坡店长", detail: "要什么样的人", terms: "薪资或预算，做到什么算完成" },
  other: { title: "比如：品牌视觉设计", detail: "要交付什么", terms: "预算多少，按项目还是按月" },
};

function replaceGroup(all: NeedItem[], mineIds: Set<string>, next: NeedItem[]) {
  const out: NeedItem[] = [];
  let inserted = false;
  for (const n of all) {
    if (!mineIds.has(n.id)) out.push(n);
    else if (!inserted) {
      out.push(...next);
      inserted = true;
    }
  }
  if (!inserted) out.push(...next);
  return out;
}

function NeedsEditor({ group, needs, projectId, onChange, showErrors }: { group: "coop" | "service"; needs: NeedItem[]; projectId: string; onChange: (v: NeedItem[]) => void; showErrors: boolean }) {
  const mine = needs.filter((n) => (group === "service" ? !!n.service : !!n.coop && !n.service));
  const mineIds = new Set(mine.map((n) => n.id));
  const commit = (next: NeedItem[]) => onChange(replaceGroup(needs, mineIds, next));
  const patch = (id: string, p: Partial<NeedItem>) => commit(mine.map((n) => (n.id === id ? { ...n, ...p } : n)));
  const addCoop = (coop: CoopKind) =>
    commit([...mine, { id: `n-${Math.random().toString(36).slice(2, 8)}`, ownerType: "project", ownerId: projectId, kind: kindFromCoop(coop), coop, title: "", terms: "", createdAt: new Date().toISOString() }]);
  const addService = (service: ServiceKind) =>
    commit([...mine, { id: `n-${Math.random().toString(36).slice(2, 8)}`, ownerType: "project", ownerId: projectId, kind: "partner", service, title: "", terms: "", createdAt: new Date().toISOString() }]);
  return (
    <div className="flex flex-col gap-3">
      {mine.length === 0 ? (
        <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
          {group === "service" ? "还没写。比如找朋友介绍、新媒体代运营，或招人。写清愿意付多少。" : "还没写。每条写清在找什么，以及愿意付出的分成、报价或融资条件。"}
        </p>
      ) : (
        mine.map((n) => {
          const coop = n.coop ?? "channel";
          const service = n.service ?? "other";
          const hint = group === "service" ? SERVICE_PLACEHOLDER[service] : COOP_PLACEHOLDER[coop];
          return (
            <div key={n.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {group === "service" ? (
                  <Segmented<ServiceKind>
                    size="sm"
                    value={service}
                    onChange={(next) => patch(n.id, { service: next, coop: undefined, kind: "partner", sub: undefined })}
                    items={SERVICE_ORDER.map((k) => ({ value: k, label: SERVICE_LABEL[k] }))}
                  />
                ) : (
                  <Segmented<CoopKind>
                    size="sm"
                    value={coop}
                    onChange={(next) => patch(n.id, { coop: next, service: undefined, kind: kindFromCoop(next), sub: next === "funding" ? n.sub : undefined })}
                    items={COOP_ORDER.map((k) => ({ value: k, label: COOP_LABEL[k] }))}
                  />
                )}
                <Button size="xs" variant="tertiary" iconOnly={Trash2} onClick={() => commit(mine.filter((x) => x.id !== n.id))} className="ml-auto" aria-label="删除这条" />
              </div>
              {group === "coop" && coop === "funding" ? (
                <Field label="轮次">
                  <ChipSelect
                    size="sm"
                    options={n.sub && !(STAGES as readonly string[]).includes(n.sub) ? [n.sub, ...STAGES] : STAGES}
                    value={n.sub ? [n.sub] : []}
                    onChange={(v) => patch(n.id, { sub: v[0] })}
                  />
                </Field>
              ) : null}
              <Input
                label="在找什么"
                required
                maxCount={30}
                value={n.title}
                onChange={(e) => patch(n.id, { title: e.target.value })}
                placeholder={hint.title}
                error={showErrors && !n.title.trim() ? "写清在找什么" : undefined}
              />
              <Textarea label="要找的对象" rows={2} maxCount={80} value={n.detail ?? ""} onChange={(e) => patch(n.id, { detail: e.target.value })} placeholder={hint.detail} />
              <Textarea
                label={group === "service" ? "愿意付多少" : "合作方式"}
                required
                rows={3}
                maxCount={160}
                value={n.terms ?? ""}
                onChange={(e) => patch(n.id, { terms: e.target.value })}
                placeholder={hint.terms}
                error={showErrors && !(n.terms ?? "").trim() ? (group === "service" ? "写清预算和怎么结算" : "写清分成、报价或这笔钱对应什么") : undefined}
              />
            </div>
          );
        })
      )}
      {mine.length < 5 ? (
        <div className="flex flex-wrap gap-2">
          {group === "service"
            ? SERVICE_ORDER.map((k) => (
                <Button key={k} size="sm" variant="secondary" iconLeft={Plus} onClick={() => addService(k)}>
                  {SERVICE_LABEL[k]}
                </Button>
              ))
            : COOP_ORDER.map((k) => (
                <Button key={k} size="sm" variant="secondary" iconLeft={Plus} onClick={() => addCoop(k)}>
                  {COOP_LABEL[k]}
                </Button>
              ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">最多 5 条，聚焦最重要的。</p>
      )}
    </div>
  );
}

function CompletionCard({ completion, slug }: { completion: ReturnType<typeof projectCompletion>; slug: string }) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={completion.percent} size={56}>
          <span className="text-sm font-semibold text-gray-900">{completion.percent}%</span>
        </ProgressRing>
        <div>
          <p className="text-sm font-semibold text-gray-900">资料完成度</p>
          <p className="text-xs text-gray-500">{completion.remaining ? `还差 ${completion.remaining} 项；80% 以上可申请上发现页和月度路演` : "全部完成，可以申请上发现页和月度路演"}</p>
        </div>
      </div>
      <ul className="flex flex-col gap-1">
        {completion.items.map((it) => {
          const t = ITEM_TARGET[it.key];
          const href = t?.href ? t.href(slug) : `#${t?.anchor ?? "basic"}`;
          return (
            <li key={it.key}>
              <Link href={href} className="flex items-start gap-2.5 rounded-md px-2 py-1.5 hover:bg-gray-50">
                <span className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full", it.done ? "bg-success-500 text-white" : "border border-gray-300")}>
                  {it.done ? <Check size={11} strokeWidth={3} /> : null}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm", it.done ? "text-gray-400 line-through" : "font-medium text-gray-800")}>{it.label}</span>
                  {it.done ? null : <span className="block text-xs text-gray-500">{it.hint}</span>}
                </span>
                {t?.href && !it.done ? <span className="ml-auto shrink-0 text-xs text-brand-700">工作台</span> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function PreviewCard({ project, bare }: { project: Project; bare?: boolean }) {
  const [mode, setMode] = useState<"card" | "header">("header");
  const body = (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {bare ? <p className="text-sm text-gray-500">访客看到的样子</p> : <p className="text-sm font-semibold text-gray-900">实时预览</p>}
        <Segmented<"card" | "header">
          size="sm"
          value={mode}
          onChange={setMode}
          items={[
            { value: "header", label: "公开页" },
            { value: "card", label: "发现页卡片" },
          ]}
        />
      </div>
      {mode === "card" ? (
        <div className="pointer-events-none">
          <ProjectCard project={project} hideFollow />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <Cover tone={project.coverTone} className="h-16" />
          <div className="px-4 pb-4">
            <ProjectLogo text={project.logoText || project.name.slice(0, 1)} tone={project.logoTone} size="xl" className="relative z-10 -mt-7 ring-4 ring-white" />
            <p className="mt-2 text-lg font-semibold text-gray-900">{project.name || "项目名称"}</p>
            <p className="text-sm text-gray-600">{project.oneLiner || "一句话介绍"}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.track ? <Tag>{project.track}</Tag> : null}
              {project.tags.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              {project.region ? <Tag>{project.region}</Tag> : null}
            </div>
            {project.lookingFor.length ? (
              <div className="mt-3">
                <LookingForChips needs={project.lookingFor.filter((n) => n.title.trim())} max={3} />
              </div>
            ) : null}
            <p className="mt-3 line-clamp-3 text-sm text-gray-500">{project.intro || "项目介绍还是空的"}</p>
          </div>
        </div>
      )}
      <p className="text-xs text-gray-400">{project.visibility === "public" ? "公开：任何人可访问" : "仅持链接可见：不会出现在发现页"}</p>
    </div>
  );
  return bare ? body : <Card>{body}</Card>;
}
