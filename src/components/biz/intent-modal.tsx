"use client";

import { AlertCircle, Banknote, CheckCircle2, EyeOff, Gift, Handshake, HelpCircle, LifeBuoy, UserPlus } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, ProjectLogo } from "@/components/ui/display";
import { ChipSelect, RadioCards, Textarea, Toggle } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { INTENT_KIND_LABEL, PARTNER_SUBS } from "@/data/constants";
import type { IntentKind } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { anonymousProfile, getPerson, getProject, responseLabel, roleText, useDB, useQuota, useViewer } from "@/store/selectors";

const TEMPLATES: Record<IntentKind, string[]> = {
  invest: ["我们在看{track}方向的早期项目，想了解一下融资节奏和资金用途。", "看了你们的单店数据，想约 20 分钟聊聊后续扩张计划。"],
  partner: ["我们在{region}有现成的渠道资源，想聊聊合作方式。", "我们可以提供{sub}方面的支持，想了解你们现在最缺什么。"],
  join: ["我做了 5 年相关工作，对这个岗位很感兴趣，想先聊聊团队和期权安排。", "我目前开放兼职顾问，可以先从一个具体项目开始合作。"],
  help: ["我刚好认识合适的人，可以帮你介绍。", "我们之前踩过同样的坑，可以分享一下经验。"],
  other: ["想交个朋友，后续有合适的机会再深入。"],
};

/** 直接找人时的“邀请加入”：方向与项目页相反。 */
const INVITE_TEMPLATES = ["我们在做{project}，看到你开放合伙机会，想聊聊一起做的可能。", "我们{project}在找增长方向的伙伴，可以先从顾问开始合作。"];

