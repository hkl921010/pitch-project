"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL, GUEST_PHOTOS, HIGHLIGHTS, QUESTIONS } from "@/data/academy";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const FACES = [
  ["毛大庆", "优客工场"],
  ["李竹", "英诺天使"],
  ["吴世春", "梅花创投"],
  ["吴欣鸿", "美图"],
] as const;

const PILL = "inline-flex h-12 items-center rounded-full px-6 text-sm font-semibold";
const GRADIENT = "bg-gradient-to-r from-[#6d5efc] to-[#ee5a9b] text-white shadow-[0_10px_30px_rgba(109,94,252,0.28)] hover:brightness-105";

const LIGHTS = [
  {
    label: "诊断",
    line: "先把短板看清",
    body: "投资人按真金的标准过一遍：赛道、模式、财务、叙事。",
    orbs: [
      { top: -80, left: "18%", size: 520, color: "rgba(109,94,252,0.38)" },
      { top: 80, left: "68%", size: 240, color: "rgba(125,211,252,0.45)" },
      { top: 180, left: "8%", size: 180, color: "rgba(238,90,155,0.2)" },
    ],
  },
  {
    label: "学习",
    line: "十四节，把方法讲完",
    body: "道、略、术。每节 3 小时，一线投资人主讲。",
    orbs: [
      { top: 20, left: "58%", size: 480, color: "rgba(238,90,155,0.36)" },
      { top: -40, left: "8%", size: 300, color: "rgba(192,38,211,0.28)" },
      { top: 200, left: "40%", size: 200, color: "rgba(125,211,252,0.35)" },
    ],
  },
  {
    label: "路演",
    line: "带到真人面前改",
    body: "每个模块一场。决策人在场，好在哪、差在哪，当面说。",
    orbs: [
      { top: 40, left: "30%", size: 560, color: "rgba(125,211,252,0.42)" },
      { top: -60, left: "62%", size: 260, color: "rgba(109,94,252,0.32)" },
      { top: 160, left: "6%", size: 220, color: "rgba(238,90,155,0.3)" },
    ],
  },
] as const;

function JasperDeck({ light }: { light: number }) {
  const [card, setCard] = useState(0);
  const [face, setFace] = useState(0);
  const question = QUESTIONS[card];
  const person = FACES[face];
  return (
    <div className="relative mx-auto grid max-w-[1120px] items-end gap-10 px-5 pb-14 lg:grid-cols-2">
      <button type="button" onClick={() => setCard((current) => (current + 1) % QUESTIONS.length)} className="relative h-56 text-left">
        {[2, 1, 0].map((depth) => (
          <div key={depth} className="absolute inset-x-4 rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-[0_16px_40px_rgba(109,94,252,0.12)] backdrop-blur" style={{ top: depth * 16, zIndex: 4 - depth, transform: `scale(${1 - depth * 0.045})` }}>
            {depth === 0 ? (
              <>
                <p className="text-xs font-semibold text-[#6d5efc]">点这张卡，翻到下一问</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{question}</p>
              </>
            ) : null}
          </div>
        ))}
      </button>
      <div className="flex items-end justify-center gap-4">
        <button type="button" onClick={() => setFace((current) => (current + FACES.length - 1) % FACES.length)} className="mb-10 text-sm font-semibold text-[#5c5c6b]">上一张</button>
        <div className="text-center">
          <img key={person[0]} src={GUEST_PHOTOS[person[0]]} alt="" className="mx-auto h-72 w-52 rounded-[32px] object-cover object-top shadow-[0_24px_50px_rgba(109,94,252,0.22)] animate-portal-scene" />
          <p className="mt-3 text-lg font-semibold">{person[0]}</p>
          <p className="text-sm text-[#6d5efc]">{person[1]}</p>
          <p className="mt-1 text-xs text-[#8a8a98]">和「{LIGHTS[light].label}」放在同一屏</p>
        </div>
        <button type="button" onClick={() => setFace((current) => (current + 1) % FACES.length)} className="mb-10 text-sm font-semibold text-[#5c5c6b]">下一张</button>
      </div>
    </div>
  );
}

