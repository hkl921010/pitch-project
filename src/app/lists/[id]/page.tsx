"use client";

import { ArrowDown, ArrowUp, Check, Link2, ListOrdered, MessageCircle, PencilLine, Plus, Search, Settings2, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Suspense, useState } from "react";

import { FollowButton } from "@/components/biz/follow-button";
import { canManageList, LIST_MAX_ITEMS, ListCard } from "@/components/biz/list-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, EmptyState, ProjectLogo } from "@/components/ui/display";
import { Input, Textarea, Toggle } from "@/components/ui/form";
import { ConfirmModal, Modal } from "@/components/ui/overlay";
import { relativeTime } from "@/data/time";
import type { CuratedList, DB, Person } from "@/data/types";
import { cn } from "@/lib/cn";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { getPerson, getProject, roleText, useDB, useViewer } from "@/store/selectors";

const NOTE_MAX = 40;

export default function ListDetailPage() {
  return (
    <Suspense>
      <ListDetailView />
    </Suspense>
  );
}

function ListDetailView() {
  const { id } = useParams<{ id: string }>();
  const db = useDB();
  const viewer = useViewer();
  const list = db.lists.find((l) => l.id === id);
  const [manageParam, setManage] = useQueryParam<"0" | "1">("manage", "0");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);

  if (!list) {
    return (
      <Page narrow>
        <Card padded={false}>
          <EmptyState icon={ListOrdered} title="这个榜单不存在或已被删除" desc="可能是链接有误，去看看其他榜单吧。" action={<Button variant="primary" href="/lists">全部榜单</Button>} />
        </Card>
      </Page>
    );
  }

  const canManage = canManageList(list, viewer);
  const manage = canManage && manageParam === "1";
  const full = list.items.length >= LIST_MAX_ITEMS;

  return (
    <Page>
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/lists" className="hover:text-gray-700">
          榜单
        </Link>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-gray-700">{list.title}</span>
      </nav>

      <Header list={list} canManage={canManage} manage={manage} onManage={(v) => setManage(v ? "1" : "0")} onEdit={() => setEditing(true)} />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {manage ? (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-brand-200 bg-brand-25 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 text-sm text-brand-800">
                正在管理：可以调整顺序、修改理由或移除。新加入的{list.kind === "project" ? "项目负责人" : "人"}和关注榜单的 {list.followers.length} 人会收到通知。
              </p>
              <Button size="sm" variant="primary" iconLeft={Plus} disabled={full} onClick={() => setAdding(true)} className="shrink-0">
                {full ? `已满 ${LIST_MAX_ITEMS} 条` : "加入一条"}
              </Button>
            </div>
          ) : null}

          {list.items.length ? (
            <ol className="flex flex-col gap-3">
              {list.items.map((it, i) => (
                <ItemRow key={it.targetId} list={list} index={i} manage={manage} />
              ))}
            </ol>
          ) : (
            <Card padded={false}>
              {canManage ? (
                <EmptyState
                  icon={ListOrdered}
                  title="榜单还是空的"
                  desc={`加入第一个${list.kind === "project" ? "项目" : "人"}，写一句为什么值得关注。`}
                  action={
                    <Button
                      variant="primary"
                      iconLeft={Plus}
                      onClick={() => {
                        setManage("1");
                        setAdding(true);
                      }}
                    >
                      加入第一条
                    </Button>
                  }
                />
              ) : (
                <EmptyState icon={ListOrdered} title="整理者还在准备内容" desc="关注这个榜单，有新收录时会通知你。" />
              )}
            </Card>
          )}
        </div>

        <Aside list={list} />
      </div>

      {canManage ? <AddItemModal open={adding} onClose={() => setAdding(false)} list={list} /> : null}
      {canManage ? <EditListModal open={editing} onClose={() => setEditing(false)} list={list} /> : null}
    </Page>
  );
}

