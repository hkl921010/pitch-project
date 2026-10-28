"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { GuestAvatar } from "@/components/biz/guest-avatar";
import { GUEST_GROUPS, GUEST_PHOTOS, MODULES, RHYTHM, type AcademyPerson } from "@/data/academy";
import { cn } from "@/lib/cn";

const COACH_SCENES = [
  {
    kicker: "诊断",
    title: "先把企业看穿",
    body: "投资人按真金的标准过一遍。短板在这一步被指出来。",
  },
  {
    kicker: "学习",
    title: "十四节，把方法讲完",
    body: "道、略、术。每节 3 小时，一线投资人主讲。",
  },
  {
    kicker: "路演",
    title: "带到真人面前改",
    body: "每个模块一场。决策人在场，好在哪、差在哪，当面说。",
  },
] as const;

const LENSES = [
  { label: "赛道", text: "天花板、增速、渗透率，市场到底有多大" },
  { label: "模式", text: "增长、效率、复制、壁垒，哪一段在消耗现金" },
  { label: "财务", text: "三张表里，投资人真正会翻的那些数" },
  { label: "叙事", text: "企业不只要赚钱，值钱这件事能不能讲清楚" },
] as const;

const SHOW_FACES = ["李竹", "吴世春", "毛大庆", "吴欣鸿"] as const;

const OPEN_PROJECTS = [
  {
    slug: "shiguang-tea",
    name: "拾光茶事",
    mark: "拾",
    line: "把东方新茶饮开进东南亚的写字楼和商场",
    meta: "深圳 · 新加坡",
    ask: "天使+ 800 万 · 便利店渠道",
  },
  {
    slug: "leap-ai",
    name: "跃迁智能",
    mark: "跃",
    line: "用 AI 帮跨境卖家一键生成商品图和多语言 listing",
    meta: "杭州",
    ask: "跨境服务商渠道",
  },
  {
    slug: "wildpath",
    name: "野径",
    mark: "野",
    line: "为周末出发的城市人做的轻户外装备",
    meta: "厦门",
    ask: "欧洲线下户外连锁",
  },
  {
    slug: "fur-planet",
    name: "毛球星球",
    mark: "毛",
    line: "会看懂猫咪食欲的智能喂食器",
    meta: "深圳",
    ask: "天使轮 · 北美宠物连锁",
  },
] as const;

const REEL: Array<AcademyPerson & { group: string }> = GUEST_GROUPS.flatMap((group) =>
  group.people.filter((person) => GUEST_PHOTOS[person.name]).map((person) => ({ ...person, group: group.label })),
);

const JOURNEY = [
  {
    kicker: "诊断",
    line: "先看清短板，再决定补哪一课。",
  },
  {
    kicker: "学习",
    line: "十四节系统课，把道、略、术讲完。",
  },
  {
    kicker: "路演",
    line: "每个模块一场，毕业再做成对接大会。",
  },
] as const;

