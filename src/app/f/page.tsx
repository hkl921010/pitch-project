"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { GuestAvatar } from "@/components/biz/guest-avatar";
import { PortalCompare } from "@/components/biz/portal-compare";
import { Input } from "@/components/ui/form";
import { ABOUT_URL, ABOUT_US, BENEFITS, GUEST_GROUPS, GUEST_PHOTOS, HIGHLIGHTS, MODULES, MORE_GUESTS, RHYTHM, guestRoster } from "@/data/academy";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const ROSTER = guestRoster();
const SHOWCASE = [
  { name: "毛大庆", title: "优客工场创始人" },
  { name: "李竹", title: "英诺天使创世合伙人" },
  { name: "吴世春", title: "梅花创投创始合伙人" },
  { name: "吴欣鸿", title: "美图创始人兼 CEO" },
  { name: "蔡光渊", title: "怪兽充电创始人" },
  { name: "杨守彬", title: "丰厚资本创始合伙人" },
  { name: "周奇", title: "金沙江联合资本管理合伙人" },
  { name: "任鹏", title: "橡果资本管理合伙人" },
] as const;

function TrackRail() {
  const [step, setStep] = useState(0);
  const item = RHYTHM[step];
  return (
    <section className="mx-auto max-w-[1200px] px-5 py-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">六个月的节奏</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {RHYTHM.map((beat, index) => (
          <button key={beat.title} type="button" onClick={() => setStep(index)} aria-pressed={step === index} className={step === index ? "rounded-2xl bg-black px-4 py-4 text-left text-white" : "rounded-2xl border border-black/10 px-4 py-4 text-left"}>
            <span className="text-xs tabular-nums opacity-60">0{index + 1}</span>
            <span className="mt-1 block font-semibold">{beat.title}</span>
          </button>
        ))}
      </div>
      <p key={item.title} className="mt-4 max-w-2xl text-lg leading-8 animate-portal-scene">{item.desc}</p>
    </section>
  );
}

