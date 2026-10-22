"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/cn";
import { useApp } from "@/store/app-store";

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
}

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
}

export function Modal({
  open,
  onClose,
  title,
  desc,
  icon,
  footer,
  size = "md",
  children,
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  desc?: ReactNode;
  icon?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  children?: ReactNode;
  bodyClassName?: string;
}) {
  const mounted = useMounted();
  useLockBody(open);
  useEsc(open, onClose);
  if (!mounted || !open) return null;
  const w = { sm: "max-w-[400px]", md: "max-w-[520px]", lg: "max-w-[680px]", xl: "max-w-[880px]" }[size];
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-gray-950/60 backdrop-blur-[2px]" onClick={onClose} />
      <div role="dialog" aria-modal className={cn("relative flex max-h-[92vh] w-full animate-pop-in flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl", w)}>
        {title || icon ? (
          <div className="flex items-start gap-4 px-6 pt-6 pb-4">
            {icon}
            <div className="min-w-0 flex-1 pr-8">
              {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
              {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
            </div>
          </div>
        ) : null}
        <button onClick={onClose} aria-label="关闭" className="absolute top-4 right-4 rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-500">
          <X size={20} />
        </button>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-6", !title && !icon && "pt-6", footer ? "pb-2" : "pb-6", bodyClassName)}>{children}</div>
        {footer ? <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, desc, footer, children, width = 480 }: { open: boolean; onClose: () => void; title?: ReactNode; desc?: ReactNode; footer?: ReactNode; children?: ReactNode; width?: number }) {
  const mounted = useMounted();
  useLockBody(open);
  useEsc(open, onClose);
  if (!mounted || !open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 animate-fade-in bg-gray-950/50" onClick={onClose} />
      <aside className="absolute top-0 right-0 flex h-full w-full animate-slide-in flex-col bg-white shadow-xl" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
          <div>
            {title ? <h3 className="text-lg font-semibold text-gray-900">{title}</h3> : null}
            {desc ? <p className="mt-1 text-sm text-gray-500">{desc}</p> : null}
          </div>
          <button onClick={onClose} aria-label="关闭" className="rounded-lg p-2 text-gray-400 hover:bg-gray-50">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">{footer}</div> : null}
      </aside>
    </div>,
    document.body,
  );
}

export function Toaster() {
  const toasts = useApp((s) => s.toasts);
  const dismiss = useApp((s) => s.dismissToast);
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(
    <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:bottom-6">
      {toasts.map((t) => {
        const Icon = t.tone === "success" ? CheckCircle2 : t.tone === "error" ? XCircle : Info;
        return (
          <div key={t.id} className="pointer-events-auto flex animate-pop-in items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
            <Icon size={20} className={cn("mt-0.5 shrink-0", t.tone === "success" ? "text-success-600" : t.tone === "error" ? "text-error-600" : "text-brand-600")} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">{t.title}</p>
              {t.body ? <p className="mt-0.5 text-sm text-gray-600">{t.body}</p> : null}
            </div>
            <button onClick={() => dismiss(t.id)} className="text-gray-400 hover:text-gray-500" aria-label="关闭">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}

/** 简易下拉菜单：点击触发，点外部关闭。 */
export function Dropdown({ trigger, children, align = "right", width = 240 }: { trigger: (open: boolean) => ReactNode; children: (close: () => void) => ReactNode; align?: "left" | "right"; width?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger(open)}</div>
      {open ? (
        <div
          className={cn("absolute top-full z-[70] mt-2 animate-pop-in overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg", align === "right" ? "right-0" : "left-0")}
          style={{ width }}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, active, danger, desc }: { icon?: React.ComponentType<{ size?: number; className?: string }>; children: ReactNode; onClick?: () => void; active?: boolean; danger?: boolean; desc?: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm hover:bg-gray-50", active && "bg-gray-50", danger ? "text-error-700" : "text-gray-700")}
    >
      {Icon ? <Icon size={16} className={danger ? "text-error-600" : "text-gray-500"} /> : null}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="font-medium">{children}</span>
        {desc ? <span className="truncate text-xs text-gray-500">{desc}</span> : null}
      </span>
    </button>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  desc,
  confirmText = "确认",
  danger,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  desc?: ReactNode;
  confirmText?: string;
  danger?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      desc={desc}
      icon={icon}
      footer={
        <>
          <button onClick={onClose} className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-xs hover:bg-gray-50">
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn("h-10 flex-1 rounded-lg px-4 text-sm font-semibold text-white shadow-xs", danger ? "bg-error-600 hover:bg-error-700" : "bg-primary hover:bg-primary-hover")}
          >
            {confirmText}
          </button>
        </>
      }
    >
      {children}
    </Modal>
  );
}
