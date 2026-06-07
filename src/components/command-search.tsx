"use client";

import { Command as CommandPrimitive } from "cmdk";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  BinaryIcon,
  BoxesIcon,
  Clock3Icon,
  FileTextIcon,
  Layers3Icon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";

import type { NoteItem, TopicSearchResult } from "@/data/notes";
import { groupTopicSearchResults } from "@/lib/search-notes";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { InputGroup, InputGroupAddon } from "@/components/ui/input-group";

type CommandSearchProps = {
  notes: NoteItem[];
  open: boolean;
  recentSearches: string[];
  popularTopics: readonly string[];
  onOpenChange: (open: boolean) => void;
  onSubmitQuery: (query: string) => void;
  onClearRecentSearches: () => void;
  buildSessionHref?: (id: string, sourceQuery: string) => string;
  onSessionNavigate?: (focusId: string, sourceQuery: string) => void;
};

const topicMeta: Record<
  string,
  { description: string; icon: React.ComponentType<{ className?: string }>; accent: string }
> = {
  "Binary Search": {
    description: "Efficient search in sorted arrays and monotonic spaces",
    icon: BinaryIcon,
    accent: "text-[#3563ff]",
  },
  "Dynamic Programming": {
    description: "Solve complex problems by breaking into simpler subproblems",
    icon: BoxesIcon,
    accent: "text-[#39a0b8]",
  },
  Stacks: {
    description: "LIFO data structure and its applications",
    icon: Layers3Icon,
    accent: "text-[#6d5efc]",
  },
  Graphs: {
    description: "Representing and traversing relationships",
    icon: WorkflowIcon,
    accent: "text-[#46b873]",
  },
  Trees: {
    description: "Hierarchical data structures and tree algorithms",
    icon: SparklesIcon,
    accent: "text-[#ef667e]",
  },
};

