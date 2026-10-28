"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { GuestAvatar } from "@/components/biz/guest-avatar";
import { GuestReel, HeroStage, JourneyScroll } from "@/components/biz/portal-stage";
import { PortalCompare } from "@/components/biz/portal-compare";
import { Input } from "@/components/ui/form";
import {
  ABOUT_URL,
  ABOUT_US,
  BENEFITS,
  BRAND_LOGOS,
  CAPABILITIES,
  FORMATS,
  GUEST_GROUPS,
  GUEST_PHOTOS,
  HIGHLIGHTS,
  MODULES,
  MORE_GUESTS,
  PILLARS,
  PORTAL_SECTIONS,
  PROMISES,
  QUESTIONS,
  ROADSHOWS,
  WHY,
  guestRoster,
  type AcademyPerson,
} from "@/data/academy";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const ROSTER = guestRoster();
const SECTION_IDS = PORTAL_SECTIONS.map((item) => item.id);
const LABS_URL = "https://labs.dev.pitchxyz.com";
const DOT = "bg-[#8adf4a]";
const DOT_TEXT = "text-[#1f6b12]";

export default function HomePage() {
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const timer = window.setTimeout(() => document.getElementById(id)?.scrollIntoView(), 60);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white pb-16 text-gray-950">
      <PortalCompare current="a" />
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-6 px-5 sm:px-10">
          <a href="#top" className="shrink-0" aria-label="培驰商学">
            <img src="/brand/logo-horizontal.png" alt="" className="h-9 w-auto sm:h-10" />
          </a>
          <nav className="scrollbar-none ml-auto hidden items-center gap-7 overflow-x-auto lg:flex" aria-label="门户栏目">
            {PORTAL_SECTIONS.map((item) => (
              <a key={item.id} href={`#${item.id}`} className={cn("text-sm font-medium", active === item.id ? "text-gray-950" : "text-gray-500 hover:text-gray-950")}>
                {item.label}
              </a>
            ))}
          </nav>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-sm font-medium text-gray-600 hover:text-gray-950 lg:ml-10">
            公众号文章
          </a>
          <Link href="/discover" className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-950">
            发现
          </Link>
          <Link href="/me" className="shrink-0 text-sm font-semibold">
            我的
          </Link>
        </div>
        <nav className="scrollbar-none flex gap-6 overflow-x-auto border-t border-black/5 px-5 py-3 lg:hidden" aria-label="门户栏目">
          {PORTAL_SECTIONS.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={cn("shrink-0 text-sm font-medium", active === item.id ? "text-gray-950" : "text-gray-500")}>
              {item.label}
            </a>
          ))}
          <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-gray-950">
            公众号文章
          </a>
        </nav>
      </header>

      <section id="top" className="bg-[#f7f6f3]">
        <div className="mx-auto grid max-w-[1440px] items-end gap-10 px-5 pt-16 sm:px-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:pt-24">
          <div>
            <p className="flex items-center gap-3 text-sm font-medium tracking-[0.22em] text-gray-500">
              <span className={cn("h-2.5 w-2.5 rounded-full", DOT)} />
              资本商学
            </p>
            <h1 className="mt-5 text-5xl leading-[1.02] font-semibold tracking-tight sm:text-7xl lg:text-[92px]">
              读懂资本
              <br />
              反向经营
            </h1>
          </div>
          <div className="lg:pb-3">
            <p className="text-lg leading-8 text-gray-600">专业的资本辅导与资源对接平台。不仅要赚钱，更要企业值钱。</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <SubmitProjectButton />
              <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center rounded-full border border-black/10 bg-white px-6 text-base font-semibold shadow-sm hover:border-black sm:h-16 sm:px-8">
                BP 诊断
              </a>
              <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-14 items-center px-2 text-base font-semibold text-gray-950 underline decoration-[#8adf4a] decoration-2 underline-offset-4 hover:decoration-[#1f6b12] sm:h-16">
                公众号文章
              </a>
            </div>
          </div>
        </div>
        <HeroStage />
        <div className="mx-auto mt-14 grid max-w-[1440px] grid-cols-2 gap-3 px-5 pb-10 sm:px-10 lg:grid-cols-4">
          {HIGHLIGHTS.slice(0, 4).map((item) => (
            <div key={item.unit} className="rounded-2xl bg-white px-5 py-8 shadow-[0_8px_24px_rgba(16,24,40,0.06)] sm:px-8">
              <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-sm text-gray-700">{item.unit}</p>
              <p className="mt-1 text-xs text-gray-400">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="overflow-hidden border-b border-black/10 bg-white">
        <p className="flex flex-wrap justify-center gap-x-8 gap-y-3 px-5 py-6 text-sm tracking-[0.22em] text-gray-500 sm:px-10">
          {CAPABILITIES.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </p>
      </div>

      <Band id="about" index="01" title="学院介绍" statement={<>让价值被资本看见，<br />让成长穿越周期。</>}>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-20">
          <div className="max-w-xl text-lg leading-9 text-gray-700">
            <p>培驰商学是专业的资本辅导与资源对接平台。取「培育」与「飞驰」之意，以「读懂资本，反向经营」为核心理念，用诊断、学习、路演把「道 — 略 — 术」串起来。</p>
            <p className="mt-6">一线投资人把用真金换来的经验拿来讲，帮创始人建立完整的资本认知。学方法，实战练，链资本。</p>
          </div>
          <div className="flex flex-col justify-end gap-8">
            {[
              ["使命", "放大被低估的价值"],
              ["愿景", "陪伴企业穿越周期、持续生长"],
              ["价值观", "专业、实战、求真、长期主义"],
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl bg-[#f7f6f3] px-5 py-5">
                <p className="text-xs tracking-[0.28em] text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-x-16 gap-y-8 sm:grid-cols-2">
          {QUESTIONS.map((question, index) => (
            <p key={question} className="flex gap-4 rounded-2xl bg-[#f7f6f3] px-5 py-5 text-lg leading-8">
              <span className="text-sm text-gray-400 tabular-nums">{String(index + 1).padStart(2, "0")}</span>
              {question}
            </p>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-500">欢迎加入培驰商学，成为鹰雄会候选人。</p>
      </Band>

      <section className="bg-[#070707] text-white">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
          <div>
            <p className="flex items-center gap-3 text-xs tracking-[0.32em] text-white/50">
              <span className={cn("h-2 w-2 rounded-full", DOT)} />
              发起校董
            </p>
            <img src={GUEST_PHOTOS["刘小鹰"]} alt="" className="mt-8 h-64 w-48 rounded-2xl object-cover object-top shadow-[0_16px_40px_rgba(0,0,0,0.35)]" />
            <h3 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">刘小鹰</h3>
            <p className="mt-6 max-w-sm text-base leading-8 text-white/65">1000 个创业梦想的天使。老鹰基金创始合伙人，中国长远控股创办人兼董事局主席。</p>
          </div>
          <div className="grid gap-10 sm:grid-cols-2">
            <Fact light title="投资人" items={["2011 年创办老鹰基金", "天使联合汇主席", "管理规模超 30 亿元，直投近 300 个项目", "常年位列中国最佳天使投资人前十"]} />
            <Fact light title="企业家" items={["长远电信（0110.HK）创办人兼董事局主席", "引进磁卡电话与诺基亚手机进入中国", "2003 年《中国科技百强企业》第六", "同年入榜胡润财富 500 强"]} />
            <Fact light title="老鹰基金" items={["产业型天使基金，覆盖 1000+ 创业项目", "移动互联网、新消费、医疗、人工智能、硬科技", "2016 年「中国最佳天使投资基金」前三"]} />
            <Fact light title="所在" items={["北京、上海、杭州、武汉", "成都、香港", "洛杉矶、波士顿"]} />
          </div>
        </div>
      </section>

      <Band id="philosophy" index="02" title="课程理念" statement={<>不是碎片化的技巧，<br />是一套资本思维。</>}>
        <p className="max-w-3xl text-lg leading-9 text-gray-600">要么快速放大现金流，要么找到一条有未来的价值增值路径。资本不是临时工具。不要最缺钱的时候去找钱，要在最好的时候去学习和拥抱。</p>
        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <div key={pillar.key} className="rounded-3xl bg-[#f7f6f3] p-8 shadow-[0_8px_24px_rgba(16,24,40,0.05)] sm:p-10">
              <p className="text-6xl font-semibold tracking-tight sm:text-7xl">{pillar.key}</p>
              <p className="mt-2 text-sm tracking-[0.28em] text-gray-400">{pillar.title}</p>
              <ul className="mt-8 flex flex-col gap-3">
                {pillar.lines.map((line) => (
                  <li key={line} className="text-[15px] leading-7 text-gray-600">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <div key={item.title} className="rounded-2xl bg-[#f7f6f3] p-5">
              <p className="text-2xl font-semibold">{item.title}</p>
              <p className="mt-3 text-sm leading-7 text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-12 lg:grid-cols-2">
          {WHY.map((item) => (
            <div key={item.n} className="rounded-2xl border border-black/5 bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
              <p className={cn("text-sm font-semibold tabular-nums", DOT_TEXT)}>{item.n}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{item.title}</p>
              <p className="mt-3 text-[15px] leading-7 text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <p className="text-sm tracking-[0.28em] text-gray-400">2026 · 14 节系统课</p>
          <p className="mt-3 max-w-2xl text-gray-600">道 3、略 3、术 8。每节 3 小时。导师包括一线投资人、经济学家、资本市场律师、投行、财务专家和独角兽创始人。</p>
          <div className="mt-10 flex flex-col gap-4">
            {MODULES.map((mod) => (
              <article key={mod.index} className="grid gap-4 rounded-3xl bg-[#f7f6f3] p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)] lg:grid-cols-[160px_minmax(0,1fr)] lg:p-8">
                <p className="text-sm tracking-[0.18em] text-gray-400">{mod.layer}</p>
                <div>
                  <h3 className="text-2xl font-semibold tracking-tight">{mod.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-500">{mod.summary}</p>
                  <ol className="mt-6 flex flex-col">
                    {mod.lessons.map((lesson) => (
                      <li key={lesson.n} className="grid gap-2 border-t border-black/5 py-4 sm:grid-cols-[52px_minmax(0,1fr)]">
                        <span className="text-sm text-gray-400 tabular-nums">{lesson.n}</span>
                        <div>
                          <p className="font-medium">{lesson.title}</p>
                          <p className="mt-1 text-sm leading-6 text-gray-500">{lesson.points.join(" · ")}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Band>

      <JourneyScroll />

      <Band id="delivery" index="03" title="交付形式" statement="每一次集中授课，都包含一场真路演。" tone="mist">
        <div className="grid gap-4 lg:grid-cols-2">
          {ROADSHOWS.map((item) => (
            <div key={item.title} className="rounded-3xl bg-[#070707] p-8 text-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] sm:p-12">
              <p className="text-2xl font-semibold">{item.title}</p>
              <p className="mt-4 max-w-md text-[15px] leading-8 text-white/70">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 grid gap-12 sm:grid-cols-2">
          {FORMATS.map((item) => (
            <div key={item.title} className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
              <p className="text-xl font-semibold">{item.title}</p>
              <p className="mt-3 text-[15px] leading-7 text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20">
          <p className="text-sm tracking-[0.28em] text-gray-400">学员拿到什么</p>
          <div className="mt-8 flex flex-col gap-3">
            {BENEFITS.map((item) => (
              <div key={item.title} className="grid gap-3 rounded-2xl bg-white px-5 py-5 shadow-[0_8px_24px_rgba(16,24,40,0.05)] sm:grid-cols-[180px_120px_minmax(0,1fr)] sm:items-baseline">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className={cn("text-sm font-medium", DOT_TEXT)}>{item.meta}</p>
                <p className="text-sm leading-7 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">另有 1v1 校董咨询 5 次、路演现场辅导、30+ 机构辅导，校友圈永久保留。</p>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-black/10 pt-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs tracking-[0.28em] text-gray-400">入学</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">严格筛选，面试入学。</p>
          </div>
          <p className="max-w-sm text-sm leading-7 text-gray-500">成为鹰雄会候选人。还有 10+ 企业参访，96+ 核心课时。</p>
        </div>
      </Band>

      <Band id="guests" index="04" title="往期嘉宾" statement="向谁取经，名单都在这里。">
        <Guests />
      </Band>

      <section className="bg-[#f6f6f4]" aria-label="培驰标志">
        <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-10 lg:py-28">
          <p className="text-xs tracking-[0.32em] text-gray-400">标志</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">培育 · 陪伴 · 飞驰</h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BRAND_LOGOS.map((logo) => (
              <figure key={logo.src} className={cn("flex h-56 items-center justify-center rounded-2xl p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)] sm:h-64", logo.dark ? "bg-black sm:col-span-2 lg:col-span-1" : "bg-white")}>
                <img src={logo.src} alt={logo.alt} className="max-h-full max-w-full object-contain" />
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section id="about-us" className="scroll-mt-36 bg-[#070707] text-white">
        <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-10 lg:py-32">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.32em] text-white/45">05 · 关于我们</p>
              <h2 className="mt-6 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-6xl">陪企业穿越周期的资本伙伴。</h2>
            </div>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className={cn("inline-flex h-12 shrink-0 items-center rounded-full px-6 text-sm font-semibold text-black shadow-[0_8px_20px_rgba(138,223,74,0.35)]", DOT)}>
              打开公众号文章
            </a>
          </div>
          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            {ABOUT_US.map((item) => (
              <div key={item.title} className="rounded-2xl bg-white/5 p-5">
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="mt-3 text-[15px] leading-8 text-white/65">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-black text-white">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-14 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <img src="/brand/logo-dark.png" alt="培驰" className="h-28 w-auto" />
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
            {PORTAL_SECTIONS.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="hover:text-white">
                {item.label}
              </a>
            ))}
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              BP 诊断
            </a>
            <Link href="/discover" className="hover:text-white">
              发现
            </Link>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              公众号文章
            </a>
            <Link href="/me" className="hover:text-white">
              我的
            </Link>
          </div>
        </div>
        <p className="border-t border-white/10 px-5 py-6 text-xs leading-5 text-white/35 sm:px-10">具体活动形式以实际执行为准。嘉宾排名不分先后。本期课程最终解释权归培驰商学所有。</p>
      </footer>
    </div>
  );
}

function Band({ id, index, title, statement, children, tone = "white" }: { id: string; index: string; title: string; statement: ReactNode; children: ReactNode; tone?: "white" | "mist" }) {
  return (
    <section id={id} className={cn("scroll-mt-36", tone === "mist" ? "bg-[#f6f6f4]" : "bg-white")}>
      <div className="mx-auto max-w-[1200px] px-5 py-24 sm:px-10 lg:py-32">
        <p className="text-xs tracking-[0.32em] text-gray-400">
          {index} · {title}
        </p>
        <h2 className="mt-6 max-w-4xl text-4xl leading-[1.15] font-semibold tracking-tight sm:text-5xl lg:text-6xl">{statement}</h2>
        <div className="mt-16">{children}</div>
      </div>
    </section>
  );
}

function Fact({ title, items, light }: { title: string; items: string[]; light?: boolean }) {
  return (
    <div className={cn("rounded-2xl p-5", light ? "bg-white/5" : "bg-[#f7f6f3]")}>
      <p className={cn("text-xs tracking-[0.28em]", light ? "text-white/40" : "text-gray-400")}>{title}</p>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item} className={cn("text-sm leading-7", light ? "text-white/75" : "text-gray-600")}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const GUEST_FILTERS = [
  { value: "all", label: "全部" },
  ...GUEST_GROUPS.map((group) => ({ value: group.id, label: group.label })),
  { value: "more", label: "更多嘉宾" },
];

function Guests() {
  const [filter, setFilter] = useState("all");
  const groups = GUEST_GROUPS.filter((group) => filter === "all" || filter === group.id);
  const showMore = filter === "all" || filter === "more";

  return (
    <div>
      <GuestReel />
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        {GUEST_FILTERS.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={cn("text-sm font-medium", filter === item.value ? "text-gray-950 underline decoration-[#8adf4a] decoration-2 underline-offset-8" : "text-gray-400 hover:text-gray-700")}>
            {item.label}
          </button>
        ))}
      </div>

      {groups.map((group) => (
        <div key={group.id} className="mt-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="text-2xl font-semibold">{group.label}</h3>
            <p className="max-w-xl text-sm leading-7 text-gray-500">{group.intro}</p>
          </div>
          <div className="mt-8 grid gap-x-12 sm:grid-cols-2">
            {group.people.map((person) => (
              <PersonLine key={person.name} person={person} />
            ))}
          </div>
        </div>
      ))}

      {showMore ? (
        <div className="mt-14">
          <h3 className="text-2xl font-semibold">更多创投嘉宾</h3>
          <div className="mt-8 grid gap-x-12 sm:grid-cols-2 lg:grid-cols-3">
            {MORE_GUESTS.map((person) => (
              <PersonLine key={person.name} person={person} compact />
            ))}
          </div>
        </div>
      ) : null}

      <Roster />
    </div>
  );
}

function Portrait({ name, className }: { name: string; className: string }) {
  return <GuestAvatar name={name} className={className} />;
}

function PersonLine({ person, compact }: { person: AcademyPerson; compact?: boolean }) {
  return (
    <article className="flex gap-4 border-t border-black/10 py-5">
      <Portrait name={person.name} className={compact ? "h-16 w-14 rounded-xl" : "h-24 w-20 rounded-2xl"} />
      <div className="min-w-0">
        <p className={cn("font-semibold", compact ? "text-base" : "text-xl")}>{person.name}</p>
        <p className="mt-1 text-sm text-gray-500">{person.title}</p>
        {person.bio && !compact ? <p className="mt-3 text-sm leading-7 text-gray-600">{person.bio}</p> : null}
      </div>
    </article>
  );
}

function Roster() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROSTER;
    return ROSTER.filter((person) => `${person.name} ${person.title} ${person.bio}`.toLowerCase().includes(q));
  }, [query]);
  const pageSize = 12;
  const pages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(page, pages - 1);
  const slice = list.slice(current * pageSize, current * pageSize + pageSize);
  const go = (next: number) => {
    setPage(next);
    document.getElementById("roster")?.scrollIntoView({ block: "start" });
  };

  return (
    <div id="roster" className="mt-20 scroll-mt-28">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">完整名单</h3>
          <p className="mt-2 text-sm text-gray-500">共 {ROSTER.length} 位，每次看 12 位。排名不分先后。</p>
        </div>
        <Input
          icon={Search}
          inputSize="sm"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(0);
          }}
          placeholder="搜索姓名或机构"
          wrapperClassName="w-full sm:w-64"
        />
      </div>
      {slice.length ? (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((person) => (
            <li key={person.name + person.title} className="flex items-center gap-3 rounded-2xl bg-[#f7f6f3] px-3 py-3">
              <Portrait name={person.name} className="h-12 w-12 rounded-xl" />
              <div className="min-w-0">
                <p className="font-medium">{person.name}</p>
                <p className="truncate text-sm text-gray-500">{person.title}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-gray-500">没有匹配的人。</p>
      )}
      {list.length > pageSize ? (
        <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4">
          <p className="text-sm text-gray-500 tabular-nums">
            {current * pageSize + 1}–{Math.min(list.length, (current + 1) * pageSize)} / {list.length}
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={current === 0} onClick={() => go(current - 1)} className="h-9 px-3 text-sm font-semibold text-gray-700 disabled:text-gray-300">
              上一页
            </button>
            <button type="button" disabled={current >= pages - 1} onClick={() => go(current + 1)} className="h-9 rounded-full bg-black px-4 text-sm font-semibold text-white shadow-sm disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none">
              下一页
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SubmitProjectButton() {
  const viewer = useViewer();
  const openCreate = useApp((s) => s.openCreate);
  const requireLogin = useApp((s) => s.requireLogin);
  const waiting = useRef(false);

  useEffect(() => {
    if (!viewer || !waiting.current) return;
    waiting.current = false;
    if (viewer.id === "u-newbie") return;
    openCreate();
  }, [viewer, openCreate]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!viewer) {
          waiting.current = true;
          requireLogin("登录后即可投递项目");
          return;
        }
        openCreate();
      }}
      className="inline-flex h-14 items-center rounded-full bg-[#8adf4a] px-8 text-lg font-semibold text-black shadow-[0_10px_24px_rgba(138,223,74,0.35)] hover:brightness-95 sm:h-16 sm:px-10 sm:text-xl"
    >
      项目投递
    </button>
  );
}

function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const nodes = ids.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.2] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
