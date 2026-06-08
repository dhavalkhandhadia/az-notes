import seed from "@/data/az-b13-seed.json";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type NoteType = "Lecture" | "Revision";
export type CoursePhase =
  | "Phase 1"
  | "Phase 2"
  | "Phase 3"
  | "Phase 4"
  | "Phase 5";

type SeedTopic = {
  id: string;
  title: string;
  phase: string;
  sessionNos: number[];
  aliases: string[];
  concepts: string[];
};

type SeedSession = {
  sessionNo: number;
  date?: string;
  title: string;
  phase: string;
  topic: string;
  pdfTitle?: string;
  driveId?: string;
  concepts: string[];
  summary?: string;
  notesUrl: string;
};

type SeedShape = {
  topics: SeedTopic[];
  sessions: SeedSession[];
};

export type NoteItem = {
  id: string;
  legacyIds?: string[];
  sessionNumber: number;
  title: string;
  topic: string;
  phase?: string;
  phaseLabel?: CoursePhase;
  subtopics: string[];
  concepts: string[];
  difficulty?: Difficulty;
  type: NoteType;
  notesUrl: string;
  pdfUrl?: string;
  originalPdfUrl?: string;
  lectureUrl?: string;
  relatedSessionIds?: string[];
  date?: string;
  summary?: string;
  hasNotes?: boolean;
};

export function isUpcomingSession(note: Pick<NoteItem, "date" | "lectureUrl">) {
  if (!note.lectureUrl || !note.date) {
    return false;
  }

  const scheduledAt = new Date(note.date).getTime();

  return Number.isFinite(scheduledAt) && scheduledAt > Date.now();
}

export type NoteRecord = NoteItem;

export type TopicSearchResult = {
  topic: string;
  matchedConcepts: string[];
  sessions: NoteItem[];
};

export type NoteDirectoryNode = {
  id: string;
  label: string;
  description: string;
  noteIds: string[];
  children?: NoteDirectoryNode[];
};

const { topics: seedTopics, sessions: seedSessions } = seed as SeedShape;

export const coursePhases = [
  "Phase 1",
  "Phase 2",
  "Phase 3",
  "Phase 4",
  "Phase 5",
] as const satisfies readonly CoursePhase[];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const difficultyByPhase: Record<string, Difficulty> = {
  Foundations: "Beginner",
  Math: "Beginner",
  "Core Tools": "Intermediate",
  "Core Techniques": "Intermediate",
  Search: "Intermediate",
  "Two Pointers": "Intermediate",
  Recursion: "Intermediate",
  Graphs: "Advanced",
  Trees: "Advanced",
  Bits: "Intermediate",
  DP: "Advanced",
};

const topicByTitle = new Map(seedTopics.map((topic) => [topic.title, topic]));

const legacyRouteIdsBySession = new Map<number, string[]>([
  [13, ["monotonic-stack-next-greater-element", "stack-usage-mastery"]],
  [23, ["dijkstra-and-shortest-paths"]],
  [14, ["binary-search-on-answer"]],
  [18, ["recursion-and-backtracking"]],
]);

const lectureUrlOverrides = new Map<number, string>([
  [1, "https://maang.in/live-sessions/Foundations-of-Problem-Solving-982?"],
  [2, "https://maang.in/live-sessions/Never-get-TLE-ever-again-989?"],
  [3, "https://maang.in/live-sessions/Searching-Sorting-and-Frequency-Mapping-991?"],
  [4, "https://maang.in/live-sessions/Modulo-Arithmetic-998?"],
  [5, "https://maang.in/live-sessions/Combinatorics-you-must-know-1000?"],
  [6, "https://maang.in/live-sessions/Number-Theory-1011?"],
  [7, "https://maang.in/live-sessions/STL-foundation-1-1024?"],
  [8, "https://maang.in/live-sessions/STL-foundation-2-1025?"],
  [9, "https://maang.in/live-sessions/Contribution-Technique-1030?"],
  [10, "https://maang.in/live-sessions/Debugging-Masterclass-1032?"],
  [11, "https://maang.in/live-sessions/Greedy-Ideas-with-STL-1040?"],
  [12, "https://maang.in/live-sessions/Sweep-line-on-Segments-1042?"],
  [13, "https://maang.in/live-sessions/Stack-Usage-mastery-1048?"],
  [14, "https://maang.in/live-sessions/Binary-Search-1072?"],
  [15, "https://maang.in/live-sessions/Binary-Search-2-1077?"],
  [16, "https://maang.in/live-sessions/Two-Pointers-Form-1-1088?"],
  [17, "https://maang.in/live-sessions/Two-Pointers-Form-2-3-1090?"],
  [18, "https://maang.in/live-sessions/Recursion-Foundation-1098?"],
  [19, "https://maang.in/live-sessions/Backtracking-Framework-1100?"],
  [20, "https://maang.in/live-sessions/Recursion-Application-Ideas-1114?"],
  [21, "https://maang.in/live-sessions/Graph-Foundations-1-1127?"],
  [22, "https://maang.in/live-sessions/Graph-Foundations-2-1129?"],
  [23, "https://maang.in/live-sessions/Graph-Shortest-Path-Algorithms-1142?"],
  [24, "https://maang.in/live-sessions/Graph-Formulation-1-1144?"],
  [25, "https://maang.in/live-sessions/Graph-Formulation-2-1159?"],
  [26, "https://maang.in/live-sessions/DSU-and-Applications-1161?"],
  [27, "https://maang.in/live-sessions/Tree-Application-Ideas-1-1177?"],
  [28, "https://maang.in/live-sessions/Tree-Application-Ideas-2-1179?"],
  [29, "https://maang.in/live-sessions/Bitmanipulation-Basics-1199?"],
  [30, "https://maang.in/live-sessions/Bitmanipulation-Applications-1201?"],
  [31, "https://maang.in/live-sessions/DP-Foundations-1207?"],
  [32, "https://maang.in/live-sessions/DP-Form-1-1208?"],
  [33, "https://maang.in/live-sessions/DP-Form-2-3-1209?"],
  [34, "https://maang.in/live-sessions/DP-Form-4-5-1211?"],
]);

type DraftNote = NoteItem & {
  sortDate?: string;
  sortOrder: number;
};

function createLectureUrl(session: SeedSession) {
  const override = lectureUrlOverrides.get(session.sessionNo);

  if (override) {
    return override;
  }

  return `https://example.com/lectures/${slugify(session.title)}`;
}

function createPdfUrl(session: SeedSession) {
  if (session.pdfTitle || session.driveId) {
    return `/api/pdf/session/${session.sessionNo}`;
  }

  return "/stack-usage-mastery.pdf";
}

function createNotesUrl(session: SeedSession) {
  if (session.pdfTitle || session.driveId) {
    return `/api/notes/${session.sessionNo}`;
  }

  return session.notesUrl;
}

function getSubtopics(topic: SeedTopic | undefined, session: SeedSession) {
  const aliases = topic?.aliases ?? [];
  const conceptFallback = session.concepts.filter(
    (concept) => !aliases.includes(concept)
  );

  return [...aliases, ...conceptFallback].slice(0, 4);
}

