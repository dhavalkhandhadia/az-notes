"use client";

import { CommandIcon, SearchIcon, SparklesIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type HeroSearchProps = {
  query: string;
  resultCount: number;
  submitSequence: number;
  onQueryChange: (value: string) => void;
  onOpenSearch: () => void;
  onSubmit: () => void;
  resultsContent?: React.ReactNode;
};

function TextClip({
  imageUrl,
  children,
  animated = false,
}: {
  imageUrl: string;
  children: React.ReactNode;
  animated?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block bg-clip-text text-transparent",
        animated && "text-clip-orbit"
      )}
      style={{
        backgroundImage: `url(${imageUrl})`,
        backgroundPosition: animated ? "0% 0%" : "center",
        backgroundSize: animated ? "165% 165%" : "cover",
        animation: animated ? "text-clip-orbit 8s cubic-bezier(0.37,0,0.63,1) infinite" : undefined,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {children}
    </span>
  );
}

export function HeroSearch({
  query,
  resultCount,
  submitSequence,
  onQueryChange,
  onOpenSearch,
  onSubmit,
  resultsContent,
}: HeroSearchProps) {
  const hasQuery = query.trim().length > 0;
  const resultsCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!submitSequence || !hasQuery || !resultsCardRef.current) {
      return;
    }

    resultsCardRef.current.focus({ preventScroll: true });
    resultsCardRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }, [hasQuery, submitSequence]);

  return (
    <section
      id="search"
      className="relative overflow-hidden border-b border-slate-200 bg-[#f8f8fc] dark:border-white/10 dark:bg-[#12121e]"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[34rem] sm:h-[38rem] lg:h-[44rem]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat dark:hidden"
          style={{ backgroundImage: "url('/hero/backgroundhero.png')" }}
        />
        <div
          className="absolute inset-0 hidden bg-cover bg-center bg-no-repeat dark:block"
          style={{ backgroundImage: "url('/hero/backgroundhero-dark.png')" }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-6 pb-14 pt-18 text-center lg:px-8 lg:pb-18 lg:pt-24">
        <div className="max-w-4xl space-y-5">
          <h1 className="font-heading text-balance text-[2.55rem] leading-[1.02] font-semibold tracking-[-0.055em] text-slate-950 dark:text-white md:text-[3.45rem]">
            Search{" "}
            <TextClip imageUrl="/hero/algozenith-text-clip.png" animated>
              AlgoZenith
            </TextClip>{" "}
            notes,
            <br />
            lectures, and{" "}
            <TextClip imageUrl="/hero/concepts-text-clip.png">
              concepts.
            </TextClip>
          </h1>
          <p className="text-lg font-medium tracking-[-0.02em] text-slate-600 dark:text-slate-300 md:text-xl">
            Find what you remember. Fast.
          </p>
        </div>

        <div className="mt-10 w-full max-w-4xl">
          <div className="group mx-auto flex h-16 w-full items-center gap-4 rounded-[2rem] border border-slate-200 bg-white/92 px-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-white/10 dark:bg-[#0d1322]/92">
            <button
              type="button"
              onClick={onOpenSearch}
              className="flex items-center justify-center text-slate-500 transition-colors hover:text-slate-950 dark:text-slate-400 dark:hover:text-white"
              aria-label="Open search"
            >
              <SearchIcon className="size-6" strokeWidth={2.2} />
            </button>
            <input
              value={query}
              placeholder="Search notes, lectures, concepts..."
              aria-label="Search notes library"
              className="h-full min-w-0 flex-1 bg-transparent text-lg text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 md:text-xl"
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }

                if (
                  (event.ctrlKey || event.metaKey) &&
                  event.key.toLowerCase() === "k"
                ) {
                  event.preventDefault();
                  onOpenSearch();
                }
              }}
            />
            <button
              type="button"
              onClick={onOpenSearch}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-base font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-white/10 dark:text-slate-100">
                <CommandIcon className="size-3.5" />
                <span>K</span>
              </span>
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-lg text-slate-600 dark:text-slate-300">
            <SparklesIcon className="size-4 text-sky-500" />
            <span>Press</span>
            <span className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-0.5 text-base font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              <CommandIcon className="size-4" />
              <span>K</span>
            </span>
            <span>or</span>
            <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-0.5 text-base font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
              Ctrl K
            </span>
          </div>
        </div>

        <div
          ref={resultsCardRef}
          id="search-results-panel"
          tabIndex={-1}
          className={cn(
            "mt-14 w-full max-w-[72rem] rounded-[2rem] border border-slate-200 bg-white/94 px-6 py-8 shadow-[0_24px_80px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all duration-[680ms] ease-[cubic-bezier(0.16,1,0.3,1)] outline-none focus-visible:ring-2 focus-visible:ring-[#4f7cff]/35 dark:border-white/10 dark:bg-[#0d1322]/94 md:px-8 md:py-10",
            hasQuery
              ? "translate-y-0 scale-[0.985] shadow-[0_30px_100px_rgba(15,23,42,0.08)]"
              : "translate-y-0 scale-[0.998]"
          )}
        >
          <div
            className={cn(
              "mx-auto flex max-w-2xl flex-col items-center text-center transition-all duration-[680ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              hasQuery
                ? "translate-y-[-0.75rem] scale-[0.88] opacity-100 md:translate-y-[-1rem] md:scale-[0.84]"
                : "translate-y-0 scale-100 opacity-100"
            )}
          >
            <div
              className={cn(
                "flex size-16 items-center justify-center rounded-[1.6rem] border border-slate-200 bg-white text-slate-700 shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition-all duration-[680ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200",
                hasQuery
                  ? "rotate-0 opacity-100 shadow-[0_12px_34px_rgba(15,23,42,0.08)]"
                  : "rotate-[-8deg] opacity-90"
              )}
            >
              <SearchIcon className="size-7" strokeWidth={2.15} />
            </div>
            <h2 className="font-heading mt-8 text-3xl font-semibold tracking-[-0.04em] text-slate-950 transition-all duration-[680ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-white md:text-4xl">
              {hasQuery
                ? `${resultCount} search ${resultCount === 1 ? "result" : "results"} ready`
                : "Your search results will appear here"}
            </h2>
              <p className="mt-3 text-lg text-slate-600 transition-all duration-[680ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-slate-300 md:text-xl">
                {hasQuery
                  ? "Grouped by topic first, then narrowed to matching sessions."
                  : "Search by concept, topic, or lecture to get started."}
            </p>
          </div>

          <div
            className={cn(
              "overflow-hidden transition-all duration-[720ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              hasQuery
                ? "mt-2 max-h-[120rem] opacity-100"
                : "max-h-0 opacity-0"
            )}
          >
            <div
              className={cn(
                "aesthetic-scroll scroll-fade-y space-y-4 overflow-y-auto pr-2 transition-all duration-[720ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                hasQuery
                  ? "translate-y-0 scale-100"
                  : "translate-y-8 scale-[0.985]"
              )}
              style={hasQuery ? { maxHeight: "min(42rem, 62vh)" } : undefined}
            >
              {resultsContent}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
