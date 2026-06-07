"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CommandIcon,
  ExternalLinkIcon,
  FolderIcon,
  FolderOpenIcon,
  HistoryIcon,
  HomeIcon,
  LibraryBigIcon,
  MenuIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  PlayIcon,
  SearchIcon,
} from "lucide-react";
import Link from "next/link";

import type { NoteDirectoryNode, NoteItem, NoteType } from "@/data/notes";
import {
  isUpcomingSession,
  notes as allNotes,
  notesDirectory,
  popularTopics,
} from "@/data/notes";
import { CommandSearch } from "@/components/command-search";
import { PdfErrorState } from "@/components/pdf/pdf-error-state";
import { PdfSidebar } from "@/components/pdf/pdf-sidebar";
import { PdfViewer } from "@/components/pdf/pdf-viewer";
import { SessionNotesBrowser } from "@/components/session-notes-browser";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SelectMenu } from "@/components/ui/select-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { filterNotes } from "@/lib/search-notes";
import { cn } from "@/lib/utils";

type SessionPageShellProps = {
  note: NoteItem;
  relatedSessions: NoteItem[];
  backHref?: string;
  initialView?: "pdf" | "all-notes" | "recent";
};

type CenterView =
  | { kind: "pdf" }
  | { kind: "all-notes" }
  | { kind: "recent" }
  | {
      kind: "directory";
      directoryId: string;
      title: string;
      subtitle: string;
      noteIds: string[];
    };

type NotesSidebarContentProps = {
  centerView: CenterView;
  isExpanded: boolean;
  noteId: string;
  onOpenSearch: () => void;
  onSelectView: (view: CenterView) => void;
  onCloseMobile?: () => void;
};

const RECENT_SESSION_IDS_KEY = "az-notes:recent-session-ids";
const RECENT_SESSION_LIMIT = 15;

function readRecentSessionIds(currentNoteId: string, includeCurrent: boolean) {
  if (typeof window === "undefined") {
    return includeCurrent ? [currentNoteId] : [];
  }

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(RECENT_SESSION_IDS_KEY) ?? "[]"
    );
    const storedIds = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
    const nextIds = includeCurrent
      ? [currentNoteId, ...storedIds.filter((id) => id !== currentNoteId)]
      : storedIds;

    return nextIds.slice(0, RECENT_SESSION_LIMIT);
  } catch {
    return includeCurrent ? [currentNoteId] : [];
  }
}

function collectDirectoryIds(node: NoteDirectoryNode): string[] {
  return [node.id, ...(node.children?.flatMap(collectDirectoryIds) ?? [])];
}

function findDirectoryNode(
  nodes: NoteDirectoryNode[],
  targetId: string
): NoteDirectoryNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node;
    }

    const match = node.children ? findDirectoryNode(node.children, targetId) : null;

    if (match) {
      return match;
    }
  }

  return null;
}

