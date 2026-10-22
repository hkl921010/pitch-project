"use client";

import { ListOrdered, Plus, Sparkles, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";

import { canCurate, LIST_MAX_ITEMS, ListCard } from "@/components/biz/list-card";
import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, FeaturedIcon, PageHeader } from "@/components/ui/display";
import { Input, RadioCards, Textarea } from "@/components/ui/form";
import { Modal } from "@/components/ui/overlay";
import { Tabs } from "@/components/ui/tabs";
import type { CuratedList } from "@/data/types";
import { useQueryParam } from "@/lib/use-query";
import { useApp } from "@/store/app-store";
import { useDB, useViewer } from "@/store/selectors";

type Tab = "all" | "project" | "person" | "following" | "mine";

const TITLE_MAX = 30;
const DESC_MAX = 80;

export default function ListsPage() {
  return (
    <Suspense>
      <ListsView />
    </Suspense>
  );
}

const byRecent = (a: CuratedList, b: CuratedList) => Number(b.featured) - Number(a.featured) || b.updatedAt.localeCompare(a.updatedAt);

function ListsView() {
  const db = useDB();
  const viewer = useViewer();
  const requireLogin = useApp((s) => s.requireLogin);
  const [tab, setTab] = useQueryParam<Tab>("tab", "all");
  const [create, setCreate] = useQueryParam<"0" | "1">("create", "0");
  const curator = canCurate(viewer);

  const all = [...db.lists].sort(byRecent);
  const featured = all.filter((l) => l.featured);
  const following = viewer ? all.filter((l) => l.followers.includes(viewer.id)) : [];
  const mine = viewer ? all.filter((l) => l.curatorId === viewer.id) : [];
  const shown = {
    all,
    project: all.filter((l) => l.kind === "project"),
    person: all.filter((l) => l.kind === "person"),
    following,
    mine,
  }[tab];

  const tabs = [
    { value: "all" as const, label: "全部", count: all.length },
    { value: "project" as const, label: "项目榜" },
    { value: "person" as const, label: "人物榜" },
    { value: "following" as const, label: "我关注的", count: following.length || undefined },
    ...(curator || mine.length ? [{ value: "mine" as const, label: "我整理的", count: mine.length || undefined }] : []),
  ];

  return (
    <Page>
      <PageHeader
        title="榜单"
        desc="由 Pitch 运营和社区里的投资人、合作方整理，每一条收录都写明理由。"
        actions={
          curator ? (
            <Button variant="primary" iconLeft={Plus} onClick={() => setCreate("1")}>
              新建榜单
            </Button>
          ) : null
        }
      />

      {tab === "all" && featured.length ? (
        <section className="mt-6">
          <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            <Star size={16} className="fill-highlight text-highlight-ink" />
            运营精选
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {featured.map((l) => (
              <ListCard key={l.id} list={l} className="border-highlight-ink/20 bg-highlight-soft/40" />
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <Tabs value={tab} onChange={setTab} items={tabs} />
          <div className="mt-5">
            {shown.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(tab === "all" ? shown.filter((l) => !l.featured) : shown).map((l) => (
                  <ListCard key={l.id} list={l} />
                ))}
              </div>
            ) : (
              <Card padded={false}>
                {tab === "following" ? (
                  <EmptyState
                    icon={ListOrdered}
                    title={viewer ? "还没关注榜单" : "登录后可以关注榜单"}
                    desc="关注后，榜单收录新项目或新的人时会通知你。"
                    action={
                      viewer ? (
                        <Button variant="primary" onClick={() => setTab("all")}>
                          看看全部榜单
                        </Button>
                      ) : (
                        <Button variant="primary" onClick={() => requireLogin("登录后可以关注榜单，有新收录时通知你")}>
                          登录
                        </Button>
                      )
                    }
                  />
                ) : tab === "mine" ? (
                  <EmptyState
                    icon={ListOrdered}
                    title="你还没整理过榜单"
                    desc="把你看好的项目或靠谱的人整理成榜单，关注的人会收到更新，被收录的项目也会收到通知。"
                    action={
                      <Button variant="primary" iconLeft={Plus} onClick={() => setCreate("1")}>
                        新建榜单
                      </Button>
                    }
                  />
                ) : (
                  <EmptyState icon={ListOrdered} title="这一类还没有榜单" desc="运营每周都会整理新的榜单，过几天再来看看。" />
                )}
              </Card>
            )}
          </div>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <Card>
            <p className="text-sm font-semibold text-gray-900">榜单是怎么来的</p>
            <ul className="mt-3 flex flex-col gap-2.5 text-sm text-gray-600">
              <li>· Pitch 运营、投资人和合作方可以整理榜单；创始人和人才不建榜，避免自荐。</li>
              <li>· 项目榜只收公开且已上墙的项目，人物榜只收已选身份的人。</li>
              <li>· 每条收录都要写一句理由，最多 {LIST_MAX_ITEMS} 条。</li>
              <li>· 被收录时会通知项目负责人或本人；关注榜单的人也会收到更新。</li>
              <li>· “运营精选”由运营挑选，会出现在发现页和周报里。</li>
            </ul>
          </Card>
          {!curator ? (
            <Card className="bg-gray-25">
              <div className="flex items-start gap-3">
                <FeaturedIcon icon={Sparkles} tone="gray" size="sm" />
                <p className="min-w-0 text-sm text-gray-600">
                  {viewer?.role === "founder" ? "想让项目被收录？把资料完善到 80% 并申请上墙，运营和投资人更容易看到你。" : "想推荐值得上榜的项目或人？在答疑或反馈里告诉运营。"}
                </p>
              </div>
            </Card>
          ) : null}
        </aside>
      </div>

      <CreateListModal open={create === "1"} onClose={() => setCreate("0")} />
    </Page>
  );
}

function CreateListModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const viewer = useViewer();
  const createList = useApp((s) => s.createList);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [kind, setKind] = useState<"project" | "person">("project");
  const [tried, setTried] = useState(false);

  const titleErr = !title.trim() ? "给榜单起个名字" : title.length > TITLE_MAX ? `最多 ${TITLE_MAX} 字` : undefined;
  const descErr = desc.length > DESC_MAX ? `最多 ${DESC_MAX} 字` : undefined;

  const close = () => {
    setTitle("");
    setDesc("");
    setKind("project");
    setTried(false);
    onClose();
  };

  if (open && !canCurate(viewer)) {
    return (
      <Modal open onClose={close} size="sm" title="暂时不能整理榜单" desc="目前只有 Pitch 运营、投资人和合作方可以整理榜单。">
        <Button variant="primary" className="w-full" onClick={close}>
          知道了
        </Button>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="新建榜单"
      desc="建好后再一条条加入项目或人，每条写一句收录理由。"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setTried(true);
              if (titleErr || descErr) return;
              const id = createList({ title: title.trim(), desc: desc.trim(), kind });
              toast({ tone: "success", title: "榜单已创建", body: "现在加入第一条吧" });
              close();
              router.push(`/lists/${id}?manage=1`);
            }}
          >
            创建并添加内容
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RadioCards
          value={kind}
          onChange={setKind}
          options={[
            { value: "project", title: "项目榜", desc: "收录公开且已上墙的项目" },
            { value: "person", title: "人物榜", desc: "收录投资人、合作方、人才等" },
          ]}
        />
        <Input label="榜单名" required value={title} onChange={(e) => setTitle(e.target.value)} maxCount={TITLE_MAX} placeholder="例如：十一月值得关注的宠物出海项目" error={tried ? titleErr : undefined} />
        <Textarea label="一句话说明" value={desc} onChange={(e) => setDesc(e.target.value)} maxCount={DESC_MAX} rows={3} placeholder="你按什么标准挑的？" error={tried ? descErr : undefined} />
      </div>
    </Modal>
  );
}
