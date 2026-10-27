"use client";

import { ArrowLeft, Info, Mail, MessageCircle, Send } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

import {
  buildDigest,
  DIGEST_ROLE_LABEL,
  DIGEST_SAMPLE,
  DigestEmailBody,
  digestHasTodo,
  digestPeriod,
  digestRoleOf,
  PhoneFrame,
  WechatMenu,
  WechatThread,
  type DigestData,
  type DigestRole,
} from "@/components/biz/digest";
import { Button } from "@/components/ui/button";
import { Card, EmptyState } from "@/components/ui/display";
import { Segmented } from "@/components/ui/tabs";
import { NOTIFICATION_TYPES } from "@/data/constants";
import { formatDate, formatDateTime } from "@/data/time";
import { useQueryParam } from "@/lib/use-query";
import { notifyPrefsOf, useApp } from "@/store/app-store";
import { getPerson, roleText, useDB, useViewer } from "@/store/selectors";

type Channel = "email" | "wechat";

export default function DigestPreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}

function subjectOf(d: DigestData) {
  if (d.kind === "founder") return `【Pitch 周报】${d.project.name}本周浏览 ${d.views}${d.pending.length ? `，${d.pending.length} 条意向待回应` : ""}`;
  if (d.kind === "investor") return d.fresh.length ? `【Pitch 周报】观察清单里 ${d.fresh.length} 个项目有新动态` : `【Pitch 周报】本周 ${d.matches.length} 个符合你偏好的项目`;
  return "【Pitch 精选】本周值得看的项目和需求";
}

