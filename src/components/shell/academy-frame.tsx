import type { ReactNode } from "react";

/** 发现、我的与首页共用的页眉：芽绿圆点、大标题、细线。 */
export function AcademyFrame({
  eyebrow,
  title,
  desc,
  action,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  desc?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="academy-surface min-h-full bg-white text-gray-950">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-10 sm:py-14">
        <header className="flex flex-col gap-6 border-b border-black/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="flex items-center gap-3 text-sm font-medium tracking-[0.22em] text-gray-500">
              <span className="h-2.5 w-2.5 rounded-full bg-[#8adf4a]" />
              {eyebrow}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
            {desc ? <p className="mt-3 max-w-2xl text-base leading-7 text-gray-600">{desc}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
        <div className="pt-8">{children}</div>
      </div>
    </div>
  );
}
