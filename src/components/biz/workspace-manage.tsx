"use client";

import { Copy, Eye, Megaphone, Search, Trash2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState } from "@/components/ui/display";
import { Input, RadioCards, Select, Textarea } from "@/components/ui/form";
import { ConfirmModal, Modal } from "@/components/ui/overlay";
import { UPDATE_TEMPLATES } from "@/data/constants";
import { relativeTime } from "@/data/time";
import type { Project, TeamMember, TeamRole, UpdateTemplate } from "@/data/types";
import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";
import { getPerson, roleText, useDB } from "@/store/selectors";

/* ------------------------------------------------------------------ 成员 */

export const TEAM_ROLE: Record<TeamRole, { label: string; desc: string }> = {
  owner: { label: "创建者", desc: "全部权限，唯一可以调整成员权限的人" },
  manager: { label: "管理员", desc: "编辑资料、处理意向、管理成员和曝光申请" },
  editor: { label: "编辑", desc: "编辑资料、发动态、处理建议" },
  member: { label: "成员", desc: "只展示在团队里，没有管理权限" },
};

export function TeamPanel({ project, viewerId }: { project: Project; viewerId: string }) {
  const db = useDB();
  const changeRole = useApp((s) => s.changeMemberRole);
  const remove = useApp((s) => s.removeMember);
  const toast = useApp((s) => s.toast);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const isOwner = project.ownerId === viewerId;
  const confirmed = project.team.filter((t) => t.status === "confirmed");
  const invited = project.team.filter((t) => t.status === "invited");

  const row = (m: TeamMember) => {
    const p = getPerson(db, m.personId);
    if (!p) return null;
    const self = m.personId === viewerId;
    return (
      <li key={m.personId} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar name={p.name} tone={p.avatarTone} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/u/${p.handle}`} className="text-sm font-semibold text-gray-900 hover:text-brand-700">
                {p.name}
              </Link>
              {self ? <span className="text-xs text-gray-400">（你）</span> : null}
              {m.status === "invited" ? (
                <Badge tone="warning" size="xs" dot>
                  待确认 · {relativeTime(m.invitedAt)}邀请
                </Badge>
              ) : null}
            </div>
            <p className="truncate text-sm text-gray-500">
              {m.title} · {roleText(p)}
              {p.org ? ` · ${p.org}` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-[52px] sm:pl-0">
          {m.role === "owner" ? (
            <Badge tone="dark">创建者</Badge>
          ) : isOwner ? (
            <Select
              selectSize="sm"
              aria-label={`${p.name} 的权限`}
              value={m.role}
              wrapperClassName="w-28"
              onChange={(e) => {
                changeRole(project.id, m.personId, e.target.value as TeamRole);
                toast({ tone: "success", title: `已把 ${p.name} 设为${TEAM_ROLE[e.target.value as TeamRole].label}` });
              }}
              options={(["manager", "editor", "member"] as const).map((r) => ({ value: r, label: TEAM_ROLE[r].label }))}
            />
          ) : (
            <Badge>{TEAM_ROLE[m.role].label}</Badge>
          )}
          {m.role !== "owner" && !self && (isOwner || m.role !== "manager") ? (
            m.status === "invited" ? (
              <Button
                size="sm"
                variant="tertiary"
                onClick={() => {
                  remove(project.id, m.personId);
                  toast({ tone: "info", title: "已撤回邀请" });
                }}
              >
                撤回邀请
              </Button>
            ) : (
              <Button size="sm" variant="tertiary" iconOnly={Trash2} aria-label={`移出 ${p.name}`} onClick={() => setRemoving(m)} />
            )
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="min-w-0">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-gray-900">团队成员</h3>
            <p className="text-sm text-gray-500">对方确认后，项目会出现在 TA 的个人主页上</p>
          </div>
          <Button variant="primary" iconLeft={UserPlus} onClick={() => setInviteOpen(true)}>
            邀请成员
          </Button>
        </div>
        <ul className="flex flex-col divide-y divide-gray-100">{confirmed.map(row)}</ul>
        {invited.length ? (
          <>
            <p className="mt-6 mb-3 text-xs font-semibold tracking-wide text-gray-500 uppercase">等待确认 · {invited.length}</p>
            <ul className="flex flex-col divide-y divide-gray-100">{invited.map(row)}</ul>
          </>
        ) : null}
        {confirmed.length < 2 ? (
          <div className="mt-5 flex items-start gap-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <Users size={16} className="mt-0.5 shrink-0 text-gray-400" />
            至少 2 位确认的成员，完成度清单里的“团队成员”才会打勾。投资人通常先看团队。
          </div>
        ) : null}
      </Card>

      <Card className="h-fit bg-gray-25">
        <h3 className="text-sm font-semibold text-gray-900">权限说明</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {(Object.keys(TEAM_ROLE) as TeamRole[]).map((r) => (
            <li key={r} className="text-sm">
              <span className="font-semibold text-gray-800">{TEAM_ROLE[r].label}</span>
              <span className="block text-gray-500">{TEAM_ROLE[r].desc}</span>
            </li>
          ))}
        </ul>
      </Card>

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} project={project} canAssignManager={isOwner} />
      <ConfirmModal
        open={!!removing}
        onClose={() => setRemoving(null)}
        danger
        title={`把 ${getPerson(db, removing?.personId)?.name ?? ""} 移出团队？`}
        desc="项目会从 TA 的主页上消失，TA 不会收到通知。之后可以重新邀请。"
        confirmText="移出"
        onConfirm={() => {
          if (!removing) return;
          remove(project.id, removing.personId);
          toast({ tone: "info", title: "已移出团队" });
        }}
      />
    </div>
  );
}

function InviteModal({ open, onClose, project, canAssignManager }: { open: boolean; onClose: () => void; project: Project; canAssignManager: boolean }) {
  const db = useDB();
  const invite = useApp((s) => s.inviteMember);
  const toast = useApp((s) => s.toast);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<TeamRole>("editor");
  const [tried, setTried] = useState(false);

  const inTeam = new Set(project.team.map((t) => t.personId));
  const kw = q.trim().toLowerCase();
  const candidates = db.people
    .filter((p) => !p.isOps && !inTeam.has(p.id) && p.onboarded)
    .filter((p) => !kw || [p.name, p.org, p.title, p.handle].some((s) => s.toLowerCase().includes(kw)))
    .slice(0, 6);
  const picked = getPerson(db, pick);

  const reset = () => {
    setQ("");
    setPick(null);
    setTitle("");
    setRole("editor");
    setTried(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="邀请成员"
      desc="对方确认后才会出现在团队里，项目也会出现在 TA 的主页上"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (!picked || !title.trim()) return;
              invite(project.id, picked.id, title.trim(), role);
              toast({ tone: "success", title: `已邀请 ${picked.name}`, body: "TA 会在通知和“我的意向 · 成员邀请”里看到" });
              close();
            }}
          >
            发送邀请
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {picked ? (
          <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-25 p-3">
            <Avatar name={picked.name} tone={picked.avatarTone} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{picked.name}</p>
              <p className="truncate text-xs text-gray-500">
                {picked.title} · {picked.org}
              </p>
            </div>
            <Button size="xs" variant="tertiary" onClick={() => setPick(null)}>
              换一个
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Input icon={Search} label="找人" placeholder="姓名、公司或职位" value={q} onChange={(e) => setQ(e.target.value)} error={tried && !picked ? "选择要邀请的人" : undefined} />
            {candidates.length ? (
              <ul className="flex flex-col gap-1">
                {candidates.map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setPick(p.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-gray-50">
                      <Avatar name={p.name} tone={p.avatarTone} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">{p.name}</span>
                        <span className="block truncate text-xs text-gray-500">
                          {roleText(p)} · {p.title}
                          {p.org ? ` · ${p.org}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">没找到“{q}”。TA 可能还不在 Pitch 上，可以发邀请链接。</p>
            )}
          </div>
        )}
        <Input label="在项目中的职位" required maxCount={20} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="比如：联合创始人 & COO" error={tried && !title.trim() ? "填写职位" : undefined} />
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-700">权限</span>
          <RadioCards<TeamRole>
            columns={1}
            value={role}
            onChange={setRole}
            options={(["manager", "editor", "member"] as const).map((r) => ({
              value: r,
              title: TEAM_ROLE[r].label,
              desc: r === "manager" && !canAssignManager ? "只有创建者可以设置管理员" : TEAM_ROLE[r].desc,
              disabled: r === "manager" && !canAssignManager,
            }))}
          />
        </div>
        <button
          onClick={() => {
            void navigator.clipboard?.writeText(`https://pitch.cn/join/${project.slug}`).catch(() => {});
            toast({ tone: "success", title: "邀请链接已复制", body: "对方注册后会自动收到成员邀请" });
          }}
          className="flex items-center gap-2 self-start text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          <Copy size={14} />
          TA 还不在 Pitch？复制邀请链接
        </button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ 动态 */

