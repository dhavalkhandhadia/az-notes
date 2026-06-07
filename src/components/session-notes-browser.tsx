"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  FileTextIcon,
  BarChart3Icon,
  CalendarDaysIcon,
  PlayIcon,
} from "lucide-react";

import { isUpcomingSession, type NoteItem } from "@/data/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { getTopicTheme } from "@/lib/topic-theme";
import { cn } from "@/lib/utils";

type SessionNotesBrowserProps = {
  notes: NoteItem[];
  sessionNumberById?: Record<string, number>;
  buildSessionHref?: (id: string, focusId: string) => string;
  onSessionNavigate?: (focusId: string) => void;
  gridClassName?: string;
  reservedSlots?: number;
};

function SessionThumbnail({
  sessionNumber,
}: {
  sessionNumber: number;
}) {
  return (
    <div className="flex h-full min-h-[4.1rem] items-start justify-start">
      <div
        className="flex h-[3.9rem] w-[3.9rem] flex-col items-center justify-center rounded-[0.95rem] border border-[#dfe4ff] bg-[url('/hero/algozenith-text-clip.png')] bg-cover bg-center text-white"
        aria-label={`Session ${sessionNumber}`}
      >
        <span className="font-numbers text-[1.55rem] font-semibold leading-none">
          {sessionNumber}
        </span>
        <span className="mt-0.5 text-[0.5rem] font-medium uppercase tracking-[0.14em] text-white/92">
          Session
        </span>
      </div>
    </div>
  );
}

function getDifficultyAccent(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200";
    case "advanced":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200";
  }
}