function Header({ list, canManage, manage, onManage, onEdit }: { list: CuratedList; canManage: boolean; manage: boolean; onManage: (v: boolean) => void; onEdit: () => void }) {
  const db = useDB();
  const viewer = useViewer();
  const toggleFollow = useApp((s) => s.toggleListFollow);
  const curate = useApp((s) => s.curateList);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const curator = getPerson(db, list.curatorId);
  const following = !!viewer && list.followers.includes(viewer.id);
  const own = viewer?.id === list.curatorId;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        {list.featured ? (
          <Badge tone="highlight" size="sm" icon={Star}>
            运营精选
          </Badge>
        ) : null}
        <Badge tone="gray" size="sm">
          {list.kind === "project" ? "项目榜单" : "人物榜单"}
        </Badge>
        <span className="text-sm text-gray-400">{relativeTime(list.updatedAt)}更新</span>
      </div>
      <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            <span className="min-w-0">{list.title}</span>
            {manage ? (
              <button onClick={onEdit} aria-label="编辑榜单信息" className="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600">
                <PencilLine size={18} />
              </button>
            ) : null}
          </h1>
          {list.desc ? <p className="mt-2 text-[15px] text-gray-600">{list.desc}</p> : null}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
            {curator ? (
              <Link href={`/u/${curator.handle}`} className="flex items-center gap-2 hover:text-gray-700">
                <Avatar name={curator.name} tone={curator.avatarTone} size="xs" />
                <span>
                  <span className="font-medium text-gray-700">{curator.name}</span> · {curator.isOps ? "Pitch 运营策展" : `${roleText(curator)}整理`}
                </span>
              </Link>
            ) : null}
            <span>{list.items.length} 个{list.kind === "project" ? "项目" : "人"}</span>
            <span>{list.followers.length} 人关注</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {!own ? (
            <Button
              variant={following ? "secondary" : "primary"}
              iconLeft={following ? Check : Plus}
              onClick={() => {
                if (!viewer) return requireLogin("登录后可以关注榜单，有新收录时通知你");
                toggleFollow(list.id);
                if (!following) toast({ tone: "success", title: "已关注榜单", body: "有新收录时会通知你" });
              }}
            >
              {following ? "已关注" : "关注榜单"}
            </Button>
          ) : null}
          <Button
            variant="secondary"
            iconLeft={Link2}
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.origin + `/lists/${list.id}`).catch(() => {});
              toast({ tone: "success", title: "链接已复制" });
            }}
          >
            复制链接
          </Button>
          {canManage ? (
            <Button variant={manage ? "primary" : "secondary"} iconLeft={manage ? Check : Settings2} onClick={() => onManage(!manage)}>
              {manage ? "完成" : "管理榜单"}
            </Button>
          ) : null}
        </div>
      </div>
      {manage && viewer?.isOps ? (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <Toggle
            checked={list.featured}
            onChange={(v) => {
              curate(list.id, { featured: v });
              toast({ tone: "success", title: v ? "已设为运营精选" : "已取消精选", body: v ? "会出现在榜单页顶部、发现页和周报里" : undefined });
            }}
            label="设为运营精选"
            hint="精选榜单置顶展示，并进入发现页和周报。只有运营可以设置。"
          />
        </div>
      ) : null}
    </Card>
  );
}