export default function PlatformShowcase() {
  const [picked, setPicked] = useState(0);
  return (
    <div className="min-h-screen bg-white pb-20 text-[#111]">
      <PortalCompare current="f" />
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <a href="#top" aria-label="培驰商学">
            <img src="/brand/logo-horizontal.png" alt="" className="h-8 w-auto" />
          </a>
          <nav className="scrollbar-none ml-auto hidden items-center gap-6 text-sm text-[#444] lg:flex">
            <a href="#coach" className="hover:text-black">辅导</a>
            <a href="#network" className="hover:text-black">对接</a>
            <a href="#program" className="hover:text-black">课程</a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-black">公众号文章</a>
            <Link href="/discover" className="hover:text-black">发现</Link>
            <Link href="/me" className="hover:text-black">我的</Link>
          </nav>
          <SubmitProjectButton className="ml-auto inline-flex h-10 items-center rounded-full bg-black px-4 text-sm font-semibold text-white lg:ml-0" />
        </div>
      </header>

      <section id="top" className="mx-auto max-w-[1200px] px-5 pt-14 pb-6 lg:pt-20">
        <p className="text-sm font-medium text-[#666]">资本辅导 · 资源对接</p>
        <h1 className="mt-4 max-w-4xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
          读懂资本，
          <br />
          反向经营。
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[#444]">培驰商学是专业的资本辅导与资源对接平台。<br />不仅要赚钱，更要企业值钱。</p>
        <div id="coach" className="mt-10 grid gap-3 md:grid-cols-2">
          <a href="#program" className="rounded-3xl border border-black/10 p-6 transition hover:border-black hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:p-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">平台 · 辅导</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">诊断、学习、路演</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-[#555]">六个月系统课。投资人把方法讲透，再带到真实路演里改。</p>
            <p className="mt-6 text-sm font-semibold">进入课程</p>
          </a>
          <div id="network" className="rounded-3xl bg-[#111] p-6 text-white sm:p-8">
            <p className="text-xs font-semibold tracking-[0.16em] text-white/50">平台 · 对接</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">项目、机构、嘉宾</p>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/70">在平台上投递，或直接找正在开放的资源。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/discover" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-black">发现项目</Link>
              <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full border border-white/25 px-4 text-sm font-semibold">BP 诊断</a>
              <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full px-2 text-sm font-semibold text-white/80">公众号文章</a>
            </div>
          </div>
        </div>
      </section>

      <TrackRail />

      <section className="mx-auto max-w-[1200px] px-5 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">展示</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">平台上的人</h2>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setPicked((current) => (current + SHOWCASE.length - 1) % SHOWCASE.length)} className="text-sm font-semibold">上一位</button>
            <button type="button" onClick={() => setPicked((current) => (current + 1) % SHOWCASE.length)} className="text-sm font-semibold">下一位</button>
            <a href="#guests" className="text-sm font-semibold">全部嘉宾</a>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SHOWCASE.map((person, index) => {
            const on = picked === index;
            return (
              <button key={person.name} type="button" onClick={() => setPicked(index)} aria-pressed={on} className={on ? "text-left sm:col-span-2 sm:row-span-2" : "text-left"}>
                <img src={GUEST_PHOTOS[person.name]} alt="" className={on ? "aspect-[4/3] w-full rounded-2xl object-cover object-top transition-all duration-500" : "aspect-[4/5] w-full rounded-2xl object-cover object-top opacity-80 transition-all duration-500 hover:opacity-100"} />
                <p className="mt-3 text-sm font-semibold">{person.name}</p>
                {on ? <p className="mt-1 text-sm text-[#666]">{person.title}</p> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="border-y border-black/5 bg-[#fafafa]">
        <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-5 py-10 sm:grid-cols-4">
          {HIGHLIGHTS.slice(0, 4).map((item) => (
            <div key={item.unit}>
              <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{item.value}</p>
              <p className="mt-1 font-medium">{item.unit}</p>
              <p className="mt-1 text-sm text-[#777]">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-16 lg:grid-cols-[280px_1fr]">
        <img src="/guests/liu-xiaoying.jpg" alt="刘小鹰" className="aspect-[4/5] w-full rounded-3xl object-cover object-top" />
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">发起校董</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">刘小鹰</h2>
          <p className="mt-5 max-w-2xl text-2xl leading-snug font-semibold">1000 个创业梦想的天使。</p>
          <p className="mt-4 max-w-2xl leading-8 text-[#444]">2011 年创办老鹰基金。港股上市公司董事局主席，天使联合汇主席。管理规模超 30 亿元，直投近 300 个项目。长远电信（0110.HK）创办人。</p>
        </div>
      </section>

      <section id="program" className="scroll-mt-24 border-t border-black/5 bg-[#fafafa]">
        <div className="mx-auto max-w-[1200px] px-5 py-16">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">课程</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">14 节系统课</h2>
          <div className="mt-8 flex flex-col gap-4">
            {MODULES.map((mod) => (
              <article key={mod.index} className="rounded-3xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#888]">{mod.index} · {mod.layer}</p>
                <h3 className="mt-2 text-2xl font-semibold">{mod.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[#555]">{mod.summary}</p>
                <ol className="mt-4 grid gap-3 sm:grid-cols-2">
                  {mod.lessons.map((lesson) => (
                    <li key={lesson.n} className="rounded-2xl bg-[#fafafa] px-4 py-3">
                      <p className="text-sm font-semibold">{lesson.n} {lesson.title}<span className="ml-2 font-medium text-[#999]">{lesson.hours}</span></p>
                      <p className="mt-1 text-xs leading-5 text-[#666]">{lesson.points.join(" · ")}</p>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-16">
        <h2 className="text-4xl font-semibold tracking-tight">交付与权益</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RHYTHM.map((item, index) => (
            <article key={item.title} className="rounded-3xl border border-black/10 p-5">
              <p className="text-sm font-semibold text-[#999]">{String(index + 1).padStart(2, "0")}</p>
              <p className="mt-2 text-lg font-semibold">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-[#555]">{item.desc}</p>
            </article>
          ))}
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {BENEFITS.map((item) => (
            <article key={item.title} className="rounded-3xl bg-[#fafafa] p-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-[#666]">{item.meta}</p>
              </div>
              <p className="mt-2 text-sm leading-7 text-[#555]">{item.desc}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-lg font-semibold">入学资格：严格筛选，面试入学。</p>
      </section>

      <section id="guests" className="scroll-mt-24 border-t border-black/5">
        <div className="mx-auto max-w-[1200px] px-5 py-16">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#888]">展示</p>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight">向谁取经</h2>
          {GUEST_GROUPS.map((group) => (
            <div key={group.id} className="mt-12">
              <h3 className="text-2xl font-semibold">{group.label}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#555]">{group.intro}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.people.map((person) => (
                  <article key={person.name} className="overflow-hidden rounded-3xl border border-black/5">
                    <GuestAvatar name={person.name} className="aspect-[4/3] h-auto w-full" />
                    <div className="p-4">
                      <p className="text-lg font-semibold">{person.name}</p>
                      <p className="mt-1 text-sm text-[#666]">{person.title}</p>
                      {person.bio ? <p className="mt-2 text-sm leading-6 text-[#444]">{person.bio}</p> : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
          <h3 className="mt-12 text-2xl font-semibold">更多创投嘉宾</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MORE_GUESTS.map((person) => (
              <article key={person.name} className="flex gap-3 rounded-2xl bg-[#fafafa] p-3">
                <GuestAvatar name={person.name} className="h-16 w-14 rounded-xl" />
                <div>
                  <p className="font-semibold">{person.name}</p>
                  <p className="text-sm text-[#666]">{person.title}</p>
                  {person.bio ? <p className="mt-1 text-sm leading-6 text-[#444]">{person.bio}</p> : null}
                </div>
              </article>
            ))}
          </div>
          <Roster />
        </div>
      </section>

      <section id="about-us" className="scroll-mt-24 bg-[#111] text-white">
        <div className="mx-auto max-w-[1200px] px-5 py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs tracking-[0.16em] text-white/50">关于我们</p>
              <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight">陪企业穿越周期的资本伙伴。</h2>
            </div>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-black">打开公众号文章</a>
          </div>
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {ABOUT_US.map((item) => (
              <article key={item.title} className="rounded-3xl bg-white/5 p-5">
                <p className="text-lg font-semibold">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-white/70">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
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
  return (
    <div id="roster" className="mt-14">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold">完整名单</h3>
          <p className="mt-1 text-sm text-[#777]">共 {ROSTER.length} 位，每次 12 位。</p>
        </div>
        <Input icon={Search} inputSize="sm" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="搜索姓名或机构" wrapperClassName="w-full sm:w-64" />
      </div>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slice.map((person) => (
          <li key={person.name + person.title} className="flex items-center gap-3 rounded-2xl border border-black/5 px-3 py-3">
            <GuestAvatar name={person.name} className="h-11 w-11 rounded-xl" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{person.name}</span>
              <span className="block truncate text-xs text-[#777]">{person.title}</span>
            </span>
          </li>
        ))}
      </ul>
      {list.length > pageSize ? (
        <div className="mt-4 flex items-center justify-between text-sm text-[#666]">
          <span className="tabular-nums">{current * pageSize + 1}–{Math.min(list.length, (current + 1) * pageSize)} / {list.length}</span>
          <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="h-9 rounded-full bg-black px-4 font-semibold text-white disabled:bg-[#ddd]">下一页</button>
        </div>
      ) : null}
    </div>
  );
}

function SubmitProjectButton({ className }: { className?: string }) {
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
      className={className}
    >
      项目投递
    </button>
  );
}
