"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL, GUEST_PHOTOS, HIGHLIGHTS } from "@/data/academy";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const ACTIONS = [
  { href: "#system", label: "资本辅导", bg: "#efe7ff", name: "刘小鹰", caption: "发起校董", detail: "六个月：诊断、学习、路演。" },
  { href: "/discover", label: "资源对接", bg: "#e5f8ea", name: "吴世春", caption: "正在开放的资源", detail: "项目、机构、嘉宾。可以直接去发现。" },
  { href: "#guests", label: "嘉宾网络", bg: "#e5f0ff", name: "毛大庆", caption: "往期嘉宾", detail: "优客工场创始人，以及更多到场的人。" },
  { href: LABS_URL, label: "BP 诊断", bg: "#fff3cc", name: "李竹", caption: "先把 BP 看一遍", detail: "诊断不需要登录，可以直接打开。", external: true },
  { href: ABOUT_URL, label: "公众号文章", bg: "#ffe8df", name: "吴欣鸿", caption: "关于我们", detail: "培驰是谁，写在这篇公众号文章里。", external: true },
] as const;

const INTENT_NEXT: Record<string, { title: string; points: string[]; href: string; cta: string; external?: boolean }> = {
  资本辅导: { title: "接下来六个月", points: ["先诊断短板", "十四节把道、略、术讲完", "每个模块一场路演"], href: "#system", cta: "看课程" },
  资源对接: { title: "现在能对上", points: ["拾光茶事 · 天使+ 800 万", "跃迁智能 · 跨境渠道", "野径 · 欧洲线下"], href: "/discover", cta: "去发现" },
  嘉宾网络: { title: "人在这里", points: ["一线投资人", "企业家", "青年创业者"], href: "#guests", cta: "看名单" },
  "BP 诊断": { title: "先把计划书打开", points: ["不用登录", "按资本的标准看一遍", "看完再决定要不要上课"], href: LABS_URL, cta: "打开诊断", external: true },
  公众号文章: { title: "先读我们是谁", points: ["发起校董刘小鹰", "反向经营是什么", "课堂已经去过哪些城市"], href: ABOUT_URL, cta: "打开文章", external: true },
};

function IntentBoard({ scene }: { scene: (typeof ACTIONS)[number] }) {
  const next = INTENT_NEXT[scene.label];
  return (
    <section className="mx-auto mt-8 max-w-[1180px] px-5">
      <div key={scene.label} className="grid gap-6 rounded-[28px] bg-white p-6 animate-portal-scene sm:p-8 lg:grid-cols-[240px_1fr]">
        <div>
          <p className="text-sm text-[#777]">选了「{scene.label}」之后</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{next.title}</h2>
        </div>
        <div>
          <ul className="flex flex-col">
            {next.points.map((point, index) => (
              <li key={point} className="border-t border-black/10 py-3 text-lg">{String(index + 1).padStart(2, "0")}  {point}</li>
            ))}
          </ul>
          <a href={next.href} {...(next.external ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-4 inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold" style={{ background: scene.bg }}>
            {next.cta}
          </a>
        </div>
      </div>
    </section>
  );
}

export default function DeelPortal() {
  const [action, setAction] = useState(0);
  const scene = ACTIONS[action];
  return (
    <div className="min-h-screen bg-[#f6f5f1] pb-24 text-[#111]">
      <PortalCompare current="e" />
      <header className="sticky top-0 z-50 bg-[#f6f5f1]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1180px] items-center gap-6 px-5">
          <a href="#top" aria-label="培驰商学">
            <img src="/brand/logo-horizontal.png" alt="" className="h-9 w-auto" />
          </a>
          <nav className="scrollbar-none ml-auto hidden items-center gap-6 text-sm text-[#333] lg:flex">
            <a href="#system" className="hover:text-black">课程</a>
            <a href="#founder" className="hover:text-black">校董</a>
            <a href="#guests" className="hover:text-black">嘉宾</a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-black">公众号文章</a>
            <Link href="/discover" className="hover:text-black">发现</Link>
            <Link href="/me" className="hover:text-black">我的</Link>
          </nav>
          <SubmitProjectButton className="ml-auto inline-flex h-10 items-center rounded-full bg-black px-4 text-sm font-semibold text-white hover:bg-[#222] lg:ml-0" />
        </div>
        <nav className="scrollbar-none flex gap-5 overflow-x-auto px-5 pb-3 text-sm lg:hidden">
          <a href="#system">课程</a>
          <a href="#founder">校董</a>
          <a href="#guests">嘉宾</a>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer">公众号文章</a>
          <Link href="/discover">发现</Link>
          <Link href="/me">我的</Link>
        </nav>
      </header>

      <section id="top" className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 pt-12 pb-16 lg:grid-cols-[minmax(0,1.15fr)_400px] lg:pt-20">
        <div>
          <p className="text-sm font-medium text-[#666]">你想先做什么？</p>
          <h1 className="mt-4 max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-[68px]">
            读懂资本，
            <br />
            反向经营。
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-[#444]">专业的资本辅导与资源对接平台。诊断、学习、路演，六个月走完。</p>
          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="你想先做什么">
            {ACTIONS.map((item, index) => (
              <button key={item.label} type="button" role="tab" aria-selected={action === index} onClick={() => setAction(index)} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition hover:-translate-y-0.5" style={{ background: item.bg, outline: action === index ? "2px solid #111" : "2px solid transparent", outlineOffset: 2 }}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <SubmitProjectButton className="inline-flex h-12 items-center rounded-full bg-black px-6 text-base font-semibold text-white hover:bg-[#222]" />
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-black/15 bg-white px-6 text-base font-semibold">
              BP 诊断
            </a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center px-2 text-base font-semibold underline underline-offset-4">
              公众号文章
            </a>
          </div>
        </div>
        <div className="relative">
          <img key={scene.name} src={GUEST_PHOTOS[scene.name]} alt="" className="aspect-[4/5] w-full rounded-[32px] object-cover object-[center_20%] animate-portal-scene" />
          <div className="absolute bottom-5 left-5 max-w-[240px] rounded-2xl bg-white px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.14)] sm:-left-8">
            <p className="text-sm font-semibold">{scene.caption}</p>
            <p className="text-xs leading-5 text-[#666]">{scene.name} · {scene.detail}</p>
            <a href={scene.href} {...("external" in scene ? { target: "_blank", rel: "noreferrer" } : {})} className="mt-2 inline-flex text-xs font-semibold underline underline-offset-4">
              打开
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1180px] px-5">
        <div className="grid grid-cols-2 gap-6 rounded-[28px] bg-white px-6 py-8 sm:grid-cols-4 sm:px-10">
          {HIGHLIGHTS.slice(0, 4).map((item) => (
            <div key={item.unit}>
              <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{item.value}</p>
              <p className="mt-1 font-medium">{item.unit}</p>
              <p className="mt-1 text-sm text-[#777]">{item.hint}</p>
            </div>
          ))}
        </div>
      </section>

      <IntentBoard scene={scene} />

      <PortalDepth tone="deel" />


      <section className="px-5 py-16">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-6 rounded-[28px] bg-black px-8 py-12 text-white sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="text-4xl font-semibold tracking-tight">先看公众号文章，或直接投递。</h2>
            <p className="mt-3 text-white/70">关于我们写在这篇公众号文章里。BP 诊断不需要登录。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full bg-white px-6 text-sm font-semibold text-black">
              打开公众号文章
            </a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center rounded-full border border-white/30 px-6 text-sm font-semibold">
              BP 诊断
            </a>
          </div>
        </div>
      </section>
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
