"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GuestAvatar } from "@/components/biz/guest-avatar";
import { PortalCompare } from "@/components/biz/portal-compare";
import { Input } from "@/components/ui/form";
import {
  ABOUT_URL,
  BENEFITS,
  CAPABILITIES,
  FORMATS,
  GUEST_GROUPS,
  GUEST_PHOTOS,
  HIGHLIGHTS,
  MODULES,
  MORE_GUESTS,
  PILLARS,
  PROMISES,
  QUESTIONS,
  RHYTHM,
  ROADSHOWS,
  WHY,
  guestRoster,
} from "@/data/academy";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const ROSTER = guestRoster();
const CHAPTERS = [
  { href: "#about", label: "学院介绍", desc: "使命、愿景，和你正在问的问题" },
  { href: "#system", label: "课程理念", desc: "道、略、术，14 节系统课" },
  { href: "#delivery", label: "交付形式", desc: "诊断、学习、路演" },
  { href: "#founder", label: "发起校董", desc: "刘小鹰与老鹰基金" },
  { href: "#guests", label: "往期嘉宾", desc: "导师与创投嘉宾" },
  { href: "#benefits", label: "学员权益", desc: "面试入学，鹰雄会候选人" },
] as const;

const RECALL = ["圆桌辩论", "入企游学", "大咖讲干货", "路演大赛", "高峰对话", "投资人请回答", "被投企业参访", "投融资对接会", "合作洽谈会", "主题分享会", "高尔夫", "VIP 晚宴", "大师小饭局", "圆桌研讨会"];

const CHAPTER_PAGES = [
  { href: "#about", label: "学院介绍", line: "以「读懂资本，反向经营」为核心理念。", body: "构建「道 — 略 — 术」三层体系。一线投资人把用真金换来的经验拿来讲。学方法，实战练，链资本。" },
  { href: "#system", label: "课程理念", line: "不要最缺钱的时候才去找钱。", body: "要么放大现金流，要么找到有未来的价值增值路径。道、略、术，十四节系统课一次讲完。" },
  { href: "#delivery", label: "交付形式", line: "每一次集中授课，都包含一场真路演。", body: "4 大模块，每 1–2 个月一次。每次含 1 场路演。毕业模块是 2 天资本对接大会。" },
  { href: "#founder", label: "发起校董", line: "刘小鹰 · 1000 个创业梦想的天使。", body: "2011 年创办老鹰基金。管理规模超 30 亿元，直投近 300 个项目。长远电信创办人。" },
  { href: "#guests", label: "往期嘉宾", line: "向谁取经，名单都在这一页。", body: "一线投资人、企业家、青年创业者和领域专家。点开可以下翻到完整名单。" },
  { href: "#benefits", label: "学员权益", line: "严格筛选，面试入学。", body: "成为鹰雄会候选人。另有 1v1 校董咨询、路演现场辅导和永久校友圈。" },
] as const;

const SPREADS = [
  { kicker: "01  资本辅导", title: "诊断、学习、路演", body: "六个月系统课，把认知带到真实路演里。", href: "#system", cta: "进入课程" },
  { kicker: "02  资源对接", title: "项目、机构、嘉宾", body: "在平台上投递，或直接找正在开放的资源。", href: "/discover", cta: "发现项目" },
  { kicker: "03  发起校董", title: "刘小鹰", body: "1000 个创业梦想的天使。老鹰基金创始合伙人，直投近 300 个项目。", href: "#founder", cta: "看校董", photo: "刘小鹰" },
] as const;

