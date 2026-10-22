"use client";

import { ArrowLeft, ChevronDown, Eye, Lock, PencilLine, Share2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Suspense } from "react";

import { ReceivedIntentList } from "@/components/biz/intent-list";
import { EXPOSURE_MIN_COMPLETION, ExposurePanel, OverviewPanel, SharePanel, WallBadge, type WorkspaceTab } from "@/components/biz/workspace";
import { FeedbackPanel, TEAM_ROLE, TeamPanel, UpdatesPanel } from "@/components/biz/workspace-manage";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Dropdown, MenuItem } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { canManageProject, getProjectBySlug, INTENT_WAIT_DAYS, projectCompletion, responseLabel, useDB, useViewer } from "@/store/selectors";

/** 只有创建者和管理员能处理的分区；编辑看到的是锁定说明。 */
const MANAGER_ONLY: WorkspaceTab[] = ["intents", "team", "exposure"];

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardView />
    </Suspense>
  );
}

function DashboardView() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const db = useDB();
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  const [tab, setTab] = useQueryParam<WorkspaceTab>("tab", "overview");
  const project = getProjectBySlug(db, slug);

  if (!viewer) {
    return (
      <Page narrow>
        <EmptyState icon={Lock} title="登录后进入项目工作台" action={<Button variant="primary" onClick={() => requireLogin("登录后进入项目工作台")}>登录</Button>} />
      </Page>
    );
  }
  if (!project) {
    return (
      <Page narrow>
        <EmptyState icon={Lock} title="项目不存在" desc="可能已被删除，或链接有误" action={<Button href="/">回到首页</Button>} />
      </Page>
    );
  }
  const me = project.team.find((t) => t.personId === viewer.id && t.status === "confirmed");
  if (!me || me.role === "member") {
    return (
      <Page narrow>
        <EmptyState
          icon={Lock}
          title="工作台只对项目管理员和编辑开放"
          desc={me ? "你是项目成员，项目已展示在你的主页上。需要编辑权限请联系创建者。" : "你不是这个项目的成员。"}
          action={
            <Button href={`/p/${project.slug}`} iconLeft={ArrowLeft}>
              回到项目页
            </Button>
          }
        />
      </Page>
    );
  }

  const manage = canManageProject(project, viewer.id);
  const mine = db.projects.filter((p) => p.team.some((t) => t.personId === viewer.id && t.status === "confirmed" && t.role !== "member"));
  const intents = db.intents.filter((i) => i.projectId === project.id);
  const pending = intents.filter((i) => i.status === "pending").length;
  const feedbackTodo = db.feedback.filter((f) => f.projectId === project.id && !f.reply && !f.helpful).length;
  const invited = project.team.filter((t) => t.status === "invited").length;
  const completion = projectCompletion(project);
  const locked = !manage && MANAGER_ONLY.includes(tab);
  const response = responseLabel(project.responseHours);
  const tabLabel = (t: WorkspaceTab, text: string) =>
    !manage && MANAGER_ONLY.includes(t) ? (
      <span className="flex items-center gap-1">
        {text}
        <Lock size={12} className="text-gray-400" />
      </span>
    ) : (
      text
    );

  return (
    <Page>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <ProjectLogo text={project.logoText} tone={project.logoTone} size="xl" />
          <div className="min-w-0">
            {mine.length > 1 ? (
              <Dropdown
                align="left"
                width={280}
                trigger={() => (
                  <button type="button" className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-700">
                    项目工作台
                    <ChevronDown size={16} />
                  </button>
                )}
              >
                {(close) =>
                  mine.map((p) => (
                    <MenuItem
                      key={p.id}
                      active={p.id === project.id}
                      onClick={() => {
                        close();
                        router.push(`/dashboard/${p.slug}`);
                      }}
                      desc={p.oneLiner}
                    >
                      {p.name}
                    </MenuItem>
                  ))
                }
              </Dropdown>
            ) : (
              <p className="text-sm font-semibold text-gray-500">项目工作台</p>
            )}
            <h1 className="truncate text-2xl font-semibold text-gray-900 sm:text-3xl">{project.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <WallBadge wall={project.wall} />
              {project.visibility === "link" ? <Badge>仅持链接可见</Badge> : null}
              <Badge tone={response.tone}>{response.label}</Badge>
              <Badge tone="gray">你是{TEAM_ROLE[me.role].label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" iconLeft={Eye} href={`/p/${project.slug}`} className="flex-1 sm:flex-none">
            查看公开页
          </Button>
          <Button variant="primary" iconLeft={PencilLine} href={`/p/${project.slug}/edit`} className="flex-1 sm:flex-none">
            编辑资料
          </Button>
        </div>
      </div>

      <Tabs<WorkspaceTab>
        className="mt-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "overview", label: "概览" },
          { value: "intents", label: tabLabel("intents", "意向"), count: manage ? pending || undefined : undefined },
          { value: "team", label: tabLabel("team", "成员"), count: project.team.filter((t) => t.status === "confirmed").length, dot: manage && invited > 0 },
          { value: "updates", label: "动态", count: project.updates.length },
          { value: "feedback", label: "建议", count: feedbackTodo || undefined },
          { value: "exposure", label: tabLabel("exposure", "曝光"), dot: manage && project.wall === "none" && completion.percent >= EXPOSURE_MIN_COMPLETION },
          { value: "share", label: "分享物料" },
        ]}
      />

      <div className="mt-6">
        {locked ? (
          <Card>
            <EmptyState icon={Lock} title="需要管理员权限" desc="意向、成员和曝光申请由创建者或管理员处理。你可以编辑资料、发动态和处理建议。" />
          </Card>
        ) : tab === "intents" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-gray-25 p-4 text-sm text-gray-600 sm:flex-row sm:items-center">
              <Badge tone={response.tone}>{response.label}</Badge>
              <span>
                选“暂不考虑”不会通知对方；{INTENT_WAIT_DAYS} 天没回应，对方看到的都是“暂未回应”。回复意向不消耗次数。
              </span>
            </div>
            <ReceivedIntentList
              intents={intents}
              showProject={false}
              emptyAction={
                <Button size="sm" variant="secondary" iconLeft={Share2} onClick={() => setTab("share")}>
                  分享项目页
                </Button>
              }
            />
          </div>
        ) : tab === "team" ? (
          <TeamPanel project={project} viewerId={viewer.id} />
        ) : tab === "updates" ? (
          <UpdatesPanel project={project} />
        ) : tab === "feedback" ? (
          <FeedbackPanel project={project} />
        ) : tab === "exposure" ? (
          <ExposurePanel project={project} onTab={setTab} />
        ) : tab === "share" ? (
          <SharePanel project={project} />
        ) : (
          <OverviewPanel project={project} manage={manage} onTab={setTab} />
        )}
      </div>
    </Page>
  );
}
