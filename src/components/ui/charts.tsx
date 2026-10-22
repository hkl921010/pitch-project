"use client";

import { useState } from "react";

/** 面积折线图：工作台浏览趋势。 */
export function AreaChart({ data, labels, height = 180 }: { data: number[]; labels: string[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const w = 600;
  const h = height;
  const pad = { t: 12, b: 24, l: 8, r: 8 };
  const max = Math.max(1, ...data) * 1.15;
  const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, data.length - 1);
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / max);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(v)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${h - pad.b} L${x(0)},${h - pad.b} Z`;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none" onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--color-brand-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad.l} x2={w - pad.r} y1={pad.t + (h - pad.t - pad.b) * g} y2={pad.t + (h - pad.t - pad.b) * g} stroke="var(--color-gray-100)" />
        ))}
        <path d={area} fill="url(#area-fill)" />
        <path d={line} fill="none" stroke="var(--color-brand-600)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {data.map((v, i) => (
          <rect key={i} x={x(i) - (w / data.length) / 2} y={0} width={w / data.length} height={h} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null ? (
          <>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={h - pad.b} stroke="var(--color-gray-300)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx={x(hover)} cy={y(data[hover])} r="5" fill="white" stroke="var(--color-brand-600)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </>
        ) : null}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        {labels.filter((_, i) => i % Math.ceil(labels.length / 7) === 0).map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      {hover !== null ? (
        <div className="pointer-events-none absolute top-0 rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg" style={{ left: `calc(${(hover / Math.max(1, data.length - 1)) * 100}% - 32px)` }}>
          {labels[hover]} · {data[hover]} 次浏览
        </div>
      ) : null}
    </div>
  );
}

/** 水平条形：流量来源占比。 */
export function BarList({ items }: { items: { label: string; value: number; hint?: string }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <div className="relative h-9 flex-1 overflow-hidden rounded-md bg-gray-50">
            <div className="absolute inset-y-0 left-0 rounded-md bg-brand-100" style={{ width: `${(it.value / max) * 100}%` }} />
            <span className="relative flex h-full items-center px-3 text-sm font-medium text-gray-700">
              {it.label}
              {it.hint ? <span className="ml-2 text-xs font-normal text-gray-500">{it.hint}</span> : null}
            </span>
          </div>
          <span className="w-16 text-right text-sm font-medium text-gray-900 tabular-nums">{Math.round((it.value / total) * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({ data, width = 96, height = 32 }: { data: number[]; width?: number; height?: number }) {
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i * width) / Math.max(1, data.length - 1)},${height - (v / max) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke="var(--color-success-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