/** 统一意向弹层：投资 / 合作 / 加入 / 帮忙 / 其他，一个入口。 */
export function IntentModal() {
  const db = useDB();
  const viewer = useViewer();
  const target = useApp((s) => s.ui.intentTarget);
  const close = useApp((s) => s.closeIntent);
  const send = useApp((s) => s.sendIntent);
  const quota = useQuota();
  const [kind, setKind] = useState<IntentKind>("partner");
  const [sub, setSub] = useState<string[]>([]);
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [error]);

  useEffect(() => {
    if (!target) return;
    if (target.type === "person") {
      const p = getPerson(useApp.getState().db, target.personId);
      setKind(target.presetKind ?? (p?.role === "talent" ? "join" : p?.role === "partner" ? "partner" : "other"));
    } else setKind(target.presetKind ?? "partner");
    setJobId(target.type === "project" ? (target.jobId ?? "") : "");
    setSub([]);
    setMessage(target.prefill ?? "");
    setAnonymous(false);
    setTried(false);
    setError(null);
    setDone(false);
  }, [target]);

  if (!target || !viewer) return null;
  const project = target.type === "project" ? getProject(db, target.projectId) : undefined;
  const person = target.type !== "project" ? getPerson(db, target.personId) : project ? getPerson(db, project.ownerId) : undefined;
  const need = target.type === "project" ? project?.lookingFor.find((n) => n.id === target.needId) : undefined;
  const offer = target.type === "person" && target.offerId ? person?.openStatus.offers?.find((o) => o.id === target.offerId) : undefined;
  const direct = target.type === "person";
  const myProject = db.projects.find((p) => p.ownerId === viewer.id);
  const resp = responseLabel(project?.responseHours ?? null);
  const noQuota = !!quota && !quota.unlimited && quota.remaining <= 0;
  const msgError = tried && message.trim().length < 10 ? "至少 10 个字，说明你是谁、想聊什么" : undefined;

  const fill = (tpl: string) =>
    setMessage(
      tpl
        .replace("{track}", project?.track ?? "这个")
        .replace("{region}", viewer.city || "当地")
        .replace("{sub}", offer?.title ?? sub[0] ?? "渠道")
        .replace("{project}", myProject ? `「${myProject.name}」` : "一个新项目"),
    );
  const templates = direct && kind === "join" ? INVITE_TEMPLATES : TEMPLATES[kind];

  const submit = () => {
    setTried(true);
    if (message.trim().length < 10 || noQuota) return;
    const subValue = kind === "partner" ? (offer?.title ?? sub[0]) : undefined;
    const res = send({ target: target.type === "project" ? { ...target, jobId: kind === "join" ? jobId || undefined : undefined } : target, kind, sub: subValue, message: message.trim(), anonymous });
    if (!res.ok) return setError(res.reason);
    setDone(true);
  };

  if (done) {
    return (
      <Modal open onClose={close} size="sm">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-100 text-success-600 ring-8 ring-success-50">
            <CheckCircle2 size={28} />
          </span>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">意向已发出</h3>
          <p className="text-sm text-gray-600">
            {anonymous ? "对方只会看到匿名概要（身份类型与偏好），点“我也想聊”后双方身份才会互相揭晓。" : `${person?.name ?? "对方"}接受后会自动开启对话，你会收到通知。`}
            {project ? ` 项目方${resp.label}。` : ""}
          </p>
          {quota && !quota.unlimited ? <Badge tone="gray">本月还可发 {Math.max(0, quota.remaining)} 次</Badge> : null}
          <div className="mt-3 flex w-full gap-3">
            <Button className="flex-1" onClick={close}>
              继续浏览
            </Button>
            <Button className="flex-1" variant="primary" href="/me/intents" onClick={close}>
              查看我的意向
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const kindOptions = direct
        ? [
            { value: "partner" as IntentKind, title: "想合作", desc: offer ? `想要：${offer.title}` : "渠道、流量、品牌、服务", icon: Handshake },
            { value: "join" as IntentKind, title: "邀请 TA 加入", desc: "合伙、全职或顾问，在说明里介绍你的项目", icon: UserPlus },
            { value: "other" as IntentKind, title: "其他", desc: "交个朋友、请教问题", icon: HelpCircle },
          ]
        : [
          { value: "invest" as IntentKind, title: "想投资", desc: "对方会看到你的投资偏好", icon: Banknote },
          { value: "partner" as IntentKind, title: "想合作", desc: "供应链、渠道，或按对方写的方式合作", icon: Handshake },
          { value: "other" as IntentKind, title: "其他", desc: "交个朋友、请教问题", icon: HelpCircle },
        ];

  return (
    <Modal
      open
      onClose={close}
      size="lg"
      title="表达意向"
      desc="一个入口代替“查看联系方式 / 发起连接”。对方接受后在站内对话，联系方式由双方自愿交换。"
      footer={
        <>
          <span className="mr-auto hidden items-center text-sm text-gray-500 sm:flex">
            {quota?.unlimited ? "会员 · 不限次数" : `本次消耗 1 次 · 本月剩余 ${quota?.remaining ?? 0} 次`}
          </span>
          <Button onClick={close}>取消</Button>
          <Button variant="primary" onClick={submit} disabled={noQuota}>
            {anonymous ? "匿名发送" : "发送意向"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-25 p-3">
          {project ? <ProjectLogo text={project.logoText} tone={project.logoTone} /> : person ? <Avatar name={person.name} tone={person.avatarTone} /> : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">{project ? project.name : person?.name}</p>
            <p className="truncate text-xs text-gray-500">
              {need ? `正在寻找：${need.title}` : offer ? `能提供：${offer.title}` : project ? project.oneLiner : [roleText(person), person?.title, person?.org].filter(Boolean).join(" · ")}
            </p>
          </div>
          {project ? <Badge tone={resp.tone} size="xs">{resp.label}</Badge> : null}
        </div>

        {noQuota ? (
          <div className="flex items-start gap-3 rounded-lg border border-warning-200 bg-warning-50 p-3 text-sm text-warning-700">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">本月意向次数已用完</p>
              <p className="mt-0.5">完成贡献任务（发布动态、刷新开放状态）每项 +1 次，或开通会员不限次数。</p>
            </div>
            <Button size="xs" variant="secondary" iconLeft={Gift} href="/rewards" onClick={close}>
              去做任务
            </Button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">你想</span>
          <RadioCards<IntentKind> value={kind} onChange={setKind} columns={direct ? 3 : 2} options={kindOptions} />
        </div>

        {kind === "partner" && !offer && !need ? (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-gray-700">合作方向</span>
            <ChipSelect options={PARTNER_SUBS} value={sub} onChange={setSub} size="sm" />
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <Textarea
            label="一句话说明来意"
            required
            placeholder="说清楚你是谁、为什么找TA、想聊什么，回复率会高很多"
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
            maxCount={200}
            rows={3}
            error={msgError}
          />
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs text-gray-500">试试：</span>
            {templates.map((t, i) => (
              <button key={i} onClick={() => fill(t)} className="max-w-full truncate rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200">
                {t.replace(/\{\w+\}/g, "…").slice(0, 18)}…
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-gray-200 p-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Toggle checked={anonymous} onChange={setAnonymous} label="匿名发送" hint="对方点“我也想聊”后，双方身份同时揭晓；对方选择“暂不考虑”则永远不会知道是你。" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-gray-500">对方会看到</p>
            <div className={cn("flex items-center gap-3 rounded-lg border p-3", anonymous ? "border-dashed border-gray-300 bg-gray-50" : "border-gray-200 bg-white")}>
              <Avatar name={viewer.name} tone={viewer.avatarTone} anonymous={anonymous} />
              <div className="min-w-0">
                {anonymous ? (
                  <>
                    <p className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                      <EyeOff size={14} />
                      匿名{roleText(viewer)}
                    </p>
                    <p className="line-clamp-2 text-xs text-gray-500">{anonymousProfile(db, viewer)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-900">{viewer.name}</p>
                    <p className="truncate text-xs text-gray-500">
                      {roleText(viewer)}
                      {viewer.org ? ` · ${viewer.org}` : ""}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div
            ref={errorRef}
            role="alert"
            className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700"
          >
            <AlertCircle size={16} />
            {error}
            {error.includes("等待") ? (
              <Link href="/me/intents" onClick={close} className="ml-auto font-semibold underline">
                去看看
              </Link>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-gray-400">
          {direct && kind === "join" ? "邀请加入团队" : INTENT_KIND_LABEL[kind]} · 浏览与关注免费；非会员每月 5 次意向，回复意向不消耗次数。
        </p>
      </div>
    </Modal>
  );
}
