"use client";

import Link from "next/link";
import { CommandIcon } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";

type SiteHeaderProps = {
  onOpenSearch: () => void;
};

export function SiteHeader({ onOpenSearch }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/82 backdrop-blur-xl dark:border-white/10 dark:bg-[#060811]/82">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenSearch}
          className="group relative inline-flex items-center overflow-hidden rounded-[0.94rem] bg-black p-[6px] text-sm font-medium text-white"
        >
          <span
            aria-hidden="true"
            className="search-border-pan absolute inset-[-24%] rounded-[1.3rem] bg-[url('/hero/viteplus.png')] bg-[length:240%_240%] bg-center bg-no-repeat"
          />
          <span
            aria-hidden="true"
            className="absolute inset-[6px] rounded-[0.72rem] bg-[linear-gradient(180deg,rgba(16,16,16,0.98),rgba(3,3,3,1))] transition-[inset] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:inset-[7px]"
          />
          <span className="relative flex items-center gap-3 rounded-[0.72rem] px-3.5 py-1.5">
            <span className="relative">Open Search</span>
            <span className="relative inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-semibold text-white/90">
              <CommandIcon className="size-3.5" />
              <span>K</span>
            </span>
          </span>
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/sessions"
            className="inline-flex h-10 items-center rounded-2xl border border-slate-200 bg-white/88 px-4 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition-[border-color,background-color,color] hover:border-slate-300 hover:bg-white hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/8 dark:hover:text-white"
          >
            Notes
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
