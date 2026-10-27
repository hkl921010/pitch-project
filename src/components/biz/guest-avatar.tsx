import { GUEST_PHOTOS } from "@/data/academy";
import { cn } from "@/lib/cn";

function isHan(char: string) {
  const code = char.codePointAt(0) ?? 0;
  return code >= 0x4e00 && code <= 0x9fff;
}

function mark(name: string) {
  const chars = [...name];
  const han = chars.filter(isHan);
  if (han.length) return han[han.length - 1];
  const latin = chars.find((char) => /[A-Za-z]/.test(char));
  const fallback = name.trim().slice(0, 1) || "·";
  return (latin ?? fallback).toUpperCase();
}

export function GuestAvatar({ name, className }: { name: string; className?: string }) {
  const src = GUEST_PHOTOS[name];
  if (src) {
    return <img src={src} alt="" className={cn("shrink-0 bg-neutral-100 object-cover object-top", className)} />;
  }
  return (
    <span aria-hidden className={cn("@container inline-flex shrink-0 items-center justify-center bg-[#1c1c1c] text-[#f4f1ea]", className)}>
      <span className="text-[46cqmin] leading-none font-medium">{mark(name)}</span>
    </span>
  );
}