export function UpdatesPanel({ project }: { project: Project }) {
  const db = useDB();
  const post = useApp((s) => s.postUpdate);
  const del = useApp((s) => s.deleteUpdate);
  const toast = useApp((s) => s.toast);
  const [tpl, setTpl] = useState<UpdateTemplate>("milestone");
  const [title, setTitle] = useState(UPDATE_TEMPLATES.milestone.title);
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const followers = new Set([
    ...db.follows.filter((f) => f.targetType === "project" && f.targetId === project.id).map((f) => f.userId),
    ...db.watch.filter((w) => w.projectId === project.id).map((w) => w.userId),
  ]).size + (project.followerBase ?? 0);

  const pickTpl = (t: UpdateTemplate) => {
    if (!title.trim() || title === UPDATE_TEMPLATES[tpl].title) setTitle(UPDATE_TEMPLATES[t].title);
    setTpl(t);
  };
  const titleErr = tried && title.trim().length < 4 ? "标题至少 4 个字" : undefined;
  const bodyErr = tried && body.trim().length < 10 ? "至少 10 个字，具体的数字和事实最打动人" : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">发一条动态</h3>
            <p className="text-sm text-gray-500">选个模板，30 秒写完。会出现在项目页时间线，关注这个项目的人也会看到。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(UPDATE_TEMPLATES) as UpdateTemplate[]).map((t) => (
              <button
                key={t}
                onClick={() => pickTpl(t)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                  tpl === t ? "border-brand-600 bg-brand-25 text-brand-800 shadow-[0_0_0_1px_var(--color-brand-600)]" : "border-gray-200 text-gray-700 hover:border-gray-300",
                )}
              >
                {UPDATE_TEMPLATES[t].label}
              </button>
            ))}
          </div>
          <Input label="标题" required maxCount={40} value={title} onChange={(e) => setTitle(e.target.value)} error={titleErr} />
          <Textarea label="内容" required rows={4} maxCount={300} value={body} onChange={(e) => setBody(e.target.value)} placeholder={UPDATE_TEMPLATES[tpl].placeholder} error={bodyErr} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-gray-500">发布后会提醒 {followers} 位关注者，并计入本月贡献任务</span>
            <Button
              variant="primary"
              iconLeft={Megaphone}
              onClick={() => {
                setTried(true);
                if (title.trim().length < 4 || body.trim().length < 10) return;
                post(project.id, tpl, title.trim(), body.trim());
                toast({ tone: "success", title: "动态已发布", body: `已提醒 ${followers} 位关注者` });
                setTried(false);
                setBody("");
                setTitle(UPDATE_TEMPLATES[tpl].title);
              }}
            >
              发布
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold text-gray-900">已发布 · {project.updates.length}</h3>
          {project.updates.length ? (
            <ul className="flex flex-col divide-y divide-gray-100">
              {project.updates.map((u) => {
                const author = getPerson(db, u.authorId);
                return (
                  <li key={u.id} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge size="xs" tone="brand">
                          {UPDATE_TEMPLATES[u.template].label}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          {author?.name} · {relativeTime(u.at)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{u.title}</p>
                      <p className="mt-0.5 text-sm text-gray-600">{u.body}</p>
                    </div>
                    <Button size="xs" variant="tertiary" iconOnly={Trash2} aria-label="删除这条动态" onClick={() => setDeleting(u.id)} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState compact icon={Megaphone} title="还没有动态" desc="上线、融资、招人、获奖、数据里程碑，都值得发一条" />
          )}
        </Card>
      </div>

      <Card className="h-fit bg-gray-25">
        <h3 className="text-sm font-semibold text-gray-900">什么样的动态有人看</h3>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-sm text-gray-600">
          <li>有数字：月流水、复购、用户数，对比上个月</li>
          <li>有进展：签约、上线、拿到认证、开新店</li>
          <li>有请求：结尾说一句你现在最需要什么</li>
          <li>两周一条刚好；周报会汇总给关注者和观察清单里的投资人</li>
        </ul>
      </Card>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        danger
        title="删除这条动态？"
        desc="项目页上会删掉，已经发出的提醒无法撤回。"
        confirmText="删除"
        onConfirm={() => {
          if (deleting) del(project.id, deleting);
          toast({ tone: "info", title: "已删除" });
        }}
      />
    </div>
  );
}