function resolveCoursePhase({
  topic,
  title,
}: Pick<NoteItem, "title" | "topic">): CoursePhase | undefined {
  switch (topic) {
    case "Foundations":
    case "Complexity Analysis":
    case "Sorting and Frequency":
    case "Modulo Arithmetic":
    case "Combinatorics":
    case "Number Theory":
    case "STL":
    case "Contribution Technique":
    case "Debugging":
      return "Phase 1";
    case "Binary Search":
    case "Two Pointers":
    case "Bit Manipulation":
    case "Recursion":
    case "Backtracking":
      return "Phase 2";
    case "Graphs":
    case "Shortest Paths":
    case "Graph Formulation":
    case "DSU":
    case "Trees":
      return "Phase 3";
    case "Greedy":
    case "Sweep Line":
      return "Phase 4";
    case "Dynamic Programming":
      return "Phase 4";
    case "Stacks":
      return "Phase 1";
    case "Drills":
      if (/Phase 1|STL/i.test(title)) {
        return "Phase 1";
      }

      if (/Phase 2|Recursion|Backtracking/i.test(title)) {
        return "Phase 2";
      }

      if (/Greedy/i.test(title)) {
        return "Phase 4";
      }

      return undefined;
    default:
      return undefined;
  }
}

const draftNotes: DraftNote[] = seedSessions.map((session) => {
  const topic = topicByTitle.get(session.topic);
  const generatedId = slugify(session.title);
  const legacyIds = legacyRouteIdsBySession.get(session.sessionNo) ?? [];
  const pdfUrl = createPdfUrl(session);
  const notesUrl = createNotesUrl(session);

  return {
    id: generatedId,
    legacyIds,
    sessionNumber: session.sessionNo,
    title: session.title,
    topic: session.topic,
    phase: session.phase,
    phaseLabel: resolveCoursePhase({
      title: session.title,
      topic: session.topic,
    }),
    subtopics: getSubtopics(topic, session),
    concepts: session.concepts,
    difficulty: difficultyByPhase[session.phase],
    type: "Lecture",
    notesUrl,
    pdfUrl,
    originalPdfUrl: notesUrl,
    lectureUrl: createLectureUrl(session),
    relatedSessionIds: [],
    date: session.date,
    summary: session.summary,
    hasNotes: Boolean(pdfUrl),
    sortDate: session.date,
    sortOrder: session.sessionNo,
  };
});

function addLiveSession({
  id,
  title,
  topic,
  phase,
  date,
  lectureUrl,
  sortOrder,
  subtopics,
  concepts,
  difficulty,
  summary,
}: Omit<
  DraftNote,
  "hasNotes" | "notesUrl" | "relatedSessionIds" | "sessionNumber" | "sortDate" | "type"
> & {
  date: string;
  lectureUrl: string;
}) {
  draftNotes.push({
    id,
    sessionNumber: 0,
    title,
    topic,
    phase,
    phaseLabel: resolveCoursePhase({ title, topic }),
    subtopics,
    concepts,
    difficulty,
    type: "Lecture",
    notesUrl: "",
    lectureUrl,
    relatedSessionIds: [],
    date,
    summary,
    hasNotes: false,
    sortDate: date,
    sortOrder,
  });
}

