import Link from "next/link";
import { ArrowRightIcon, ExternalLinkIcon, PlayIcon } from "lucide-react";

import { isUpcomingSession, type NoteItem } from "@/data/notes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverTooltip } from "@/components/ui/hover-tooltip";

type PdfSidebarProps = {
  note: NoteItem;
  relatedSessions: NoteItem[];
};

export function PdfSidebar({ note, relatedSessions }: PdfSidebarProps) {
  const upcomingLecture = isUpcomingSession(note);

  return (
    <aside className="w-full xl:shrink-0">
      <div className="space-y-5 text-slate-950 dark:text-white">
        <div className="space-y-1">
          <div className="font-numbers text-[12px] text-[#3563ff]">
            Session {note.sessionNumber}
          </div>
          <h2 className="text-[1.55rem] font-semibold tracking-[-0.035em]">
            {note.title}
          </h2>
        </div>

        <div className="space-y-4 border-t border-slate-200 pt-4 dark:border-white/10">
          <div className="space-y-2">
            <div className="text-[13px] font-medium">Topic</div>
            <Badge className="rounded-xl border-0 bg-[#eef3ff] px-3 py-1 text-[12px] text-[#2452f2] shadow-none dark:bg-[#18306a] dark:text-[#b9c8ff]">
              {note.topic}
            </Badge>
          </div>

          {note.difficulty ? (
            <div className="space-y-2">
              <div className="text-[13px] font-medium">Difficulty</div>
              <Badge className="rounded-xl border-0 bg-[#f3f0ff] px-3 py-1 text-[12px] text-[#6f4cd7] shadow-none dark:bg-[#2b1e57] dark:text-[#d3c4ff]">
                {note.difficulty}
              </Badge>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-[13px] font-medium">Concepts</div>
            <div className="flex flex-wrap gap-2">
              {note.concepts.map((concept) => (
                <Badge
                  key={concept}
                  className="rounded-xl border-0 bg-[#f7f8fc] px-3 py-1 text-[12px] text-slate-700 shadow-none dark:bg-white/8 dark:text-slate-200"
                >
                  {concept}
                </Badge>
              ))}
            </div>
          </div>

          {note.summary ? (
            <div className="space-y-2">
              <div className="text-[13px] font-medium">Description</div>
              <p className="text-[13px] leading-6 text-slate-600 dark:text-slate-400">
                {note.summary}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
          <div className="text-[13px] font-medium">Related sessions</div>
          <div className="space-y-2">
            {relatedSessions.length ? (
              relatedSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] transition-colors hover:bg-[#f8faff] dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8"
                >
                  <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200">
                    {session.title}
                  </span>
                  <ArrowRightIcon className="size-4 text-slate-400 dark:text-slate-500" />
                </Link>
              ))
            ) : (
              <div className="text-[13px] text-slate-500 dark:text-slate-400">
                No related sessions.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
          <div className="text-[13px] font-medium">Quick actions</div>
          <div className="space-y-2">
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
                    variant="outline"
                    disabled
                    className="h-10 w-full justify-between rounded-xl border-slate-200 bg-white text-[13px] text-slate-400 dark:border-white/10 dark:bg-white/5"
                  >
                    <span>Open original PDF</span>
                    <ExternalLinkIcon data-icon="inline-end" />
                  </Button>
                </span>
              </HoverTooltip>
            ) : (
              <Button
                variant="outline"
                nativeButton={false}
                className="h-10 w-full justify-between rounded-xl border-slate-200 bg-white text-[13px] text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                render={<a href={note.originalPdfUrl ?? note.notesUrl} />}
              >
                <span>Open original PDF</span>
                <ExternalLinkIcon data-icon="inline-end" />
              </Button>
            )}
            {note.lectureUrl ? (
              upcomingLecture ? (
                <Button
                  variant="outline"
                  disabled
                  className="h-10 w-full justify-between rounded-xl border-[#e4e9f4] bg-white text-[13px] text-slate-400 dark:border-white/10 dark:bg-white/5"
                >
                  <span>About to happen</span>
                  <PlayIcon data-icon="inline-end" />
                </Button>
              ) : (
              <Button
                variant="outline"
                nativeButton={false}
                className="h-10 w-full justify-between rounded-xl border-[#e4e9f4] bg-[#0f172a] text-[13px] text-white hover:bg-[#111c36] dark:border-[#2d3e6f] dark:bg-[#1c4fff] dark:hover:bg-[#1848e5]"
                render={
                  <a href={note.lectureUrl} target="_blank" rel="noreferrer" />
                }
              >
                <span>Watch lecture</span>
                <PlayIcon data-icon="inline-end" />
              </Button>
              )
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}