function Spread() {
  const [index, setIndex] = useState(0);
  const page = SPREADS[index];
  const turn = (delta: number) => setIndex((current) => (current + delta + SPREADS.length) % SPREADS.length);
  return (
    <div className="relative min-h-[380px] lg:pl-6">
      <div className="absolute inset-y-6 right-4 left-10 rounded-[28px] bg-[#e7e1d6]" />
      <div className="absolute inset-y-3 right-2 left-5 rounded-[28px] bg-white/80 shadow-sm" />
      <article key={page.kicker} className="relative flex min-h-[380px] flex-col justify-between rounded-[28px] bg-white p-7 shadow-[0_18px_40px_rgba(16,24,40,0.08)] animate-portal-scene">
        <div>
          <p className="text-xs tracking-[0.2em] text-[#1f6b12]">{page.kicker}</p>
          {"photo" in page ? <img src={GUEST_PHOTOS[page.photo]} alt="" className="mt-5 h-28 w-24 rounded-2xl object-cover object-top" /> : null}
          <h2 className="mt-4 text-3xl font-semibold tracking-tight">{page.title}</h2>
          <p className="mt-3 text-sm leading-7 text-[#555]">{page.body}</p>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <a href={page.href} className="text-sm font-semibold underline decoration-[#8adf4a] decoration-2 underline-offset-4">{page.cta}</a>
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-[#999]">{index + 1} / {SPREADS.length}</span>
            <button type="button" onClick={() => turn(-1)} className="h-9 rounded-full border border-black/10 px-3 text-sm font-semibold">上一页</button>
            <button type="button" onClick={() => turn(1)} className="h-9 rounded-full bg-black px-3 text-sm font-semibold text-white">下一页</button>
          </div>
        </div>
      </article>
    </div>
  );
}

function QuoteDeck() {
  const [index, setIndex] = useState(0);
  const quote = QUESTIONS[index];
  return (
    <div className="mt-14">
      <p className="text-sm font-medium text-[#666]">如果你正在想这些问题，欢迎成为鹰雄会候选人。</p>
      <blockquote key={quote} className="mt-5 max-w-3xl text-3xl leading-snug font-semibold tracking-tight animate-portal-scene sm:text-4xl">{quote}</blockquote>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        {QUESTIONS.map((item, itemIndex) => (
          <button key={item} type="button" aria-label={`第 ${itemIndex + 1} 个问题`} aria-pressed={index === itemIndex} onClick={() => setIndex(itemIndex)} className={cn("h-2.5 rounded-full transition-all", index === itemIndex ? "w-8 bg-black" : "w-2.5 bg-black/20")} />
        ))}
        <button type="button" onClick={() => setIndex((current) => (current + 1) % QUESTIONS.length)} className="ml-2 text-sm font-semibold">下一问</button>
      </div>
    </div>
  );
}

function ChapterBrowser() {
  const [index, setIndex] = useState(0);
  const page = CHAPTER_PAGES[index];
  return (
    <section className="mx-auto grid max-w-[1200px] gap-6 px-5 py-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-stretch">
      <div className="flex flex-col gap-1" role="tablist" aria-label="章节">
        {CHAPTER_PAGES.map((item, itemIndex) => (
          <button key={item.href} type="button" role="tab" aria-selected={index === itemIndex} onClick={() => setIndex(itemIndex)} className={cn("rounded-2xl px-4 py-3 text-left transition", index === itemIndex ? "bg-white shadow-[0_8px_24px_rgba(16,24,40,0.06)]" : "hover:bg-white/70")}>
            <span className="text-xs text-[#999] tabular-nums">{String(itemIndex + 1).padStart(2, "0")}</span>
            <span className="mt-1 block text-lg font-semibold">{item.label}</span>
          </button>
        ))}
      </div>
      <div key={page.href} className="flex min-h-[360px] flex-col justify-between rounded-[28px] bg-white p-8 shadow-[0_16px_40px_rgba(16,24,40,0.06)] animate-portal-scene sm:p-10">
        {page.href === "#founder" ? <img src={GUEST_PHOTOS["刘小鹰"]} alt="" className="h-40 w-32 rounded-2xl object-cover object-top" /> : null}
        {page.href === "#guests" ? (
          <div className="flex gap-2">
            {["毛大庆", "李竹", "吴世春", "吴欣鸿"].map((name) => (
              <img key={name} src={GUEST_PHOTOS[name]} alt="" className="h-24 w-16 rounded-xl object-cover object-top" />
            ))}
          </div>
        ) : null}
        <div className={page.href === "#founder" || page.href === "#guests" ? "mt-6" : ""}>
          <p className="text-xs tracking-[0.22em] text-[#1f6b12]">{CHAPTERS[index]?.desc}</p>
          <h2 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight">{page.line}</h2>
          <p className="mt-4 max-w-xl text-base leading-8 text-[#555]">{page.body}</p>
        </div>
        <a href={page.href} className="mt-8 inline-flex text-sm font-semibold underline decoration-[#8adf4a] decoration-2 underline-offset-4">
          进入{page.label}
        </a>
      </div>
    </section>
  );
}

export default function PortalB() {
  return (
    <div className="bg-[#f4f1ea] pb-24 text-[#161616]">
      <PortalCompare current="b" />
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[#f4f1ea]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center gap-6 px-5">
          <Link href="/b" className="shrink-0" aria-label="培驰商学">
            <img src="/brand/logo-horizontal.png" alt="" className="h-9 w-auto" />
          </Link>
          <nav className="scrollbar-none hidden flex-1 items-center justify-end gap-5 overflow-x-auto lg:flex">
            {CHAPTERS.map((item) => (
              <a key={item.href} href={item.href} className="shrink-0 text-sm text-[#3d3d3d] hover:text-black">
                {item.label}
              </a>
            ))}
          </nav>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="ml-auto text-sm text-[#3d3d3d] hover:text-black lg:ml-2">
            公众号文章
          </a>
          <Link href="/discover" className="text-sm text-[#3d3d3d] hover:text-black">
            发现
          </Link>
          <Link href="/me" className="text-sm font-semibold">
            我的
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-16">
        <div>
          <p className="text-xs font-medium tracking-[0.28em] text-[#6b6b6b]">PITCH VENTURE ACADEMY</p>
          <h1 className="mt-4 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
            资本商学
            <br />
            读懂资本，反向经营
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-[#3f3f3f]">专业的资本辅导与资源对接平台。不仅要赚钱，更要企业值钱。</p>
          <blockquote className="mt-6 max-w-xl border-l-2 border-[#8adf4a] pl-4 text-[15px] leading-7 text-[#555]">
            我们相信，资本真正的价值不只是帮助企业融资，更是帮助企业构建长期竞争力，让价值被资本看见，让成长穿越周期。
          </blockquote>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SubmitProjectButton />
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-5 text-base font-semibold shadow-sm hover:border-black">
              BP 诊断
            </a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center px-2 text-base font-semibold underline decoration-[#8adf4a] decoration-2 underline-offset-4">
              公众号文章
            </a>
          </div>
        </div>
        <Spread />
      </section>

      <div className="border-y border-black/10 bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap justify-center gap-x-8 gap-y-3 px-5 py-5 text-sm tracking-[0.18em] text-[#555]">
          {CAPABILITIES.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>

      <ChapterBrowser />

      <section id="about" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:py-20">
          <Eyebrow>01 · 学院介绍</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl leading-tight font-semibold tracking-tight">以「读懂资本，反向经营」为核心理念。</h2>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[#444]">培驰商学是专业的资本辅导与资源对接平台。构建「道 — 略 — 术」三层体系，用诊断、学习、路演把课串起来。一线投资人亲授用真金换来的经验。学方法 · 实战练 · 链资本。</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ["使命", "放大被低估的价值"],
              ["愿景", "陪伴企业穿越周期、持续生长"],
              ["价值观", "专业、实战、求真、长期主义"],
            ].map(([label, text]) => (
              <div key={label} className="rounded-2xl bg-[#f4f1ea] p-6">
                <p className="text-xs tracking-[0.2em] text-[#888]">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.unit} className="rounded-2xl bg-[#f4f1ea] p-5">
                <p className="text-4xl font-semibold tabular-nums">{item.value}</p>
                <p className="mt-1 font-medium">{item.unit}</p>
                <p className="text-sm text-[#666]">{item.hint}</p>
              </div>
            ))}
          </div>
          <QuoteDeck />
        </div>
      </section>

      <section id="system" className="scroll-mt-24">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:py-20">
          <Eyebrow>02 · 课程理念</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">系统化学习资本。不要最缺钱的时候才去找钱。</h2>
          <p className="mt-4 max-w-3xl leading-8 text-[#444]">要么快速放大现金流，要么找到有未来的价值增值路径。科学评估看的是钱、资源和背书。资本尊重长期价值。</p>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PILLARS.map((pillar) => (
              <article key={pillar.key} className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                <p className="text-5xl font-semibold">{pillar.key}</p>
                <p className="mt-1 text-sm text-[#777]">{pillar.title}</p>
                <ul className="mt-4 flex flex-col gap-2 text-sm leading-6 text-[#444]">
                  {pillar.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PROMISES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
                <p className="text-lg font-semibold">「{item.title}」</p>
                <p className="mt-2 text-sm leading-6 text-[#555]">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {WHY.map((item) => (
              <article key={item.n} className="rounded-3xl bg-[#161616] p-6 text-white shadow-[0_12px_32px_rgba(0,0,0,0.12)]">
                <p className="text-sm text-[#8adf4a]">{item.n}</p>
                <p className="mt-2 text-xl font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/70">{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-14 flex flex-col gap-4">
            {MODULES.map((mod) => (
              <article key={mod.index} className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                <p className="text-xs tracking-[0.16em] text-[#888]">
                  {mod.index} · {mod.layer}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">{mod.title}</h3>
                <p className="mt-2 text-sm text-[#666]">{mod.summary}</p>
                <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.n} className="text-sm leading-6">
                      <span className="mr-2 text-[#999] tabular-nums">{lesson.n}</span>
                      {lesson.title}
                      <span className="ml-2 text-xs text-[#999]">{lesson.hours}</span>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="delivery" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:py-20">
          <Eyebrow>03 · 交付形式</Eyebrow>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">以「诊断 — 学习 — 路演」为主线。</h2>
          <p className="mt-4 max-w-3xl leading-8 text-[#444]">4 大模块，每 1–2 个月集中一次。每次含 1 场路演。毕业模块是 2 天资本对接大会。</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RHYTHM.map((item, index) => (
              <div key={item.title} className="rounded-2xl bg-[#f4f1ea] p-5">
                <p className="text-sm text-[#999] tabular-nums">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-2 text-lg font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#555]">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {ROADSHOWS.map((item) => (
              <article key={item.title} className="rounded-3xl border border-black/5 bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#444]">{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {FORMATS.map((item) => (
              <article key={item.title} className="rounded-2xl bg-[#f4f1ea] p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#444]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="founder" className="scroll-mt-24 bg-[#161616] text-white">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 lg:grid-cols-[280px_minmax(0,1fr)] lg:py-20">
          <div>
            <img src="/guests/liu-xiaoying.jpg" alt="刘小鹰" className="aspect-[4/5] w-full rounded-3xl object-cover object-top shadow-[0_16px_40px_rgba(0,0,0,0.28)]" />
          </div>
          <div>
            <Eyebrow light>04 · 发起校董</Eyebrow>
            <h2 className="mt-3 text-4xl font-semibold">刘小鹰</h2>
            <p className="mt-2 text-white/60">1000 个创业梦想的天使 · 老鹰基金创始合伙人</p>
            <p className="mt-5 max-w-2xl leading-8 text-white/80">2011 年创办老鹰基金。港股上市公司董事局主席，天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。引进磁卡电话和诺基亚手机进入中国市场的人。长远电信（0110.HK）创办人。</p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <p className="text-sm leading-7 text-white/70">家族母基金出资 10 多家早期机构，覆盖 1000+ 创业项目。2016 年列入「中国最佳天使投资基金」前三。</p>
              <p className="text-sm leading-7 text-white/70">北京、上海、杭州、武汉、成都、香港、洛杉矶、波士顿设有分部。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="guests" className="scroll-mt-24">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:py-20">
          <Eyebrow>05 · 往期嘉宾</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold">向谁取经</h2>
          <p className="mt-3 max-w-2xl text-[#555]">一线投资人、企业家、青年创业者、领域专家，以及鹰雄讲堂创投嘉宾。排名不分先后。</p>
          {GUEST_GROUPS.map((group) => (
            <div key={group.id} className="mt-12">
              <h3 className="text-2xl font-semibold">{group.label}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#666]">{group.intro}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.people.map((person) => (
                  <article key={person.name} className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_28px_rgba(16,24,40,0.08)]">
                    {GUEST_PHOTOS[person.name] ? <img src={GUEST_PHOTOS[person.name]} alt="" className="aspect-[4/3] w-full object-cover object-top" /> : null}
                    <div className="p-4">
                      <p className="text-lg font-semibold">{person.name}</p>
                      <p className="mt-1 text-sm text-[#777]">{person.title}</p>
                      <p className="mt-2 text-sm leading-6 text-[#444]">{person.bio}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-12">
            <h3 className="text-2xl font-semibold">更多创投嘉宾</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MORE_GUESTS.map((person) => (
                <article key={person.name} className="flex gap-3 rounded-2xl bg-white p-3 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
                  <GuestAvatar name={person.name} className="h-20 w-16 rounded-xl" />
                  <div>
                    <p className="font-semibold">{person.name}</p>
                    <p className="text-sm text-[#666]">{person.title}</p>
                    <p className="mt-1 text-sm text-[#444]">{person.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <Roster />
        </div>
      </section>

      <section id="benefits" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16 lg:py-20">
          <Eyebrow>06 · 学员权益</Eyebrow>
          <h2 className="mt-3 text-4xl font-semibold">成为新一代候选人，成为鹰雄会候选人。</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {BENEFITS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-[0_8px_24px_rgba(16,24,40,0.05)]">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <span className="text-sm text-[#1f6b12]">{item.meta}</span>
                </div>
                <p className="mt-2 text-sm leading-7 text-[#444]">{item.desc}</p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-lg font-semibold">入学资格：严格筛选，面试入学。</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16">
        <Eyebrow>精彩回顾</Eyebrow>
        <div className="mt-6 flex flex-wrap gap-2">
          {RECALL.map((item) => (
            <span key={item} className="rounded-full bg-white px-3 py-2 text-sm shadow-sm">
              {item}
            </span>
          ))}
        </div>
      </section>

      <footer className="border-t border-black/10 bg-[#161616] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-10 sm:flex-row sm:items-end sm:justify-between">
          <img src="/brand/logo-dark.png" alt="培驰" className="h-24 w-auto" />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/70">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              公众号文章
            </a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="hover:text-white">
              BP 诊断
            </a>
            <Link href="/discover" className="hover:text-white">
              发现
            </Link>
            <Link href="/me" className="hover:text-white">
              我的
            </Link>
            <Link href="/" className="hover:text-white">
              版本 A
            </Link>
          </div>
        </div>
        <p className="border-t border-white/10 px-5 py-4 text-xs text-white/40">具体活动形式以实际执行为准。嘉宾排名不分先后。本期课程最终解释权归培驰商学所有。</p>
      </footer>
    </div>
  );
}

function Eyebrow({ children, light }: { children: string; light?: boolean }) {
  return <p className={cn("text-xs tracking-[0.22em]", light ? "text-[#8adf4a]" : "text-[#888]")}>{children}</p>;
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
    document.getElementById("roster-b")?.scrollIntoView({ block: "start" });
  };
  return (
    <div id="roster-b" className="mt-14 scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">到场名单</h3>
          <p className="mt-1 text-sm text-[#666]">共 {ROSTER.length} 位，每次看 12 位。</p>
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
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {slice.map((person) => (
            <li key={person.name + person.title} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-[0_6px_16px_rgba(16,24,40,0.05)]">
              <GuestAvatar name={person.name} className="h-10 w-10 rounded-xl" />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{person.name}</span>
                <span className="block truncate text-xs text-[#777]">{person.title}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-6 text-sm text-[#666]">没有匹配的人。</p>
      )}
      {list.length > pageSize ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#777] tabular-nums">
            {current * pageSize + 1}–{Math.min(list.length, (current + 1) * pageSize)} / {list.length}
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={current === 0} onClick={() => go(current - 1)} className="h-9 px-3 text-sm font-semibold disabled:text-[#ccc]">
              上一页
            </button>
            <button type="button" disabled={current >= pages - 1} onClick={() => go(current + 1)} className="h-9 rounded-full bg-black px-4 text-sm font-semibold text-white shadow-sm disabled:bg-[#ddd] disabled:text-[#888] disabled:shadow-none">
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
      className="inline-flex h-12 items-center rounded-full bg-[#8adf4a] px-5 text-base font-semibold text-black shadow-[0_8px_20px_rgba(138,223,74,0.35)] hover:brightness-95"
    >
      项目投递
    </button>
  );
}