function DirectoryTreeItem({
  node,
  depth,
  centerView,
  currentNoteId,
  onSelectView,
  onCloseMobile,
}: {
  node: NoteDirectoryNode;
  depth: number;
  centerView: CenterView;
  currentNoteId: string;
  onSelectView: (view: CenterView) => void;
  onCloseMobile?: () => void;
}) {
  const isExplicitlySelected =
    centerView.kind === "directory" && centerView.directoryId === node.id;
  const containsActiveNote = node.noteIds.includes(currentNoteId);
  const descendantIds = node.children?.flatMap(collectDirectoryIds) ?? [];
  const childSelected =
    centerView.kind === "directory" && descendantIds.includes(centerView.directoryId);
  const defaultOpen = containsActiveNote || isExplicitlySelected || childSelected;
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const hasChildren = Boolean(node.children?.length);
  const isOpen = manualOpen ?? defaultOpen;
  const toggleOpen = () => setManualOpen((current) => !(current ?? defaultOpen));
  const isTopLevel = depth === 0;

  return (
    <div className={cn("relative", isTopLevel ? "space-y-1" : "space-y-1.5")}>
      <div className="relative" style={{ paddingLeft: `${depth * 1.15}rem` }}>
        {depth > 0 ? (
          <div className="pointer-events-none absolute left-[0.72rem] top-[-0.45rem] h-[calc(100%+0.9rem)] w-px bg-slate-200 dark:bg-[#31415e]" />
        ) : null}

        <div className="relative flex min-h-12 items-center gap-2">
          {depth > 0 ? (
            <>
              <div className="pointer-events-none absolute left-[0.72rem] top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 dark:bg-[#49617f]" />
              <div className="pointer-events-none absolute left-[0.72rem] top-1/2 h-px w-[1rem] -translate-y-1/2 bg-slate-200 dark:bg-[#31415e]" />
            </>
          ) : null}

          <button
            type="button"
            onClick={() => {
              if (hasChildren) {
                setManualOpen(true);
              }

              onSelectView({
                kind: "directory",
                directoryId: node.id,
                title: node.label,
                subtitle: node.description,
                noteIds: node.noteIds,
              });
              onCloseMobile?.();
            }}
            className={cn(
              "group relative flex min-w-0 flex-1 items-center gap-3 rounded-[0.95rem] px-3 py-2 text-left transition-[background-color,color,box-shadow] duration-150",
              isExplicitlySelected
                ? "bg-[linear-gradient(180deg,rgba(242,246,255,0.98),rgba(230,238,255,0.98))] text-slate-950 shadow-[inset_2px_0_0_#5f83ff,0_10px_26px_rgba(79,124,255,0.12)] dark:bg-[linear-gradient(180deg,rgba(28,42,72,0.98),rgba(20,31,56,0.98))] dark:text-[#eef4ff]"
                : containsActiveNote
                  ? "text-slate-800 dark:text-[#dfe8fb]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950 dark:text-[#b8c4da] dark:hover:bg-white/8 dark:hover:text-[#f4f7ff]"
            )}
          >
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center transition-colors",
                isExplicitlySelected
                  ? "text-[#4f7cff]"
                  : "text-slate-400 group-hover:text-slate-600 dark:text-[#6f88ad] dark:group-hover:text-[#b9c8de]"
              )}
            >
              {hasChildren && isOpen ? (
                <FolderOpenIcon className="size-4" strokeWidth={1.8} />
              ) : (
                <FolderIcon className="size-4" strokeWidth={1.8} />
              )}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-[0.8rem] font-medium leading-4">
                {node.label}
              </span>
              <span className="block truncate text-[0.66rem] leading-4 text-slate-400 dark:text-[#72829d]">
                {node.noteIds.length} sessions
              </span>
            </span>

            {hasChildren ? (
              <span
                role="button"
                tabIndex={0}
                className="ml-auto flex size-6 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 group-hover:text-slate-600 dark:text-[#74839a] dark:hover:bg-white/8 dark:group-hover:text-[#aebbd0]"
                aria-label={isOpen ? "Collapse folder" : "Expand folder"}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleOpen();
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    event.stopPropagation();
                    toggleOpen();
                  }
                }}
              >
                {isOpen ? (
                  <ChevronDownIcon className="size-3.5" />
                ) : (
                  <ChevronRightIcon className="size-3.5" />
                )}
              </span>
            ) : null}

            {node.label === "Ad Hoc Sessions" && isTopLevel ? (
              <span className="ml-1 size-1.5 shrink-0 rounded-full bg-[#f4bf4f] shadow-[0_0_12px_rgba(244,191,79,0.55)]" />
            ) : null}
          </button>
        </div>
      </div>

      {hasChildren && isOpen ? (
        <div className="space-y-0.5 pt-0.5">
          {node.children?.map((child) => (
            <DirectoryTreeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              centerView={centerView}
              currentNoteId={currentNoteId}
              onSelectView={onSelectView}
              onCloseMobile={onCloseMobile}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NotesSidebarContent({
  centerView,
  isExpanded,
  noteId,
  onOpenSearch,
  onSelectView,
  onCloseMobile,
}: NotesSidebarContentProps) {
  return (
    <>
      <div
        className={cn(
          "border-b border-slate-200/80 px-3 py-4 dark:border-[#1a2639]",
          isExpanded ? "w-full" : "w-[4.5rem]"
        )}
      >
        <nav className="space-y-1.5">
          {!isExpanded ? (
            <div className="flex justify-center pb-1">
              <ThemeToggle />
            </div>
          ) : null}

          <Link
            href="/"
            title="Home"
            onClick={() => onCloseMobile?.()}
            className={cn(
              "flex w-full items-center rounded-[0.95rem] px-3 py-2 text-[13px] font-medium text-slate-700 transition-[background-color,color,box-shadow] hover:bg-slate-50 hover:text-slate-950 dark:text-[#c9d3e6] dark:hover:bg-white/8 dark:hover:text-white",
              isExpanded ? "gap-3" : "justify-center"
            )}
          >
            <HomeIcon className="size-4 text-slate-400 dark:text-[#7890b0]" />
            {isExpanded ? <span>Home</span> : null}
          </Link>

          <button
            type="button"
            title="Search notes"
            onClick={() => {
              onCloseMobile?.();
              onOpenSearch();
            }}
            className={cn(
              "flex w-full items-center rounded-[0.95rem] px-3 py-2 text-[13px] font-medium text-slate-700 transition-[background-color,color,box-shadow] hover:bg-slate-50 hover:text-slate-950 dark:text-[#c9d3e6] dark:hover:bg-white/8 dark:hover:text-white",
              isExpanded ? "gap-3" : "justify-center"
            )}
          >
            <SearchIcon className="size-4 text-slate-400 dark:text-[#7890b0]" />
            {isExpanded ? (
              <>
                <span>Search notes</span>
                <span className="ml-auto inline-flex items-center gap-1 rounded-[0.8rem] border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500 dark:border-[#26364f] dark:bg-[#0d1728] dark:text-[#74839a]">
                  <CommandIcon className="size-3.5" />
                  <span>K</span>
                </span>
              </>
            ) : null}
          </button>

          {[
            {
              label: "All Notes",
              icon: LibraryBigIcon,
              view: { kind: "all-notes" } as CenterView,
            },
            {
              label: "Recent",
              icon: HistoryIcon,
              view: { kind: "recent" } as CenterView,
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              onClick={() => {
                onSelectView(item.view);
                onCloseMobile?.();
              }}
              className={cn(
                "flex w-full items-center rounded-[0.95rem] px-3 py-2 text-[13px] font-medium text-slate-700 transition-[background-color,color,box-shadow] hover:bg-slate-50 hover:text-slate-950 dark:text-[#c9d3e6] dark:hover:bg-white/8 dark:hover:text-white",
                centerView.kind === item.view.kind &&
                  "bg-[linear-gradient(180deg,rgba(242,246,255,0.98),rgba(230,238,255,0.98))] text-slate-950 shadow-[inset_2px_0_0_#5f83ff,0_10px_26px_rgba(79,124,255,0.12)] dark:bg-[#1a2947] dark:text-white",
                isExpanded ? "gap-3" : "justify-center"
              )}
            >
              <item.icon className="size-4 text-slate-400 dark:text-[#7890b0]" />
              {isExpanded ? <span>{item.label}</span> : null}
            </button>
          ))}
        </nav>
      </div>

      {isExpanded ? (
      <div className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full min-h-0 flex-col">
          <div className="px-6 pb-3 pt-4 text-[0.62rem] font-medium uppercase tracking-[0.48em] text-slate-400 dark:text-[#66748c]">
            Notes Directory
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5">
            <div className="space-y-2">
              {notesDirectory.map((node) => (
                <DirectoryTreeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  centerView={centerView}
                  currentNoteId={noteId}
                  onSelectView={onSelectView}
                  onCloseMobile={onCloseMobile}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      ) : null}
    </>
  );
}

export function SessionPageShell({
  note,
  relatedSessions,
  backHref = "/",
  initialView = "pdf",
}: SessionPageShellProps) {
  const router = useRouter();
  const [isNotesSidebarOpen, setIsNotesSidebarOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1280
  );
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1280
  );
  const [centerView, setCenterView] = useState<CenterView>({ kind: initialView });
  const [viewHistory, setViewHistory] = useState<CenterView[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentNoteIds] = useState(() =>
    readRecentSessionIds(note.id, initialView === "pdf")
  );
  const [browserType, setBrowserType] = useState<NoteType | "All">("All");
  const [browserSort, setBrowserSort] = useState<"newest" | "session">("session");
  const shouldReduceMotion = useReducedMotion();
  const upcomingLecture = isUpcomingSession(note);

  const allNotesBySession = useMemo(() => [...allNotes], []);
  const recentNotes = useMemo(() => {
    const noteById = new Map(allNotes.map((entry) => [entry.id, entry]));

    return recentNoteIds
      .map((id) => noteById.get(id))
      .filter((entry): entry is NoteItem => Boolean(entry));
  }, [recentNoteIds]);
  const directoryNotes = useMemo(() => {
    if (centerView.kind !== "directory") {
      return [];
    }

    const noteIdSet = new Set(centerView.noteIds);
    return allNotesBySession.filter((entry) => noteIdSet.has(entry.id));
  }, [allNotesBySession, centerView]);
  const activeDirectoryNode = useMemo(
    () =>
      centerView.kind === "directory"
        ? findDirectoryNode(notesDirectory, centerView.directoryId)
        : null,
    [centerView]
  );
  const timelineSessionNumbers = useMemo(() => {
    const orderedNotes = [...allNotes].sort((left, right) => {
      const leftDate = left.date
        ? new Date(left.date).getTime()
        : Number.POSITIVE_INFINITY;
      const rightDate = right.date
        ? new Date(right.date).getTime()
        : Number.POSITIVE_INFINITY;

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      return left.sessionNumber - right.sessionNumber;
    });

    return Object.fromEntries(orderedNotes.map((entry, index) => [entry.id, index + 1]));
  }, []);

  const centerBaseNotes =
    centerView.kind === "all-notes"
      ? allNotesBySession
      : centerView.kind === "recent"
        ? recentNotes
        : directoryNotes;
  const centerNotes =
    centerView.kind === "pdf"
      ? []
      : filterNotes(centerBaseNotes, {
          type: browserType,
          sort: browserSort,
        });

  const centerMeta = useMemo(() => {
    if (centerView.kind === "all-notes") {
      return {
        title: "All Notes",
        subtitle:
          "Browse the complete notes library, then use the folder directory on the left to jump into specific phases or grouped sessions.",
        count: centerNotes.length,
      };
    }

    if (centerView.kind === "recent") {
      return {
        title: "Recent Notes",
        subtitle: "Sessions you opened most recently on this device.",
        count: centerNotes.length,
      };
    }

    if (centerView.kind === "directory") {
      return {
        title: centerView.title,
        subtitle: centerView.subtitle,
        count: centerNotes.length,
      };
    }

    return {
      title: note.title,
      subtitle:
        note.summary ??
        "Read the note preview and jump into the lecture when needed.",
      count: note.sessionNumber,
    };
  }, [centerNotes.length, centerView, note.sessionNumber, note.summary, note.title]);

  const submitSearchQuery = (query: string) => {
    const nextQuery = query.trim();

    if (!nextQuery) {
      return;
    }

    setRecentSearches((current) =>
      [nextQuery, ...current.filter((entry) => entry !== nextQuery)].slice(0, 5)
    );
  };

  const centerViewKey =
    centerView.kind === "directory"
      ? `directory:${centerView.directoryId}`
      : centerView.kind;

  const selectCenterView = (nextView: CenterView) => {
    const nextKey =
      nextView.kind === "directory"
        ? `directory:${nextView.directoryId}`
        : nextView.kind;

    if (nextKey === centerViewKey) {
      return;
    }

    setViewHistory((current) => [...current, centerView]);
    setCenterView(nextView);
  };

  const handleBack = () => {
    if (viewHistory.length > 0) {
      const previousView = viewHistory[viewHistory.length - 1];
      setViewHistory((current) => current.slice(0, -1));
      setCenterView(previousView);
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(backHref);
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updateViewport = () => {
      const nextDesktop = window.innerWidth >= 1280;
      setIsDesktopViewport(nextDesktop);

      if (nextDesktop) {
        setIsNotesSidebarOpen(false);
        setIsInfoSidebarOpen(true);
      }
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);

    return () => {
      window.removeEventListener("resize", updateViewport);
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      RECENT_SESSION_IDS_KEY,
      JSON.stringify(recentNoteIds.slice(0, RECENT_SESSION_LIMIT))
    );
  }, [recentNoteIds]);

  return (
    <main className="min-h-screen bg-[#f7faff] dark:bg-[#12121e] xl:h-screen xl:overflow-hidden">
      <div className="w-full xl:h-screen">
        <div
          className={cn(
            "flex min-h-screen flex-col transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] xl:h-screen xl:grid xl:overflow-hidden",
            isInfoSidebarOpen
              ? "xl:grid-cols-[4.5rem_minmax(0,1fr)_18.75rem]"
              : "xl:grid-cols-[4.5rem_minmax(0,1fr)_0rem]"
          )}
        >
          <motion.aside
            animate={{ width: isNotesSidebarOpen ? 320 : 72 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: "spring", stiffness: 300, damping: 34 }
            }
            className={cn(
              "hidden overflow-hidden border-r border-slate-200 bg-white shadow-[18px_0_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#0b101b] dark:shadow-[18px_0_50px_rgba(0,0,0,0.26)] xl:fixed xl:left-0 xl:top-0 xl:z-40 xl:flex xl:h-screen xl:flex-col"
            )}
          >
            <div
              className={cn(
                "flex border-b border-slate-200/80 px-3 py-3 dark:border-white/10",
                isNotesSidebarOpen
                  ? "w-full items-center justify-between"
                  : "w-[4.5rem] items-center justify-center"
              )}
            >
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label={
                  isNotesSidebarOpen
                    ? "Collapse notes sidebar"
                    : "Expand notes sidebar"
                }
                onClick={() => setIsNotesSidebarOpen((current) => !current)}
                className="text-slate-500 hover:bg-slate-100 hover:text-slate-950 dark:text-[#8fa2bd] dark:hover:bg-white/8 dark:hover:text-white"
              >
                {isNotesSidebarOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
              </Button>
              {isNotesSidebarOpen ? <ThemeToggle /> : null}
            </div>

            <NotesSidebarContent
              centerView={centerView}
              isExpanded={isNotesSidebarOpen}
              noteId={note.id}
              onOpenSearch={() => setIsSearchOpen(true)}
              onSelectView={selectCenterView}
            />
          </motion.aside>

          <div className="hidden xl:block" aria-hidden="true" />

          <section className="min-w-0 border-r border-slate-200 dark:border-white/10 xl:grid xl:h-screen xl:grid-rows-[auto_1fr] xl:overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 dark:border-white/10 lg:px-5 lg:py-4 xl:sticky xl:top-0 xl:z-10 xl:bg-[#f7faff] dark:xl:bg-[#12121e]">
              <div className="flex items-center justify-between xl:hidden">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={
                      isNotesSidebarOpen
                        ? "Collapse notes sidebar"
                        : "Expand notes sidebar"
                    }
                    onClick={() => setIsNotesSidebarOpen((current) => !current)}
                    className="dark:text-slate-200"
                  >
                    <MenuIcon />
                  </Button>
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={
                      isInfoSidebarOpen
                        ? "Collapse info sidebar"
                        : "Expand info sidebar"
                    }
                    onClick={() => setIsInfoSidebarOpen((current) => !current)}
                    className="dark:text-slate-200"
                  >
                    {isInfoSidebarOpen ? <PanelRightCloseIcon /> : <PanelRightOpenIcon />}
                  </Button>
                </div>
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-3 xl:grid xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center xl:gap-4">
                <div className="flex shrink-0 items-center gap-2.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-fit rounded-xl px-3.5 text-[13px] text-slate-700 dark:text-slate-200"
                    onClick={handleBack}
                  >
                    <ArrowLeftIcon data-icon="inline-start" />
                    Back
                  </Button>

                  <div className="hidden h-7 w-px shrink-0 bg-slate-200 dark:bg-white/10 lg:block" />
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <CardTitle className="min-w-0 truncate font-heading text-[1.55rem] tracking-[-0.04em] text-slate-950 dark:text-white xl:text-[1.5rem] 2xl:text-[1.7rem]">
                    {centerMeta.title}
                  </CardTitle>
                  <Badge className="shrink-0 rounded-xl border-0 bg-[#eef3ff] px-2.5 py-0.75 text-[12px] font-medium text-[#2452f2] shadow-none dark:bg-[#18315f] dark:text-[#d6e4ff]">
                    {centerView.kind === "pdf"
                      ? `Session ${note.sessionNumber}`
                      : `${centerMeta.count} sessions`}
                  </Badge>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={
                      isInfoSidebarOpen
                        ? "Collapse info sidebar"
                        : "Expand info sidebar"
                    }
                    onClick={() => setIsInfoSidebarOpen((current) => !current)}
                    className="hidden rounded-xl border-slate-200 bg-white text-slate-600 shadow-none hover:bg-slate-50 hover:text-slate-950 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/8 xl:inline-flex"
                  >
                    {isInfoSidebarOpen ? (
                      <PanelRightCloseIcon />
                    ) : (
                      <PanelRightOpenIcon />
                    )}
                  </Button>
                  {centerView.kind === "pdf" ? (
                    <>
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
                              className="h-10 shrink-0 rounded-xl border-slate-200 bg-white px-4 text-[13px] text-slate-400 dark:border-white/10 dark:bg-white/5"
                            >
                              Open original PDF
                              <ExternalLinkIcon data-icon="inline-end" />
                            </Button>
                          </span>
                        </HoverTooltip>
                      ) : (
                        <Button
                          variant="outline"
                          className="h-10 shrink-0 rounded-xl border-slate-200 bg-white px-4 text-[13px] text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          nativeButton={false}
                          render={<a href={note.originalPdfUrl ?? note.notesUrl} />}
                        >
                          Open original PDF
                          <ExternalLinkIcon data-icon="inline-end" />
                        </Button>
                      )}
                      {note.lectureUrl ? (
                        upcomingLecture ? (
                          <Button
                            disabled
                            className="h-10 shrink-0 rounded-xl bg-slate-200 px-4 text-[13px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400"
                          >
                            <PlayIcon data-icon="inline-start" />
                            About to happen
                          </Button>
                        ) : (
                        <Button
                          className="h-10 shrink-0 rounded-xl bg-slate-950 px-4 text-[13px] font-medium text-white hover:bg-slate-800 dark:bg-[#1c4fff] dark:hover:bg-[#1848e5]"
                          nativeButton={false}
                          render={
                            <a
                              href={note.lectureUrl}
                              target="_blank"
                              rel="noreferrer"
                            />
                          }
                        >
                          <PlayIcon data-icon="inline-start" />
                          Watch lecture
                        </Button>
                        )
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              {centerView.kind === "pdf" ? null : (
                <p className="max-w-3xl text-[13px] leading-5.5 text-slate-500 dark:text-slate-400">
                  {centerMeta.subtitle}
                </p>
              )}
            </div>

            <div className="xl:min-h-0 xl:overflow-hidden">
              {centerView.kind === "pdf" ? (
                note.hasNotes === false ? (
                  <PdfErrorState
                    title="Notes not added yet"
                    message="This session currently has a lecture recording, but the notes PDF has not been added yet."
                    className="m-4 min-h-[calc(100svh-12rem)] px-6 py-14 pb-20 dark:bg-[#0f1524] sm:m-6 sm:px-10 xl:min-h-[calc(100vh-10rem)]"
                  />
                ) : note.pdfUrl ? (
                  <PdfViewer
                    pdfUrl={note.pdfUrl}
                    originalPdfUrl={note.originalPdfUrl ?? note.notesUrl}
                    title={note.title}
                  />
                ) : (
                  <PdfErrorState
                    title="Notes preview unavailable"
                    actionHref={note.originalPdfUrl ?? note.notesUrl}
                    actionLabel="Open original PDF"
                  />
                )
              ) : (
                <div className="space-y-3 py-3 xl:flex xl:h-full xl:min-h-0 xl:flex-col">
                  <div className="flex flex-col gap-2.5 px-4 lg:px-5">
                    <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center">
                      <div className="flex min-h-10 min-w-[15rem] items-center rounded-[1rem] border border-[#dfe7f5] bg-[linear-gradient(180deg,#ffffff_0%,#f6f8fd_100%)] px-3.5 text-[13px] font-medium text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.04)] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(18,24,39,0.96),rgba(12,18,31,0.98))] dark:text-slate-200">
                        {centerView.kind === "directory" ? (
                          <div className="flex min-w-0 items-center gap-2.5">
                            <FolderOpenIcon className="size-4 shrink-0 text-[#4f7cff]" />
                            <span className="truncate">
                              {activeDirectoryNode?.label ?? centerView.title}
                            </span>
                          </div>
                        ) : (
                          <div className="flex min-w-0 items-center gap-2.5">
                            <LibraryBigIcon className="size-4 shrink-0 text-[#4f7cff]" />
                            <span className="truncate">
                              {centerView.kind === "all-notes"
                                ? "All Notes"
                                : "Recent Notes"}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 xl:ml-auto">
                        <SelectMenu
                          label="Type filter"
                          value={browserType}
                          onChange={(value) => setBrowserType(value as NoteType | "All")}
                          options={[
                            { value: "All", label: "All Types" },
                            { value: "Lecture", label: "Lecture" },
                            { value: "Revision", label: "Revision" },
                          ]}
                          className="lg:min-w-[11rem]"
                        />
                        <SelectMenu
                          label="Sort order"
                          value={browserSort}
                          onChange={(value) =>
                            setBrowserSort(value as "newest" | "session")
                          }
                          options={[
                            { value: "newest", label: "Newest First" },
                            { value: "session", label: "Session Order" },
                          ]}
                          className="lg:min-w-[11rem]"
                        />
                          <Button
                            type="button"
                            variant="ghost"
                          onClick={() => {
                            setBrowserType("All");
                            setBrowserSort("session");
                          }}
                            className="h-10 rounded-xl px-3 text-[13px] text-slate-500 dark:text-slate-300"
                          >
                            Reset filters
                          </Button>
                      </div>
                    </div>

                  </div>

                  <div className="px-4 pt-1 lg:px-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-2">
                    <SessionNotesBrowser
                      notes={centerNotes}
                      sessionNumberById={timelineSessionNumbers}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          <section
            className={cn(
              "bg-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:bg-[#0b101b] xl:sticky xl:top-0 xl:h-screen xl:overflow-y-auto",
              isInfoSidebarOpen ? "w-full px-3 py-3 xl:w-[18.75rem]" : "w-0 overflow-hidden p-0"
            )}
          >
            {isInfoSidebarOpen ? (
              <PdfSidebar note={note} relatedSessions={relatedSessions} />
            ) : null}
          </section>
        </div>
      </div>

      {!isDesktopViewport ? (
        <Dialog open={isNotesSidebarOpen} onOpenChange={setIsNotesSidebarOpen}>
          <DialogContent
            showCloseButton={false}
            motionPopup
            motionPreset="side-left"
            className="left-0 top-0 h-[100dvh] w-[min(24rem,calc(100vw-1rem))] max-w-none translate-x-0 translate-y-0 rounded-none rounded-r-[1.75rem] border border-slate-200 bg-white p-0 shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#0b101b] xl:hidden"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 px-3 py-4 dark:border-white/10">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Notes directory
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setIsNotesSidebarOpen(false)}
                  className="dark:text-slate-200"
                >
                  <PanelLeftCloseIcon />
                </Button>
              </div>
              <NotesSidebarContent
                centerView={centerView}
                isExpanded
                noteId={note.id}
                onOpenSearch={() => setIsSearchOpen(true)}
                onSelectView={selectCenterView}
                onCloseMobile={() => setIsNotesSidebarOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {!isDesktopViewport ? (
        <Dialog open={isInfoSidebarOpen} onOpenChange={setIsInfoSidebarOpen}>
          <DialogContent
            showCloseButton={false}
            motionPopup
            motionPreset="side-right"
            className="left-auto right-0 top-0 h-[100dvh] w-[min(22rem,calc(100vw-1rem))] max-w-none translate-x-0 translate-y-0 rounded-none rounded-l-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_30px_90px_rgba(15,23,42,0.22)] dark:border-white/10 dark:bg-[#0b101b] xl:hidden"
          >
            <div className="flex h-full min-h-0 flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  Session info
                </div>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setIsInfoSidebarOpen(false)}
                  className="dark:text-slate-200"
                >
                  <PanelLeftCloseIcon />
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PdfSidebar note={note} relatedSessions={relatedSessions} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      <CommandSearch
        notes={allNotes}
        open={isSearchOpen}
        recentSearches={recentSearches}
        popularTopics={popularTopics}
        onOpenChange={setIsSearchOpen}
        onSubmitQuery={submitSearchQuery}
        onClearRecentSearches={() => setRecentSearches([])}
      />
    </main>
  );
}
