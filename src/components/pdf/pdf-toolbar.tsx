"use client";

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

type PdfToolbarProps = {
  currentPage: number;
  totalPages: number;
  zoom: number;
  canGoPrevious: boolean;
  canGoNext: boolean;
  canZoomOut: boolean;
  canZoomIn: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
};

export function PdfToolbar({
  currentPage,
  totalPages,
  zoom,
  canGoPrevious,
  canGoNext,
  canZoomOut,
  canZoomIn,
  onPreviousPage,
  onNextPage,
  onZoomOut,
  onZoomIn,
}: PdfToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e4e9f6] bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canGoPrevious}
          onClick={onPreviousPage}
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous page
        </Button>
        <div className="rounded-xl border border-[#dfe4f3] bg-[#f8f9fe] px-3 py-1.5 text-sm text-foreground">
          <span className="font-mono-numbers">
            Page {currentPage} / {totalPages || 1}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!canGoNext}
          onClick={onNextPage}
        >
          Next page
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={!canZoomOut}
          onClick={onZoomOut}
        >
          <MinusIcon />
        </Button>
        <div className="rounded-xl border border-[#dfe4f3] bg-[#f8f9fe] px-3 py-1.5 text-sm text-foreground">
          <span className="font-mono-numbers">
            {Math.round(zoom * 100)}%
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={!canZoomIn}
          onClick={onZoomIn}
        >
          <PlusIcon />
        </Button>
      </div>
    </div>
  );
}