function formatSessionDate(value?: string) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function SessionNotesBrowser({
  notes,
  sessionNumberById,
  buildSessionHref,
  onSessionNavigate,
  gridClassName,
  reservedSlots,
}: SessionNotesBrowserProps) {
  const shouldReduceMotion = useReducedMotion();
  const layoutTransition = shouldReduceMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 240, damping: 28 };

  if (!notes.length) {
    return (
      <div>
        <Card className="rounded-[1.5rem] border-[#e5ebf7] bg-white py-0 shadow-[0_18px_56px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0f1524]">
          <CardContent className="px-6 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No notes available for this selection.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      layout
      transition={{ layout: layoutTransition }}
      className={cn(
        "grid gap-3.5 md:grid-cols-2 lg:grid-cols-3",
        gridClassName
      )}
    >
      {notes.map((entry) => {
        const theme = getTopicTheme(entry.topic);
        const displaySessionNumber = sessionNumberById?.[entry.id] ?? entry.sessionNumber;
        const focusId = `available-note-${entry.id}`;
        const upcomingLecture = isUpcomingSession(entry);
        const sessionHref =
          buildSessionHref?.(entry.id, focusId) ?? `/sessions/${entry.id}`;

        return (
          <motion.div
            key={entry.id}
            layout
            transition={{ layout: layoutTransition }}
          >
            <Card
              id={focusId}
              tabIndex={-1}
              className="h-full min-h-[12rem] overflow-hidden rounded-[1.35rem] border-[#e7ebf6] bg-white py-0 shadow-[0_16px_42px_rgba(98,111,170,0.08)] dark:border-white/10 dark:bg-[#101827] sm:min-h-[11.25rem]"
            >
              <CardContent className="flex h-full flex-col px-0 py-0">
                <div className="grid flex-1 grid-cols-[4.05rem_minmax(0,1fr)] items-start gap-3 px-3.5 py-3.5">
                  <div className="h-full">
                    <SessionThumbnail sessionNumber={displaySessionNumber} />
                  </div>

                  <div className="flex min-h-full min-w-0 flex-col justify-between gap-3">
                    <div className="space-y-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          className={cn(
                            "h-auto rounded-full px-2.5 py-0.75 text-[0.64rem] font-medium shadow-none",
                            theme.badgeClassName
                          )}
                        >
                          {entry.topic}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-auto rounded-full px-2.5 py-0.75 text-[0.64rem] font-semibold shadow-none",
                            getDifficultyAccent(entry.difficulty)
                          )}
                        >
                          <BarChart3Icon data-icon="inline-start" className="size-3.5" />
                          {entry.difficulty ?? "Intermediate"}
                        </Badge>
                      </div>

                      <Link
                        href={sessionHref}
                        onClick={() => onSessionNavigate?.(focusId)}
                        className="font-heading block text-[1.02rem] font-semibold leading-[1.08] tracking-[-0.04em] text-[#1b2340] transition-colors hover:text-primary dark:text-white sm:text-[1.08rem] 2xl:text-[1.16rem]"
                      >
                        {entry.title}
                      </Link>
                      {formatSessionDate(entry.date) ? (
                        <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-medium text-[#7b87ab] dark:text-slate-400">
                          <CalendarDaysIcon className="size-3.5" />
                          {formatSessionDate(entry.date)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-auto grid gap-2 border-t border-[#e8edf7] px-3.5 py-3 dark:border-white/10 sm:grid-cols-2 sm:px-3.5">
                  {entry.hasNotes === false ? (
                    <HoverTooltip
                      content={
                        <div className="max-w-xs text-center">
                          <p className="text-xs leading-5 text-slate-500">
                            Notes haven&apos;t been added for this session yet.
                          </p>
                        </div>
                      }
                    >
                      <span className="flex w-full">
                        <Button
                          size="default"
                          variant="outline"
                          disabled
                          className="h-9.5 w-full rounded-[0.9rem] border-[#dde5f2] bg-white px-3 text-[0.76rem] font-semibold text-[#9aa5c3] shadow-none dark:border-white/10 dark:bg-white/5"
                        >
                          <FileTextIcon data-icon="inline-start" className="size-4 text-[#aab4cf]" />
                          Open notes
                        </Button>
                      </span>
                    </HoverTooltip>
                  ) : (
                    <Button
                      size="default"
                      variant="outline"
                      className="h-9.5 w-full rounded-[0.9rem] border-[#dde5f2] bg-white px-3 text-[0.76rem] font-semibold text-[#4b5b86] shadow-none hover:bg-[#fbfcff] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/8"
                      nativeButton={false}
                      onClick={() => onSessionNavigate?.(focusId)}
                      render={<Link href={sessionHref} />}
                    >
                      <FileTextIcon data-icon="inline-start" className="size-4 text-[#5d6b96]" />
                      Open notes
                    </Button>
                  )}
                  {entry.lectureUrl ? (
                    upcomingLecture ? (
                      <Button
                        size="default"
                        variant="outline"
                        disabled
                        className="h-9.5 rounded-[0.9rem] border-[#dfe3ff] bg-[#f7f9ff] px-3 text-[0.76rem] font-semibold text-[#7d8bb5] shadow-none dark:border-white/10 dark:bg-white/5 dark:text-slate-400"
                      >
                        <PlayIcon data-icon="inline-start" className="size-4 text-[#8ea0cc]" />
                        About to happen
                      </Button>
                    ) : (
                    <Button
                      size="default"
                      variant="outline"
                      className="h-9.5 rounded-[0.9rem] border-[#dfe3ff] bg-[linear-gradient(180deg,#f7f8ff_0%,#f2f4ff_100%)] px-3 text-[0.76rem] font-semibold text-[#4b5eff] shadow-none hover:bg-[linear-gradient(180deg,#f6f7ff_0%,#edf0ff_100%)] dark:border-[#3052af] dark:bg-[linear-gradient(180deg,#2556ff_0%,#1a46d5_100%)] dark:text-white dark:hover:bg-[linear-gradient(180deg,#2b60ff_0%,#1f4de3_100%)]"
                      nativeButton={false}
                      render={<a href={entry.lectureUrl} target="_blank" rel="noreferrer" />}
                    >
                      <PlayIcon data-icon="inline-start" className="size-4 text-[#5b63ff] dark:text-white" />
                      Watch lecture
                    </Button>
                    )
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
      {Array.from({
        length: Math.max(0, (reservedSlots ?? notes.length) - notes.length),
      }).map((_, index) => (
        <motion.div
          key={`reserved-note-slot-${index}`}
          layout
          aria-hidden="true"
          className="pointer-events-none invisible"
          transition={{ layout: layoutTransition }}
        >
          <Card className="h-full min-h-[12rem] rounded-[1.35rem] py-0 sm:min-h-[11.25rem]" />
        </motion.div>
      ))}
    </motion.div>
  );
}
