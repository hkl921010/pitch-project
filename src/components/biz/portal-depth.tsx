"use client";

import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { GuestAvatar } from "@/components/biz/guest-avatar";
import { Input } from "@/components/ui/form";
import {
  ABOUT_URL,
  ABOUT_US,
  BENEFITS,
  CAPABILITIES,
  FORMATS,
  GUEST_GROUPS,
  MORE_GUESTS,
  MODULES,
  PILLARS,
  PROMISES,
  QUESTIONS,
  RHYTHM,
  ROADSHOWS,
  WHY,
  guestRoster,
} from "@/data/academy";
import { cn } from "@/lib/cn";

const ROSTER = guestRoster();
const RECALL = ["圆桌辩论", "入企游学", "大咖讲干货", "路演大赛", "高峰对话", "投资人请回答", "被投企业参访", "投融资对接会", "合作洽谈会", "主题分享会", "高尔夫", "VIP 晚宴", "大师小饭局", "圆桌研讨会"];
const VALUES = [
  ["使命", "放大被低估的价值"],
  ["愿景", "陪伴企业穿越周期、持续生长"],
  ["价值观", "专业、实战、求真、长期主义"],
];
const FOUNDER = [
  ["投资人", "2011 年创办老鹰基金。天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。"],
  ["企业家", "长远电信（0110.HK）创办人。引进磁卡电话与诺基亚手机进入中国。"],
  ["老鹰基金", "覆盖 1000+ 创业项目。2016 年「中国最佳天使投资基金」前三。"],
  ["所在", "北京、上海、杭州、武汉、成都、香港、洛杉矶、波士顿。"],
];

type Tone = "jasper" | "supabase" | "deel";

export function PortalDepth({ tone }: { tone: Tone }) {
  if (tone === "supabase") return <SupabaseBody />;
  if (tone === "deel") return <DeelBody />;
  return <JasperBody />;
}

function useRoster() {
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
  return { query, setQuery, setPage, list, pageSize, pages, current, slice: list.slice(current * pageSize, current * pageSize + pageSize) };
}