const extraLiveSessions = [
  {
    id: "doubt-session-dec-12",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2025-12-12",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-987?",
    sortOrder: 1.5,
    subtopics: ["doubt clearing", "problem solving", "clarifications"],
    concepts: ["doubt session", "clarifications", "problem solving"],
    difficulty: "Intermediate",
    summary: "General doubt-clearing session for early AZ B13 topics.",
  },
  {
    id: "doubt-session-dec-16",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2025-12-16",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-993?",
    sortOrder: 3.5,
    subtopics: ["doubt clearing", "sorting", "frequency mapping"],
    concepts: ["doubt session", "clarifications", "implementation"],
    difficulty: "Intermediate",
    summary: "Doubt-clearing session after the searching, sorting, and frequency mapping lectures.",
  },
  {
    id: "doubt-session-dec-26",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2025-12-26",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1014?",
    sortOrder: 5.5,
    subtopics: ["doubt clearing", "math", "implementation"],
    concepts: ["doubt session", "number theory", "combinatorics"],
    difficulty: "Intermediate",
    summary: "Doubt-clearing session for the math phase.",
  },
  {
    id: "phase-1-drill-session",
    title: "Phase 1 Drill Session",
    topic: "Drills",
    phase: "Core Tools",
    date: "2025-12-28",
    lectureUrl: "https://maang.in/live-sessions/Phase-1-Drill-Session-1013?",
    sortOrder: 6.5,
    subtopics: ["practice", "phase review", "implementation"],
    concepts: ["drill session", "phase 1", "problem solving"],
    difficulty: "Intermediate",
    summary: "Practice drill session for Phase 1 topics.",
  },
  {
    id: "contest-discussion-jan-4",
    title: "Contest Discussion",
    topic: "Contests",
    phase: "Contests",
    date: "2026-01-04",
    lectureUrl: "https://maang.in/live-sessions/Contest-discussion-1020?",
    sortOrder: 6.8,
    subtopics: ["editorial walkthroughs", "mistake analysis", "post-contest strategy"],
    concepts: ["contest discussion", "editorial breakdown", "problem-solving review"],
    difficulty: "Advanced",
    summary: "Contest discussion with editorial walkthroughs and common mistake analysis.",
  },
  {
    id: "doubt-session-jan-7",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-01-07",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1022?",
    sortOrder: 6.9,
    subtopics: ["doubt clearing", "phase review", "implementation"],
    concepts: ["doubt session", "clarifications", "implementation"],
    difficulty: "Intermediate",
    summary: "General doubt-clearing session before STL foundations.",
  },
  {
    id: "doubt-session-jan-16",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-01-16",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1029?",
    sortOrder: 8.5,
    subtopics: ["doubt clearing", "STL", "implementation"],
    concepts: ["doubt session", "STL", "clarifications"],
    difficulty: "Intermediate",
    summary: "Doubt-clearing session around STL and implementation topics.",
  },
  {
    id: "doubt-session-jan-23",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-01-23",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1037?",
    sortOrder: 10.5,
    subtopics: ["doubt clearing", "greedy", "sweep line"],
    concepts: ["doubt session", "greedy", "sweep line"],
    difficulty: "Intermediate",
    summary: "Doubt-clearing session around greedy and sweep-line topics.",
  },
  {
    id: "doubt-session-jan-28",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-01-28",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1045?",
    sortOrder: 12.5,
    subtopics: ["doubt clearing", "stacks", "implementation"],
    concepts: ["doubt session", "stacks", "clarifications"],
    difficulty: "Intermediate",
    summary: "Doubt-clearing session after stack and monotonic-stack practice.",
  },
  {
    id: "phase-1-drill-session-on-stl",
    title: "Phase 1 Drill Session on STL",
    topic: "Drills",
    phase: "Core Tools",
    date: "2026-01-31",
    lectureUrl: "https://maang.in/live-sessions/Phase-1-Drill-Session-on-STL-1050?",
    sortOrder: 13.5,
    subtopics: ["practice", "STL", "implementation"],
    concepts: ["drill session", "STL", "implementation"],
    difficulty: "Intermediate",
    summary: "Practice drill session focused on STL usage and implementation speed.",
  },
  {
    id: "mentor-session-feb-1",
    title: "Mentor Session",
    topic: "Ad Hoc Sessions",
    phase: "Mentorship",
    date: "2026-02-01",
    lectureUrl: "https://maang.in/live-sessions/Mentor-session-1051?",
    sortOrder: 13.8,
    subtopics: ["mentorship", "strategy", "planning"],
    concepts: ["mentor session", "planning", "strategy"],
    difficulty: "Beginner",
    summary: "Mentor session for planning, strategy, and course guidance.",
  },
  {
    id: "doubt-session-feb-3",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-02-03",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-1054?",
    sortOrder: 13.9,
    subtopics: ["doubt clearing", "implementation", "strategy"],
    concepts: ["doubt session", "clarifications", "implementation"],
    difficulty: "Intermediate",
    summary: "General doubt-clearing session before binary search topics.",
  },
  {
    id: "greedy-drill-session",
    title: "Greedy Drill Session",
    topic: "Greedy",
    phase: "Core Techniques",
    date: "2026-02-07",
    lectureUrl: "https://maang.in/live-sessions/Greedy-Drill-Session-1063?",
    sortOrder: 15.5,
    subtopics: ["practice", "greedy", "implementation"],
    concepts: ["greedy", "drill session", "problem solving"],
    difficulty: "Intermediate",
    summary: "Practice drill session focused on greedy problem solving.",
  },
  {
    id: "contest-discussion-feb-8",
    title: "Contest Discussion",
    topic: "Contests",
    phase: "Contests",
    date: "2026-02-08",
    lectureUrl: "https://maang.in/live-sessions/Contest-Discussion-1055?",
    sortOrder: 15.6,
    subtopics: ["editorial walkthroughs", "mistake analysis", "post-contest strategy"],
    concepts: ["contest discussion", "editorial breakdown", "problem-solving review"],
    difficulty: "Advanced",
    summary: "Contest discussion with editorial walkthroughs and review.",
  },
  {
    id: "mentor-session-feb-8",
    title: "Mentor Session",
    topic: "Ad Hoc Sessions",
    phase: "Mentorship",
    date: "2026-02-08",
    lectureUrl: "https://maang.in/live-sessions/Mentor-Session-1066?",
    sortOrder: 15.7,
    subtopics: ["mentorship", "strategy", "planning"],
    concepts: ["mentor session", "planning", "strategy"],
    difficulty: "Beginner",
    summary: "Mentor session for planning, strategy, and progress review.",
  },
  {
    id: "doubt-session-feb-10",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2026-02-10",
    lectureUrl: "https://maang.in/live-sessions/Doubt-session-1069?",
    sortOrder: 15.8,
    subtopics: ["doubt clearing", "binary search prep", "implementation"],
    concepts: ["doubt session", "clarifications", "implementation"],
    difficulty: "Intermediate",
    summary: "General doubt-clearing session before binary search.",
  },
  {
    id: "doubt-session-binary-search",
    title: "Doubt Session: Binary Search",
    topic: "Doubt Sessions",
    phase: "Search",
    date: "2026-02-18",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-Binary-Search-1082?",
    sortOrder: 15.5,
    subtopics: ["doubt clearing", "binary search", "check function"],
    concepts: ["binary search", "doubt session", "monotonicity"],
    difficulty: "Intermediate",
    summary: "Binary search doubt-clearing session.",
  },
  {
    id: "doubt-session-binary-search-2",
    title: "Doubt Session: Binary Search 2",
    topic: "Doubt Sessions",
    phase: "Search",
    date: "2026-02-25",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-Binary-Search-2-1093?",
    sortOrder: 17.5,
    subtopics: ["doubt clearing", "binary search", "answer space"],
    concepts: ["binary search", "doubt session", "answer space"],
    difficulty: "Intermediate",
    summary: "Follow-up binary search doubt-clearing session.",
  },
  {
    id: "doubt-session-two-pointers",
    title: "Doubt Session: Two Pointers",
    topic: "Doubt Sessions",
    phase: "Two Pointers",
    date: "2026-03-05",
    lectureUrl: "https://maang.in/live-sessions/Doubt-Session-Two-pointers-1105?",
    sortOrder: 17.5,
    subtopics: ["doubt clearing", "two pointers", "sliding window"],
    concepts: ["two pointers", "doubt session", "sliding window"],
    difficulty: "Intermediate",
    summary: "Two pointers doubt-clearing session.",
  },
  {
    id: "phase-2-drill-session",
    title: "Phase 2 Drill Session",
    topic: "Drills",
    phase: "Recursion",
    date: "2026-03-14",
    lectureUrl: "https://maang.in/live-sessions/Phase-2-Drill-Session-1116?",
    sortOrder: 20.2,
    subtopics: ["practice", "recursion", "backtracking"],
    concepts: ["drill session", "recursion", "backtracking"],
    difficulty: "Intermediate",
    summary: "Practice drill session for Phase 2 recursion and backtracking topics.",
  },
  {
    id: "dev-sessions-foundations-of-frontend-development",
    title: "Dev Sessions: Foundations of Front-End Development",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-03-16",
    lectureUrl:
      "https://maang.in/live-sessions/Dev-Sessions-Foundations-of-FrontEnd-Development-1120?",
    sortOrder: 20.6,
    subtopics: ["frontend", "HTML", "CSS"],
    concepts: ["front-end development", "layout", "web fundamentals"],
    difficulty: "Beginner",
    summary: "Development session on front-end foundations.",
  },
  {
    id: "dev-sessions-developing-interactive-web-interfaces",
    title: "Dev Sessions: Developing Interactive Web Interfaces",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-03-17",
    lectureUrl:
      "https://maang.in/live-sessions/Dev-Sessions-Developing-Interactive-Web-Interfaces-1121?",
    sortOrder: 20.7,
    subtopics: ["frontend", "interactivity", "JavaScript"],
    concepts: ["interactive UI", "DOM", "JavaScript"],
    difficulty: "Beginner",
    summary: "Development session on building interactive web interfaces.",
  },
  {
    id: "dev-sessions-getting-started-with-git-and-github",
    title: "Dev Sessions: Getting Started with Git and GitHub",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-03-19",
    lectureUrl:
      "https://maang.in/live-sessions/Dev-Sessions-Getting-Started-with-Git-and-GitHub-1122?",
    sortOrder: 20.8,
    subtopics: ["Git", "GitHub", "version control"],
    concepts: ["git", "github", "version control"],
    difficulty: "Beginner",
    summary: "Development session on Git and GitHub basics.",
  },
  {
    id: "dev-sessions-version-control-and-collaboration-with-github",
    title: "Dev Sessions: Version Control and Collaboration with GitHub",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-03-20",
    lectureUrl:
      "https://maang.in/live-sessions/Dev-Sessions-Version-Control-and-Collaboration-with-GitHub-1123?",
    sortOrder: 20.9,
    subtopics: ["Git", "GitHub", "collaboration"],
    concepts: ["git", "github", "collaboration"],
    difficulty: "Beginner",
    summary: "Development session on version control and GitHub collaboration.",
  },
  {
    id: "algozenith-placement-cell-orientation-session",
    title: "AlogoZenith Placement Cell Orientation Session",
    topic: "Ad Hoc Sessions",
    phase: "Orientation",
    date: "2026-03-21",
    lectureUrl:
      "https://maang.in/live-sessions/AlogoZenith-Placement-Cell-Orientation-Session-1130?",
    sortOrder: 22.5,
    subtopics: ["placement", "orientation", "career strategy"],
    concepts: ["placement orientation", "career planning", "strategy"],
    difficulty: "Beginner",
    summary: "Placement cell orientation session.",
  },
  {
    id: "react-foundations-and-project-setup",
    title: "React Foundations and Project Setup",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-04-04",
    lectureUrl: "https://maang.in/live-sessions/React-Foundations-and-Project-Setup-1167?",
    sortOrder: 25.5,
    subtopics: ["React", "project setup", "components"],
    concepts: ["react", "components", "project setup"],
    difficulty: "Intermediate",
    summary: "Development session on React foundations and project setup.",
  },
  {
    id: "state-management-and-core-project-features",
    title: "State Management and Core Project Features",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-04-05",
    lectureUrl:
      "https://maang.in/live-sessions/State-Management-and-Core-Project-Features-1168?",
    sortOrder: 26.3,
    subtopics: ["state management", "project features", "React"],
    concepts: ["state management", "React", "project architecture"],
    difficulty: "Intermediate",
    summary: "Development session on state management and core project features.",
  },
  {
    id: "mentor-session-apr-5",
    title: "Mentor Session",
    topic: "Ad Hoc Sessions",
    phase: "Mentorship",
    date: "2026-04-05",
    lectureUrl: "https://maang.in/live-sessions/Mentor-Session-1148?",
    sortOrder: 26.4,
    subtopics: ["mentorship", "strategy", "planning"],
    concepts: ["mentor session", "planning", "strategy"],
    difficulty: "Beginner",
    summary: "Mentor session for planning and progress review.",
  },
  {
    id: "advanced-react-concepts-and-project-refinement",
    title: "Advanced React Concepts and Project Refinement",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-04-11",
    lectureUrl:
      "https://maang.in/live-sessions/Advanced-React-Concepts-and-Project-Refinement-1181?",
    sortOrder: 27.5,
    subtopics: ["React", "advanced concepts", "project refinement"],
    concepts: ["react", "project refinement", "advanced frontend"],
    difficulty: "Intermediate",
    summary: "Development session on advanced React concepts and project refinement.",
  },
  {
    id: "frontend-foundation-navigation",
    title: "Front-end Foundation & Navigation",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-04-12",
    lectureUrl: "https://maang.in/live-sessions/Frontend-Foundation-Navigation-1183?",
    sortOrder: 28.5,
    subtopics: ["frontend", "navigation", "routing"],
    concepts: ["frontend", "navigation", "routing"],
    difficulty: "Intermediate",
    summary: "Development session on front-end foundations and navigation.",
  },
  {
    id: "finalizing-the-book-ui-create-and-delete",
    title: "Finalizing the Book UI: Create and Delete",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-04-19",
    lectureUrl: "https://maang.in/live-sessions/Finalizing-the-Book-UI-Create-and-Delete-1197?",
    sortOrder: 28.8,
    subtopics: ["frontend", "CRUD", "project UI"],
    concepts: ["create", "delete", "UI state"],
    difficulty: "Intermediate",
    summary: "Development session on finalizing create/delete flows in the book UI.",
  },
  {
    id: "crafting-the-interface-component-architecture-state-management",
    title: "Crafting the Interface - Component Architecture & State Management",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-05-09",
    lectureUrl:
      "https://maang.in/live-sessions/Crafting-the-Interface-Component-Architecture-State-Management-1213?",
    sortOrder: 34.5,
    subtopics: ["component architecture", "state management", "frontend"],
    concepts: ["components", "state management", "frontend architecture"],
    difficulty: "Intermediate",
    summary: "Development session on component architecture and state management.",
  },
  {
    id: "dp-classical-problems-1",
    title: "DP Classical Problems 1",
    topic: "Dynamic Programming",
    phase: "DP",
    date: "2026-05-10",
    lectureUrl: "https://maang.in/live-sessions/DP-Classical-Problems-1-1225?",
    sortOrder: 34.6,
    subtopics: ["classical DP", "practice", "state transitions"],
    concepts: ["dynamic programming", "classical problems", "practice"],
    difficulty: "Advanced",
    summary: "Dynamic programming session focused on classical DP problems.",
  },
  {
    id: "powering-the-app-appwrite-backend",
    title: "Powering the App - Appwrite Backend",
    topic: "Dev Sessions",
    phase: "Development",
    date: "2026-05-10",
    lectureUrl: "https://maang.in/live-sessions/Powering-the-App-Appwrite-Backend-1227?",
    sortOrder: 34.7,
    subtopics: ["backend", "Appwrite", "project integration"],
    concepts: ["appwrite", "backend", "project integration"],
    difficulty: "Intermediate",
    summary: "Development session on powering the app with an Appwrite backend.",
  },
  {
    id: "dp-classical-problems-2",
    title: "DP Classical Problems 2",
    topic: "Dynamic Programming",
    phase: "DP",
    date: "2026-05-12",
    lectureUrl: "https://maang.in/live-sessions/DP-Classical-Problems-2-1232?",
    sortOrder: 34.8,
    subtopics: ["classical DP", "practice", "optimization"],
    concepts: ["dynamic programming", "classical problems", "practice"],
    difficulty: "Advanced",
    summary: "Follow-up dynamic programming session focused on classical DP problems.",
  },
  {
    id: "dbms-introduction-to-basic-terminologies-and-data-model",
    title: "DBMS: Introduction to Basic Terminologies and Data Model",
    topic: "DBMS",
    phase: "DBMS",
    date: "2026-05-14",
    lectureUrl:
      "https://maang.in/live-sessions/DBMS-Introduction-to-basic-terminologies-and-Data-Model-1235?",
    sortOrder: 34.9,
    subtopics: ["DBMS", "data model", "terminology"],
    concepts: ["DBMS", "data model", "database terminology"],
    difficulty: "Intermediate",
    summary: "DBMS session introducing basic terminology and data models.",
  },
  {
    id: "dbms-functional-dependencies-normalization-decomposition-denormalization",
    title: "DBMS: Functional Dependencies, Normalization, Decomposition and Denormalization",
    topic: "DBMS",
    phase: "DBMS",
    date: "2026-05-15",
    lectureUrl:
      "https://maang.in/live-sessions/DBMS-Functional-Dependencies-Normalization-Decomposition-and-Denormalization-1238?",
    sortOrder: 35,
    subtopics: ["DBMS", "normalization", "functional dependencies"],
    concepts: ["functional dependencies", "normalization", "decomposition"],
    difficulty: "Intermediate",
    summary: "DBMS session on functional dependencies, normalization, decomposition, and denormalization.",
  },
  {
    id: "dbms-transaction-and-concurrency-control-indexing",
    title: "DBMS: Transaction and Concurrency Control, Indexing",
    topic: "DBMS",
    phase: "DBMS",
    date: "2026-05-16",
    lectureUrl:
      "https://maang.in/live-sessions/DBMS-Transaction-and-Concurrency-Control-Indexing-1243?",
    sortOrder: 35.1,
    subtopics: ["DBMS", "transactions", "indexing"],
    concepts: ["transactions", "concurrency control", "indexing"],
    difficulty: "Intermediate",
    summary: "DBMS session on transactions, concurrency control, and indexing.",
  },
  {
    id: "dp-practice-optimizations-1",
    title: "DP Practice + Optimizations 1",
    topic: "Dynamic Programming",
    phase: "DP",
    date: "2026-05-16",
    lectureUrl: "https://maang.in/live-sessions/DP-Practice-Optimizations-1-1239?",
    sortOrder: 35.2,
    subtopics: ["DP practice", "optimization", "state transitions"],
    concepts: ["dynamic programming", "optimization", "practice"],
    difficulty: "Advanced",
    summary: "Dynamic programming practice session focused on optimizations.",
  },
  {
    id: "dbms-b-b-plus-trees-dbms-optimization-techniques-interview-specifics",
    title: "DBMS: B & B+ Trees, DBMS Optimization Techniques Interview Specifics",
    topic: "DBMS",
    phase: "DBMS",
    date: "2026-05-17",
    lectureUrl:
      "https://maang.in/live-sessions/DBMS-B-B-Trees-DBMS-Optimization-Techniques-Interview-Specifics-1244?",
    sortOrder: 35.3,
    subtopics: ["DBMS", "B+ trees", "optimization"],
    concepts: ["B trees", "B+ trees", "query optimization"],
    difficulty: "Intermediate",
    summary: "DBMS interview-focused session on B/B+ trees and optimization techniques.",
  },
  {
    id: "dp-practice-optimisations-2",
    title: "DP Practice + Optimisations 2",
    topic: "Dynamic Programming",
    phase: "DP",
    date: "2026-05-17",
    lectureUrl: "https://maang.in/live-sessions/DP-Practice-Optimisations-2-1241?",
    sortOrder: 35.4,
    subtopics: ["DP practice", "optimization", "state compression"],
    concepts: ["dynamic programming", "optimization", "practice"],
    difficulty: "Advanced",
    summary: "Follow-up dynamic programming practice session focused on optimisations.",
  },
  {
    id: "dp-doubt-session",
    title: "DP Doubt Session",
    topic: "Doubt Sessions",
    phase: "DP",
    date: "2026-05-21T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/DP-Doubt-Session-1252?",
    sortOrder: 35.5,
    subtopics: ["DP doubts", "states", "transitions"],
    concepts: ["dynamic programming", "doubt session", "optimization"],
    difficulty: "Advanced",
    summary:
      "Dynamic Programming doubt-clearing session focused on states, transitions, and optimization techniques.",
  },
  {
    id: "google-hiring-process-shortlisting-insights-unfiltered",
    title: "Google Hiring Process & Shortlisting Insights - Unfiltered",
    topic: "Career Guidance",
    phase: "Career Guidance",
    date: "2026-05-24T15:00:00+05:30",
    lectureUrl:
      "https://maang.in/live-sessions/Google-Hiring-Process-Shortlisting-Insights-Unfiltered-1261?",
    sortOrder: 35.55,
    subtopics: ["Google hiring", "shortlisting", "interview process"],
    concepts: ["resume shortlisting", "Google hiring process", "interview rounds"],
    difficulty: "Beginner",
    summary:
      "Google hiring process discussion covering resume shortlisting insights, interview rounds, preparation strategy, and common mistakes to avoid.",
  },
  {
    id: "oops-overview-and-basic-terminologies",
    title: "OOPs: Overview and Basic Terminologies",
    topic: "OOPs",
    phase: "OOPs",
    date: "2026-05-25T20:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/OOPs-Overview-and-Basic-Terminologies-1256?",
    sortOrder: 35.6,
    subtopics: ["OOPs", "terminology", "object-oriented design"],
    concepts: ["classes", "objects", "encapsulation", "abstraction"],
    difficulty: "Beginner",
    summary:
      "Introductory OOPs session covering core concepts and basic terminology for structured object-oriented applications.",
  },
  {
    id: "oops-advanced-terminologies-and-concepts",
    title: "OOPs: Advanced Terminologies and Concepts",
    topic: "OOPs",
    phase: "OOPs",
    date: "2026-05-26T20:00:00+05:30",
    lectureUrl:
      "https://maang.in/live-sessions/OOPs-Advanced-Terminologies-and-Concepts-1265?",
    sortOrder: 35.7,
    subtopics: ["advanced OOPs", "design concepts", "scalable systems"],
    concepts: ["inheritance", "polymorphism", "composition", "maintainability"],
    difficulty: "Intermediate",
    summary:
      "Advanced OOPs session covering deeper terminology and design concepts for building scalable and maintainable applications.",
  },
  {
    id: "pillars-of-oops",
    title: "Pillars of OOPS",
    topic: "OOPs",
    phase: "OOPs",
    date: "2026-05-28T15:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Pillars-of-OOPS-1270?",
    sortOrder: 35.8,
    subtopics: ["encapsulation", "inheritance", "polymorphism", "abstraction"],
    concepts: ["OOP pillars", "encapsulation", "inheritance", "polymorphism"],
    difficulty: "Intermediate",
    summary:
      "OOPs session covering encapsulation, inheritance, polymorphism, and abstraction, with a focus on designing robust applications.",
  },
  {
    id: "oops-interview-practice-questions",
    title: "OOPs: Interview Practice Questions",
    topic: "OOPs",
    phase: "OOPs",
    date: "2026-05-31T12:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/OOPs-Interview-Practice-Questions-1271?",
    sortOrder: 35.9,
    subtopics: ["OOPs interview", "practice questions", "real-world scenarios"],
    concepts: ["OOPs", "interview practice", "concept clarity", "applications"],
    difficulty: "Intermediate",
    summary:
      "OOPs interview practice session focused on concept clarity, real-world applications, and commonly asked scenarios.",
  },
  {
    id: "segment-tree-foundations",
    title: "Segment Tree Foundations",
    topic: "Trees",
    phase: "Trees",
    date: "2026-06-06T15:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Segment-Tree-Foundations-1282",
    sortOrder: 36,
    subtopics: ["segment tree", "range queries", "tree data structures"],
    concepts: ["segment tree", "range queries", "point updates", "tree fundamentals"],
    difficulty: "Advanced",
    summary:
      "Segment tree foundations session covering the fundamentals of segment trees for range-query style problems.",
  },
  {
    id: "segment-tree-applications",
    title: "Segment Tree Applications",
    topic: "Trees",
    phase: "Trees",
    date: "2026-06-07T15:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Segment-Tree-Applications-1287",
    sortOrder: 36.1,
    subtopics: ["segment tree", "range queries", "applications"],
    concepts: ["segment tree", "range query applications", "updates", "tree data structures"],
    difficulty: "Advanced",
    summary:
      "Segment tree applications session covering how to apply segment trees to range-query and update problems.",
  },
  {
    id: "intro-to-hld",
    title: "Intro to HLD",
    topic: "High Level Design",
    phase: "System Design",
    date: "2025-12-17T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Intro-to-HLD-994?",
    sortOrder: 4.2,
    subtopics: ["HLD basics", "requirements", "components"],
    concepts: ["system requirements", "architecture", "scalability"],
    difficulty: "Intermediate",
    summary:
      "Introductory high-level design session covering requirements, major components, and scalable system architecture basics.",
  },
  {
    id: "intro-to-hld-2",
    title: "Intro to HLD - 2",
    topic: "High Level Design",
    phase: "System Design",
    date: "2025-12-20T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Intro-to-HLD-2-1002?",
    sortOrder: 4.8,
    subtopics: ["HLD fundamentals", "scalability", "trade-offs"],
    concepts: ["scalability", "trade-offs", "system architecture"],
    difficulty: "Intermediate",
    summary:
      "Follow-up HLD fundamentals session focused on scalability and design trade-offs.",
  },
  {
    id: "lld-practice-class-design-chatgpt",
    title: "LLD Practice Class: Design ChatGPT",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-12-22T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Practice-Class-Design-ChatGPT-1001?",
    sortOrder: 5.2,
    subtopics: ["LLD practice", "ChatGPT design", "class design"],
    concepts: ["low-level design", "classes", "extensibility", "interactions"],
    difficulty: "Advanced",
    summary:
      "Low-level design practice session for a ChatGPT-like system, focusing on class design, interactions, extensibility, and interview-ready discussion.",
  },
  {
    id: "hld-data-structures-that-power-your-databases",
    title: "HLD: Data Structures That Power Your Databases",
    topic: "High Level Design",
    phase: "System Design",
    date: "2025-12-28T21:00:00+05:30",
    lectureUrl:
      "https://maang.in/live-sessions/HLD-Data-structures-that-power-your-databases-1005?",
    sortOrder: 6.6,
    subtopics: ["databases", "storage engines", "data structures"],
    concepts: ["database internals", "indexes", "storage", "query execution"],
    difficulty: "Advanced",
    summary:
      "High-level design session on the data structures behind databases and how they support storage, retrieval, and query execution.",
  },
  {
    id: "hld-replication",
    title: "HLD: Replication",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-01-10T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Replication-1021?",
    sortOrder: 7.2,
    subtopics: ["replication", "availability", "consistency"],
    concepts: ["replication", "consistency", "fault tolerance", "availability"],
    difficulty: "Advanced",
    summary:
      "High-level design session on data replication strategies, consistency trade-offs, and designing systems for high availability and fault tolerance.",
  },
  {
    id: "hld-quorum-and-partitioning",
    title: "HLD: Quorum and Partitioning",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-01-18T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Quorum-and-Partitioning-1033?",
    sortOrder: 9.3,
    subtopics: ["quorum", "partitioning", "distributed systems"],
    concepts: ["quorum", "partitioning", "consistency", "fault tolerance"],
    difficulty: "Advanced",
    summary:
      "High-level design session on quorum-based systems and partitioning, with consistency, fault tolerance, and scalability trade-offs.",
  },
  {
    id: "hld-transactions",
    title: "HLD: Transactions",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-01-25T11:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Transactions-1043?",
    sortOrder: 11.8,
    subtopics: ["transactions", "ACID", "concurrency"],
    concepts: ["transactions", "ACID", "consistency", "failure recovery"],
    difficulty: "Advanced",
    summary:
      "High-level design session on reliable transaction handling, ACID properties, consistency, concurrency, failure recovery, and scalability.",
  },
  {
    id: "hld-ad-hoc-session",
    title: "HLD: Ad Hoc Session",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-02-01T11:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Ad-hoc-session-1052?",
    sortOrder: 13.75,
    subtopics: ["ad hoc design", "system design intuition", "trade-offs"],
    concepts: ["high-level design", "trade-offs", "requirements"],
    difficulty: "Intermediate",
    summary:
      "High-level design session focused on applying core design ideas to ad hoc system design scenarios.",
  },
  {
    id: "hld-designing-booking-system",
    title: "HLD: Designing Booking System",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-02-14T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Designing-Booking-System-1076?",
    sortOrder: 15.9,
    subtopics: ["booking system", "requirements", "concurrency"],
    concepts: ["system design", "capacity", "concurrency", "data modeling"],
    difficulty: "Advanced",
    summary:
      "High-level design walkthrough for a scalable booking system, covering requirements, architecture, data modeling, concurrency, and trade-offs.",
  },
  {
    id: "hld-design-youtube",
    title: "HLD: Design YouTube",
    topic: "High Level Design",
    phase: "System Design",
    date: "2026-02-28T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/HLD-Design-YouTube-1097?",
    sortOrder: 17.7,
    subtopics: ["YouTube design", "video storage", "streaming"],
    concepts: ["system design", "video streaming", "recommendations", "scalability"],
    difficulty: "Advanced",
    summary:
      "High-level design session on building a scalable YouTube-like system, including video storage, streaming, recommendations, scalability, and reliability.",
  },
  {
    id: "onboarding-to-az-premium",
    title: "Onboarding to AZ Premium",
    topic: "Ad Hoc Sessions",
    phase: "Orientation",
    date: "2025-12-06T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Onboarding-to-AZ-Premium-980?",
    sortOrder: 0.5,
    subtopics: ["onboarding", "platform walkthrough", "course usage"],
    concepts: ["onboarding", "AZ Premium", "platform features"],
    difficulty: "Beginner",
    summary:
      "Onboarding session for AZ Premium, covering platform features, usage flow, and how to get value from the cohort.",
  },
  {
    id: "doubt-session-dec-9",
    title: "Doubt Session",
    topic: "Doubt Sessions",
    phase: "Doubts",
    date: "2025-12-09T21:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/Doubt-session-985?",
    sortOrder: 0.8,
    subtopics: ["doubt clearing", "problem solving", "clarifications"],
    concepts: ["doubt session", "clarifications", "problem solving"],
    difficulty: "Intermediate",
    summary: "General doubt-clearing session for early AZ B13 topics.",
  },
  {
    id: "lld-camp-lld-mock-interview-with-shubham",
    title: "LLD Camp: LLD Mock Interview with Shubham",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-12-07T20:30:00+05:30",
    lectureUrl:
      "https://maang.in/live-sessions/LLD-Camp-LLD-Mock-Interview-with-Shubham-984?",
    sortOrder: 0.7,
    subtopics: ["mock interview", "LLD", "design discussion"],
    concepts: ["low-level design", "mock interview", "requirements", "class design"],
    difficulty: "Advanced",
    summary:
      "LLD mock interview session focused on applying design principles, articulating design decisions, and refining interview-ready system design skills.",
  },
  {
    id: "lld-camp-final-lld-class",
    title: "LLD Camp - Final LLD Class",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-12-11T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Camp-Final-LLD-Class-986?",
    sortOrder: 1.2,
    subtopics: ["LLD wrap-up", "best practices", "design walkthroughs"],
    concepts: ["low-level design", "best practices", "interview readiness"],
    difficulty: "Advanced",
    summary:
      "Final LLD camp session covering advanced design insights, end-to-end walkthroughs, and interview best practices.",
  },
  {
    id: "lld-framework-for-interviews",
    title: "LLD - Framework for Interviews",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-30T14:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Framework-for-Interviews-974?",
    sortOrder: -2,
    subtopics: ["LLD framework", "requirements", "class design"],
    concepts: ["low-level design", "requirements", "interactions", "SOLID"],
    difficulty: "Advanced",
    summary:
      "Structured LLD interview framework session covering requirement gathering, class design, interaction flows, and scalable object-oriented design.",
  },
  {
    id: "lld-applied-lld-framework-1",
    title: "LLD - Applied LLD Framework 1",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-30T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Applied-LLD-Framework-1-976?",
    sortOrder: -1.9,
    subtopics: ["applied LLD", "requirements", "components"],
    concepts: ["low-level design", "class design", "interactions", "scalability"],
    difficulty: "Advanced",
    summary:
      "Applied LLD framework session focused on translating requirements into clean class designs, interactions, and scalable components.",
  },
  {
    id: "lld-mastering-concurrency-1",
    title: "LLD - Mastering Concurrency 1",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-22T18:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Mastering-Concurrency-1-965?",
    sortOrder: -3.5,
    subtopics: ["concurrency", "threads", "synchronization"],
    concepts: ["threads", "race conditions", "synchronization", "thread safety"],
    difficulty: "Advanced",
    summary:
      "Low-level design session on concurrency fundamentals, including threads, synchronization, race conditions, and thread-safe system design.",
  },
  {
    id: "lld-mastering-concurrency-2",
    title: "LLD - Mastering Concurrency 2",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-23T12:00:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Mastering-Concurrency-2-967?",
    sortOrder: -3.4,
    subtopics: ["locks", "semaphores", "deadlocks"],
    concepts: ["locks", "semaphores", "deadlocks", "parallel workflows"],
    difficulty: "Advanced",
    summary:
      "Low-level design session on advanced concurrency concepts, including locks, semaphores, deadlocks, and safe parallel workflows.",
  },
  {
    id: "lld-bootcamp-solid-principles",
    title: "LLD Bootcamp: SOLID Principles",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-09T14:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Bootcamp-SOLID-Principles-950?",
    sortOrder: -4.5,
    subtopics: ["SOLID", "object-oriented design", "extensibility"],
    concepts: ["SOLID", "OOP", "maintainability", "design principles"],
    difficulty: "Intermediate",
    summary:
      "LLD bootcamp session covering SOLID principles and how to apply them to flexible, extensible, and maintainable systems.",
  },
  {
    id: "lld-bootcamp-intro-and-foundations",
    title: "LLD Bootcamp: Intro and Foundations",
    topic: "Low Level Design",
    phase: "System Design",
    date: "2025-11-08T20:30:00+05:30",
    lectureUrl: "https://maang.in/live-sessions/LLD-Bootcamp-Intro-and-Foundations-949?",
    sortOrder: -4.6,
    subtopics: ["LLD foundations", "OOP", "design patterns"],
    concepts: ["low-level design", "object-oriented principles", "design patterns"],
    difficulty: "Intermediate",
    summary:
      "Introductory LLD bootcamp session covering object-oriented principles, design patterns, and maintainable component structure.",
  },
] satisfies Array<Parameters<typeof addLiveSession>[0]>;

