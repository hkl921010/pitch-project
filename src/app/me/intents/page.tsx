"use client";

import { Check, Gift, LogIn, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ReceivedIntentList, SentIntentList } from "@/components/biz/intent-list";
import { TEAM_ROLE } from "@/components/biz/workspace-manage";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Card, EmptyState, PageHeader, ProgressBar, ProjectLogo } from "@/components/ui/display";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/data/time";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { getPerson, intentsReceived, intentsSent, useDB, useQuota, useViewer } from "@/store/selectors";

export default function MyIntentsPage() {
  return (
    <Suspense>
      <MyIntents />
    </Suspense>
  );
}

function MyIntents() {
  const db = useDB();
  const viewer = useViewer();
  const quota = useQuota();
  const requireLogin = useApp((s) => s.requireLogin);
  const respondInvite = useApp((s) => s.respondInvite);
  const toast = useApp((s) => s.toast);
  const [tab, setTab] = useQueryParam<"sent" | "received" | "invites">("tab", "sent");

  if (!viewer) {
    return (
      <Page>
        <EmptyState icon={LogIn} title="登录后查看你的意向" action={<Button variant="primary" onClick={() => requireLogin("登录后查看你的意向")}>登录</Button>} />
      </Page>
    );
  }
  const sent = intentsSent(db, viewer.id);
  const received = intentsReceived(db, viewer.id);
  const invites = db.projects.flatMap((p) => p.team.filter((t) => t.personId === viewer.id && t.status === "invited").map((t) => ({ project: p, member: t })));

  return (
    <Page>
      <PageHeader
        title="我的意向"
        desc="发出的、收到的意向和项目成员邀请都在这里。对方接受后会自动开启对话。"
        actions={
          quota ? (
            <Card className="flex min-w-[260px] items-center gap-4 px-4 py-3" padded={false}>
              <div className="flex-1">
                <p className="text-xs text-gray-500">本月意向次数</p>
                {quota.unlimited ? (
                  <p className="text-sm font-semibold text-gray-900">会员 · 不限次数</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-gray-900">
                      已用 {quota.used} / {quota.limit}
                      <span className="ml-1 text-xs font-normal text-gray-500">（含任务奖励 {quota.bonus}）</span>
                    </p>
                    <ProgressBar value={Math.round((quota.used / quota.limit) * 100)} className="mt-1.5" tone={quota.remaining ? "brand" : "highlight"} />
                  </>
                )}
              </div>
              {!quota.unlimited ? (
                <Button size="xs" variant="secondary" iconLeft={Gift} href="/rewards">
                  赚次数
                </Button>
              ) : null}
            </Card>
          ) : null
        }
      />
      <Tabs
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "sent", label: "我发出的", count: sent.length },
          { value: "received", label: "我收到的", count: received.filter((i) => i.status === "pending").length, dot: received.some((i) => i.status === "pending") },
          { value: "invites", label: "成员邀请", count: invites.length, dot: invites.length > 0 },
        ]}
      />
      <div className="mt-6">
        {tab === "sent" ? (
          <>
            <p className="mb-4 text-sm text-gray-500">对方接受后会自动开启对话；7 天没有回应会显示“暂未回应”，之后可以再试一次。等待中的意向可以撤回（次数不退回）。</p>
            <SentIntentList intents={sent} />
          </>
        ) : null}
        {tab === "received" ? <ReceivedIntentList intents={received} /> : null}
        {tab === "invites" ? (
          invites.length ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {invites.map(({ project, member }) => {
                const owner = getPerson(db, project.ownerId);
                return (
                  <Card key={project.id} className="flex flex-col gap-4">
                    <div className="flex items-start gap-3">
                      <ProjectLogo text={project.logoText} tone={project.logoTone} size="lg" />
                      <div className="min-w-0 flex-1">
                        <Link href={`/p/${project.slug}`} className="font-semibold text-gray-900 hover:text-brand-700">
                          {project.name}
                        </Link>
                        <p className="text-sm text-gray-500">{project.oneLiner}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {owner ? <Avatar name={owner.name} tone={owner.avatarTone} size="xs" /> : null}
                      {owner?.name} 于 {formatDate(member.invitedAt)} 邀请你担任 <b>{member.title}</b>
                    </div>
                    <p className="text-xs text-gray-500">
                      确认后，项目会出现在你的个人主页上，你也会出现在项目的团队里。
                      {member.role !== "member" ? `你将获得「${TEAM_ROLE[member.role].label}」权限：${TEAM_ROLE[member.role].desc}。` : ""}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="primary"
                        iconLeft={Check}
                        onClick={() => {
                          respondInvite(project.id, true);
                          toast({ tone: "success", title: `已加入${project.name}`, body: "项目已出现在你的主页上" });
                        }}
                      >
                        确认加入
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        iconLeft={X}
                        onClick={() => {
                          respondInvite(project.id, false);
                          toast({ tone: "info", title: "已婉拒邀请" });
                        }}
                      >
                        婉拒
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white">
              <EmptyState compact icon={UserPlus} title="没有待确认的成员邀请" desc="项目方邀请你成为成员时会出现在这里" />
            </div>
          )
        ) : null}
      </div>
    </Page>
  );
}
