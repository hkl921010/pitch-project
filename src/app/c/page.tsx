"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL, GUEST_PHOTOS, HIGHLIGHTS } from "@/data/academy";
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

export default function JasperPortal() {
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
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px]">
          <div className="absolute top-[-80px] left-1/2 h-[460px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(109,94,252,0.22),transparent_68%)]" />
          <div className="absolute top-24 right-[8%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(238,90,155,0.28),transparent_70%)]" />
          <div className="absolute top-32 left-[6%] h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(125,211,252,0.35),transparent_70%)]" />
        </div>
        <div className="relative mx-auto max-w-[860px] px-5 pt-20 pb-8 text-center sm:pt-28">
          <p className="mx-auto inline-flex h-8 items-center rounded-full border border-[#6d5efc]/20 bg-white/80 px-3 text-xs font-semibold text-[#6d5efc]">资本商学</p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-7xl">
            读懂资本
            <br />
            <span className="bg-gradient-to-r from-[#6d5efc] via-[#c026d3] to-[#ee5a9b] bg-clip-text pb-1 text-transparent">反向经营</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-8 text-[#5c5c6b]">专业的资本辅导与资源对接平台。诊断、学习、路演，六个月走完。</p>
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
        <div className="relative mx-auto grid max-w-[1120px] gap-4 px-5 pb-8 lg:grid-cols-2">
          <a href="#system" className="rounded-[28px] border border-[#6d5efc]/15 bg-white p-7 text-left shadow-[0_16px_40px_rgba(109,94,252,0.08)]">
            <p className="text-sm font-semibold text-[#6d5efc]">资本辅导</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">诊断、学习、路演</p>
            <p className="mt-3 text-sm leading-7 text-[#5c5c6b]">六个月系统课。投资人把方法讲透，再带到路演里改。</p>
          </a>
          <div className="rounded-[28px] bg-[#12121a] p-7 text-left text-white shadow-[0_16px_40px_rgba(18,18,26,0.16)]">
            <p className="text-sm font-semibold text-[#ee5a9b]">资源对接</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">项目、机构、嘉宾</p>
            <p className="mt-3 text-sm leading-7 text-white/70">投递项目，或在平台上找正在开放的资源。</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/discover" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#12121a]">发现项目</Link>
              <a href="#guests" className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-sm font-semibold">嘉宾网络</a>
            </div>
            <div className="mt-5 flex gap-2">
              {FACES.map(([name]) => (
                <img key={name} src={GUEST_PHOTOS[name]} alt="" className="h-14 w-12 rounded-xl object-cover object-top" />
              ))}
            </div>
          </div>
        </div>
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
