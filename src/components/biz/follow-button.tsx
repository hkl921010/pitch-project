"use client";

import { Check, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";
import { isFollowing, useDB } from "@/store/selectors";

/** quiet：旁边已有主按钮时，未关注态也用次要样式。 */
export function FollowButton({
  targetType,
  targetId,
  size = "sm",
  className,
  disabledSelf,
  quiet,
}: {
  targetType: "project" | "person";
  targetId: string;
  size?: "xs" | "sm" | "md";
  className?: string;
  disabledSelf?: boolean;
  quiet?: boolean;
}) {
  const db = useDB();
  const viewerId = useApp((s) => s.viewerId);
  const toggle = useApp((s) => s.toggleFollow);
  const requireLogin = useApp((s) => s.requireLogin);
  const toast = useApp((s) => s.toast);
  const on = isFollowing(db, viewerId, targetType, targetId);
  if (disabledSelf) return null;
  return (
    <Button
      size={size}
      variant={on || quiet ? "secondary" : "primary"}
      iconLeft={on ? Check : Plus}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!viewerId) return requireLogin("登录后即可关注，项目有新动态会通知你");
        toggle(targetType, targetId);
        if (!on) toast({ tone: "success", title: "已关注", body: targetType === "project" ? "项目发布动态时会通知你" : "TA 有新动态时会通知你" });
      }}
    >
      {on ? "已关注" : "关注"}
    </Button>
  );
}
