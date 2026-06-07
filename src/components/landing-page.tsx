"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import {
  coursePhases,
  notes,
  popularTopics,
  type NoteType,
} from "@/data/notes";
import {
  filterNotes,
  groupTopicSearchResults,
  paginateNotes,
} from "@/lib/search-notes";
import { CommandSearch } from "@/components/command-search";
import { FilterBar } from "@/components/filter-bar";
import { HeroSearch } from "@/components/hero-search";
import { SessionNotesBrowser } from "@/components/session-notes-browser";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TopicSearchResultCard } from "@/components/topic-search-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const LANDING_RETURN_STATE_KEY = "az-notes:return-state";
const PAGINATION_WINDOW_SIZE = 4;

function getResponsivePageSize(width: number) {
  if (width >= 1024) {
    return 6;
  }

  return 4;
}

type LandingReturnState = {
  query: string;
  phase: string;
  topic: string;
  type: NoteType | "All";
  sort: "newest" | "session";
  page: number;
  focusId: string | null;
};

function getPaginationItems(totalPages: number, currentPage: number) {
  if (totalPages <= PAGINATION_WINDOW_SIZE) {
    return Array.from({ length: totalPages }, (_, index) => ({
      page: index + 1,
    }));
  }

  const windowStep = PAGINATION_WINDOW_SIZE - 1;
  const rawWindowStart =
    Math.floor((currentPage - 1) / windowStep) * windowStep + 1;
  const windowStart = Math.min(
    rawWindowStart,
    Math.max(1, totalPages - PAGINATION_WINDOW_SIZE + 1)
  );
  const windowEnd = Math.min(
    totalPages,
    windowStart + PAGINATION_WINDOW_SIZE - 1
  );

  return Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, index) => ({
      page: windowStart + index,
    })
  );
}

function getInitialLandingState(): LandingReturnState {
  if (typeof window === "undefined") {
    return {
      query: "",
      phase: "All",
      topic: "All",
      type: "All" as NoteType | "All",
      sort: "newest" as "newest" | "session",
      page: 1,
      focusId: null as string | null,
    };
  }

  try {
    const persisted = window.sessionStorage.getItem(LANDING_RETURN_STATE_KEY);

    if (persisted) {
      const parsed = JSON.parse(persisted) as LandingReturnState;

      if (parsed && typeof parsed === "object") {
        return {
          query: parsed.query ?? "",
          phase: parsed.phase ?? "All",
          topic: parsed.topic ?? "All",
          type:
            parsed.type === "Lecture" || parsed.type === "Revision"
              ? parsed.type
              : "All",
          sort: parsed.sort === "session" ? "session" : "newest",
          page:
            Number.isFinite(parsed.page) && parsed.page > 0 ? parsed.page : 1,
          focusId: parsed.focusId ?? null,
        };
      }
    }
  } catch {}

  const params = new URLSearchParams(window.location.search);
  const nextType = params.get("type");
  const nextSort = params.get("sort");
  const nextPageValue = Number(params.get("page") ?? "1");

  return {
    query: params.get("q")?.trim() ?? "",
    phase: params.get("phase") ?? "All",
    topic: params.get("topic") ?? "All",
    type:
      nextType === "Lecture" || nextType === "Revision" ? nextType : "All",
    sort: nextSort === "session" ? "session" : "newest",
    page: Number.isFinite(nextPageValue) && nextPageValue > 0 ? nextPageValue : 1,
    focusId: params.get("focus"),
  };
}