function TopicGroupPreview({
  result,
  onPickSession,
}: {
  result: TopicSearchResult;
  onPickSession: (id: string) => void;
}) {
  return (
    <CommandGroup key={result.topic} heading={result.topic}>
      <CommandItem disabled className="cursor-default opacity-100">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center gap-2 text-foreground">
            <BoxesIcon className="size-3.5" />
            <span className="font-medium">{result.topic}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Matched inside: {result.matchedConcepts.join(", ")}
          </div>
        </div>
        <CommandShortcut>{result.sessions.length} matches</CommandShortcut>
      </CommandItem>

      {result.sessions.map((session) => (
        <CommandItem
          key={session.id}
          value={`${result.topic} ${session.title} ${session.concepts.join(" ")}`}
          onSelect={() => onPickSession(session.id)}
          onClick={() => onPickSession(session.id)}
          className="items-start py-3"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">
                Session {session.sessionNumber}
              </span>
              <span className="font-medium text-foreground">{session.title}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {session.type} / {session.difficulty ?? "General"}
            </div>
          </div>
          <CommandShortcut className="flex items-center gap-2 tracking-normal">
            <FileTextIcon className="size-3.5" />
            <PlayIcon className="size-3.5" />
          </CommandShortcut>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

export function CommandSearch({
  notes,
  open,
  recentSearches,
  popularTopics,
  onOpenChange,
  onSubmitQuery,
  onClearRecentSearches,
  buildSessionHref,
  onSessionNavigate,
}: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const commandActionLockRef = useRef(false);

  const groupedResults = useMemo(
    () => groupTopicSearchResults(notes, query),
    [notes, query]
  );

  const closePalette = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery("");
    }

    onOpenChange(nextOpen);
  };

  const handleShortcut = useEffectEvent(() => {
    if (!open) {
      onOpenChange(true);
    }
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        handleShortcut();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submitQuery = (value: string) => {
    const nextQuery = value.trim();

    if (!nextQuery) {
      return;
    }

    onSubmitQuery(nextQuery);
    closePalette(false);
  };

  const runCommandAction = (action: () => void) => {
    if (commandActionLockRef.current) {
      return;
    }

    commandActionLockRef.current = true;
    action();
    window.setTimeout(() => {
      commandActionLockRef.current = false;
    }, 80);
  };

  const typing = query.trim().length > 0;
  const submittedQuery = query.trim();

  return (
    <CommandDialog
      open={open}
      onOpenChange={closePalette}
      title="Search notes"
      description="Search notes by concept, topic, or lecture."
      className="w-[min(calc(100vw-0.85rem),31rem)] overflow-hidden border border-[#dfe7fb] bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(250,251,255,0.99))] p-0 shadow-[0_40px_140px_rgba(67,90,150,0.18)] ring-1 ring-white/70 sm:w-[min(calc(100vw-2rem),34rem)] lg:w-[36rem] 2xl:w-[42rem] dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(12,18,31,0.995),rgba(10,14,24,0.995))] dark:ring-white/5"
    >
      <Command shouldFilter={false} className="gap-0">
        <div className="border-b border-[#e8eefb] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,250,255,0.86))] px-3.5 pb-3.5 pt-3.5 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(14,18,31,0.98),rgba(10,14,24,0.94))] sm:px-4 sm:pb-4 sm:pt-4 2xl:px-5 2xl:pb-5 2xl:pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[1.05rem] font-semibold text-slate-900 dark:text-white sm:text-[1.18rem] 2xl:text-[1.45rem]">
                Quick find anything in AlgoZenith
              </div>
              <p className="text-[0.76rem] leading-5 text-slate-500 dark:text-slate-400 sm:text-[0.82rem] 2xl:text-[0.9rem]">
                Search notes, lectures, concepts, or topics across your knowledge base.
              </p>
            </div>
            <div className="rounded-xl border border-[#e1e7f5] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 sm:text-sm">
              Esc
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-[1.05rem] border border-[#cddcff] bg-white p-1.5 shadow-[0_0_0_3px_rgba(53,99,255,0.06)] dark:border-[#304067] dark:bg-[#0f1524] dark:shadow-none sm:mt-4 sm:gap-2.5 sm:rounded-[1.2rem] sm:p-1.5 2xl:mt-5 2xl:gap-3 2xl:rounded-[1.35rem] 2xl:p-2">
            <div className="min-w-0 flex-1">
              <InputGroup className="h-9! rounded-[0.85rem]! border-transparent bg-transparent shadow-none! *:data-[slot=input-group-addon]:pl-3! sm:h-10! sm:rounded-[0.95rem]! 2xl:h-11! 2xl:rounded-[1rem]! 2xl:*:data-[slot=input-group-addon]:pl-4!">
                <InputGroupAddon>
                  <SearchIcon className="size-4 shrink-0 text-slate-400 dark:text-slate-500 2xl:size-5" />
                </InputGroupAddon>
                <CommandPrimitive.Input
                  value={query}
                  onValueChange={setQuery}
                  className="w-full bg-transparent text-[0.82rem] text-slate-900 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500 sm:text-[0.88rem] 2xl:text-[0.96rem]"
                  placeholder="Search notes, lectures, concepts..."
                  aria-label="Search notes"
                />
              </InputGroup>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-xl border border-[#dde4f2] bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 lg:inline-flex 2xl:px-3 2xl:py-2 2xl:text-sm">
                <span>Cmd/Ctrl</span>
                <span>K</span>
              </div>
              <button
                type="button"
                onClick={() => submitQuery(query)}
                className="inline-flex h-[2.125rem] items-center gap-2 rounded-[0.8rem] bg-[#3563ff] px-3 text-xs font-semibold text-white shadow-[0_14px_30px_rgba(53,99,255,0.22)] transition-colors hover:bg-[#2d57e8] sm:h-9 sm:rounded-[0.85rem] 2xl:h-10 2xl:rounded-[0.95rem] 2xl:px-4 2xl:text-sm"
              >
                <span>Search</span>
                <ArrowRightIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>

        <CommandList className="aesthetic-scroll scroll-fade-y max-h-[min(18rem,calc(100svh-13rem))] bg-[linear-gradient(180deg,#fbfcff_0%,#f6f8fc_100%)] px-2.5 pt-2.5 dark:bg-[linear-gradient(180deg,#0d1423_0%,#0a111d_100%)] sm:max-h-[min(20rem,calc(100svh-13rem))] sm:px-3 sm:pt-3 lg:max-h-[min(22rem,calc(100svh-13rem))] 2xl:max-h-[28rem] 2xl:px-4 2xl:pt-4">
          {typing ? (
            <>
              <CommandGroup heading="Search results">
                <CommandItem
                  onSelect={() => runCommandAction(() => submitQuery(query))}
                  onClick={() => runCommandAction(() => submitQuery(query))}
                  className="bg-[#f8fbff] dark:bg-white/6"
                >
                  <SearchIcon className="size-4" />
                  Search library for &quot;{query}&quot;
                  <CommandShortcut>Enter</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              {groupedResults.length ? (
                groupedResults.map((result) => (
                  <TopicGroupPreview
                    key={result.topic}
                    result={result}
                    onPickSession={(id) => runCommandAction(() => {
                      onSessionNavigate?.("search-results-panel", submittedQuery);
                      onSubmitQuery(submittedQuery);
                      closePalette(false);
                      router.push(
                        buildSessionHref?.(id, submittedQuery) ?? `/sessions/${id}`
                      );
                    })}
                  />
                ))
              ) : (
                <CommandEmpty>No grouped topic results found.</CommandEmpty>
              )}
            </>
          ) : (
            <>
              <div className="px-2 pb-2">
                <div className="flex items-center justify-between pb-3">
                  <div className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Recent searches
                  </div>
                  <button
                    type="button"
                    onClick={onClearRecentSearches}
                    className="text-sm font-medium text-[#3563ff]"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {recentSearches.length ? (
                    recentSearches.map((item) => (
                      <CommandItem
                        key={item}
                        onSelect={() => runCommandAction(() => submitQuery(item))}
                        onClick={() => runCommandAction(() => submitQuery(item))}
                        className="min-h-0 rounded-full border border-[#e6ebf6] bg-white px-4 py-2 text-[0.95rem] text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
                      >
                        <Clock3Icon className="size-4 text-slate-400 dark:text-slate-500" />
                        {item}
                      </CommandItem>
                    ))
                  ) : (
                    <div className="px-1 text-sm text-slate-500 dark:text-slate-400">
                      No recent searches yet.
                    </div>
                  )}
                </div>
              </div>

              <CommandSeparator className="my-5" />

              <div className="px-2">
                <div className="pb-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Popular topics
                </div>
                <div className="space-y-2">
                  {popularTopics.map((topic, index) => {
                    const meta = topicMeta[topic] ?? {
                      description: "Browse notes and lectures in this topic",
                      icon: SparklesIcon,
                      accent: "text-[#3563ff]",
                    };
                    const Icon = meta.icon;

                    return (
                      <CommandItem
                        key={topic}
                        onSelect={() => runCommandAction(() => submitQuery(topic))}
                        onClick={() => runCommandAction(() => submitQuery(topic))}
                        className={
                          index === 0
                            ? "min-h-0 rounded-[1.2rem] border-[#dbe6ff] bg-[linear-gradient(180deg,#f6f9ff,#eef4ff)] px-4 py-4 dark:border-[#2e4f96] dark:bg-[linear-gradient(180deg,rgba(24,40,84,0.78),rgba(16,28,59,0.92))]"
                            : "min-h-0 rounded-[1.2rem] border-[#edf1f8] bg-white px-4 py-4 dark:border-white/10 dark:bg-white/5"
                        }
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-[0.95rem] border border-[#e4ebf8] bg-white dark:border-white/10 dark:bg-[#0b1322]">
                            <Icon className={`size-4 ${meta.accent}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[1rem] font-semibold text-slate-900 dark:text-white">
                              {topic}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {meta.description}
                            </div>
                          </div>
                        </div>
                        <ArrowRightIcon className="size-4 text-slate-400 dark:text-slate-500" />
                      </CommandItem>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CommandList>

        <div className="flex items-center justify-between gap-3 border-t border-[#e9eef9] bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(244,248,255,0.98))] px-3.5 py-2.5 text-xs text-slate-500 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(14,18,31,0.92),rgba(10,14,24,0.98))] dark:text-slate-400 sm:px-4 sm:py-3 2xl:px-6 2xl:py-4 2xl:text-sm">
          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex size-8 items-center justify-center rounded-full bg-[#ebf8f2] text-[#49a57b]">
              <SparklesIcon className="size-4" />
            </div>
            <span>Use arrow keys to navigate, Enter to select, Esc to close</span>
          </div>
          <div className="flex items-center gap-2 text-[#3563ff]">
            <span>Search across your notes instantly.</span>
            <SparklesIcon className="size-4" />
          </div>
        </div>
      </Command>
    </CommandDialog>
  );
}