function Preview() {
  const db = useDB();
  const viewer = useViewer();
  const send = useApp((s) => s.sendTestDigest);
  const toast = useApp((s) => s.toast);
  const own = viewer ? digestRoleOf(db, viewer) : null;
  const [role, setRole] = useQueryParam<DigestRole>("role", own ?? "founder");
  const [channel, setChannel] = useQueryParam<Channel>("channel", "email");
  const [h5, setH5] = useState(false);

  const self = !!viewer && own === role;
  const person = self ? viewer : getPerson(db, DIGEST_SAMPLE[role]);
  const data = person ? buildDigest(db, person, role) : null;
  const prefs = person ? notifyPrefsOf(db, person.id) : null;
  const period = digestPeriod();
  const canSend = self && prefs && (channel === "wechat" ? prefs.wechatBound : !!prefs.email);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-8">
          <Link href={viewer ? "/digest" : "/"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            <ArrowLeft size={16} />
            {viewer ? "提醒设置" : "返回首页"}
          </Link>
          <span className="hidden h-5 w-px bg-gray-200 sm:block" />
          <p className="font-semibold text-gray-900">周报预览</p>
          <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto">
            <Segmented
              size="sm"
              value={role}
              onChange={(r) => {
                setRole(r);
                setH5(false);
              }}
              items={(Object.keys(DIGEST_ROLE_LABEL) as DigestRole[]).map((r) => ({ value: r, label: DIGEST_ROLE_LABEL[r] }))}
            />
            <Segmented
              size="sm"
              value={channel}
              onChange={(c) => {
                setChannel(c);
                setH5(false);
              }}
              items={[
                { value: "email", label: "邮件" },
                { value: "wechat", label: "服务号" },
              ]}
            />
            {self ? (
              <Button
                size="sm"
                variant="secondary"
                iconLeft={Send}
                disabled={!canSend}
                onClick={() => {
                  send(channel);
                  toast({ tone: "success", title: channel === "wechat" ? "已发送到你的服务号" : `已发送到 ${prefs?.email}`, body: "在通知中心也能看到这条记录" });
                }}
              >
                发一份测试
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1080px] px-0 py-6 sm:px-8 sm:py-8">
        <div className="mx-4 mb-5 flex items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 sm:mx-0">
          <Info size={16} className="mt-0.5 shrink-0 text-gray-400" />
          <p className="min-w-0 flex-1">
            {self ? (
              <>
                用你的真实数据生成，统计截至现在。下一期 <span className="font-semibold text-gray-900">{formatDateTime(period.send)}</span> 发送，覆盖 {formatDate(period.from)} – {formatDate(period.to)}。
                {prefs?.frequency === "off" ? <span className="text-warning-700"> 你已关闭周报，这一期不会发送。</span> : null}
                {prefs?.frequency === "important" && data && !digestHasTodo(data) ? <span className="text-warning-700"> 你选了“有待办时才发”，本周没有待办，这一期会跳过。</span> : null}
              </>
            ) : (
              <>
                这是用 <span className="font-semibold text-gray-900">{person?.name}</span>（{roleText(person)}）的数据生成的示例。
                {own ? (
                  <>
                    你收到的是{DIGEST_ROLE_LABEL[own]}，
                    <button type="button" onClick={() => setRole(own)} className="font-semibold text-brand-700 hover:underline">
                      看我的周报
                    </button>
                  </>
                ) : (
                  "登录后会用你自己的数据生成。"
                )}
              </>
            )}
          </p>
        </div>

        {!data || !person || !prefs ? (
          <Card className="mx-4 sm:mx-0">
            <EmptyState icon={Mail} title="这个版本暂时没有内容" desc="创始人版需要至少管理一个项目" />
          </Card>
        ) : channel === "email" ? (
          <div className="mx-auto max-w-[680px]">
            <div className="mb-4 rounded-none border-y border-gray-200 bg-white px-4 py-4 sm:rounded-xl sm:border sm:px-6">
              <p className="text-lg font-semibold text-gray-900">{subjectOf(data)}</p>
              <dl className="mt-3 grid grid-cols-[3.5em_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
                <dt className="text-gray-500">发件人</dt>
                <dd className="truncate text-gray-800">Pitch 周报 &lt;weekly@pitch.cn&gt;</dd>
                <dt className="text-gray-500">收件人</dt>
                <dd className="truncate text-gray-800">{prefs.email ?? <span className="text-gray-400">未设置邮箱</span>}</dd>
                <dt className="text-gray-500">时间</dt>
                <dd className="text-gray-800">{formatDateTime(period.send)}（预计）</dd>
              </dl>
              {!prefs.email || !prefs.emailOn ? (
                <p className="mt-3 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-700">
                  {person.name}没有开启邮件周报，这里只是预览。{self ? <Link href="/digest" className="font-semibold underline">去设置邮箱</Link> : null}
                </p>
              ) : null}
            </div>
            <div className="px-2 sm:px-0">
              <DigestEmailBody db={db} data={data} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="min-w-0">
              {h5 ? (
                <PhoneFrame title="Pitch 周报" onBack={() => setH5(false)}>
                  <div className="p-2">
                    <DigestEmailBody db={db} data={data} />
                  </div>
                </PhoneFrame>
              ) : (
                <PhoneFrame title="Pitch 创业服务" scrollToEnd footer={<WechatMenu person={person} />}>
                  <WechatThread db={db} data={data} onOpen={() => setH5(true)} />
                </PhoneFrame>
              )}
            </div>
            <div className="mx-4 flex min-w-0 flex-col gap-4 sm:mx-0">
              <Card>
                <div className="flex items-center gap-2">
                  <MessageCircle size={18} className="text-success-600" />
                  <h2 className="text-base font-semibold text-gray-900">服务号里会收到什么</h2>
                </div>
                <ul className="mt-3 flex flex-col gap-3 text-sm text-gray-600">
                  <li>
                    <span className="font-semibold text-gray-900">即时提醒：</span>
                    {prefs.instant.length ? `${prefs.instant.map((t) => NOTIFICATION_TYPES[t].label).join("、")}，发生时立即推送。` : "已全部关闭。"}
                  </li>
                  <li>
                    <span className="font-semibold text-gray-900">周报：</span>每周一 09:00 一条，点“详情”打开完整周报（可以在手机里点开试试）。
                  </li>
                  <li>其余通知只进站内通知中心，不打扰你。</li>
                </ul>
                {self ? (
                  <Button size="sm" variant="secondary" href="/digest#instant" className="mt-4">
                    调整推送内容
                  </Button>
                ) : null}
              </Card>
              {!prefs.wechatBound ? (
                <Card className="border-warning-200 bg-warning-25">
                  <p className="text-sm font-semibold text-warning-700">{person.name}还没关注服务号</p>
                  <p className="mt-1 text-xs text-warning-700">关注之前，即时提醒和周报都只在站内。</p>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
