"use client";

import { SearchX } from "lucide-react";

import { Page } from "@/components/shell/page";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/display";

export default function NotFound() {
  return (
    <Page>
      <EmptyState
        icon={SearchX}
        title="页面不存在或已下线"
        desc="可能是项目设置了仅持链接可见、链接有误，或内容已被删除。"
        action={
          <>
            <Button href="/discover" variant="primary">
              去发现页看看
            </Button>
            <Button href="/" variant="secondary">
              回到首页
            </Button>
          </>
        }
      />
    </Page>
  );
}
