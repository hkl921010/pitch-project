"use client";

import { useParams } from "next/navigation";

import { InboxShell } from "@/components/biz/inbox";

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  return <InboxShell activeId={id} />;
}