function lead(bio: string) {
  const cut = bio.indexOf("。");
  return cut === -1 ? bio : bio.slice(0, cut + 1);
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function HeroStage({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [door, setDoor] = useState<"coach" | "match">("coach");

  return (
    <div className="mx-auto mt-10 max-w-[1440px] px-5 sm:mt-14 sm:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-white p-1 shadow-[0_8px_24px_rgba(16,24,40,0.06)]" role="tablist" aria-label="首页两条路">
          <DoorTab on={door === "coach"} onClick={() => setDoor("coach")}>
            资本辅导
          </DoorTab>
          <DoorTab on={door === "match"} onClick={() => setDoor("match")}>
            资源对接
          </DoorTab>
        </div>
        <p className={tone === "dark" ? "text-sm text-white/60" : "text-sm text-gray-500"}>{door === "coach" ? "点开三步，画面会换" : "点一个项目，海报会换"}</p>
      </div>

      <div className="mt-4 grid">
        <div className={cn("relative col-start-1 row-start-1 transition-opacity duration-500", door === "coach" ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0")} aria-hidden={door !== "coach"} inert={door !== "coach"}>
          <CoachStage />
        </div>
        <div className={cn("relative col-start-1 row-start-1 transition-opacity duration-500", door === "match" ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0")} aria-hidden={door !== "match"} inert={door !== "match"}>
          <MatchStage />
        </div>
      </div>
    </div>
  );
}

function DoorTab({ on, onClick, children }: { on: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" role="tab" aria-selected={on} onClick={onClick} className={cn("h-12 rounded-full px-6 text-sm font-semibold transition sm:h-14 sm:px-8 sm:text-base", on ? "bg-black text-white" : "text-gray-600 hover:text-gray-950")}>
      {children}
    </button>
  );
}

function CoachStage() {
  const [step, setStep] = useState(0);
  const pause = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (!pause.current) setStep((current) => (current + 1) % COACH_SCENES.length);
    }, 4600);
    return () => window.clearInterval(id);
  }, []);

  const choose = (next: number) => {
    pause.current = true;
    setStep(next);
    window.setTimeout(() => {
      pause.current = false;
    }, 9000);
  };

  const scene = COACH_SCENES[step];

  return (
    <div className="grid h-full min-h-[560px] overflow-hidden rounded-[28px] bg-[#101010] text-white shadow-[0_24px_60px_rgba(16,24,40,0.12)] lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
      <div key={scene.kicker} className="flex h-full flex-col justify-between p-7 animate-portal-scene sm:p-10 lg:p-12">
        <p className="text-xs font-semibold tracking-[0.28em] text-[#8adf4a]">0{step + 1} · {scene.kicker}</p>
        <div>
          <h2 className="max-w-xl text-4xl font-semibold tracking-tight sm:text-6xl">{scene.title}</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/65">{scene.body}</p>
          <SceneBody step={step} />
        </div>
        <a href="#journey" className="mt-8 inline-flex text-sm font-semibold text-white underline decoration-[#8adf4a] decoration-2 underline-offset-4">
          看六个月怎么走
        </a>
      </div>
      <div className="flex flex-col justify-center gap-2 border-t border-white/10 p-4 sm:p-6 lg:border-t-0 lg:border-l lg:p-8">
        {COACH_SCENES.map((item, index) => (
          <button key={item.kicker} type="button" onClick={() => choose(index)} aria-pressed={step === index} className={cn("rounded-2xl px-5 py-4 text-left transition", step === index ? "bg-white text-black" : "text-white/55 hover:bg-white/5 hover:text-white")}>
            <span className="text-xs tracking-[0.22em]">0{index + 1}</span>
            <span className="mt-1 block text-2xl font-semibold tracking-tight">{item.kicker}</span>
            <span className="mt-3 block h-0.5 overflow-hidden rounded-full bg-black/10">
              {step === index ? <span key={step} className="block h-full origin-left bg-[#8adf4a] animate-portal-fill" /> : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SceneBody({ step }: { step: number }) {
  if (step === 1) {
    return (
      <div className="mt-8 flex max-w-xl flex-col gap-2">
        {MODULES.map((mod, index) => (
          <div key={mod.index} className={cn("rounded-2xl px-4 py-3", index === 1 ? "bg-[#8adf4a] text-black" : "bg-white/10 text-white")}>
            <p className={cn("text-xs tracking-[0.16em]", index === 1 ? "text-black/60" : "text-white/45")}>{mod.layer}</p>
            <p className="mt-1 text-base font-semibold sm:text-lg">{mod.title}</p>
          </div>
        ))}
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="mt-8 grid max-w-xl grid-cols-4 gap-2 sm:gap-3">
        {SHOW_FACES.map((name) => (
          <div key={name}>
            <img src={GUEST_PHOTOS[name]} alt="" className="aspect-[3/4] w-full rounded-2xl object-cover object-top" />
            <p className="mt-2 truncate text-xs font-medium sm:text-sm">{name}</p>
          </div>
        ))}
      </div>
    );
  }
  return (
    <ul className="mt-8 max-w-xl">
      {LENSES.map((item, index) => (
        <li key={item.label} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-t border-white/10 py-3 animate-fade-in [animation-fill-mode:both]" style={{ animationDelay: `${index * 70}ms` }}>
          <span className="text-sm font-semibold text-[#8adf4a]">{item.label}</span>
          <span className="text-sm leading-6 text-white/70">{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

function MatchStage() {
  const [index, setIndex] = useState(0);
  const pause = useRef(false);
  const project = OPEN_PROJECTS[index];

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const id = window.setInterval(() => {
      if (!pause.current) setIndex((current) => (current + 1) % OPEN_PROJECTS.length);
    }, 4600);
    return () => window.clearInterval(id);
  }, []);

  const choose = (next: number) => {
    pause.current = true;
    setIndex(next);
    window.setTimeout(() => {
      pause.current = false;
    }, 9000);
  };

  return (
    <div className="grid h-full min-h-[560px] overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(16,24,40,0.08)] lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
      <div className="flex h-full min-h-[420px] flex-col bg-[#101010] text-white">
        <div key={project.slug} className="flex h-full flex-col justify-between p-7 animate-portal-scene sm:p-10 lg:p-12">
        <p className="text-xs font-semibold tracking-[0.28em] text-[#8adf4a]">正在开放 · {project.meta}</p>
        <div>
          <p className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8adf4a] text-2xl font-semibold text-black">{project.mark}</p>
          <h2 className="mt-6 text-4xl font-semibold tracking-tight sm:text-6xl">{project.name}</h2>
          <p className="mt-4 max-w-md text-base leading-7 text-white/65">{project.line}</p>
          <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium">{project.ask}</p>
        </div>
        <Link href={`/p/${project.slug}`} className="mt-8 inline-flex text-sm font-semibold underline decoration-[#8adf4a] decoration-2 underline-offset-4">
          打开这个项目
        </Link>
        </div>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-1 flex-col justify-center gap-1 p-4 sm:p-6">
          {OPEN_PROJECTS.map((item, itemIndex) => (
            <button key={item.slug} type="button" onClick={() => choose(itemIndex)} aria-pressed={index === itemIndex} className={cn("rounded-2xl px-4 py-3 text-left transition", index === itemIndex ? "bg-[#101010] text-white" : "hover:bg-[#f7f6f3]")}>
              <span className="text-lg font-semibold">{item.name}</span>
              <span className={cn("mt-1 block text-sm", index === itemIndex ? "text-white/60" : "text-gray-500")}>{item.ask}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-black/5 px-5 py-4">
          <div className="flex -space-x-2">
            {SHOW_FACES.map((name) => (
              <img key={name} src={GUEST_PHOTOS[name]} alt="" className="h-9 w-9 rounded-full object-cover object-top ring-2 ring-white" />
            ))}
          </div>
          <Link href="/discover" className="text-sm font-semibold">
            进入发现
          </Link>
        </div>
      </div>
    </div>
  );
}

export function JourneyScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [pin, setPin] = useState(false);
  const [rail, setRail] = useState({ left: 40, width: 320 });

  useEffect(() => {
    const nodes = JOURNEY.map((_, index) => document.getElementById(`journey-${index}`)).filter((node): node is HTMLElement => !!node);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = Number(visible.target.id.replace("journey-", ""));
        if (!Number.isNaN(index)) setActive(index);
      },
      { rootMargin: "-35% 0px -45% 0px", threshold: [0.15, 0.4, 0.7] },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const column = columnRef.current;
    if (!section || !column) return;
    const measure = () => {
      const railBox = column.getBoundingClientRect();
      if (railBox.width > 0) setRail((prev) => (prev.left === railBox.left && prev.width === railBox.width ? prev : { left: railBox.left, width: railBox.width }));
    };
    measure();
    const observer = new IntersectionObserver(([entry]) => {
      measure();
      setPin(entry?.isIntersecting ?? false);
    }, { rootMargin: "-72px 0px -42% 0px", threshold: 0 });
    observer.observe(section);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const go = (index: number) => {
    document.getElementById(`journey-${index}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  };

  return (
    <section id="journey" ref={sectionRef} className="scroll-mt-28 border-t border-black/5 bg-white">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[minmax(240px,0.72fr)_minmax(0,1.28fr)]">
        <div ref={columnRef}>
          <div
            className={cn("px-5 py-16 sm:px-10 lg:flex lg:h-[calc(100vh-72px)] lg:flex-col lg:justify-center lg:px-10 lg:py-0", pin && "lg:fixed lg:top-[72px]")}
            style={pin ? { left: rail.left, width: rail.width } : undefined}
          >
          <p className="text-xs font-semibold tracking-[0.28em] text-gray-400">六个月</p>
          <div className="mt-8 flex flex-col gap-6">
            {JOURNEY.map((step, index) => (
              <button key={step.kicker} type="button" onClick={() => go(index)} className="text-left" aria-current={active === index ? "step" : undefined}>
                <span className={cn("block font-semibold tracking-tight transition-all duration-300", active === index ? "text-5xl text-gray-950 sm:text-6xl" : "text-3xl text-gray-300 hover:text-gray-500")}>{step.kicker}</span>
                <span className={cn("mt-2 max-w-xs text-sm leading-6 text-gray-500", active === index ? "block" : "hidden")}>{step.line}</span>
              </button>
            ))}
          </div>
          </div>
        </div>
        <div className="px-5 sm:px-10 lg:pr-10">
          <article id="journey-0" className="flex min-h-[78vh] items-center py-16">
            <div className="w-full rounded-[28px] bg-[#f7f6f3] p-7 sm:p-12">
              <p className="text-xs tracking-[0.28em] text-gray-400">01 · 诊断</p>
              <h3 className="mt-4 max-w-lg text-4xl font-semibold tracking-tight">把短板先看清</h3>
              <ul className="mt-10 flex flex-col">
                {LENSES.map((item) => (
                  <li key={item.label} className="grid gap-2 border-t border-black/10 py-5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:items-baseline">
                    <span className="text-lg font-semibold">{item.label}</span>
                    <span className="text-base leading-7 text-gray-600">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
          <article id="journey-1" className="flex min-h-[78vh] items-center py-16">
            <div className="w-full">
              <p className="text-xs tracking-[0.28em] text-gray-400">02 · 学习</p>
              <h3 className="mt-4 text-4xl font-semibold tracking-tight">十四节，一次讲完</h3>
              <div className="mt-10 flex flex-col gap-4">
                {MODULES.map((mod) => (
                  <div key={mod.index} className="rounded-[24px] border border-black/10 p-6">
                    <p className="text-xs tracking-[0.18em] text-[#1f6b12]">{mod.layer}</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">{mod.title}</p>
                    <p className="mt-2 text-sm leading-7 text-gray-500">{mod.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
          <article id="journey-2" className="flex min-h-[78vh] items-center py-16">
            <div className="w-full rounded-[28px] bg-[#101010] p-7 text-white sm:p-12">
              <p className="text-xs tracking-[0.28em] text-[#8adf4a]">03 · 路演</p>
              <h3 className="mt-4 max-w-lg text-4xl font-semibold tracking-tight">每一次集中授课，都包含一场真路演</h3>
              <div className="mt-10 grid gap-6 sm:grid-cols-2">
                {RHYTHM.map((item, index) => (
                  <div key={item.title}>
                    <p className="text-sm tabular-nums text-white/35">0{index + 1}</p>
                    <p className="mt-2 text-xl font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-white/60">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

export function GuestReel() {
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, x: 0, left: 0, moved: false });
  const [index, setIndex] = useState(0);
  const person = REEL[index];

  const nearest = () => {
    const el = scroller.current;
    if (!el) return 0;
    const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    el.querySelectorAll<HTMLElement>("[data-reel]").forEach((child) => {
      const box = child.getBoundingClientRect();
      const dist = Math.abs(box.left + box.width / 2 - mid);
      const reelIndex = Number(child.dataset.reel);
      if (dist < bestDist && !Number.isNaN(reelIndex)) {
        bestDist = dist;
        best = reelIndex;
      }
    });
    return best;
  };

  const center = (next: number, smooth: boolean) => {
    const el = scroller.current;
    const child = el?.querySelector<HTMLElement>(`[data-reel="${next}"]`);
    if (!el || !child) return;
    const delta = child.getBoundingClientRect().left - el.getBoundingClientRect().left - (el.clientWidth - child.offsetWidth) / 2;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: smooth ? "smooth" : "auto" });
  };

  if (!person) return null;

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el) return;
    drag.current = { active: true, x: event.clientX, left: el.scrollLeft, moved: false };
    el.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const el = scroller.current;
    if (!el || !drag.current.active) return;
    const dx = event.clientX - drag.current.x;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.left - dx;
  };
  const onPointerUp = () => {
    const moved = drag.current.moved;
    drag.current.active = false;
    if (!moved) return;
    const next = nearest();
    setIndex(next);
    center(next, !prefersReducedMotion());
  };
  const shift = (delta: number) => {
    const next = (index + delta + REEL.length) % REEL.length;
    setIndex(next);
    center(next, !prefersReducedMotion());
  };

  return (
    <div className="mb-16">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(240px,380px)_minmax(0,1fr)]">
        <img key={person.name} src={GUEST_PHOTOS[person.name]} alt="" className="aspect-[4/5] w-full rounded-[28px] object-cover object-top animate-portal-scene" />
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.28em] text-[#1f6b12]">{person.group}</p>
          <h3 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">{person.name}</h3>
          <p className="mt-3 text-lg text-gray-600">{person.title}</p>
          <p className="mt-5 max-w-xl text-base leading-8 text-gray-600">{lead(person.bio)}</p>
          <div className="mt-8 flex items-center gap-4">
            <p className="text-sm text-gray-400">按住拖动，或用左右换人</p>
            <button type="button" onClick={() => shift(-1)} className="text-sm font-semibold">上一位</button>
            <button type="button" onClick={() => shift(1)} className="text-sm font-semibold">下一位</button>
          </div>
          <div
            ref={scroller}
            className="scrollbar-none mt-4 flex cursor-grab touch-pan-y gap-3 overflow-x-auto px-[max(0px,calc(50%-2.5rem))] pb-2 active:cursor-grabbing"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onScroll={() => {
              const next = nearest();
              setIndex((current) => (current === next ? current : next));
            }}
          >
            {REEL.map((item, itemIndex) => (
              <button
                key={item.name}
                type="button"
                data-reel={itemIndex}
                onClick={() => {
                  if (drag.current.moved) return;
                  setIndex(itemIndex);
                  center(itemIndex, !prefersReducedMotion());
                }}
                className={cn("w-16 shrink-0 snap-center sm:w-20", index === itemIndex ? "opacity-100" : "opacity-45 hover:opacity-80")}
                aria-label={item.name}
                aria-pressed={index === itemIndex}
              >
                <GuestAvatar name={item.name} className={cn("aspect-[4/5] w-full rounded-xl", index === itemIndex && "ring-2 ring-black")} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