for (const session of extraLiveSessions) {
  addLiveSession(session);
}

draftNotes.push({
  id: "recursion-doubt-session",
  sessionNumber: 0,
  title: "Recursion Doubt Session",
  topic: "Doubt Sessions",
  phase: "Recursion",
  phaseLabel: resolveCoursePhase({
    title: "Recursion Doubt Session",
    topic: "Doubt Sessions",
  }),
  subtopics: ["doubt clearing", "recursion patterns", "implementation clarifications"],
  concepts: ["recursion", "doubt session", "base cases", "recursive thinking"],
  difficulty: "Intermediate",
  type: "Lecture",
  notesUrl: "",
  lectureUrl: "https://maang.in/live-sessions/Recursion-Doubt-Session-1118?",
  relatedSessionIds: [],
  date: "2026-03-15",
  summary:
    "Focused recursion doubt-clearing session for recursion patterns, base cases, and implementation clarifications.",
  hasNotes: false,
  sortDate: "2026-03-15",
  sortOrder: 20.5,
});

draftNotes.push({
  id: "contest-discussion-mar-24",
  sessionNumber: 0,
  title: "Contest Discussion",
  topic: "Contests",
  phase: "Contests",
  phaseLabel: resolveCoursePhase({
    title: "Contest Discussion",
    topic: "Contests",
  }),
  subtopics: ["editorial walkthroughs", "mistake analysis", "post-contest strategy"],
  concepts: ["contest discussion", "editorial breakdown", "problem-solving review"],
  difficulty: "Advanced",
  type: "Lecture",
  notesUrl: "",
  lectureUrl: "https://maang.in/live-sessions/Contest-Discussion-1137?",
  relatedSessionIds: [],
  date: "2026-03-24",
  summary:
    "March 24 contest discussion with editorial thinking, alternate approaches, and common mistake breakdowns.",
  hasNotes: false,
  sortDate: "2026-03-24",
  sortOrder: 22.5,
});

