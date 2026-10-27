"use client";

import { Bell, Eye, Mail, MailX, MessageCircle, QrCode, Send } from "lucide-react";
import { Suspense, useEffect, useState } from "react";

import { buildDigest, DIGEST_ROLE_LABEL, digestHasTodo, digestPeriod, digestRoleOf, digestSummary } from "@/components/biz/digest";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui/display";
import { Checkbox, Input, RadioCards, Toggle } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { DEFAULT_INSTANT, DIGEST_FREQUENCY, NOTIFICATION_GROUPS, NOTIFICATION_TYPES, type NotificationGroup } from "@/data/constants";
import { formatDateTime, relativeTime } from "@/data/time";
import type { DigestFrequency, NotificationType } from "@/data/types";
import { useQueryParam } from "@/lib/use-query";
import { notifyPrefsOf, useApp } from "@/store/app-store";
import { useDB, useViewer } from "@/store/selectors";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function DigestSettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}

function Settings() {
  const db = useDB();
  const viewer = useViewer();
  const update = useApp((s) => s.updateNotifyPrefs);
  const send = useApp((s) => s.sendTestDigest);
  const toast = useApp((s) => s.toast);
  const requireLogin = useApp((s) => s.requireLogin);
  const [unsub, setUnsub] = useQueryParam<string>("unsubscribe", "");
  const [qrOpen, setQrOpen] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    if (window.location.hash !== "#instant") return;
    const t = setTimeout(() => document.getElementById("instant")?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    return () => clearTimeout(t);
  }, []);

  if (!viewer) {
    return (
      <Page narrow>
        <Card className="mt-10">
          <EmptyState
            icon={Bell}
            title="登录后设置周报和提醒"
            desc="创始人收到项目数据周报，投资人收到观察清单和符合偏好的项目。"
            action={
              <>
                <Button variant="primary" onClick={() => requireLogin("登录后设置周报和提醒")}>
                  登录
                </Button>
                <Button href="/digest/preview">先看看周报长什么样</Button>
              </>
            }
          />
        </Card>
      </Page>
    );
  }

  const prefs = notifyPrefsOf(db, viewer.id);
  const role = digestRoleOf(db, viewer);
  const data = buildDigest(db, viewer, role);
  const summary = data ? digestSummary(data) : null;
  const period = digestPeriod();
  const wechatLive = prefs.wechatBound && prefs.wechatOn;
  const emailLive = !!prefs.email && prefs.emailOn;
  const channels = [wechatLive && "服务号", emailLive && "邮箱"].filter(Boolean).join("和");
  const skip = prefs.frequency === "important" && data && !digestHasTodo(data);

  const saveEmail = () => {
    const v = email.trim();
    if (!EMAIL_RE.test(v)) return setEmailError("邮箱格式不对");
    update({ email: v, emailOn: true });
    setEditingEmail(false);
    setEmailError("");
    toast({ tone: "success", title: "邮箱已保存", body: "下一期周报会同时发到这个邮箱" });
  };

  const toggleInstant = (t: NotificationType, on: boolean) => update({ instant: on ? [...prefs.instant, t] : prefs.instant.filter((x) => x !== t) });

  return (
    <Page>
      <PageHeader
        title="周报与提醒"
        desc="需要你回应的事即时推送到服务号，其余汇总成每周一份周报。站内通知中心始终保留全部记录。"
        actions={
          <Button iconLeft={Bell} href="/notifications">
            通知中心
          </Button>
        }
      />

      {unsub === "email" && prefs.emailOn ? (
        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-25 p-4 sm:flex-row sm:items-center">
          <MailX size={20} className="shrink-0 text-warning-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-warning-700">确认退订邮件周报？</p>
            <p className="text-sm text-warning-700">退订后不再发邮件，服务号和站内通知不受影响。</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setUnsub("")}>
              保留
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                update({ emailOn: false });
                setUnsub("");
                toast({ tone: "success", title: "已退订邮件周报", body: "随时可以在这里重新开启" });
              }}
            >
              退订
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <h2 className="text-base font-semibold text-gray-900">接收渠道</h2>
            <p className="text-sm text-gray-500">设置会自动保存</p>
            <div className="mt-4 flex flex-col divide-y divide-gray-100">
              <div className="flex flex-wrap items-center gap-3 py-4 first:pt-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600">
                  <MessageCircle size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Pitch 创业服务（服务号）</p>
                  <p className="text-sm text-gray-500">{prefs.wechatBound ? "已关注 · 即时提醒和周报都会推送到这里" : "还没关注，关注后才能收到微信里的提醒"}</p>
                </div>
                {prefs.wechatBound ? (
                  <Toggle checked={prefs.wechatOn} onChange={(v) => update({ wechatOn: v })} label={<span className="sr-only">服务号推送</span>} />
                ) : (
                  <Button size="sm" variant="primary" iconLeft={QrCode} onClick={() => setQrOpen(true)}>
                    关注服务号
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-start gap-3 py-4 last:pb-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Mail size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">邮件</p>
                  {prefs.email && !editingEmail ? (
                    <p className="text-sm text-gray-500">
                      {prefs.email} ·{" "}
                      <button
                        type="button"
                        className="font-semibold text-brand-700 hover:underline"
                        onClick={() => {
                          setEmail(prefs.email ?? "");
                          setEditingEmail(true);
                        }}
                      >
                        修改
                      </button>
                    </p>
                  ) : (
                    <div className="mt-2 flex max-w-md flex-col gap-2 sm:flex-row sm:items-start">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError("");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && saveEmail()}
                        placeholder="name@company.com"
                        error={emailError}
                        wrapperClassName="min-w-0 flex-1"
                        aria-label="邮箱"
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={saveEmail} disabled={!email.trim()}>
                          保存
                        </Button>
                        {editingEmail ? (
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditingEmail(false);
                              setEmailError("");
                            }}
                          >
                            取消
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                  {!prefs.email && !editingEmail ? <p className="mt-1 text-xs text-gray-500">邮件版内容更完整，适合在电脑上看。</p> : null}
                </div>
                <Toggle checked={prefs.emailOn && !!prefs.email} disabled={!prefs.email} onChange={(v) => update({ emailOn: v })} label={<span className="sr-only">邮件周报</span>} />
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900">周报频率</h2>
            <p className="mb-4 text-sm text-gray-500">你收到的是{DIGEST_ROLE_LABEL[role]}，内容按你的身份和数据生成</p>
            <RadioCards<DigestFrequency>
              columns={3}
              value={prefs.frequency}
              onChange={(v) => update({ frequency: v })}
              options={(Object.keys(DIGEST_FREQUENCY) as DigestFrequency[]).map((k) => ({ value: k, title: DIGEST_FREQUENCY[k].label, desc: DIGEST_FREQUENCY[k].desc }))}
            />
            <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
              {prefs.frequency === "off"
                ? "不会发送周报。需要回应的事仍会即时提醒。"
                : !channels
                  ? "服务号和邮件都没开启，周报只能在这里预览。"
                  : skip
                    ? `本周没有待办，${formatDateTime(period.send)} 这一期会跳过。`
                    : `下一期 ${formatDateTime(period.send)} 发送到${channels}。`}
            </p>
          </Card>

          <Card id="instant" className="scroll-mt-24">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-gray-900">即时推送到服务号</h2>
                <p className="text-sm text-gray-500">勾选的类型发生时立刻推送；没勾选的只进通知中心，并汇总进周报</p>
              </div>
              <Button size="sm" variant="link" disabled={!wechatLive} onClick={() => update({ instant: DEFAULT_INSTANT })}>
                恢复默认
              </Button>
            </div>
            {!wechatLive ? <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{prefs.wechatBound ? "服务号推送已关闭，下面的设置暂不生效。" : "关注服务号后才能设置即时推送。"}</p> : null}
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(Object.keys(NOTIFICATION_GROUPS) as NotificationGroup[]).map((g) => (
                <div key={g}>
                  <p className="mb-2 text-xs font-semibold text-gray-500">{NOTIFICATION_GROUPS[g]}</p>
                  <div className="flex flex-col gap-3">
                    {(Object.keys(NOTIFICATION_TYPES) as NotificationType[])
                      .filter((t) => NOTIFICATION_TYPES[t].group === g)
                      .map((t) => (
                        <Checkbox key={t} disabled={!wechatLive} checked={prefs.instant.includes(t)} onChange={(v) => toggleInstant(t, v)} label={NOTIFICATION_TYPES[t].label} hint={NOTIFICATION_TYPES[t].desc} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="flex min-w-0 flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-gray-900">下一期</h2>
              <Badge tone="brand">{DIGEST_ROLE_LABEL[role]}</Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">{formatDateTime(period.send)}</p>
            {summary ? (
              <dl className="mt-4 flex flex-col gap-2 rounded-lg bg-gray-50 p-3 text-sm">
                {summary.fields.map(([k, v]) => (
                  <div key={k} className="flex gap-3">
                    <dt className="w-[6em] shrink-0 text-gray-500">{k}</dt>
                    <dd className="min-w-0 flex-1 text-gray-900">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" variant="primary" iconLeft={Eye} href="/digest/preview">
                预览邮件
              </Button>
              <Button size="sm" variant="secondary" iconLeft={MessageCircle} href="/digest/preview?channel=wechat">
                预览服务号
              </Button>
            </div>
            <Button
              size="sm"
              variant="tertiary"
              iconLeft={Send}
              className="mt-2 w-full"
              disabled={!prefs.wechatBound && !prefs.email}
              onClick={() => {
                const ch = prefs.wechatBound ? "wechat" : "email";
                send(ch);
                toast({ tone: "success", title: ch === "wechat" ? "已发送到你的服务号" : `已发送到 ${prefs.email}` });
              }}
            >
              发一份测试{prefs.lastTestAt ? `（上次 ${relativeTime(prefs.lastTestAt)}）` : ""}
            </Button>
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-gray-900">三个版本</h2>
            <ul className="mt-3 flex flex-col gap-3 text-sm">
              {[
                { k: "founder", d: "项目的浏览、关注、意向和来源变化，等你回应的意向，本周值得做的事，关注你赛道的投资人。" },
                { k: "investor", d: "观察清单的新动态，符合投资偏好的新项目，答疑预约。" },
                { k: "general", d: "等你回应的事，和你身份相关的“正在寻找”与岗位，以及热门项目。" },
              ].map((x) => (
                <li key={x.k} className={x.k === role ? "rounded-lg bg-brand-25 p-2.5 ring-1 ring-brand-200" : "p-2.5"}>
                  <p className="font-semibold text-gray-900">
                    {DIGEST_ROLE_LABEL[x.k as keyof typeof DIGEST_ROLE_LABEL]}
                    {x.k === role ? <span className="ml-1.5 text-xs font-medium text-brand-700">你收到的</span> : null}
                  </p>
                  <p className="mt-0.5 text-gray-500">{x.d}</p>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      <Modal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        size="sm"
        title="关注 Pitch 创业服务"
        desc="用微信扫码关注。原型里点下面的按钮模拟扫码完成。"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              update({ wechatBound: true, wechatOn: true });
              setQrOpen(false);
              toast({ tone: "success", title: "已关注服务号", body: "需要你回应的事会即时推送到微信" });
            }}
          >
            我已扫码关注
          </Button>
        }
      >
        <div className="mx-auto grid h-44 w-44 grid-cols-9 gap-0.5 rounded-xl border border-gray-200 p-3" aria-hidden>
          {Array.from({ length: 81 }, (_, i) => (
            <span key={i} className={(i * 7 + (i % 5) * 3) % 3 === 0 || [0, 1, 2, 9, 11, 18, 19, 20, 6, 7, 8, 15, 17, 24, 25, 26, 54, 55, 56, 63, 65, 72, 73, 74].includes(i) ? "bg-gray-900" : "bg-white"} />
          ))}
        </div>
      </Modal>
    </Page>
  );
}
