import type { NoteItem } from "@/data/notes";
import { notes } from "@/data/notes";
import { SessionPageShell } from "@/components/session-page-shell";

export default function SessionsPage() {
  const note = notes[notes.length - 1];
  const relatedSessions: NoteItem[] = (
    note.relatedSessionIds?.length
      ? note.relatedSessionIds
          .map((relatedId) => notes.find((entry) => entry.id === relatedId))
          .filter((entry): entry is NoteItem => Boolean(entry))
      : notes.filter((entry) => entry.topic === note.topic && entry.id !== note.id)
  ).slice(0, 4);

  return (
    <SessionPageShell
      note={note}
      relatedSessions={relatedSessions}
      backHref="/"
      initialView="all-notes"
    />
  );
}