draftNotes.push({
  id: "contest-discussion",
  sessionNumber: 0,
  title: "Contest Discussion",
  topic: "Contests",
  phase: "Contests",
  phaseLabel: resolveCoursePhase({
    title: "Contest Discussion",
    topic: "Contests",
  }),
  subtopics: ["editorial walkthroughs", "mistake analysis", "post-contest strategy"],
  concepts: ["contest discussion", "editorial breakdown", "problem-solving review"],
  difficulty: "Advanced",
  type: "Lecture",
  notesUrl: "",
  lectureUrl: "https://maang.in/live-sessions/Contest-Discussion-1206?",
  relatedSessionIds: [],
  date: "2026-04-29",
  summary:
    "Post-contest discussion session with editorial thinking, alternate approaches, and common mistake breakdowns.",
  hasNotes: false,
  sortDate: "2026-04-29",
  sortOrder: 30.5,
});

draftNotes.push({
  id: "graphs-doubt-session",
  sessionNumber: 0,
  title: "Graphs Doubt Session",
  topic: "Doubt Sessions",
  phase: "Graphs",
  phaseLabel: resolveCoursePhase({
    title: "Graphs Doubt Session",
    topic: "Doubt Sessions",
  }),
  subtopics: ["doubt clearing", "graph forms", "implementation clarifications"],
  concepts: ["graphs", "doubt session", "clarifications"],
  difficulty: "Advanced",
  type: "Lecture",
  notesUrl: "",
  lectureUrl: "https://maang.in/live-sessions/Graphs-Doubt-session-1170?",
  relatedSessionIds: [],
  date: "2026-04-07",
  summary:
    "Focused graph doubt-clearing lecture covering tricky formulations, implementation questions, and review of common mistakes.",
  hasNotes: false,
  sortDate: "2026-04-07",
  sortOrder: 26.5,
});