export default function JasperPortal() {
  const [light, setLight] = useState(0);
  const scene = LIGHTS[light];
  return (
    <div className="min-h-screen bg-white pb-24 text-[#12121a]">
      <PortalCompare current="c" />
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-6 px-5">
          <a href="#top" aria-label="培驰商学">
            <img src="/brand/logo-horizontal.png" alt="" className="h-8 w-auto" />
          </a>
          <nav className="scrollbar-none ml-auto hidden items-center gap-7 text-sm text-[#5c5c6b] lg:flex">
            <a href="#system" className="hover:text-[#12121a]">课程</a>
            <a href="#founder" className="hover:text-[#12121a]">校董</a>
            <a href="#guests" className="hover:text-[#12121a]">嘉宾</a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-[#12121a]">公众号文章</a>
            <Link href="/discover" className="hover:text-[#12121a]">发现</Link>
            <Link href="/me" className="hover:text-[#12121a]">我的</Link>
          </nav>
          <div className="ml-auto lg:ml-0">
            <SubmitProjectButton className={cn(PILL, "h-10", GRADIENT)} />
          </div>
        </div>
        <nav className="scrollbar-none flex gap-5 overflow-x-auto px-5 pb-3 text-sm text-[#5c5c6b] lg:hidden">
          <a href="#system">课程</a>
          <a href="#founder">校董</a>
          <a href="#guests">嘉宾</a>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer">公众号文章</a>
          <Link href="/discover">发现</Link>
          <Link href="/me">我的</Link>
        </nav>
      </header>

      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px]">
          {scene.orbs.map((orb, orbIndex) => (
            <div
              key={orbIndex}
              className="absolute rounded-full transition-all duration-700 ease-out"
              style={{ top: orb.top, left: orb.left, width: orb.size, height: orb.size, background: `radial-gradient(circle, ${orb.color}, transparent 68%)` }}
            />
          ))}
        </div>
        <div className="relative mx-auto max-w-[860px] px-5 pt-20 pb-8 text-center sm:pt-28">
          <p className="mx-auto inline-flex h-8 items-center rounded-full border border-[#6d5efc]/20 bg-white/80 px-3 text-xs font-semibold text-[#6d5efc]">资本商学</p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            读懂资本
            <br />
            <span className="bg-gradient-to-r from-[#6d5efc] via-[#c026d3] to-[#ee5a9b] bg-clip-text pb-1 text-transparent">反向经营</span>
          </h1>
          <div className="mt-8 flex justify-center gap-2" role="tablist" aria-label="光斑场景">
            {LIGHTS.map((item, index) => (
              <button key={item.label} type="button" role="tab" aria-selected={light === index} onClick={() => setLight(index)} className={cn("h-10 rounded-full px-5 text-sm font-semibold transition", light === index ? "bg-[#12121a] text-white" : "bg-white/80 text-[#5c5c6b] hover:bg-white")}>
                {item.label}
              </button>
            ))}
          </div>
          <p key={scene.label} className="mx-auto mt-6 max-w-lg text-lg leading-8 text-[#5c5c6b] animate-portal-scene">{scene.line}。{scene.body}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <SubmitProjectButton className={cn(PILL, GRADIENT)} />
            <a href={LABS_URL} target="_blank" rel="noreferrer" className={cn(PILL, "border border-black/10 bg-white hover:border-black/30")}>
              BP 诊断
            </a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className={cn(PILL, "text-[#6d5efc] hover:bg-[#f6f3ff]")}>
              公众号文章
            </a>
          </div>
        </div>
        <JasperDeck light={light} />
      </section>

      <section className="mx-auto max-w-[1120px] px-5 py-8">
        <div className="grid grid-cols-2 gap-3 rounded-3xl bg-[#f6f5fb] p-3 sm:grid-cols-4 sm:p-4">
          {HIGHLIGHTS.slice(0, 4).map((item) => (
            <div key={item.unit} className="rounded-2xl bg-white px-5 py-6">
              <p className="text-4xl font-semibold tracking-tight tabular-nums">{item.value}</p>
              <p className="mt-1 text-sm font-medium">{item.unit}</p>
              <p className="mt-1 text-xs text-[#7a7a88]">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <PortalDepth tone="jasper" />


      <section className="px-5 py-16">
        <div className="mx-auto flex max-w-[1120px] flex-col items-start justify-between gap-8 rounded-[32px] bg-gradient-to-br from-[#6d5efc] via-[#9a4dff] to-[#ee5a9b] px-8 py-12 text-white sm:px-12 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">先看公众号文章，或直接投递项目。</h2>
            <p className="mt-3 max-w-lg text-white/80">关于我们写在这篇公众号文章里。项目投递需要登录，BP 诊断可以直接打开。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-[#12121a]">
              打开公众号文章
            </a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-white/40 px-6 text-sm font-semibold text-white">
              BP 诊断
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-4 px-5 py-8 text-sm text-[#7a7a88] sm:flex-row sm:items-center sm:justify-between">
          <img src="/brand/logo-horizontal.png" alt="培驰" className="h-8 w-auto" />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-[#12121a]">公众号文章</a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="hover:text-[#12121a]">BP 诊断</a>
            <Link href="/discover" className="hover:text-[#12121a]">发现</Link>
            <Link href="/me" className="hover:text-[#12121a]">我的</Link>
          </div>
        </div>
      </footer>
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