function JasperBody() {
  const roster = useRoster();
  return (
    <div>
      <p className="flex flex-wrap justify-center gap-x-8 gap-y-2 px-5 py-6 text-sm tracking-[0.14em] text-[#8a8a98]">{CAPABILITIES.map((item) => <span key={item}>{item}</span>)}</p>

      <section id="about" className="scroll-mt-24 mx-auto max-w-[1120px] px-5 py-20 text-center">
        <p className="text-sm font-semibold text-[#6d5efc]">学院介绍</p>
        <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">让价值被资本看见，让成长穿越周期。</h2>
        <p className="mx-auto mt-5 max-w-2xl leading-8 text-[#5c5c6b]">培驰商学是专业的资本辅导与资源对接平台。以「读懂资本，反向经营」为核心理念，用诊断、学习、路演把「道 — 略 — 术」串起来。</p>
        <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
          {VALUES.map(([label, text]) => (
            <div key={label} className="rounded-3xl bg-[#f6f5fb] p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#6d5efc]">{label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {QUESTIONS.map((question) => (
            <span key={question} className="rounded-full border border-[#6d5efc]/15 bg-white px-4 py-2 text-sm text-[#3c3c48]">{question}</span>
          ))}
        </div>
      </section>

      <section id="founder" className="scroll-mt-24 bg-[#f6f5fb]">
        <div className="mx-auto grid max-w-[1120px] items-center gap-10 px-5 py-20 lg:grid-cols-[300px_1fr]">
          <img src="/guests/liu-xiaoying.jpg" alt="刘小鹰" className="aspect-[4/5] w-full rounded-[28px] object-cover object-top shadow-[0_24px_60px_rgba(109,94,252,0.18)]" />
          <div>
            <p className="text-sm font-semibold text-[#6d5efc]">发起校董</p>
            <h2 className="mt-3 text-5xl font-semibold tracking-tight">刘小鹰</h2>
            <p className="mt-5 text-2xl leading-snug font-medium">“1000 个创业梦想的天使。”</p>
            <p className="mt-4 max-w-xl leading-8 text-[#5c5c6b]">2011 年创办老鹰基金。港股上市公司董事局主席，天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。长远电信（0110.HK）创办人。</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {FOUNDER.map(([title, text]) => (
                <div key={title} className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-[#6d5efc]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-[#3c3c48]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="system" className="scroll-mt-24 mx-auto max-w-[1120px] px-5 py-20 text-center">
        <p className="text-sm font-semibold text-[#6d5efc]">课程理念</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">不是碎片技巧，<br />是一套资本思维。</h2>
        <p className="mx-auto mt-4 max-w-2xl leading-8 text-[#5c5c6b]">不要最缺钱的时候去找钱，要在最好的时候去学习和拥抱。</p>
        <div className="mt-10 grid gap-4 text-left lg:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <article key={pillar.key} className={cn("rounded-[28px] p-7", index === 1 ? "bg-[#12121a] text-white shadow-[0_24px_50px_rgba(18,18,26,0.16)]" : "border border-[#6d5efc]/10 bg-white")}>
              <p className={cn("text-xs font-semibold", index === 1 ? "text-[#ee5a9b]" : "text-[#6d5efc]")}>{pillar.title}</p>
              <p className="mt-3 bg-gradient-to-r from-[#6d5efc] to-[#ee5a9b] bg-clip-text text-6xl font-semibold text-transparent">{pillar.key}</p>
              <ul className="mt-6 flex flex-col gap-3 text-sm leading-6">
                {pillar.lines.map((line) => <li key={line} className={index === 1 ? "text-white/80" : "text-[#3c3c48]"}>{line}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-4 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <div key={item.title} className="rounded-3xl bg-[#f6f5fb] p-5">
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#5c5c6b]">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3 text-left md:grid-cols-2">
          {WHY.map((item) => (
            <article key={item.n} className="rounded-3xl border border-black/5 p-6">
              <p className="bg-gradient-to-r from-[#6d5efc] to-[#ee5a9b] bg-clip-text text-sm font-semibold text-transparent">{item.n}</p>
              <p className="mt-2 text-xl font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#5c5c6b]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-16 text-left">
          <h3 className="text-center text-3xl font-semibold tracking-tight">14 节系统课</h3>
          <div className="mt-8 flex flex-col gap-5">
            {MODULES.map((mod) => (
              <article key={mod.index} className="overflow-hidden rounded-[28px] border border-[#6d5efc]/10 bg-white">
                <div className="bg-gradient-to-r from-[#6d5efc] to-[#ee5a9b] px-6 py-5 text-white">
                  <p className="text-xs font-semibold tracking-[0.14em] text-white/80">{mod.index} · {mod.layer}</p>
                  <p className="mt-1 text-2xl font-semibold">{mod.title}</p>
                  <p className="mt-2 text-sm text-white/80">{mod.summary}</p>
                </div>
                <ol>
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.n} className="grid gap-3 border-t border-[#6d5efc]/10 px-6 py-4 sm:grid-cols-[72px_1fr]">
                      <span className="inline-flex h-8 w-12 items-center justify-center rounded-full bg-[#f3efff] text-sm font-semibold text-[#6d5efc]">{lesson.n}</span>
                      <div>
                        <p className="font-semibold">{lesson.title}<span className="ml-2 text-xs font-medium text-[#8a8a98]">{lesson.hours}</span></p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lesson.points.map((point) => <span key={point} className="rounded-full bg-[#f6f5fb] px-3 py-1 text-xs leading-5 text-[#3c3c48]">{point}</span>)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="delivery" className="scroll-mt-24 bg-[#f6f5fb]">
        <div className="mx-auto max-w-[1120px] px-5 py-20">
          <p className="text-center text-sm font-semibold text-[#6d5efc]">交付形式</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-center text-4xl font-semibold tracking-tight">每一次集中授课，都包含一场真路演。</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RHYTHM.map((item, index) => (
              <article key={item.title} className="rounded-3xl bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-[#6d5efc]">{String(index + 1).padStart(2, "0")}</p>
                <p className="mt-3 text-xl font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#5c5c6b]">{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {ROADSHOWS.map((item) => (
              <article key={item.title} className="rounded-3xl bg-[#12121a] p-7 text-white">
                <p className="text-xl font-semibold">{item.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/75">{item.desc}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FORMATS.map((item) => (
              <article key={item.title} className="rounded-3xl bg-white p-6">
                <p className="font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#5c5c6b]">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="scroll-mt-24 mx-auto max-w-[1120px] px-5 py-20 text-center">
        <p className="text-sm font-semibold text-[#6d5efc]">学员权益</p>
        <h2 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight">成为鹰雄会候选人。</h2>
        <div className="mt-10 grid gap-4 text-left md:grid-cols-2">
          {BENEFITS.map((item) => (
            <article key={item.title} className="rounded-3xl border border-[#6d5efc]/10 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="text-sm font-semibold text-[#6d5efc]">{item.meta}</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#5c5c6b]">{item.desc}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-lg font-semibold">入学资格：严格筛选，面试入学。</p>
      </section>

      <JasperGuests roster={roster} />
      <AboutBlock tone="jasper" />
    </div>
  );
}

function JasperGuests({ roster }: { roster: ReturnType<typeof useRoster> }) {
  return (
    <section id="guests" className="scroll-mt-24 bg-[#faf9fd]">
      <div className="mx-auto max-w-[1120px] px-5 py-20">
        <p className="text-center text-sm font-semibold text-[#6d5efc]">往期嘉宾</p>
        <h2 className="mt-3 text-center text-4xl font-semibold tracking-tight">向谁取经</h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-7 text-[#5c5c6b]">一线投资人、企业家、青年创业者和领域专家。排名不分先后。</p>
        {GUEST_GROUPS.map((group) => (
          <div key={group.id} className="mt-12">
            <h3 className="text-2xl font-semibold">{group.label}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#5c5c6b]">{group.intro}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.people.map((person) => (
                <article key={person.name} className="overflow-hidden rounded-[28px] bg-white shadow-[0_16px_40px_rgba(109,94,252,0.08)]">
                  <GuestAvatar name={person.name} className="aspect-[4/3] h-auto w-full" />
                  <div className="p-5">
                    <p className="text-lg font-semibold">{person.name}</p>
                    <p className="mt-1 text-sm text-[#6d5efc]">{person.title}</p>
                    {person.bio ? <p className="mt-3 text-sm leading-6 text-[#5c5c6b]">{person.bio}</p> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
        <div className="mt-12">
          <h3 className="text-2xl font-semibold">更多创投嘉宾</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MORE_GUESTS.map((person) => (
              <article key={person.name} className="flex gap-3 rounded-3xl bg-white p-4">
                <GuestAvatar name={person.name} className="h-16 w-14 rounded-2xl" />
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-sm text-[#6d5efc]">{person.title}</p>
                  {person.bio ? <p className="mt-1 text-sm leading-6 text-[#5c5c6b]">{person.bio}</p> : null}
                </div>
              </article>
            ))}
          </div>
        </div>
        <RosterView roster={roster} tone="jasper" />
      </div>
    </section>
  );
}

function SupabaseBody() {
  const roster = useRoster();
  return (
    <div className="text-[#ededed]">
      <div className="border-y border-white/10 bg-[#171717]">
        <p className="mx-auto flex max-w-[1200px] flex-wrap gap-x-6 gap-y-2 px-5 py-4 font-mono text-xs text-[#898989]">
          {CAPABILITIES.map((item) => <span key={item}>{item}</span>)}
        </p>
      </div>
      <Doc id="about" kicker="01  学院" title="让价值被资本看见，让成长穿越周期。">
        <p className="max-w-3xl leading-8 text-[#b4b4b4]">培驰商学是专业的资本辅导与资源对接平台。以「读懂资本，反向经营」为核心理念，用诊断、学习、路演把「道 — 略 — 术」串起来。学方法，实战练，链资本。</p>
        <div className="mt-6 overflow-hidden rounded-lg border border-white/10">
          {VALUES.map(([label, text]) => (
            <div key={label} className="grid border-t border-white/10 first:border-t-0 sm:grid-cols-[140px_1fr]">
              <p className="bg-[#171717] px-4 py-3 font-mono text-xs text-[#3ecf8e]">{label}</p>
              <p className="px-4 py-3 text-sm">{text}</p>
            </div>
          ))}
        </div>
        <ol className="mt-6 flex flex-col">
          {QUESTIONS.map((question, index) => (
            <li key={question} className="grid grid-cols-[40px_1fr] gap-3 border-t border-white/10 py-3 text-sm">
              <span className="font-mono text-[#3ecf8e]">{String(index + 1).padStart(2, "0")}</span>
              {question}
            </li>
          ))}
        </ol>
      </Doc>
      <Doc id="founder" kicker="02  校董" title="刘小鹰">
        <p className="max-w-3xl leading-8 text-[#b4b4b4]">2011 年创办老鹰基金。港股上市公司董事局主席，天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。引进磁卡电话和诺基亚手机进入中国。长远电信（0110.HK）创办人。</p>
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
          <img src="/guests/liu-xiaoying.jpg" alt="刘小鹰" className="aspect-[4/5] w-full rounded-md object-cover object-top" />
          <div className="overflow-hidden rounded-lg border border-white/10">
            {FOUNDER.map(([title, text]) => (
              <div key={title} className="grid border-t border-white/10 first:border-t-0 sm:grid-cols-[120px_1fr]">
                <p className="px-4 py-3 font-mono text-xs text-[#3ecf8e]">{title}</p>
                <p className="px-4 py-3 text-sm leading-6 text-[#b4b4b4]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Doc>
      <Doc id="system" kicker="03  课程" title="道、略、术。14 节系统课。">
        <div className="grid gap-3 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
            <article key={pillar.key} className="rounded-lg border border-white/10 bg-[#1f1f1f] p-5">
              <p className="font-mono text-3xl text-[#3ecf8e]">{pillar.key}</p>
              <p className="mt-1 text-xs text-[#898989]">{pillar.title}</p>
              <ul className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-3 text-sm leading-6">
                {pillar.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <article key={item.title} className="rounded-lg border border-white/10 p-4">
              <p className="text-sm">{item.title}</p>
              <p className="mt-2 text-xs leading-5 text-[#b4b4b4]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {WHY.map((item) => (
            <article key={item.n} className="rounded-lg border border-white/10 p-5">
              <p className="font-mono text-xs text-[#3ecf8e]">{item.n}  {item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#b4b4b4]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {MODULES.map((mod) => (
            <article key={mod.index} className="overflow-hidden rounded-lg border border-white/10">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 bg-[#171717] px-4 py-3">
                <p className="font-mono text-xs text-[#3ecf8e]">{mod.index} / {mod.layer}</p>
                <p className="text-sm">{mod.title}</p>
              </header>
              <p className="px-4 py-3 text-sm leading-7 text-[#b4b4b4]">{mod.summary}</p>
              <ol>
                {mod.lessons.map((lesson) => (
                  <li key={lesson.n} className="grid gap-2 border-t border-white/10 px-4 py-3 sm:grid-cols-[52px_1fr_48px]">
                    <span className="font-mono text-xs text-[#3ecf8e]">{lesson.n}</span>
                    <div>
                      <p className="text-sm">{lesson.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[#898989]">{lesson.points.join(" · ")}</p>
                    </div>
                    <span className="font-mono text-xs text-[#898989]">{lesson.hours}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </Doc>
      <Doc id="delivery" kicker="04  交付" title="每次集中授课，都有一场真路演。">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RHYTHM.map((item, index) => (
            <article key={item.title} className="rounded-lg border border-white/10 p-4">
              <p className="font-mono text-xs text-[#3ecf8e]">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#b4b4b4]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {[...ROADSHOWS, ...FORMATS].map((item) => (
            <article key={item.title} className="rounded-lg border border-white/10 bg-[#171717] p-4">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-2 text-sm leading-7 text-[#b4b4b4]">{item.desc}</p>
            </article>
          ))}
        </div>
      </Doc>
      <Doc id="benefits" kicker="05  权益" title="成为鹰雄会候选人。">
        <div className="overflow-hidden rounded-lg border border-white/10">
          {BENEFITS.map((item) => (
            <div key={item.title} className="grid gap-2 border-t border-white/10 px-4 py-4 first:border-t-0 lg:grid-cols-[180px_140px_1fr]">
              <p className="text-sm">{item.title}</p>
              <p className="font-mono text-xs text-[#3ecf8e]">{item.meta}</p>
              <p className="text-sm leading-6 text-[#b4b4b4]">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-[#b4b4b4]">入学资格：严格筛选，面试入学。另有 1v1 校董咨询、路演现场辅导、30+ 机构辅导。</p>
      </Doc>
      <Doc id="guests" kicker="06  嘉宾" title="向谁取经">
        {GUEST_GROUPS.map((group) => (
          <div key={group.id} className="mt-8 first:mt-0">
            <p className="font-mono text-xs text-[#3ecf8e]">{group.label}</p>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-[#b4b4b4]">{group.intro}</p>
            <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
              {group.people.map((person) => (
                <div key={person.name} className="grid gap-3 border-t border-white/10 p-3 first:border-t-0 sm:grid-cols-[72px_1fr]">
                  <GuestAvatar name={person.name} className="h-16 w-full rounded-md sm:h-16" />
                  <div>
                    <p className="text-sm">{person.name}<span className="ml-2 text-xs text-[#898989]">{person.title}</span></p>
                    {person.bio ? <p className="mt-1 text-sm leading-6 text-[#b4b4b4]">{person.bio}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        <p className="mt-8 font-mono text-xs text-[#3ecf8e]">更多创投嘉宾</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-white/10">
          {MORE_GUESTS.map((person) => (
            <div key={person.name} className="grid gap-3 border-t border-white/10 px-3 py-2.5 first:border-t-0 sm:grid-cols-[160px_220px_1fr] sm:items-center">
              <p className="text-sm">{person.name}</p>
              <p className="text-xs text-[#898989]">{person.title}</p>
              <p className="text-xs leading-5 text-[#b4b4b4]">{person.bio}</p>
            </div>
          ))}
        </div>
        <RosterView roster={roster} tone="supabase" />
      </Doc>
      <AboutBlock tone="supabase" />
    </div>
  );
}

function Doc({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-white/10">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-14 lg:grid-cols-[180px_1fr]">
        <p className="font-mono text-xs text-[#3ecf8e]">{kicker}</p>
        <div>
          <h2 className="max-w-3xl text-3xl font-medium tracking-tight sm:text-4xl">{title}</h2>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

function DeelBody() {
  const roster = useRoster();
  const pastels = ["#efe7ff", "#e5f8ea", "#fff3cc", "#e5f0ff", "#ffe8df", "#f3f0ea"];
  return (
    <div>
      <section id="about" className="scroll-mt-24 mx-auto max-w-[1180px] px-5 py-20">
        <p className="text-sm text-[#666]">学院</p>
        <h2 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">让价值被资本看见，让成长穿越周期。</h2>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#444]">培驰商学是专业的资本辅导与资源对接平台。诊断、学习、路演，把「道 — 略 — 术」串成六个月。</p>
        <div className="mt-8 flex flex-wrap gap-2">
          {CAPABILITIES.map((item, index) => (
            <span key={item} className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: pastels[index % pastels.length] }}>{item}</span>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {VALUES.map(([label, text], index) => (
            <div key={label} className="rounded-[28px] p-6" style={{ background: pastels[index] }}>
              <p className="text-sm text-[#555]">{label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">{text}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {QUESTIONS.map((question) => (
            <p key={question} className="rounded-full bg-white px-5 py-3 text-[15px]">{question}</p>
          ))}
        </div>
      </section>

      <section id="founder" className="scroll-mt-24 mx-auto grid max-w-[1180px] items-center gap-8 px-5 py-8 lg:grid-cols-[300px_1fr]">
        <img src="/guests/liu-xiaoying.jpg" alt="刘小鹰" className="aspect-[4/5] w-full rounded-[32px] object-cover object-top" />
        <div className="rounded-[32px] bg-white p-8 sm:p-10">
          <p className="text-sm text-[#888]">发起校董</p>
          <h2 className="mt-2 text-5xl font-semibold tracking-tight">刘小鹰</h2>
          <p className="mt-5 text-2xl font-semibold leading-snug">1000 个创业梦想的天使。</p>
          <p className="mt-4 leading-8 text-[#444]">2011 年创办老鹰基金。港股上市公司董事局主席，天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。长远电信（0110.HK）创办人。</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {FOUNDER.map(([title, text]) => (
              <div key={title}>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[#555]">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="system" className="scroll-mt-24 mx-auto max-w-[1180px] px-5 py-16">
        <p className="text-sm text-[#666]">课程理念</p>
        <h2 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">道、略、术，放在一起学。</h2>
        <div className="mt-8 grid gap-3 lg:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <article key={pillar.key} className="rounded-[28px] p-7" style={{ background: pastels[index] }}>
              <p className="text-6xl font-semibold">{pillar.key}</p>
              <p className="mt-1 text-[#555]">{pillar.title}</p>
              <ul className="mt-5 flex flex-col gap-2 text-sm leading-6">
                {pillar.lines.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map((item) => (
            <article key={item.title} className="rounded-[24px] bg-white p-5">
              <p className="text-lg font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#555]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {WHY.map((item) => (
            <article key={item.n} className="rounded-[28px] bg-white p-6">
              <p className="text-sm text-[#888]">{item.n}</p>
              <p className="mt-2 text-2xl font-semibold">{item.title}</p>
              <p className="mt-2 leading-7 text-[#444]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-8">
          <h3 className="text-4xl font-semibold tracking-tight">14 节系统课</h3>
          {MODULES.map((mod, index) => (
            <article key={mod.index} className="overflow-hidden rounded-[28px] bg-white">
              <div className="px-6 py-5" style={{ background: pastels[index % pastels.length] }}>
                <p className="text-sm text-[#555]">{mod.index} · {mod.layer}</p>
                <p className="mt-1 text-2xl font-semibold">{mod.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#444]">{mod.summary}</p>
              </div>
              <ol className="px-6">
                {mod.lessons.map((lesson) => (
                  <li key={lesson.n} className="grid gap-3 border-t border-black/5 py-5 sm:grid-cols-[64px_1fr]">
                    <p className="text-3xl font-semibold tracking-tight">{lesson.n}</p>
                    <div>
                      <p className="text-lg font-semibold">{lesson.title}<span className="ml-2 text-sm font-medium text-[#888]">{lesson.hours}</span></p>
                      <p className="mt-2 text-sm leading-6 text-[#555]">{lesson.points.join(" · ")}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      <section id="delivery" className="scroll-mt-24 mx-auto max-w-[1180px] px-5 py-8">
        <p className="text-sm text-[#666]">交付形式</p>
        <h2 className="mt-3 max-w-3xl text-5xl font-semibold tracking-tight">每次集中授课，都有一场真路演。</h2>
        <div className="relative mt-10 grid gap-3 lg:grid-cols-4">
          {RHYTHM.map((item, index) => (
            <article key={item.title} className="rounded-[24px] bg-white p-6">
              <p className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-sm font-semibold text-white">{index + 1}</p>
              <p className="mt-4 text-xl font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#555]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {ROADSHOWS.map((item) => (
            <article key={item.title} className="rounded-[28px] bg-black p-7 text-white">
              <p className="text-2xl font-semibold">{item.title}</p>
              <p className="mt-3 leading-7 text-white/75">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {FORMATS.map((item, index) => (
            <article key={item.title} className="rounded-[24px] p-6" style={{ background: pastels[(index + 2) % pastels.length] }}>
              <p className="text-xl font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-7">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="benefits" className="scroll-mt-24 mx-auto max-w-[1180px] px-5 py-16">
        <h2 className="max-w-3xl text-5xl font-semibold tracking-tight">成为鹰雄会候选人。</h2>
        <div className="mt-8 flex flex-col gap-3">
          {BENEFITS.map((item, index) => (
            <article key={item.title} className="grid gap-3 rounded-[24px] bg-white px-6 py-5 md:grid-cols-[200px_140px_1fr] md:items-center">
              <p className="text-xl font-semibold">{item.title}</p>
              <p className="text-sm font-semibold" style={{ color: index % 2 ? "#6b4eff" : "#111" }}>{item.meta}</p>
              <p className="text-sm leading-7 text-[#444]">{item.desc}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-2xl font-semibold">入学资格：严格筛选，面试入学。</p>
      </section>

      <section id="guests" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1180px] px-5 py-16">
          <p className="text-sm text-[#666]">往期嘉宾</p>
          <h2 className="mt-3 text-5xl font-semibold tracking-tight">向谁取经</h2>
          {GUEST_GROUPS.map((group) => (
            <div key={group.id} className="mt-12">
              <h3 className="text-3xl font-semibold">{group.label}</h3>
              <p className="mt-2 max-w-3xl leading-7 text-[#555]">{group.intro}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.people.map((person) => (
                  <article key={person.name} className="overflow-hidden rounded-[28px] bg-[#f6f5f1]">
                    <GuestAvatar name={person.name} className="aspect-[4/3] h-auto w-full" />
                    <div className="p-5">
                      <p className="text-xl font-semibold">{person.name}</p>
                      <p className="mt-1 text-sm text-[#666]">{person.title}</p>
                      {person.bio ? <p className="mt-3 text-sm leading-6">{person.bio}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <h3 className="mt-12 text-3xl font-semibold">更多创投嘉宾</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {MORE_GUESTS.map((person) => (
              <article key={person.name} className="flex gap-4 rounded-[24px] bg-[#f6f5f1] p-4">
                <GuestAvatar name={person.name} className="h-20 w-16 rounded-2xl" />
                <div>
                  <p className="text-lg font-semibold">{person.name}</p>
                  <p className="text-sm text-[#666]">{person.title}</p>
                  {person.bio ? <p className="mt-1 text-sm leading-6">{person.bio}</p> : null}
                </div>
              </article>
            ))}
          </div>
          <RosterView roster={roster} tone="deel" />
        </div>
      </section>
      <AboutBlock tone="deel" />
    </div>
  );
}

function AboutBlock({ tone }: { tone: Tone }) {
  const dark = tone === "supabase";
  return (
    <section id="about-us" className={cn("scroll-mt-24", dark && "border-t border-white/10 text-[#ededed]")}>
      <div className={cn("mx-auto px-5 py-16", tone === "supabase" ? "max-w-[1200px]" : tone === "deel" ? "max-w-[1180px]" : "max-w-[1120px]")}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={dark ? "font-mono text-xs text-[#3ecf8e]" : tone === "deel" ? "text-sm text-[#666]" : "text-sm font-semibold text-[#6d5efc]"}>关于我们</p>
            <h2 className={cn("mt-3 max-w-3xl font-semibold tracking-tight", tone === "deel" ? "text-5xl" : "text-4xl", dark && "font-medium")}>陪企业穿越周期的资本伙伴。</h2>
          </div>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer" className={cn("inline-flex h-12 items-center px-5 text-sm font-semibold", dark ? "rounded-md bg-[#3ecf8e] text-[#171717]" : tone === "deel" ? "rounded-full bg-black text-white" : "rounded-full bg-gradient-to-r from-[#6d5efc] to-[#ee5a9b] text-white")}>打开公众号文章</a>
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          {ABOUT_US.map((item) => (
            <article key={item.title} className={cn(dark ? "rounded-lg border border-white/10 p-5" : tone === "deel" ? "rounded-[24px] bg-white p-6" : "rounded-3xl bg-[#f6f5fb] p-6")}>
              <p className="text-xl font-semibold">{item.title}</p>
              <p className={cn("mt-3 text-sm leading-7", dark ? "text-[#b4b4b4]" : "text-[#555]")}>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-2">
          {RECALL.map((item) => (
            <span key={item} className={cn("px-3 py-2 text-sm", dark ? "rounded-md border border-white/10" : tone === "deel" ? "rounded-full bg-white" : "rounded-full bg-[#f6f5fb]")}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RosterView({ roster, tone }: { roster: ReturnType<typeof useRoster>; tone: Tone }) {
  const { query, setQuery, setPage, list, pageSize, pages, current, slice } = roster;
  const dark = tone === "supabase";
  return (
    <div id="roster" className="mt-12 scroll-mt-28">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className={cn("font-semibold", tone === "deel" ? "text-3xl" : "text-2xl")}>完整名单</h3>
          <p className={cn("mt-1 text-sm", dark ? "text-[#898989]" : "text-[#777]")}>共 {ROSTER.length} 位，每次 12 位。排名不分先后。</p>
        </div>
        <Input icon={Search} inputSize="sm" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="搜索姓名或机构" wrapperClassName="w-full sm:w-64" />
      </div>
      <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((person) => (
          <li key={person.name + person.title} className={cn("flex items-center gap-3 px-3 py-3", dark ? "rounded-md border border-white/10" : tone === "deel" ? "rounded-2xl bg-[#f6f5f1]" : "rounded-2xl bg-white")}>
            <GuestAvatar name={person.name} className={cn("h-11 w-11", dark ? "rounded-md" : "rounded-xl")} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{person.name}</span>
              <span className={cn("block truncate text-xs", dark ? "text-[#898989]" : "text-[#777]")}>{person.title}</span>
            </span>
          </li>
        ))}
      </ul>
      {list.length > pageSize ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className={cn("tabular-nums", dark ? "font-mono text-[#898989]" : "text-[#777]")}>{current * pageSize + 1}–{Math.min(list.length, (current + 1) * pageSize)} / {list.length}</span>
          <div className="flex gap-2">
            <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="h-9 px-3 font-semibold disabled:opacity-40">上一页</button>
            <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className={cn("h-9 px-4 font-semibold disabled:opacity-40", dark ? "rounded-md bg-[#3ecf8e] text-[#171717]" : "rounded-full bg-black text-white")}>下一页</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