export const notes: NoteItem[] = draftNotes
  .sort((left, right) => {
    const dateCompare = (left.sortDate ?? "").localeCompare(right.sortDate ?? "");

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return left.sortOrder - right.sortOrder;
  })
  .map((draftNote, index) => {
    const { sortDate, sortOrder, ...note } = draftNote;
    void sortDate;
    void sortOrder;

    return {
      ...note,
      sessionNumber: index + 1,
    };
  });

for (const note of notes) {
  note.relatedSessionIds =
    notes
      .filter((candidate) => candidate.id !== note.id && candidate.topic === note.topic)
      .sort((left, right) => left.sessionNumber - right.sessionNumber)
      .map((candidate) => candidate.id)
      .slice(0, 4) ?? [];
}

export const popularTopics = [
  "Binary Search",
  "Dynamic Programming",
  "Stacks",
  "Graphs",
  "Trees",
] as const;

export const topicChips = popularTopics;

export const noteTopics = Array.from(new Set(notes.map((note) => note.topic))).sort(
  (left, right) => left.localeCompare(right)
);

export const libraryNotes = notes.filter((note) => note.phaseLabel);

export const libraryTopics = Array.from(
  new Set(libraryNotes.map((note) => note.topic))
).sort((left, right) => left.localeCompare(right));

