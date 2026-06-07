import Link from "next/link";
import {
  CalendarDaysIcon,
  FileTextIcon,
  PlayIcon,
  SignalIcon,
} from "lucide-react";

import { isUpcomingSession, type NoteItem } from "@/data/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { getTopicTheme } from "@/lib/topic-theme";
import { cn } from "@/lib/utils";

type RecentNotesTableProps = {
  notes: NoteItem[];
  buildSessionHref?: (id: string, focusId: string) => string;
  onSessionNavigate?: (focusId: string) => void;
};

function formatDate(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function getDifficultyTone(difficulty?: string) {
  switch (difficulty?.toLowerCase()) {
    case "beginner":
      return "text-emerald-500";
    case "advanced":
      return "text-amber-500";
    default:
      return "text-sky-500";
  }
}

export function RecentNotesTable({
  notes,
  buildSessionHref,
  onSessionNavigate,
}: RecentNotesTableProps) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {notes.length ? (
          notes.map((note) => {
            const theme = getTopicTheme(note.topic);
            const upcomingLecture = isUpcomingSession(note);
            const sessionHref =
              buildSessionHref?.(note.id, `available-note-${note.id}`) ??
              `/sessions/${note.id}`;

            return (
              <article
                key={note.id}
                id={`available-note-${note.id}`}
                tabIndex={-1}
                className="rounded-[1.35rem] border border-[#263656] bg-[linear-gradient(180deg,#121a2d_0%,#0f1728_100%)] px-3.5 py-3.5 shadow-[0_0_0_1px_rgba(88,126,214,0.08),0_18px_34px_rgba(3,8,20,0.24)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-8 min-w-8 items-center justify-center rounded-xl border border-[#3558b5] bg-[#182649] px-2 text-sm font-semibold text-[#d9e5ff]">
                    {note.sessionNumber}
                  </div>
                  <Badge
                    className={cn(
                      "ml-auto rounded-full border px-2.5 py-1 text-[0.76rem] font-medium shadow-none",
                      theme.softBorderClassName,
                      theme.badgeClassName
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", theme.dotClassName)} />
                    {note.topic}
                  </Badge>
                </div>

                <div className="mt-3">
                  <Link
                    href={sessionHref}
                    onClick={() => onSessionNavigate?.(`available-note-${note.id}`)}
                    className="font-heading block text-[1.55rem] leading-[1.02] font-semibold tracking-[-0.04em] text-white"
                  >
                    {note.title}
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.88rem] text-slate-400">
                  {note.difficulty ? (
                    <div className="inline-flex items-center gap-1.5">
                      <SignalIcon
                        className={cn("size-3.5", getDifficultyTone(note.difficulty))}
                      />
                      <span>{note.difficulty}</span>
                    </div>
                  ) : null}
                  {note.date ? (
                    <div className="inline-flex items-center gap-1.5">
                      <CalendarDaysIcon className="size-3.5 text-slate-500" />
                      <span>Updated {formatDate(note.date)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {note.hasNotes === false ? (
                    <HoverTooltip
                      content={
                        <div className="max-w-xs text-center">
                          <p className="text-xs leading-5 text-slate-500">
                            Notes haven&apos;t been added for this session yet.
                          </p>
                        </div>
                      }
                    >
                      <span className="flex">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled
                          className="h-9 rounded-xl border-[#27407a] bg-[#101c35] px-3 text-[#7e90b7] shadow-none"
                        >
                          <FileTextIcon data-icon="inline-start" />
                          Notes
                        </Button>
                      </span>
                    </HoverTooltip>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-[#27407a] bg-[#101c35] px-3 text-[#a9bfff] shadow-none hover:bg-[#142240] hover:text-white"
                      nativeButton={false}
                      onClick={() => onSessionNavigate?.(`available-note-${note.id}`)}
                      render={<Link href={sessionHref} />}
                    >
                      <FileTextIcon data-icon="inline-start" />
                      Notes
                    </Button>
                  )}
                  {note.lectureUrl ? (
                    upcomingLecture ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled
                        className="h-9 rounded-xl border-[#27407a] bg-[#101c35] px-3 text-[#7e90b7] shadow-none"
                      >
                        <PlayIcon data-icon="inline-start" />
                        About to happen
                      </Button>
                    ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl border-[#27407a] bg-[#101c35] px-3 text-[#88a8ff] shadow-none hover:bg-[#142240] hover:text-white"
                      nativeButton={false}
                      render={<a href={note.lectureUrl} target="_blank" rel="noreferrer" />}
                    >
                      <PlayIcon data-icon="inline-start" />
                      Lecture
                    </Button>
                    )
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-[#263656] bg-[linear-gradient(180deg,#121a2d_0%,#0f1728_100%)] px-4 py-8 text-center text-sm text-slate-400">
            No notes match the current library filters.
          </div>
        )}
      </div>

      <div className="hidden overflow-visible rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-[#0f1524] md:block">
      <div className="overflow-x-auto overflow-y-visible">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr className="text-sm text-slate-500 dark:text-slate-400">
              <th className="w-24 border-b border-slate-200 px-5 py-4 text-center font-medium">
                Session
              </th>
              <th className="border-b border-slate-200 px-5 py-4 text-left font-medium">
                Lecture
              </th>
              <th className="border-b border-slate-200 px-5 py-4 text-center font-medium">
                Topic
              </th>
              <th className="hidden border-b border-slate-200 px-5 py-4 text-center font-medium lg:table-cell">
                Updated
              </th>
              <th className="border-b border-slate-200 px-5 py-4 text-center font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {notes.length ? (
              notes.map((note) => {
                const theme = getTopicTheme(note.topic);
                const upcomingLecture = isUpcomingSession(note);

                return (
                  <tr
                    key={note.id}
                    id={`available-note-${note.id}`}
                    tabIndex={-1}
                    className="group transition-colors duration-200 hover:bg-[#fbfdff] dark:hover:bg-white/5"
                  >
                    <td className="border-b border-slate-100 px-5 py-4 text-center align-middle font-numbers text-[1.05rem] font-semibold text-slate-800 last:border-b-0 dark:border-white/6 dark:text-slate-200">
                      {note.sessionNumber}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 align-middle last:border-b-0 dark:border-white/6">
                      <div className="max-w-[23rem] space-y-1">
                        <HoverTooltip
                          content={
                            <div className="max-w-xs text-center">
                              <p className="text-xs leading-5 text-slate-500">
                                {note.summary ?? note.subtopics.join(", ")}
                              </p>
                            </div>
                          }
                        >
                          <Link
                            href={
                              buildSessionHref?.(note.id, `available-note-${note.id}`) ??
                              `/sessions/${note.id}`
                            }
                            onClick={() =>
                              onSessionNavigate?.(`available-note-${note.id}`)
                            }
                            className="font-heading inline-block max-w-full truncate text-[1.08rem] font-semibold text-slate-900 transition-colors hover:text-primary dark:text-white"
                          >
                            {note.title}
                          </Link>
                        </HoverTooltip>
                      </div>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-center align-middle last:border-b-0 dark:border-white/6">
                      <Badge
                        className={cn(
                          "gap-2 rounded-full px-3 py-1 text-[0.73rem] font-medium shadow-none",
                          theme.badgeClassName
                        )}
                      >
                        <span className={cn("size-1.5 rounded-full", theme.dotClassName)} />
                        {note.topic}
                      </Badge>
                    </td>
                    <td className="hidden border-b border-slate-100 px-5 py-4 text-center align-middle text-sm text-slate-500 last:border-b-0 lg:table-cell dark:border-white/6 dark:text-slate-400">
                      {formatDate(note.date)}
                    </td>
                    <td className="border-b border-slate-100 px-5 py-4 text-center align-middle dark:border-white/6">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {note.hasNotes === false ? (
                          <HoverTooltip
                            content={
                              <div className="max-w-xs text-center">
                                <p className="text-xs leading-5 text-slate-500">
                                  Notes haven&apos;t been added for this session yet.
                                </p>
                              </div>
                            }
                          >
                            <span className="flex">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="rounded-xl border-slate-200 bg-white px-3 text-slate-400 shadow-none dark:border-white/10 dark:bg-white/5"
                              >
                                <FileTextIcon data-icon="inline-start" />
                                Notes
                              </Button>
                            </span>
                          </HoverTooltip>
                        ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-none transition-[transform,border-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#d7e4ff] hover:shadow-[0_12px_24px_rgba(59,130,246,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/8"
                              nativeButton={false}
                              onClick={() =>
                                onSessionNavigate?.(`available-note-${note.id}`)
                              }
                              render={
                                <Link
                                  href={
                                    buildSessionHref?.(
                                      note.id,
                                      `available-note-${note.id}`
                                    ) ?? `/sessions/${note.id}`
                                  }
                                />
                              }
                            >
                              <FileTextIcon data-icon="inline-start" />
                              Notes
                            </Button>
                        )}
                        {note.lectureUrl ? (
                          upcomingLecture ? (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled
                              className="rounded-xl border-slate-200 bg-white px-3 text-slate-400 shadow-none dark:border-white/10 dark:bg-white/5"
                            >
                              <PlayIcon data-icon="inline-start" />
                              About to happen
                            </Button>
                          ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-slate-200 bg-white px-3 text-slate-700 shadow-none transition-[transform,border-color,box-shadow] duration-[180ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[#d7e4ff] hover:shadow-[0_12px_24px_rgba(59,130,246,0.08)] dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/8"
                            nativeButton={false}
                            render={<a href={note.lectureUrl} target="_blank" rel="noreferrer" />}
                          >
                            <PlayIcon data-icon="inline-start" />
                            Lecture
                          </Button>
                          )
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-slate-500"
                >
                  No notes match the current library filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
