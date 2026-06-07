"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDownIcon,
  FileTextIcon,
  FolderIcon,
  PlayIcon,
} from "lucide-react";

import { isUpcomingSession, type TopicSearchResult } from "@/data/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { getTopicTheme } from "@/lib/topic-theme";
import { cn } from "@/lib/utils";

type TopicSearchResultProps = {
  result: TopicSearchResult;
  defaultOpen?: boolean;
  buildSessionHref?: (id: string, focusId: string) => string;
  onSessionNavigate?: (focusId: string) => void;
};

export function TopicSearchResultCard({
  result,
  defaultOpen = false,
  buildSessionHref,
  onSessionNavigate,
}: TopicSearchResultProps) {
  const [open, setOpen] = useState(defaultOpen);
  const theme = getTopicTheme(result.topic);

  return (
    <Card
      className={cn(
        "gap-0 rounded-[1.7rem] bg-white/92 py-0 shadow-[0_18px_60px_rgba(52,102,214,0.05)] transition-[transform,box-shadow,border-color] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:shadow-[0_26px_80px_rgba(52,102,214,0.09)] dark:bg-[#0f1524]",
        theme.softBorderClassName
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex min-w-0 gap-3">
          <div
            className={cn(
              "mt-0.5 flex size-9 items-center justify-center rounded-xl border",
              theme.surfaceClassName
            )}
          >
            <FolderIcon className={cn("size-4", theme.iconClassName)} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {result.topic}
              </h3>
              <Badge className={theme.badgeClassName}>Topic</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Matched inside: {result.matchedConcepts.join(", ")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>
            {result.sessions.length}{" "}
            {result.sessions.length === 1 ? "match" : "matches"}
          </span>
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
              open && "rotate-180"
            )}
          />
        </div>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div
            className={cn(
              "border-t border-[#efe5d7] px-5 py-2 transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)] dark:border-white/10",
              open ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            )}
          >
            <div className="space-y-1">
            {result.sessions.map((session) => (
              <div
                key={session.id}
                id={`search-session-${session.id}`}
                tabIndex={-1}
                className={cn(
                  "flex flex-col gap-3 border-l py-3 pl-7 first:pt-4 last:pb-4 md:flex-row md:items-center md:justify-between",
                  theme.softBorderClassName
                )}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="font-numbers text-muted-foreground">
                      Session {session.sessionNumber}
                    </span>
                    <Link
                      href={
                        buildSessionHref?.(
                          session.id,
                          `search-session-${session.id}`
                        ) ?? `/sessions/${session.id}`
                      }
                      onClick={() =>
                        onSessionNavigate?.(`search-session-${session.id}`)
                      }
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {session.title}
                    </Link>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {session.summary ?? session.subtopics.join(", ")}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap md:justify-end">
                  {session.difficulty ? (
                    <Badge variant="outline">{session.difficulty}</Badge>
                  ) : null}
                  {session.hasNotes === false ? (
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
                          size="default"
                          variant="outline"
                          disabled
                          className="h-11 min-w-[10.5rem] justify-center rounded-xl"
                        >
                          <FileTextIcon data-icon="inline-start" />
                          Open notes
                        </Button>
                      </span>
                    </HoverTooltip>
                  ) : (
                    <Button
                      size="default"
                      variant="outline"
                      className="h-11 min-w-[10.5rem] justify-center rounded-xl"
                      nativeButton={false}
                      onClick={() =>
                        onSessionNavigate?.(`search-session-${session.id}`)
                      }
                      render={
                        <Link
                          href={
                            buildSessionHref?.(
                              session.id,
                              `search-session-${session.id}`
                            ) ?? `/sessions/${session.id}`
                          }
                        />
                      }
                    >
                      <FileTextIcon data-icon="inline-start" />
                      Open notes
                    </Button>
                  )}
                  {session.lectureUrl ? (
                    isUpcomingSession(session) ? (
                      <Button
                        size="default"
                        variant="outline"
                        disabled
                        className="h-11 min-w-[10.5rem] justify-center rounded-xl text-slate-400"
                      >
                        <PlayIcon data-icon="inline-start" />
                        About to happen
                      </Button>
                    ) : (
                    <Button
                      size="default"
                      variant="outline"
                      className="h-11 min-w-[10.5rem] justify-center rounded-xl"
                      nativeButton={false}
                      render={<a href={session.lectureUrl} target="_blank" rel="noreferrer" />}
                    >
                      <PlayIcon data-icon="inline-start" />
                      Watch lecture
                    </Button>
                    )
                  ) : null}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
