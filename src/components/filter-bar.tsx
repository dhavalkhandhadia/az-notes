"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { CommandIcon, FilterIcon, XIcon } from "lucide-react";

import type { NoteType } from "@/data/notes";
import { Button } from "@/components/ui/button";
import { SelectMenu } from "@/components/ui/select-menu";

type FilterBarProps = {
  phases: string[];
  topics: string[];
  activePhase: string;
  activeTopic: string;
  activeType: NoteType | "All";
  sort: "newest" | "session";
  resultCount: number;
  onPhaseChange: (phase: string) => void;
  onTopicChange: (topic: string) => void;
  onTypeChange: (type: NoteType | "All") => void;
  onSortChange: (sort: "newest" | "session") => void;
  onReset: () => void;
};

const typeOptions: Array<NoteType | "All"> = ["All", "Lecture", "Revision"];

export function FilterBar({
  phases,
  topics,
  activePhase,
  activeTopic,
  activeType,
  sort,
  resultCount,
  onPhaseChange,
  onTopicChange,
  onTypeChange,
  onSortChange,
  onReset,
}: FilterBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [mobileTop, setMobileTop] = useState(92);
  const activeFilterCount = [
    activePhase !== "All",
    activeTopic !== "All",
    activeType !== "All",
    sort !== "newest",
  ].filter(Boolean).length;

  const updateMobileTop = useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    setMobileTop(Math.min(window.innerHeight - 96, Math.max(72, rect.bottom + 12)));
  }, []);

  const showPopover = () => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    updateMobileTop();
    setRendered(true);
    requestAnimationFrame(() => {
      updateMobileTop();
      setOpen(true);
    });
  };

  const hidePopover = () => {
    setOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setRendered(false);
    }, 180);
  };

  useEffect(() => {
    if (!rendered) {
      return undefined;
    }

    const handleLayout = () => updateMobileTop();

    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);

    return () => {
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [rendered, updateMobileTop]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="hidden flex-wrap items-center gap-3 sm:flex">
        <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-200">
          {resultCount} notes
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Search more with{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">Command K / Ctrl K</span>
        </div>
      </div>

      <div className="flex w-full items-center gap-3 sm:w-auto">
        <div className="sm:hidden flex-1 min-w-0">
          <SelectMenu
            label="Sort order"
            value={sort}
            onChange={(value) => onSortChange(value as "newest" | "session")}
            options={[
              { value: "newest", label: "Sort by: Newest" },
              { value: "session", label: "Sort by: Session" },
            ]}
          />
        </div>
        <div className="relative overflow-visible sm:w-auto">
          <Button
            ref={buttonRef}
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={open}
            onClick={() => {
              if (open) {
                hidePopover();
                return;
              }

              showPopover();
            }}
            className="h-11 rounded-2xl border-slate-200 bg-white px-4 text-sm text-slate-700 shadow-[0_12px_26px_rgba(15,23,42,0.05)] hover:bg-slate-50 dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-200 dark:hover:bg-white/8"
          >
            <FilterIcon data-icon="inline-start" />
            Filter
            {activeFilterCount ? (
              <span className="ml-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-semibold text-white dark:bg-white dark:text-slate-950">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>

          {rendered ? (
            <motion.div
              className="fixed left-3 right-3 top-[var(--filter-mobile-top)] z-40 origin-top overflow-visible rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(247,249,254,0.99))] p-3 shadow-[0_28px_70px_rgba(15,23,42,0.14)] ring-1 ring-white/70 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(16,23,39,0.99),rgba(11,17,29,0.99))] dark:ring-white/5 sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+0.75rem)] sm:w-[24rem] sm:origin-top-right sm:rounded-[1.75rem] sm:p-4"
              style={{
                "--filter-mobile-top": `${mobileTop}px`,
                transformOrigin: "top right",
              } as CSSProperties}
              initial={false}
              animate={{
                opacity: open ? 1 : 0,
                scale: open || shouldReduceMotion ? 1 : 0.97,
                y: open || shouldReduceMotion ? 0 : -6,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 420, damping: 32, mass: 0.65 }
              }
            >
              <div className="max-h-[calc(100svh-7rem)] overflow-y-auto overscroll-contain pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-950 dark:text-white">
                    Refine notes
                  </div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Phase, topic, type, and ordering.
                  </div>
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Close filters"
                  onClick={hidePopover}
                >
                  <XIcon />
                </Button>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <SelectMenu
                  label="Phase filter"
                  value={activePhase}
                  onChange={onPhaseChange}
                  options={[
                    { value: "All", label: "All Phases" },
                    ...phases.map((phase) => ({ value: phase, label: phase })),
                  ]}
                />
                <SelectMenu
                  label="Topic filter"
                  value={activeTopic}
                  onChange={onTopicChange}
                  options={[
                    { value: "All", label: "All Topics" },
                    ...topics.map((topic) => ({ value: topic, label: topic })),
                  ]}
                />
                <SelectMenu
                  label="Type filter"
                  value={activeType}
                  onChange={(value) => onTypeChange(value as NoteType | "All")}
                  options={typeOptions.map((type) => ({
                    value: type,
                    label: type === "All" ? "All Types" : type,
                  }))}
                />
                <div className="hidden sm:block">
                  <SelectMenu
                    label="Sort order"
                    value={sort}
                    onChange={(value) => onSortChange(value as "newest" | "session")}
                    options={[
                      { value: "newest", label: "Newest First" },
                      { value: "session", label: "Session Order" },
                    ]}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 sm:inline-flex">
                  <CommandIcon className="size-3.5" />
                  <span>Use command search for deeper lookup</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onReset();
                    hidePopover();
                  }}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Reset
                </Button>
              </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
