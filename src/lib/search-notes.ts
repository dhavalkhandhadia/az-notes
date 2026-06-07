import type { NoteItem, NoteType, TopicSearchResult } from "@/data/notes";

export type NoteFilters = {
  phase?: string;
  topic?: string;
  type?: NoteType | "All";
  sort?: "newest" | "session";
};

const normalize = (value: string) => value.trim().toLowerCase();

const toSearchableText = (record: NoteItem) =>
  [
    record.title,
    record.phaseLabel ?? "",
    record.topic,
    ...record.subtopics,
    ...record.concepts,
    record.summary ?? "",
  ]
    .join(" ")
    .toLowerCase();

const matchesText = (value: string, query: string) => {
  const normalizedValue = normalize(value);
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return false;
  }

  if (normalizedValue.includes(normalizedQuery)) {
    return true;
  }

  const terms = normalizedQuery.split(/\s+/).filter(Boolean);
  return terms.every((term) => normalizedValue.includes(term));
};

export function searchNotes(records: NoteItem[], query: string) {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return [];
  }

  return records.filter((record) => matchesText(toSearchableText(record), normalizedQuery));
}

export function groupTopicSearchResults(
  records: NoteItem[],
  query: string
): TopicSearchResult[] {
  const matches = searchNotes(records, query);

  if (!matches.length) {
    return [];
  }

  const grouped = new Map<string, TopicSearchResult>();

  for (const session of matches) {
    const existing = grouped.get(session.topic);

    if (!existing) {
      grouped.set(session.topic, {
        topic: session.topic,
        matchedConcepts: [],
        sessions: [session],
      });
      continue;
    }

    existing.sessions.push(session);
  }

  return Array.from(grouped.values())
    .map((group) => {
      const directMatches = new Set<string>();
      const supportingMatches = new Set<string>();

      for (const session of group.sessions) {
        for (const concept of [...session.concepts, ...session.subtopics]) {
          if (matchesText(concept, query)) {
            directMatches.add(concept);
          } else {
            supportingMatches.add(concept);
          }
        }
      }

      const matchedConcepts = [
        ...directMatches,
        ...Array.from(supportingMatches).filter(
          (concept) => !directMatches.has(concept)
        ),
      ].slice(0, 4);

      return {
        ...group,
        matchedConcepts,
        sessions: group.sessions.sort((a, b) => b.sessionNumber - a.sessionNumber),
      };
    })
    .sort((a, b) => {
      if (b.sessions.length !== a.sessions.length) {
        return b.sessions.length - a.sessions.length;
      }

      return a.topic.localeCompare(b.topic);
    });
}

export function filterNotes(records: NoteItem[], filters: NoteFilters) {
  const sort = filters.sort ?? "newest";

  return records
    .filter((record) => {
      const matchesPhase =
        !filters.phase ||
        filters.phase === "All" ||
        record.phaseLabel === filters.phase ||
        record.phase === filters.phase;
      const matchesTopic =
        !filters.topic || filters.topic === "All" || record.topic === filters.topic;
      const matchesType =
        !filters.type || filters.type === "All" || record.type === filters.type;

      return matchesPhase && matchesTopic && matchesType;
    })
    .sort((a, b) => {
      if (sort === "session") {
        return a.sessionNumber - b.sessionNumber;
      }

      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;

      if (bDate !== aDate) {
        return bDate - aDate;
      }

      return b.sessionNumber - a.sessionNumber;
    });
}

export function paginateNotes(records: NoteItem[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    totalPages,
    items: records.slice(start, start + pageSize),
    totalItems: records.length,
  };
}
