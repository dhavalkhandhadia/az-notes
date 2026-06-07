import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import type { NoteItem } from "@/data/notes";
import { notes } from "@/data/notes";
import { SessionPageShell } from "@/components/session-page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

type SessionPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string | string[];
  }>;
};

export default async function SessionPage({
  params,
  searchParams,
}: SessionPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const rawBackHref = Array.isArray(resolvedSearchParams.returnTo)
    ? resolvedSearchParams.returnTo[0]
    : resolvedSearchParams.returnTo;
  const backHref =
    rawBackHref && rawBackHref.startsWith("/") && !rawBackHref.startsWith("//")
      ? rawBackHref
      : "/";
  const note = notes.find(
    (entry) => entry.id === id || entry.legacyIds?.includes(id)
  );

  if (!note) {
    return (
      <main className="min-h-screen bg-background px-6 py-10 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit"
            nativeButton={false}
            render={<Link href={backHref} />}
          >
            <ArrowLeftIcon data-icon="inline-start" />
            Back to notes
          </Button>

          <Card className="rounded-2xl">
            <CardContent className="px-6 py-12">
              <div className="space-y-2">
                <CardTitle className="text-2xl">Session not found</CardTitle>
                <p className="text-sm text-muted-foreground">
                  The requested notes reader page is unavailable.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const relatedSessions: NoteItem[] = (
    note.relatedSessionIds?.length
      ? note.relatedSessionIds
          .map((relatedId) => notes.find((entry) => entry.id === relatedId))
          .filter((entry): entry is NoteItem => Boolean(entry))
      : notes.filter(
          (entry) => entry.topic === note.topic && entry.id !== note.id
        )
  ).slice(0, 4);

  return (
    <SessionPageShell
      note={note}
      relatedSessions={relatedSessions}
      backHref={backHref}
    />
  );
}