const specialDirectoryAssignments = new Map<string, string[]>([
  ["doubt-session-dec-12", ["phase-1"]],
  ["doubt-session-dec-16", ["phase-1-sorting-and-frequency"]],
  ["doubt-session-dec-26", ["phase-1-math"]],
  ["contest-discussion-jan-4", ["phase-1"]],
  ["doubt-session-jan-7", ["phase-1-stl"]],
  ["doubt-session-jan-16", ["phase-1-stl"]],
  ["doubt-session-jan-23", ["phase-4-greedy", "phase-4-sweep-line"]],
  ["doubt-session-jan-28", ["phase-1-stacks"]],
  ["doubt-session-feb-3", ["phase-2-binary-search"]],
  ["contest-discussion-feb-8", ["phase-1"]],
  ["doubt-session-feb-10", ["phase-2-binary-search"]],
  ["doubt-session-binary-search", ["phase-2-binary-search"]],
  ["doubt-session-binary-search-2", ["phase-2-binary-search"]],
  ["doubt-session-two-pointers", ["phase-2-two-pointers"]],
  ["recursion-doubt-session", ["phase-2-recursion"]],
  ["contest-discussion-mar-24", ["phase-1"]],
  ["graphs-doubt-session", ["phase-3-graphs"]],
  ["contest-discussion", ["phase-1"]],
  ["dp-doubt-session", ["phase-4-dynamic-programming"]],
]);