export function LandingPage() {
  const initialLandingState = getInitialLandingState();
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialLandingState.query);
  const [searchSubmitSequence, setSearchSubmitSequence] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activePhase, setActivePhase] = useState(initialLandingState.phase);
  const [activeTopic, setActiveTopic] = useState(initialLandingState.topic);
  const [activeType, setActiveType] = useState<NoteType | "All">(
    initialLandingState.type
  );
  const [sort, setSort] = useState<"newest" | "session">(initialLandingState.sort);
  const [page, setPage] = useState(initialLandingState.page);
  const [pageSize, setPageSize] = useState(() =>
    typeof window === "undefined" ? 6 : getResponsivePageSize(window.innerWidth)
  );
  const [pendingFocusId, setPendingFocusId] = useState<string | null>(
    initialLandingState.focusId
  );

  const groupedResults = useMemo(
    () => groupTopicSearchResults(notes, searchQuery),
    [searchQuery]
  );

  const filteredNotes = useMemo(
    () =>
      filterNotes(notes, {
        phase: activePhase,
        topic: activeTopic,
        type: activeType,
        sort,
      }),
    [activePhase, activeTopic, activeType, sort]
  );

  const paginatedNotes = useMemo(
    () => paginateNotes(filteredNotes, page, pageSize),
    [filteredNotes, page, pageSize]
  );
  const paginationItems = useMemo(
    () => getPaginationItems(paginatedNotes.totalPages, paginatedNotes.page),
    [paginatedNotes.page, paginatedNotes.totalPages]
  );

  const phases = useMemo(
    () => {
      const phaseSet = new Set<string>();

      for (const note of notes) {
        if (note.phaseLabel) {
          phaseSet.add(note.phaseLabel);
        } else if (note.phase) {
          phaseSet.add(note.phase);
        }
      }

      return [
        ...coursePhases.filter((phase) => phaseSet.has(phase)),
        ...Array.from(phaseSet)
          .filter((phase) => !coursePhases.includes(phase as (typeof coursePhases)[number]))
          .sort((left, right) => left.localeCompare(right)),
      ];
    },
    []
  );
  const topics = useMemo(() => {
    if (activePhase === "All") {
      return Array.from(new Set(notes.map((note) => note.topic))).sort((left, right) =>
        left.localeCompare(right)
      );
    }

    return Array.from(
      new Set(
        notes
          .filter(
            (note) => note.phaseLabel === activePhase || note.phase === activePhase
          )
          .map((note) => note.topic)
      )
    ).sort((left, right) => left.localeCompare(right));
  }, [activePhase]);

  const totalResultCount = groupedResults.reduce(
    (count, group) => count + group.sessions.length,
    0
  );
  const focusedSearchSessionId =
    pendingFocusId?.startsWith("search-session-")
      ? pendingFocusId.replace("search-session-", "")
      : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const updatePageSize = () => {
      setPageSize((current) => {
        const next = getResponsivePageSize(window.innerWidth);
        return current === next ? current : next;
      });
    };

    updatePageSize();
    window.addEventListener("resize", updatePageSize);

    return () => {
      window.removeEventListener("resize", updatePageSize);
    };
  }, []);

  useEffect(() => {
    if (!pendingFocusId) {
      return;
    }

    let attempts = 0;
    let timeoutId = 0;

    const tryRestoreFocus = () => {
      const target = document.getElementById(pendingFocusId);

      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        window.sessionStorage.removeItem(LANDING_RETURN_STATE_KEY);
        setPendingFocusId(null);
        return;
      }

      attempts += 1;

      if (attempts >= 8) {
        window.sessionStorage.removeItem(LANDING_RETURN_STATE_KEY);
        setPendingFocusId(null);
        return;
      }

      timeoutId = window.setTimeout(tryRestoreFocus, 120);
    };

    timeoutId = window.setTimeout(tryRestoreFocus, 140);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [groupedResults, paginatedNotes.items, pendingFocusId]);

  const submitQuery = (query: string) => {
    const nextQuery = query.trim();
    setSearchQuery(nextQuery);

    if (!nextQuery) {
      return;
    }

    setSearchSubmitSequence((current) => current + 1);

    setRecentSearches((current) => [
      nextQuery,
      ...current.filter((entry) => entry !== nextQuery),
    ].slice(0, 5));
  };

  const buildSessionHref = (
    id: string,
    focusId: string,
    queryOverride?: string
  ) => {
    const returnParams = new URLSearchParams();
    const nextQuery = (queryOverride ?? searchQuery).trim();

    if (nextQuery) {
      returnParams.set("q", nextQuery);
    }

    if (activeTopic !== "All") {
      returnParams.set("topic", activeTopic);
    }

    if (activePhase !== "All") {
      returnParams.set("phase", activePhase);
    }

    if (activeType !== "All") {
      returnParams.set("type", activeType);
    }

    if (sort !== "newest") {
      returnParams.set("sort", sort);
    }

    if (page !== 1) {
      returnParams.set("page", String(page));
    }

    returnParams.set("focus", focusId);

    return `/sessions/${id}?returnTo=${encodeURIComponent(`/?${returnParams.toString()}`)}`;
  };

  const persistReturnState = (focusId: string, queryOverride?: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const payload: LandingReturnState = {
      query: (queryOverride ?? searchQuery).trim(),
      phase: activePhase,
      topic: activeTopic,
      type: activeType,
      sort,
      page,
      focusId,
    };

    window.sessionStorage.setItem(
      LANDING_RETURN_STATE_KEY,
      JSON.stringify(payload)
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f8fc] dark:bg-[#12121e]">
      <SiteHeader onOpenSearch={() => setOpen(true)} />

      <main>
        <HeroSearch
          query={searchQuery}
          resultCount={totalResultCount}
          submitSequence={searchSubmitSequence}
          onQueryChange={setSearchQuery}
          onOpenSearch={() => setOpen(true)}
          onSubmit={() => submitQuery(searchQuery)}
          resultsContent={
            groupedResults.length ? (
              groupedResults.map((result, index) => (
                <TopicSearchResultCard
                  key={result.topic}
                  result={result}
                  defaultOpen={
                    index === 0 ||
                    result.sessions.some(
                      (session) => session.id === focusedSearchSessionId
                    )
                  }
                  buildSessionHref={(id, focusId) => buildSessionHref(id, focusId)}
                  onSessionNavigate={(focusId) => persistReturnState(focusId)}
                />
              ))
            ) : searchQuery.trim().length > 0 ? (
              <Card className="rounded-[2rem] border-[#eadbcc] bg-white shadow-[0_16px_50px_rgba(92,104,170,0.05)] dark:border-white/10 dark:bg-[#0f1524]">
                <CardContent className="px-5 py-8 text-sm text-muted-foreground">
                  No grouped topic results found for &quot;{searchQuery}&quot;.
                </CardContent>
              </Card>
            ) : null
          }
        />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:px-8 lg:py-14">
          <section id="available-notes" className="scroll-mt-24 space-y-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <Image
                  src="/hero/notes.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-auto shrink-0"
                />
                <div className="space-y-1">
                  <h2 className="font-heading text-2xl font-semibold tracking-tight text-slate-900 dark:text-white md:text-[2.2rem]">
                    Available Notes
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Browse all phases, topics, and lectures.
                  </p>
                </div>
              </div>
            </div>

            <FilterBar
              phases={phases}
              topics={topics}
              activePhase={activePhase}
              activeTopic={activeTopic}
              activeType={activeType}
              sort={sort}
              resultCount={filteredNotes.length}
              onPhaseChange={(value) => {
                setActivePhase(value);
                setActiveTopic("All");
                setPage(1);
              }}
              onTopicChange={(value) => {
                setActiveTopic(value);
                setPage(1);
              }}
              onTypeChange={(value) => {
                setActiveType(value);
                setPage(1);
              }}
              onSortChange={(value) => {
                setSort(value);
                setPage(1);
              }}
              onReset={() => {
                setActivePhase("All");
                setActiveTopic("All");
                setActiveType("All");
                setSort("newest");
                setPage(1);
              }}
            />

            <div>
              <SessionNotesBrowser
                notes={paginatedNotes.items}
                buildSessionHref={(id, focusId) => buildSessionHref(id, focusId)}
                onSessionNavigate={(focusId) => persistReturnState(focusId)}
                gridClassName="sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3"
                reservedSlots={pageSize}
              />
            </div>

            <div className="flex justify-center pt-1">
              <motion.div
                layout
                className="flex flex-wrap items-center justify-center gap-2"
              >
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-300"
                  disabled={paginatedNotes.page === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeftIcon />
                </Button>

                <AnimatePresence initial={false} mode="popLayout">
                  {paginationItems.map((item) => {
                    const pageNumber = item.page;

                    return (
                      <motion.div
                        key={`page-${pageNumber}`}
                        layout
                        initial={{
                          opacity: 0,
                          x: shouldReduceMotion ? 0 : 16,
                          scale: shouldReduceMotion ? 1 : 0.96,
                        }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{
                          opacity: 0,
                          x: shouldReduceMotion ? 0 : -16,
                          scale: shouldReduceMotion ? 1 : 0.96,
                        }}
                        transition={{
                          type: "spring",
                          bounce: 0,
                          duration: shouldReduceMotion ? 0 : 0.32,
                        }}
                      >
                        <Button
                          variant={
                            pageNumber === paginatedNotes.page
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          className={
                            pageNumber === paginatedNotes.page
                              ? "rounded-xl bg-primary text-primary-foreground shadow-[0_14px_28px_rgba(52,102,214,0.2)]"
                              : "rounded-xl border-slate-200 bg-white text-slate-600 shadow-none dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-300"
                          }
                          onClick={() => setPage(pageNumber)}
                        >
                          {pageNumber}
                        </Button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <Button
                  variant="outline"
                  size="icon-sm"
                  className="rounded-xl border-slate-200 bg-white shadow-none dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-300"
                  disabled={paginatedNotes.page === paginatedNotes.totalPages}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(paginatedNotes.totalPages, current + 1)
                    )
                  }
                  aria-label="Next page"
                >
                  <ChevronRightIcon />
                </Button>
              </motion.div>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
      <CommandSearch
        notes={notes}
        open={open}
        recentSearches={recentSearches}
        popularTopics={popularTopics}
        onOpenChange={setOpen}
        onSubmitQuery={submitQuery}
        onClearRecentSearches={() => setRecentSearches([])}
        buildSessionHref={(id, sourceQuery) =>
          buildSessionHref(id, "search-results-panel", sourceQuery)
        }
        onSessionNavigate={(focusId, sourceQuery) =>
          persistReturnState(focusId, sourceQuery)
        }
      />
    </div>
  );
}