function ItemRow({ list, index, manage }: { list: CuratedList; index: number; manage: boolean }) {
  const db = useDB();
  const viewer = useViewer();
  const curate = useApp((s) => s.curateList);
  const openIntent = useApp((s) => s.openIntent);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const it = list.items[index];
  const [editNote, setEditNote] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  const project = list.kind === "project" ? getProject(db, it.targetId) : undefined;
  const person = list.kind === "person" ? getPerson(db, it.targetId) : undefined;
  if (!project && !person) return null;
  const name = project?.name ?? person!.name;
  const isMember = !!viewer && !!project?.team.some((m) => m.personId === viewer.id && m.status === "confirmed");
  const isSelf = !!viewer && person?.id === viewer.id;

  const contact = () => {
    if (!viewer) return requireLogin("登录后可以表达意向");
    const prefill = `在 Pitch 榜单「${list.title}」看到你，`;
    if (project) openIntent({ type: "project", projectId: project.id, prefill });
    else openIntent({ type: "person", personId: person!.id, prefill });
  };

  const noteErr = editNote !== null && (!editNote.trim() ? "写一句收录理由" : editNote.length > NOTE_MAX ? `最多 ${NOTE_MAX} 字` : undefined);

  return (
    <li className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-xs sm:p-5">
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums", index < 3 ? "bg-primary text-white" : "bg-gray-100 text-gray-600")}>{index + 1}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Link href={project ? `/p/${project.slug}` : `/u/${person!.handle}`} className="group flex min-w-0 items-start gap-3">
            {project ? <ProjectLogo text={project.logoText} tone={project.logoTone} size="md" /> : <Avatar name={person!.name} tone={person!.avatarTone} size="md" />}
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-gray-900 group-hover:text-brand-700">{name}</span>
              <span className="mt-0.5 line-clamp-2 block text-sm text-gray-500">
                {project ? project.oneLiner : [roleText(person), person!.title, person!.org].filter(Boolean).join(" · ")}
              </span>
              <span className="mt-1.5 flex flex-wrap gap-1.5">
                {project ? (
                  <>
                    <Badge tone="gray" size="xs">
                      {project.track}
                    </Badge>
                    <Badge tone="gray" size="xs">
                      {project.region}
                    </Badge>
                  </>
                ) : person!.city ? (
                  <Badge tone="gray" size="xs">
                    {person!.city}
                  </Badge>
                ) : null}
              </span>
            </span>
          </Link>
          {!manage ? (
            <div className="flex shrink-0 items-center gap-2">
              <FollowButton targetType={project ? "project" : "person"} targetId={it.targetId} quiet size="xs" disabledSelf={isSelf} />
              {!isMember && !isSelf ? (
                <Button size="xs" variant="secondary" iconLeft={MessageCircle} onClick={contact}>
                  {project ? "表达意向" : "联系 TA"}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-1">
              <Button size="xs" variant="tertiary" iconOnly={ArrowUp} aria-label="上移" disabled={index === 0} onClick={() => curate(list.id, { move: { targetId: it.targetId, dir: -1 } })} />
              <Button
                size="xs"
                variant="tertiary"
                iconOnly={ArrowDown}
                aria-label="下移"
                disabled={index === list.items.length - 1}
                onClick={() => curate(list.id, { move: { targetId: it.targetId, dir: 1 } })}
              />
              <Button size="xs" variant="tertiary" iconOnly={PencilLine} aria-label="修改理由" onClick={() => setEditNote(it.note)} />
              <Button size="xs" variant="tertiary" iconOnly={Trash2} aria-label="移除" className="text-error-600 hover:text-error-700" onClick={() => setRemoving(true)} />
            </div>
          )}
        </div>

        {editNote !== null ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
            <Input inputSize="sm" value={editNote} onChange={(e) => setEditNote(e.target.value)} maxCount={NOTE_MAX} error={noteErr || undefined} wrapperClassName="min-w-0 flex-1" autoFocus />
            <div className="flex shrink-0 gap-2">
              <Button size="sm" variant="secondary" onClick={() => setEditNote(null)}>
                取消
              </Button>
              <Button
                size="sm"
                variant="primary"
                disabled={!!noteErr}
                onClick={() => {
                  curate(list.id, { note: { targetId: it.targetId, note: editNote.trim() } });
                  setEditNote(null);
                  toast({ tone: "success", title: "收录理由已更新" });
                }}
              >
                保存
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
            <span className="mr-1.5 text-xs font-medium text-gray-400">收录理由</span>
            {it.note}
          </p>
        )}
      </div>

      <ConfirmModal
        open={removing}
        onClose={() => setRemoving(false)}
        danger
        title={`从榜单移除${name}？`}
        desc="移除后不会通知对方，之后可以重新加入。"
        confirmText="移除"
        onConfirm={() => {
          curate(list.id, { remove: it.targetId });
          setRemoving(false);
          toast({ tone: "info", title: `已移除${name}` });
        }}
      />
    </li>
  );
}

/** 项目榜只收公开且已上墙的项目；人物榜只收已选身份的人（不含运营账号）。 */
function candidates(db: DB, list: CuratedList): { id: string; name: string; sub: string; logo: { text: string; tone: number } | null; person: Person | null }[] {
  const inList = new Set(list.items.map((i) => i.targetId));
  if (list.kind === "project") {
    return db.projects
      .filter((p) => p.visibility === "public" && p.wall === "approved" && !inList.has(p.id))
      .map((p) => ({ id: p.id, name: p.name, sub: `${p.track} · ${p.oneLiner}`, logo: { text: p.logoText, tone: p.logoTone }, person: null }));
  }
  return db.people
    .filter((p) => p.role && !p.isOps && !inList.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, sub: [roleText(p), p.title, p.org].filter(Boolean).join(" · "), logo: null, person: p }));
}

