"use client";

import { ArrowLeft, ArrowRight, Briefcase, Check, Handshake, Rocket, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OpenStatusLine, roleTone } from "@/components/biz/person-card";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, EmptyState } from "@/components/ui/display";
import { ChipSelect, Input, RadioCards, Select, Textarea } from "@/components/ui/form";
import { PARTNER_SUBS, ROLE_DESC, ROLE_LABEL, STAGES, TRACKS } from "@/data/constants";
import type { Person, Role } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { firstSteps, useDB, useViewer } from "@/store/selectors";

const ROLE_ICON = { founder: Rocket, investor: TrendingUp, talent: Briefcase, partner: Handshake } as const;
const STEP_TITLES = ["你是谁", "基本信息", "开放状态", "第一步"];

export default function WelcomePage() {
  const viewer = useViewer();
  const db = useDB();
  const router = useRouter();
  const complete = useApp((s) => s.completeOnboarding);
  const updatePerson = useApp((s) => s.updatePerson);
  const updateOpenStatus = useApp((s) => s.updateOpenStatus);
  const openCreate = useApp((s) => s.openCreate);
  const requireLogin = useApp((s) => s.requireLogin);

  const [step, setStep] = useState(0);
  const [role, setRole] = useState<Role | null>(viewer?.role ?? null);
  const [name, setName] = useState(viewer?.name ?? "");
  const [title, setTitle] = useState(viewer?.title ?? "");
  const [org, setOrg] = useState(viewer?.org ?? "");
  const [city, setCity] = useState(viewer?.city || "深圳");
  const [headline, setHeadline] = useState("");
  const [tracks, setTracks] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [ticket, setTicket] = useState("100–300 万");
  const [openTo, setOpenTo] = useState<string[]>([]);
  const [roles, setRoles] = useState("");
  const [offerSubs, setOfferSubs] = useState<string[]>([]);
  const [offerDesc, setOfferDesc] = useState("");
  const [touched, setTouched] = useState(false);

  if (!viewer) {
    return (
      <Shell>
        <EmptyState
          icon={Sparkles}
          tone="brand"
          title="登录后开始"
          desc="Pitch 会根据你的身份，给出最合适的第一步。"
          action={<Button variant="primary" onClick={() => requireLogin("登录 Pitch")}>登录</Button>}
        />
      </Shell>
    );
  }

  const autoHeadline = (() => {
    if (headline.trim()) return headline.trim();
    if (role === "investor" && (tracks.length || stages.length)) return `在看 ${[stages.slice(0, 2).join("/"), tracks.slice(0, 2).join("、")].filter(Boolean).join(" · ")} 项目，单笔 ${ticket}`;
    if (role === "talent" && openTo.length) return `开放${openTo.join(" / ")}机会${roles ? `，擅长${roles}` : ""}`;
    if (role === "partner" && offerSubs.length) return `可提供${offerSubs.join("、")}资源${offerDesc ? `：${offerDesc}` : ""}`;
    return "";
  })();

  const preview: Person = {
    ...viewer,
    name: name || viewer.name,
    role,
    title,
    org,
    city,
    openStatus: { ...viewer.openStatus, active: !!autoHeadline, headline: autoHeadline },
  };

  const step1Error = touched && !title.trim() ? "填一个职位或身份描述，例如“创始人”“投资经理”" : undefined;

  const finish = () => {
    if (!role) return;
    if (name && name !== viewer.name) updatePerson({ name });
    complete({ role, title: title.trim(), org: org.trim(), city: city.trim(), headline: autoHeadline });
    if (role === "investor") updateOpenStatus({ investor: { tracks, stages, ticket, regions: [] } });
    if (role === "talent") updateOpenStatus({ talent: { openTo, roles: roles ? roles.split(/[,，、]/).map((s) => s.trim()).filter(Boolean) : [], availability: "随时" } });
    if (role === "partner" && offerSubs.length) updateOpenStatus({ offers: offerSubs.map((s, i) => ({ id: `of-${Date.now()}-${i}`, title: `${s}资源`, desc: offerDesc })) });
    setStep(3);
  };

  const steps = step === 3 ? firstSteps(db, viewer) : [];

  return (
    <Shell>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <Stepper step={step} />
          <div className="mt-8">
            {step === 0 ? (
              <section className="animate-fade-in">
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-[28px]">欢迎来到 Pitch，你主要想用它做什么？</h1>
                <p className="mt-2 text-gray-500">选一个最接近的。之后随时可以在主页修改，身份不需要认证。</p>
                <div className="mt-6">
                  <RadioCards<Role>
                    value={role}
                    onChange={setRole}
                    options={(Object.keys(ROLE_LABEL) as Role[]).map((r) => ({ value: r, title: `我是${ROLE_LABEL[r]}`, desc: ROLE_DESC[r], icon: ROLE_ICON[r] }))}
                  />
                </div>
                <div className="mt-8 flex justify-end">
                  <Button variant="primary" size="lg" iconRight={ArrowRight} disabled={!role} onClick={() => setStep(1)}>
                    下一步
                  </Button>
                </div>
              </section>
            ) : null}

            {step === 1 ? (
              <section className="animate-fade-in">
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-[28px]">简单介绍一下自己</h1>
                <p className="mt-2 text-gray-500">这些信息会出现在你的个人主页和意向卡片上。</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Input label="名字" required value={name} onChange={(e) => setName(e.target.value)} />
                  <Input label="城市" value={city} onChange={(e) => setCity(e.target.value)} />
                  <Input
                    label={role === "investor" ? "职位" : role === "founder" ? "在项目里的角色" : "职位 / 身份"}
                    required
                    placeholder={role === "investor" ? "投资经理" : role === "founder" ? "创始人 & CEO" : "增长负责人"}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    error={step1Error}
                  />
                  <Input label={role === "investor" ? "机构" : "公司 / 机构"} placeholder={role === "investor" ? "某某资本" : "可以不填"} value={org} onChange={(e) => setOrg(e.target.value)} />
                </div>
                <Nav
                  onBack={() => setStep(0)}
                  onNext={() => {
                    setTouched(true);
                    if (title.trim()) setStep(2);
                  }}
                />
              </section>
            ) : null}

            {step === 2 ? (
              <section className="animate-fade-in">
                <h1 className="text-2xl font-semibold text-gray-900 sm:text-[28px]">
                  {role === "founder" ? "一句话说说你在做什么" : role === "investor" ? "你在看什么样的项目？" : role === "talent" ? "你在寻找什么机会？" : "你能提供什么？"}
                </h1>
                <p className="mt-2 text-gray-500">这就是你的“开放状态”，会显示在主页最上方，每月提醒你刷新一次。可以跳过。</p>
                <div className="mt-6 flex flex-col gap-6">
                  {role === "investor" ? (
                    <>
                      <Block label="关注赛道（多选）">
                        <ChipSelect options={TRACKS} value={tracks} onChange={setTracks} multiple />
                      </Block>
                      <Block label="阶段（多选）">
                        <ChipSelect options={STAGES} value={stages} onChange={setStages} multiple />
                      </Block>
                      <Select label="单笔金额" value={ticket} onChange={(e) => setTicket(e.target.value)} options={["50 万以内", "50–100 万", "100–300 万", "300–1000 万", "1000 万以上"].map((v) => ({ value: v, label: v }))} wrapperClassName="max-w-xs" />
                    </>
                  ) : null}
                  {role === "talent" ? (
                    <>
                      <Block label="开放的机会（多选）">
                        <ChipSelect options={["合伙人", "全职", "兼职顾问"]} value={openTo} onChange={setOpenTo} multiple />
                      </Block>
                      <Input label="擅长的方向" placeholder="海外增长、DTC、内容营销" value={roles} onChange={(e) => setRoles(e.target.value)} hint="用逗号分隔" />
                    </>
                  ) : null}
                  {role === "partner" ? (
                    <>
                      <Block label="资源类型（多选）">
                        <ChipSelect options={PARTNER_SUBS} value={offerSubs} onChange={setOfferSubs} multiple />
                      </Block>
                      <Input label="具体说明" placeholder="东南亚 300+ 线下零售网点" value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)} maxCount={40} />
                    </>
                  ) : null}
                  <Textarea
                    label={role === "founder" ? "一句话" : "自定义一句话（可选）"}
                    placeholder={role === "founder" ? "在做出海宠物用品，正在找天使轮和东南亚渠道" : "不填会根据上面的选择自动生成"}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    maxCount={60}
                    rows={2}
                  />
                </div>
                <Nav onBack={() => setStep(1)} onNext={finish} nextLabel="完成" skip={!autoHeadline ? finish : undefined} />
              </section>
            ) : null}

            {step === 3 ? (
              <section className="animate-fade-in">
                <Badge tone="success" icon={Check} size="md">
                  主页已生成
                </Badge>
                <h1 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-[28px]">接下来，先做这 3 件事</h1>
                <p className="mt-2 text-gray-500">它们会一直留在首页顶部，做完自动打勾。</p>
                <ol className="mt-6 flex flex-col gap-3">
                  {steps.map((s, i) => (
                    <li key={s.key} className={cn("flex items-start gap-4 rounded-xl border border-gray-200 p-4 shadow-xs", s.done ? "bg-gray-25" : "bg-white")}>
                      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", s.done ? "bg-success-500 text-white" : "bg-gray-900 text-highlight")}>
                        {s.done ? <Check size={16} strokeWidth={3} /> : i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("font-semibold", s.done ? "text-gray-400 line-through" : "text-gray-900")}>{s.title}</p>
                        <p className="mt-0.5 text-sm text-gray-500">{s.done ? "刚刚在引导里完成了" : s.desc}</p>
                      </div>
                      {s.done ? null : s.action === "create" ? (
                        <Button
                          size="sm"
                          variant={i === 0 ? "primary" : "secondary"}
                          onClick={() => {
                            router.push("/");
                            openCreate();
                          }}
                        >
                          {s.cta}
                        </Button>
                      ) : s.href ? (
                        <Button size="sm" variant={i === 0 ? "primary" : "secondary"} href={s.href}>
                          {s.cta}
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Button variant="secondary" size="lg" href={`/u/${viewer.handle}`}>
                    看看我的主页
                  </Button>
                  <Button variant="primary" size="lg" iconRight={ArrowRight} href="/">
                    进入 Pitch
                  </Button>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <aside className="hidden lg:block">
          <p className="mb-3 text-xs font-semibold tracking-wide text-gray-400">主页预览</p>
          <div className="sticky top-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            <div className="h-20 bg-[linear-gradient(120deg,var(--color-gray-900),var(--color-brand-700))]" />
            <div className="px-5 pb-5">
              <Avatar name={preview.name} tone={preview.avatarTone} size="2xl" className="-mt-8 rounded-full ring-4 ring-white" />
              <div className="mt-3 flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{preview.name || "你的名字"}</p>
                {role ? <Badge tone={roleTone(preview)} size="xs">{ROLE_LABEL[role]}</Badge> : null}
              </div>
              <p className={cn("text-sm", title || org ? "text-gray-600" : "text-gray-400")}>{[title, org].filter(Boolean).join(" · ") || "职位 · 机构"}</p>
              <p className="text-xs text-gray-400">{city}</p>
              {autoHeadline ? (
                <div className="mt-4 rounded-lg border border-success-200 bg-success-50 p-3">
                  <p className="mb-1 text-[11px] font-semibold text-success-700">开放状态</p>
                  <OpenStatusLine person={preview} />
                </div>
              ) : (
                <div className="mt-4 rounded-lg border border-dashed border-gray-300 p-3 text-sm text-gray-400">开放状态会显示在这里</div>
              )}
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">主页地址：pitch.cn/@{viewer.handle}</p>
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex h-16 items-center justify-between border-b border-gray-100 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[15px] font-black text-highlight">P</span>
          <span className="text-lg font-bold text-gray-900">Pitch</span>
        </Link>
        <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-700">
          稍后再说
        </Link>
      </header>
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-8 sm:py-14">{children}</div>
    </div>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2">
      {STEP_TITLES.map((t, i) => (
        <li key={t} className="flex flex-1 flex-col gap-2">
          <span className={cn("h-1 rounded-full transition-colors", i <= step ? "bg-brand-600" : "bg-gray-200")} />
          <span className={cn("hidden text-xs font-semibold sm:block", i === step ? "text-brand-700" : i < step ? "text-gray-700" : "text-gray-400")}>{t}</span>
        </li>
      ))}
    </ol>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
    </div>
  );
}

function Nav({ onBack, onNext, nextLabel = "下一步", skip }: { onBack: () => void; onNext: () => void; nextLabel?: string; skip?: () => void }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <Button variant="tertiary" iconLeft={ArrowLeft} onClick={onBack}>
        上一步
      </Button>
      <div className="flex gap-3">
        {skip ? (
          <Button variant="secondary" size="lg" onClick={skip}>
            跳过
          </Button>
        ) : null}
        <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}
