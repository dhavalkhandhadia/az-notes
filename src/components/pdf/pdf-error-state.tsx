import { AlertCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PdfErrorStateProps = {
  title: string;
  message?: string;
  actionHref?: string;
  actionLabel?: string;
  className?: string;
};

export function PdfErrorState({
  title,
  message,
  actionHref,
  actionLabel,
  className,
}: PdfErrorStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[32rem] flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-card px-6 text-center",
        className
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-background">
        <AlertCircleIcon className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </div>
      {actionHref && actionLabel ? (
        <Button variant="outline" nativeButton={false} render={<a href={actionHref} />}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
