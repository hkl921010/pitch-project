"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL, GUEST_PHOTOS, HIGHLIGHTS } from "@/data/academy";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const ACTIONS = [
  { href: "#system", label: "资本辅导", bg: "#efe7ff" },
  { href: "/discover", label: "资源对接", bg: "#e5f8ea" },
  { href: "#guests", label: "嘉宾网络", bg: "#e5f0ff" },
  { href: LABS_URL, label: "BP 诊断", bg: "#fff3cc", external: true },
  { href: ABOUT_URL, label: "公众号文章", bg: "#ffe8df", external: true },
] as const;

export default function DeelPortal() {
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
          <div className="mt-6 flex flex-wrap gap-2">
            {ACTIONS.map((item) =>
              "external" in item ? (
                <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition hover:-translate-y-0.5" style={{ background: item.bg }}>
                  {item.label}
                </a>
              ) : (
                <a key={item.label} href={item.href} className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium transition hover:-translate-y-0.5" style={{ background: item.bg }}>
                  {item.label}
                </a>
              ),
            )}
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
          <img src={GUEST_PHOTOS["毛大庆"]} alt="" className="aspect-[4/5] w-full rounded-[32px] object-cover object-[center_20%]" />
          <div className="absolute bottom-5 left-5 rounded-2xl bg-white px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.14)] sm:-left-8">
            <p className="text-sm font-semibold">资源网络</p>
            <p className="text-xs text-[#666]">毛大庆 · 优客工场，以及更多嘉宾</p>
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