function AddItemModal({ open, onClose, list }: { open: boolean; onClose: () => void; list: CuratedList }) {
  const db = useDB();
  const curate = useApp((s) => s.curateList);
  const toast = useApp((s) => s.toast);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);

  const all = candidates(db, list);
  const query = q.trim().toLowerCase();
  const shown = all.filter((c) => !query || `${c.name}${c.sub}`.toLowerCase().includes(query));
  const pick = all.find((c) => c.id === picked);
  const noteErr = !note.trim() ? "写一句收录理由，读者最想知道为什么" : note.length > NOTE_MAX ? `最多 ${NOTE_MAX} 字` : undefined;

  const close = () => {
    setQ("");
    setPicked(null);
    setNote("");
    setTried(false);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={pick ? `收录${pick.name}` : list.kind === "project" ? "加入项目" : "加入人物"}
      desc={pick ? "写一句为什么值得关注，会展示在榜单上，也会写进给对方的通知里。" : list.kind === "project" ? "只能选择公开且已上墙的项目。" : "可以选择已选身份的社区成员。"}
      footer={
        pick ? (
          <>
            <Button variant="secondary" onClick={() => setPicked(null)}>
              重新选择
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setTried(true);
                if (noteErr) return;
                curate(list.id, { add: { targetId: pick.id, note: note.trim() } });
                toast({ tone: "success", title: `已收录${pick.name}`, body: list.kind === "project" ? "已通知项目负责人和关注榜单的人" : "已通知本人和关注榜单的人" });
                close();
              }}
            >
              确认收录
            </Button>
          </>
        ) : undefined
      }
    >
      {pick ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
            {pick.logo ? <ProjectLogo text={pick.logo.text} tone={pick.logo.tone} size="sm" /> : <Avatar name={pick.person!.name} tone={pick.person!.avatarTone} size="sm" />}
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900">{pick.name}</span>
              <span className="block truncate text-xs text-gray-500">{pick.sub}</span>
            </span>
          </div>
          <Textarea label="收录理由" required rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxCount={NOTE_MAX} placeholder="例如：单店 3 个月回本，模型扎实" error={tried ? noteErr : undefined} autoFocus />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input icon={Search} inputSize="sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder={list.kind === "project" ? "搜项目名、赛道" : "搜名字、机构、身份"} autoFocus />
          {shown.length ? (
            <ul className="-mx-2 flex max-h-[360px] flex-col overflow-y-auto">
              {shown.map((c) => (
                <li key={c.id}>
                  <button onClick={() => setPicked(c.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-gray-50">
                    {c.logo ? <ProjectLogo text={c.logo.text} tone={c.logo.tone} size="sm" /> : <Avatar name={c.person!.name} tone={c.person!.avatarTone} size="sm" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{c.name}</span>
                      <span className="block truncate text-xs text-gray-500">{c.sub}</span>
                    </span>
                    <Plus size={16} className="shrink-0 text-gray-400" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500">{all.length ? "没有找到匹配的结果" : "符合条件的都已经在榜单里了"}</p>
          )}
        </div>
      )}
    </Modal>
  );
}

function EditListModal({ open, onClose, list }: { open: boolean; onClose: () => void; list: CuratedList }) {
  const edit = useApp((s) => s.editList);
  const toast = useApp((s) => s.toast);
  const [title, setTitle] = useState(list.title);
  const [desc, setDesc] = useState(list.desc);
  const titleErr = !title.trim() ? "给榜单起个名字" : title.length > 30 ? "最多 30 字" : undefined;
  const descErr = desc.length > 80 ? "最多 80 字" : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="编辑榜单信息"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            disabled={!!titleErr || !!descErr}
            onClick={() => {
              edit(list.id, { title: title.trim(), desc: desc.trim() });
              toast({ tone: "success", title: "已保存" });
              onClose();
            }}
          >
            保存
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input label="榜单名" required value={title} onChange={(e) => setTitle(e.target.value)} maxCount={30} error={titleErr} />
        <Textarea label="一句话说明" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} maxCount={80} error={descErr} />
      </div>
    </Modal>
  );
}

function Aside({ list }: { list: CuratedList }) {
  const db = useDB();
  const curator = getPerson(db, list.curatorId);
  const others = db.lists.filter((l) => l.id !== list.id && l.curatorId === list.curatorId);
  const ids = new Set(list.items.map((i) => i.targetId));
  const related = db.lists
    .filter((l) => l.id !== list.id && l.curatorId !== list.curatorId && l.kind === list.kind)
    .map((l) => ({ l, overlap: l.items.filter((i) => ids.has(i.targetId)).length }))
    .sort((a, b) => b.overlap - a.overlap || b.l.updatedAt.localeCompare(a.l.updatedAt))
    .slice(0, 2);

  return (
    <aside className="flex min-w-0 flex-col gap-4">
      {curator ? (
        <Card>
          <p className="text-sm font-semibold text-gray-900">整理者</p>
          <Link href={`/u/${curator.handle}`} className="group mt-3 flex items-center gap-3">
            <Avatar name={curator.name} tone={curator.avatarTone} size="md" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700">{curator.name}</span>
              <span className="block truncate text-xs text-gray-500">{curator.isOps ? "Pitch 运营" : [roleText(curator), curator.org].filter(Boolean).join(" · ")}</span>
            </span>
          </Link>
          {others.length ? (
            <>
              <p className="mt-4 text-xs font-medium text-gray-500">TA 整理的其他榜单</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {others.map((l) => (
                  <li key={l.id}>
                    <Link href={`/lists/${l.id}`} className="block truncate text-sm text-gray-700 hover:text-brand-700">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Card>
      ) : null}
      {related.length ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-900">相关榜单</p>
          {related.map(({ l }) => (
            <ListCard key={l.id} list={l} />
          ))}
        </div>
      ) : null}
      <Card className="bg-gray-25">
        <p className="text-sm font-semibold text-gray-900">关于榜单</p>
        <p className="mt-2 text-sm text-gray-600">榜单是整理者的个人判断，不代表 Pitch 背书。每条都写明收录理由；被收录的项目和人会收到通知。</p>
        <Link href="/lists" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
          全部榜单
        </Link>
      </Card>
    </aside>
  );
}