function getAssignedNotes(directoryId: string) {
  return notes.filter((note) =>
    (specialDirectoryAssignments.get(note.id) ?? []).includes(directoryId)
  );
}

function dedupeNotes(records: NoteItem[]) {
  return Array.from(new Map(records.map((note) => [note.id, note])).values());
}

function getSortedNoteIds(records: NoteItem[]) {
  return [...dedupeNotes(records)]
    .sort((left, right) => left.sessionNumber - right.sessionNumber)
    .map((note) => note.id);
}

function createDirectoryLeaf(
  id: string,
  label: string,
  description: string,
  records: NoteItem[]
): NoteDirectoryNode {
  return {
    id,
    label,
    description,
    noteIds: getSortedNoteIds(records),
  };
}

function getDirectoryTopicLabel(phase: CoursePhase, topic: string) {
  if (
    phase === "Phase 1" &&
    ["Modulo Arithmetic", "Combinatorics", "Number Theory"].includes(topic)
  ) {
    return "Math";
  }

  if (
    phase === "Phase 3" &&
    ["Graphs", "Shortest Paths", "Graph Formulation", "DSU"].includes(topic)
  ) {
    return "Graphs";
  }

  return topic;
}

function createPhaseDirectoryNodes(): NoteDirectoryNode[] {
  return coursePhases
    .map((phase) => {
      const phaseId = slugify(phase);
      const phaseTopicRecords = libraryNotes.filter((note) => note.phaseLabel === phase);
      const phaseRecords = dedupeNotes([
        ...phaseTopicRecords,
        ...getAssignedNotes(phaseId),
      ]);
      const topics = Array.from(
        new Set(phaseTopicRecords.map((note) => getDirectoryTopicLabel(phase, note.topic)))
      ).sort((a, b) => a.localeCompare(b));

      return {
        id: phaseId,
        label: phase,
        description: `${phase} roadmap with focused topic folders and session tiles.`,
        noteIds: getSortedNoteIds(phaseRecords),
        children: topics.map((topic) =>
          createDirectoryLeaf(
            `${phaseId}-${slugify(topic)}`,
            topic,
            `${topic} sessions inside ${phase}.`,
            [
              ...phaseRecords.filter(
                (note) => getDirectoryTopicLabel(phase, note.topic) === topic
              ),
              ...getAssignedNotes(`${phaseId}-${slugify(topic)}`),
            ]
          )
        ),
      };
    })
    .filter((node) => node.noteIds.length > 0);
}

function createStandaloneDirectoryNode(
  id: string,
  label: string,
  description: string,
  topic: string
): NoteDirectoryNode {
  return createDirectoryLeaf(id, label, description, notes.filter((note) => note.topic === topic));
}

export const notesDirectory: NoteDirectoryNode[] = [
  ...createPhaseDirectoryNodes(),
  {
    id: "core-cs",
    label: "Core CS",
    description: "Computer science interview subjects organized as nested folders.",
    noteIds: getSortedNoteIds(
      notes.filter((note) => ["DBMS", "OOPs"].includes(note.topic))
    ),
    children: [
      createStandaloneDirectoryNode(
        "core-cs-dbms",
        "DBMS",
        "Database management systems sessions and interview-oriented theory notes.",
        "DBMS"
      ),
      createStandaloneDirectoryNode(
        "core-cs-oops",
        "OOPs",
        "Object-oriented programming sessions and interview terminology.",
        "OOPs"
      ),
    ],
  },
  createStandaloneDirectoryNode(
    "dev-sessions",
    "Dev Sessions",
    "Development-oriented sessions grouped in one folder.",
    "Dev Sessions"
  ),
  createStandaloneDirectoryNode(
    "ad-hoc-sessions",
    "Ad Hoc Sessions",
    "Mentor, orientation, and one-off guidance sessions.",
    "Ad Hoc Sessions"
  ),
  createStandaloneDirectoryNode(
    "doubt-sessions",
    "Doubt Sessions",
    "Doubt-clearing sessions collected into one folder.",
    "Doubt Sessions"
  ),
];
