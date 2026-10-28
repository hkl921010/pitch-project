"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { PortalCompare } from "@/components/biz/portal-compare";
import { PortalDepth } from "@/components/biz/portal-depth";
import { ABOUT_URL } from "@/data/academy";
import { useApp } from "@/store/app-store";
import { useViewer } from "@/store/selectors";

const LABS_URL = "https://labs.dev.pitchxyz.com";
const GREEN = "#3ecf8e";

const FILES = [
  { name: "诊断.md", lines: ["# 先把企业看穿", "", "- 赛道：天花板、增速、渗透率", "- 模式：增长、效率、复制、壁垒", "- 财务：投资人会翻的三张表", "- 叙事：值钱这件事能不能讲清楚"] },
  { name: "学习.md", lines: ["# 十四节系统课", "", "道 · 看懂资本，从本质到终局", "略 · 重新看懂自己的企业", "术 · 估值、财务、架构与路演"] },
  { name: "路演.md", lines: ["# 每一次集中授课，都有一场真路演", "", "4 大模块，每 1–2 个月一次", "每个模块含 1 场路演实战", "毕业模块做成 2 天资本对接大会"] },
  { name: "对接.md", lines: ["# 正在开放", "", "拾光茶事 · 天使+ 800 万", "跃迁智能 · 跨境服务商渠道", "野径 · 欧洲线下户外连锁", "毛球星球 · 北美宠物连锁"] },
] as const;

const TABLE = [
  { name: "拾光茶事", track: "消费", ask: "天使+ 800 万", place: "深圳 · 新加坡", slug: "shiguang-tea" },
  { name: "跃迁智能", track: "AI", ask: "跨境渠道", place: "杭州", slug: "leap-ai" },
  { name: "野径", track: "户外", ask: "欧洲渠道", place: "厦门", slug: "wildpath" },
  { name: "毛球星球", track: "硬件", ask: "北美宠物连锁", place: "深圳", slug: "fur-planet" },
] as const;

function ConsoleTable() {
  const [track, setTrack] = useState("全部");
  const [row, setRow] = useState(0);
  const tracks = ["全部", "消费", "AI", "户外", "硬件"];
  const rows = TABLE.filter((item) => track === "全部" || item.track === track);
  const active = rows[Math.min(row, rows.length - 1)] ?? rows[0];
  return (
    <section className="border-t border-white/10 bg-[#141414]">
      <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-12 lg:grid-cols-[minmax(0,1.3fr)_280px]">
        <div>
          <p className="font-mono text-xs text-[#3ecf8e]">open projects</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {tracks.map((item) => (
              <button key={item} type="button" onClick={() => { setTrack(item); setRow(0); }} className={item === track ? "rounded-md bg-[#3ecf8e] px-3 py-1 font-mono text-xs text-[#171717]" : "rounded-md border border-white/10 px-3 py-1 font-mono text-xs text-[#b4b4b4]"}>
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-white/10">
            {rows.map((item, index) => (
              <button key={item.slug} type="button" onClick={() => setRow(index)} className={active?.slug === item.slug ? "grid w-full grid-cols-[1.2fr_0.6fr_1fr] gap-3 border-t border-white/10 bg-white/5 px-4 py-3 text-left first:border-t-0" : "grid w-full grid-cols-[1.2fr_0.6fr_1fr] gap-3 border-t border-white/10 px-4 py-3 text-left first:border-t-0 hover:bg-white/5"}>
                <span className="text-sm">{item.name}</span>
                <span className="font-mono text-xs text-[#898989]">{item.track}</span>
                <span className="font-mono text-xs text-[#3ecf8e]">{item.ask}</span>
              </button>
            ))}
          </div>
        </div>
        {active ? (
          <div className="rounded-lg border border-white/10 bg-[#171717] p-5">
            <p className="font-mono text-xs text-[#898989]">{active.place}</p>
            <p className="mt-3 text-2xl">{active.name}</p>
            <p className="mt-2 font-mono text-sm text-[#3ecf8e]">{active.ask}</p>
            <Link href={`/p/${active.slug}`} className="mt-6 inline-flex font-mono text-xs text-white underline">打开记录</Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function SupabasePortal() {
  const [file, setFile] = useState(0);
  const current = FILES[file];
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
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#171717] shadow-[0_0_0_1px_rgba(62,207,142,0.08),0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="h-2 w-2 rounded-full" style={{ background: GREEN }} />
              <div className="scrollbar-none flex gap-1 overflow-x-auto" role="tablist" aria-label="终端文件">
                {FILES.map((item, index) => (
                  <button key={item.name} type="button" role="tab" aria-selected={file === index} onClick={() => setFile(index)} className={index === file ? "rounded-md bg-[#242424] px-3 py-1.5 font-mono text-xs text-[#3ecf8e]" : "rounded-md px-3 py-1.5 font-mono text-xs text-[#898989] hover:text-white"}>
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
            <pre key={current.name} className="min-h-[280px] px-5 py-5 font-mono text-sm leading-7 text-[#d4d4d4] animate-portal-scene">
              {current.lines.map((line, lineIndex) => (
                <span key={lineIndex} className="block">
                  {line.startsWith("# ") ? <span className="text-[#3ecf8e]">{line}</span> : line || " "}
                </span>
              ))}
              <span className="mt-2 inline-block h-4 w-2 bg-[#3ecf8e] align-middle" />
            </pre>
          </div>
        </div>
      </section>

      <ConsoleTable />

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
