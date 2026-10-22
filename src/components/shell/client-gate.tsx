"use client";

import { useEffect, type ReactNode } from "react";

import { Skeleton } from "@/components/ui/display";
import { useApp } from "@/store/app-store";

/** 先从 localStorage 恢复演示数据，再渲染页面，避免服务端与客户端内容不一致。 */
export function ClientGate({ children }: { children: ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).finally(() => useApp.getState().setHydrated());
  }, []);
  if (!hydrated) return <ShellSkeleton />;
  return <>{children}</>;
}

function ShellSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-gray-200 bg-white" />
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-8">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-80" />
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex gap-3">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="mt-2 h-3 w-4/5" />
                </div>
              </div>
              <Skeleton className="mt-5 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
