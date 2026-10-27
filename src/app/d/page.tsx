"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL } from "@/data/academy";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const GREEN = "#3ecf8e";

export default function SupabasePortal() {
  return (
    <div className="min-h-screen bg-[#1c1c1c] pb-24 text-[#ededed]">
      <PortalCompare current="d" />
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1c1c1c]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-6 px-5">
          <a href="#top" className="flex items-center gap-2 text-sm font-medium text-white" aria-label="培驰商学">
            <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
            培驰
          </a>
          <nav className="scrollbar-none ml-4 hidden items-center gap-5 text-sm text-[#b4b4b4] lg:flex">
            <a href="#system" className="hover:text-white">课程</a>
            <a href="#founder" className="hover:text-white">校董</a>
            <a href="#guests" className="hover:text-white">嘉宾</a>
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-white">公众号文章</a>
            <Link href="/discover" className="hover:text-white">发现</Link>
            <Link href="/me" className="hover:text-white">我的</Link>
          </nav>
          <div className="ml-auto">
            <SubmitProjectButton className="inline-flex h-9 items-center rounded-md bg-[#3ecf8e] px-3 text-sm font-medium text-[#171717] hover:bg-[#4de0a0]" />
          </div>
        </div>
        <nav className="scrollbar-none flex gap-5 overflow-x-auto border-t border-white/10 px-5 py-2.5 text-sm text-[#b4b4b4] lg:hidden">
          <a href="#system">课程</a>
          <a href="#founder">校董</a>
          <a href="#guests">嘉宾</a>
          <a href={ABOUT_URL} target="_blank" rel="noreferrer">公众号文章</a>
          <Link href="/discover">发现</Link>
          <Link href="/me">我的</Link>
        </nav>
      </header>

      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(ellipse_at_top,rgba(62,207,142,0.18),transparent_58%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:py-24">
          <div>
            <p className="font-mono text-sm text-[#3ecf8e]">资本商学</p>
            <h1 className="mt-4 text-5xl leading-[1.05] font-medium tracking-tight sm:text-6xl lg:text-7xl">
              读懂资本
              <br />
              <span className="text-[#3ecf8e]">反向经营</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-[#b4b4b4]">专业的资本辅导与资源对接平台。六个月里完成诊断、学习和路演。</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <SubmitProjectButton className="inline-flex h-10 items-center rounded-md bg-[#3ecf8e] px-4 text-sm font-medium text-[#171717] hover:bg-[#4de0a0]" />
              <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-white/15 bg-[#242424] px-4 text-sm text-white hover:border-white/30">
                BP 诊断
              </a>
              <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center px-2 text-sm text-[#3ecf8e] hover:underline">
                公众号文章
              </a>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#242424] shadow-[0_0_0_1px_rgba(62,207,142,0.08),0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3 font-mono text-xs text-[#898989]">
              <span className="h-2 w-2 rounded-full" style={{ background: GREEN }} />
              平台
            </div>
            {[
              ["资本辅导", "诊断 · 学习 · 路演", "#system"],
              ["资源对接", "项目 · 机构 · 嘉宾", "/discover"],
              ["BP 诊断", "上传商业计划书", LABS_URL],
              ["公众号文章", "关于我们", ABOUT_URL],
            ].map(([title, meta, href]) => (
              <a key={title} href={href} {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className="flex items-center justify-between gap-4 border-t border-white/10 px-4 py-4 first:border-t-0 hover:bg-white/5">
                <span>
                  <span className="block text-sm">{title}</span>
                  <span className="mt-1 block font-mono text-xs text-[#898989]">{meta}</span>
                </span>
                <span className="font-mono text-xs text-[#3ecf8e]">打开</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <PortalDepth tone="supabase" />


      <section className="px-5 py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col items-start justify-between gap-6 rounded-lg border border-[#3ecf8e]/40 bg-[#171717] px-6 py-10 sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="text-3xl font-medium tracking-tight">先看公众号文章，或直接投递项目。</h2>
            <p className="mt-2 text-sm text-[#b4b4b4]">关于我们写在这篇公众号文章里。BP 诊断不需要登录。</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md bg-[#3ecf8e] px-4 text-sm font-medium text-[#171717]">
              打开公众号文章
            </a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border border-white/15 px-4 text-sm">
              BP 诊断
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-4 px-5 py-8 text-sm text-[#898989] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2 text-sm text-white">
            <span className="h-2 w-2 rounded-full bg-[#3ecf8e]" />
            培驰
          </span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <a href={ABOUT_URL} target="_blank" rel="noreferrer" className="hover:text-white">公众号文章</a>
            <a href={LABS_URL} target="_blank" rel="noreferrer" className="hover:text-white">BP 诊断</a>
            <Link href="/discover" className="hover:text-white">发现</Link>
            <Link href="/me" className="hover:text-white">我的</Link>
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
