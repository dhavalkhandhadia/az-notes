"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ExpandIcon,
  MinusIcon,
  Minimize2Icon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react";

import { PdfErrorState } from "@/components/pdf/pdf-error-state";
import { PdfLoading } from "@/components/pdf/pdf-loading";
import { Button } from "@/components/ui/button";
import { SelectMenu } from "@/components/ui/select-menu";
import { cn } from "@/lib/utils";

const ZOOM_LEVELS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const THUMBNAIL_SCALE = 0.16;
const THUMBNAIL_WINDOW = 3;
const ZOOM_MIN = ZOOM_LEVELS[0] ?? 0.5;
const ZOOM_MAX = ZOOM_LEVELS[ZOOM_LEVELS.length - 1] ?? 3;
const WHEEL_ZOOM_SENSITIVITY = 0.0022;
const ZOOM_RERENDER_DELAY_MS = 180;
const ZOOM_TRANSITION_MS = 150;
const HORIZONTAL_OVERFLOW_EPSILON = 0.5;

function clampZoomLevel(level: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, level));
}

function findClosestZoomStepIndex(level: number) {
  return ZOOM_LEVELS.reduce(
    (closestIndex, currentLevel, index) =>
      Math.abs(currentLevel - level) < Math.abs(ZOOM_LEVELS[closestIndex]! - level)
        ? index
        : closestIndex,
    0
  );
}

function hasHorizontalOverflow(contentWidth: number, viewportWidth: number) {
  return contentWidth - viewportWidth > HORIZONTAL_OVERFLOW_EPSILON;
}

function getSearchMatchesForQuery(pageTextIndex: string[], query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return pageTextIndex.flatMap((pageText, index) =>
    pageText.toLowerCase().includes(normalizedQuery) ? [index + 1] : []
  );
}

type PdfViewerDocumentProps = {
  pdfUrl: string;
  originalPdfUrl?: string;
  title: string;
};

type ThumbnailMap = Record<number, string>;
type PageMetricMap = Record<number, { width: number; height: number }>;
type PageLinkMap = Record<
  number,
  Array<{
    href: string;
    left: number;
    top: number;
    width: number;
    height: number;
    label: string;
  }>
>;

type ZoomAnchor = {
  viewportX: number;
  viewportY: number;
  xRatio: number;
  yRatio: number;
  horizontalMode: "center" | "focus";
  verticalMode: "focus" | "freeze";
  pageIndex?: number;
  pageXRatio?: number;
  pageYRatio?: number;
};

type PinchGesture = {
  startDistance: number;
  startZoomLevel: number;
  lastZoomLevel: number;
  anchor: ZoomAnchor;
};

type ZoomPreset = "custom" | "auto" | "page-width" | "page-fit" | "actual-size";
type ZoomInteractionMode = "center" | "focus";
type ZoomVerticalMode = "focus" | "freeze";

const ZOOM_PRESET_OPTIONS: Array<{ value: ZoomPreset; label: string }> = [
  { value: "auto", label: "Auto fit" },
  { value: "page-width", label: "Fit width" },
  { value: "page-fit", label: "Fit page" },
  { value: "actual-size", label: "Actual size" },
  { value: "custom", label: "Custom zoom" },
];

export function PdfViewerDocument({
  pdfUrl,
  originalPdfUrl,
  title,
}: PdfViewerDocumentProps) {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const pageStackShellRef = useRef<HTMLDivElement | null>(null);
  const pageCanvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});
  const pageCardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pageSectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const pageRenderTasksRef = useRef<Record<number, { cancel: (extraDelay?: number) => void }>>(
    {}
  );
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const zoomLevelRef = useRef(1);
  const pendingZoomAnchorRef = useRef<ZoomAnchor | null>(null);
  const pinchGestureRef = useRef<PinchGesture | null>(null);
  const isPinchZoomingRef = useRef(false);
  const isViewerInteractionActiveRef = useRef(false);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [draftPageInput, setDraftPageInput] = useState<string | null>(null);
  const [zoomPreset, setZoomPreset] = useState<ZoomPreset>("auto");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [draftZoomInput, setDraftZoomInput] = useState<string | null>(null);
  const [renderedZoomLevel, setRenderedZoomLevel] = useState(1);
  const [isDocumentLoading, setIsDocumentLoading] = useState(true);
  const [isPageRendering, setIsPageRendering] = useState(true);
  const [hasInitialPagePaint, setHasInitialPagePaint] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
  const [pageTextIndex, setPageTextIndex] = useState<string[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchIndexing, setIsSearchIndexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isThumbnailRailOpen, setIsThumbnailRailOpen] = useState(false);
  const [isPinchZooming, setIsPinchZooming] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null);
  const [layoutWidth, setLayoutWidth] = useState(0);
  const [layoutHeight, setLayoutHeight] = useState(0);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [pageBaseMetrics, setPageBaseMetrics] = useState<PageMetricMap>({});
  const [pageLinks, setPageLinks] = useState<PageLinkMap>({});
  const [pageRenderedZoomLevels, setPageRenderedZoomLevels] = useState<Record<number, number>>({});
  const [renderSwapPages, setRenderSwapPages] = useState<Record<number, boolean>>({});
  const [mobileStabilizationPass, setMobileStabilizationPass] = useState(0);

  useEffect(() => {
    zoomLevelRef.current = zoomLevel;
  }, [zoomLevel]);

  useEffect(() => {
    function updateLayoutMetrics() {
      const nextWidth =
        scrollAreaRef.current?.clientWidth ??
        viewerRef.current?.clientWidth ??
        window.innerWidth;
      const nextHeight =
        scrollAreaRef.current?.clientHeight ??
        viewerRef.current?.clientHeight ??
        window.innerHeight;

      setLayoutWidth(nextWidth);
      setLayoutHeight(nextHeight);
      setIsCompactLayout(window.innerWidth < 768);
    }

    updateLayoutMetrics();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(() => updateLayoutMetrics());

    if (viewerRef.current) {
      resizeObserver?.observe(viewerRef.current);
    }

    if (scrollAreaRef.current) {
      resizeObserver?.observe(scrollAreaRef.current);
    }

    window.addEventListener("resize", updateLayoutMetrics);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateLayoutMetrics);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let documentRef: PDFDocumentProxy | null = null;

    async function loadDocument() {
      try {
        setErrorMessage(null);
        setIsDocumentLoading(true);
        setIsPageRendering(true);
        setThumbnails({});
        setPageTextIndex([]);
        setSearchQuery("");
        setActiveMatchIndex(0);
        setIsSearchOpen(false);
        setIsSearchIndexing(false);
        setIsThumbnailRailOpen(false);
        setZoomPreset("auto");
        setZoomLevel(1);
        setRenderedZoomLevel(1);
        setHasInitialPagePaint(false);
        setPageBaseMetrics({});
        setPageLinks({});
        setPageRenderedZoomLevels({});
        setRenderSwapPages({});
        setMobileStabilizationPass(0);
        setLoadingProgress(0);
        pageCanvasRefs.current = {};
        pageSectionRefs.current = {};
        for (const renderTask of Object.values(pageRenderTasksRef.current)) {
          renderTask.cancel();
        }
        pageRenderTasksRef.current = {};

        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const task = pdfjs.getDocument({
          url: pdfUrl,
          rangeChunkSize: 65536,
          disableAutoFetch: false,
          disableStream: false,
        });

        task.onProgress = (progress: { loaded: number; total?: number }) => {
          if (cancelled || !progress.total) {
            return;
          }

          setLoadingProgress((progress.loaded / progress.total) * 100);
        };

        const document = await task.promise;

        if (cancelled) {
          await document.destroy();
          return;
        }

        documentRef = document;
        setPdfDocument(document);
        setNumPages(document.numPages || 1);
        setPageNumber(1);
        setLoadingProgress(100);
        setIsDocumentLoading(false);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPdfDocument(null);
        setErrorMessage(error instanceof Error ? error.message : String(error));
        setIsDocumentLoading(false);
        setIsPageRendering(false);
      }
    }

    void loadDocument();

    return () => {
      cancelled = true;
      if (documentRef) {
        void documentRef.destroy();
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;

    async function updatePresetZoomLevel() {
      if (
        zoomPreset === "custom" ||
        !pdfDocument ||
        !layoutWidth ||
        !layoutHeight
      ) {
        return;
      }

      const firstPage = await pdfDocument.getPage(1);
      const firstViewport = firstPage.getViewport({ scale: 1 });
      const horizontalPadding = isCompactLayout
        ? isFullscreen
          ? 20
          : 24
        : isFullscreen
          ? 64
          : 48;
      const verticalPadding = isCompactLayout
        ? isFullscreen
          ? 20
          : 24
        : isFullscreen
          ? 64
          : 48;
      const availableWidth = Math.max(layoutWidth - horizontalPadding, 220);
      const availableHeight = Math.max(layoutHeight - verticalPadding, 220);
      const widthScale = availableWidth / firstViewport.width;
      const heightScale = availableHeight / firstViewport.height;

      let nextZoomLevel = 1;

      switch (zoomPreset) {
        case "page-width":
          nextZoomLevel = widthScale;
          break;
        case "page-fit":
          nextZoomLevel = Math.min(widthScale, heightScale);
          break;
        case "actual-size":
          nextZoomLevel = 1;
          break;
        case "auto":
          nextZoomLevel = Math.min(1, widthScale, heightScale);
          break;
        default:
          nextZoomLevel = zoomLevelRef.current;
          break;
      }

      if (!cancelled) {
        setZoomLevel(clampZoomLevel(nextZoomLevel));
      }
    }

    void updatePresetZoomLevel();

    return () => {
      cancelled = true;
    };
  }, [
    isCompactLayout,
    isFullscreen,
    layoutHeight,
    layoutWidth,
    pdfDocument,
    zoomPreset,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadPageMetadata() {
      if (!pdfDocument) {
        return;
      }

      try {
        const nextPageMetrics: PageMetricMap = {};
        const nextPageLinks: PageLinkMap = {};

        for (let index = 1; index <= pdfDocument.numPages; index += 1) {
          const page = await pdfDocument.getPage(index);
          const viewport = page.getViewport({ scale: 1 });
          const annotationViewport = viewport.clone({ dontFlip: true });
          const annotations = await page.getAnnotations();

          nextPageMetrics[index] = {
            width: viewport.width,
            height: viewport.height,
          };

          nextPageLinks[index] = annotations.flatMap((annotation) => {
            if (annotation.subtype !== "Link") {
              return [];
            }

            const href = annotation.url ?? annotation.unsafeUrl;

            if (!href) {
              return [];
            }

            const [x1, y1, x2, y2] = annotationViewport.convertToViewportRectangle(
              annotation.rect
            );
            const left = Math.min(x1, x2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);
            const top = annotationViewport.height - Math.max(y1, y2);

            if (!width || !height) {
              return [];
            }

            return [
              {
                href,
                left,
                top,
                width,
                height,
                label:
                  annotation.contents?.trim() ||
                  annotation.title?.trim() ||
                  `Open link from page ${index}`,
              },
            ];
          });
        }

        if (cancelled) {
          return;
        }

        setPageBaseMetrics(nextPageMetrics);
        setPageLinks(nextPageLinks);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : String(error));
        }
      }
    }

    void loadPageMetadata();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument]);

  const pageIndices = useMemo(
    () => Array.from({ length: numPages }, (_, index) => index + 1),
    [numPages]
  );
  const pagesToRender = useMemo(() => {
    const buffer = 2;
    const start = Math.max(1, pageNumber - buffer);
    const end = Math.min(numPages, pageNumber + buffer);
    const priorities: number[] = [];

    for (let offset = 0; offset <= buffer; offset += 1) {
      const left = pageNumber - offset;
      const right = pageNumber + offset;

      if (left >= start && !priorities.includes(left)) {
        priorities.push(left);
      }

      if (right <= end && !priorities.includes(right)) {
        priorities.push(right);
      }
    }

    return priorities;
  }, [numPages, pageNumber]);

  const visibleThumbnailPages = useMemo(() => {
    const start = Math.max(1, pageNumber - THUMBNAIL_WINDOW);
    const end = Math.min(numPages, pageNumber + THUMBNAIL_WINDOW);
    return pageIndices.filter((index) => index >= start && index <= end);
  }, [numPages, pageIndices, pageNumber]);

  useEffect(() => {
    let cancelled = false;

    async function renderVisiblePages() {
      if (!pdfDocument || !Object.keys(pageBaseMetrics).length) {
        return;
      }

      const outputScale = isCompactLayout
        ? Math.min(Math.max(window.devicePixelRatio || 1, 1.15), 1.6)
        : Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.2);

      if (!hasInitialPagePaint) {
        setIsPageRendering(true);
      }

      for (const renderTask of Object.values(pageRenderTasksRef.current)) {
        renderTask.cancel(0);
      }
      pageRenderTasksRef.current = {};

      for (const pageIndex of pagesToRender) {
        if (cancelled) {
          return;
        }

        const canvas = pageCanvasRefs.current[pageIndex];

        if (!canvas) {
          continue;
        }

        const page = await pdfDocument.getPage(pageIndex);
        const viewport = page.getViewport({ scale: renderedZoomLevel });
        const renderCanvas = document.createElement("canvas");
        const renderContext = renderCanvas.getContext("2d", { alpha: false });

        if (!renderContext) {
          throw new Error("Canvas context unavailable.");
        }

        renderCanvas.width = Math.ceil(viewport.width * outputScale);
        renderCanvas.height = Math.ceil(viewport.height * outputScale);
        renderContext.setTransform(1, 0, 0, 1, 0, 0);
        renderContext.clearRect(0, 0, renderCanvas.width, renderCanvas.height);

        const renderTask = page.render({
          canvas: renderCanvas,
          canvasContext: renderContext,
          viewport,
          transform:
            outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });

        pageRenderTasksRef.current[pageIndex] = renderTask;

        try {
          await renderTask.promise;
        } catch (error) {
          if (
            cancelled ||
            (error instanceof Error &&
              ("name" in error ? error.name === "RenderingCancelledException" : false))
          ) {
            continue;
          }

          throw error;
        }

        if (cancelled || pageRenderTasksRef.current[pageIndex] !== renderTask) {
          continue;
        }

        const context = canvas.getContext("2d", { alpha: false });

        if (!context) {
          throw new Error("Canvas context unavailable.");
        }

        canvas.width = renderCanvas.width;
        canvas.height = renderCanvas.height;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.imageSmoothingEnabled = true;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(renderCanvas, 0, 0);
        setRenderSwapPages((current) =>
          current[pageIndex] ? current : { ...current, [pageIndex]: true }
        );
        setPageRenderedZoomLevels((current) =>
          Math.abs((current[pageIndex] ?? 0) - renderedZoomLevel) < 0.001
            ? current
            : { ...current, [pageIndex]: renderedZoomLevel }
        );
        window.setTimeout(() => {
          setRenderSwapPages((current) => {
            if (!current[pageIndex]) {
              return current;
            }

            const next = { ...current };
            delete next[pageIndex];
            return next;
          });
        }, ZOOM_TRANSITION_MS + 50);

        if (!hasInitialPagePaint) {
          setHasInitialPagePaint(true);
          setIsPageRendering(false);
        }
      }

      if (!cancelled) {
        setIsPageRendering(false);
      }
    }

    void renderVisiblePages();

    return () => {
      cancelled = true;

      for (const renderTask of Object.values(pageRenderTasksRef.current)) {
        renderTask.cancel(0);
      }
      pageRenderTasksRef.current = {};
    };
  }, [
    hasInitialPagePaint,
    isCompactLayout,
    pageBaseMetrics,
    pagesToRender,
    pdfDocument,
    renderedZoomLevel,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function renderVisibleThumbnails() {
      if (!pdfDocument) {
        return;
      }

      for (const pageIndex of visibleThumbnailPages) {
        if (cancelled || thumbnails[pageIndex]) {
          continue;
        }

        const page = await pdfDocument.getPage(pageIndex);
        const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          continue;
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        await page.render({
          canvas,
          canvasContext: context,
          viewport,
        }).promise;

        if (!cancelled) {
          setThumbnails((current) => ({
            ...current,
            [pageIndex]: canvas.toDataURL("image/png"),
          }));
        }
      }
    }

    void renderVisibleThumbnails();

    return () => {
      cancelled = true;
    };
  }, [pdfDocument, thumbnails, visibleThumbnailPages]);

  useEffect(() => {
    let cancelled = false;

    async function buildPageTextIndex() {
      if (!pdfDocument || !isSearchOpen || pageTextIndex.length === pdfDocument.numPages) {
        return;
      }

      try {
        setIsSearchIndexing(true);
        const nextPageTextIndex = Array.from(
          { length: pdfDocument.numPages },
          (_, index) => pageTextIndex[index] ?? ""
        );

        for (let pageIndex = 1; pageIndex <= pdfDocument.numPages; pageIndex += 1) {
          if (cancelled || nextPageTextIndex[pageIndex - 1]) {
            continue;
          }

          const page = await pdfDocument.getPage(pageIndex);
          const textContent = await page.getTextContent();

          nextPageTextIndex[pageIndex - 1] = textContent.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ");
        }

        if (!cancelled) {
          setPageTextIndex(nextPageTextIndex);
        }
      } finally {
        if (!cancelled) {
          setIsSearchIndexing(false);
        }
      }
    }

    void buildPageTextIndex();

    return () => {
      cancelled = true;
    };
  }, [isSearchOpen, pageTextIndex, pdfDocument]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea || !pageIndices.length) {
      return;
    }

    let frameId = 0;

    const updateVisiblePage = () => {
      if (isPinchZoomingRef.current) {
        return;
      }

      const scrollTop = scrollArea.scrollTop;
      const nextPage =
        pageIndices.reduce(
          (closest, index) => {
            const node = pageSectionRefs.current[index];

            if (!node) {
              return closest;
            }

            const distance = Math.abs(node.offsetTop - scrollTop - 24);
            return distance < closest.distance
              ? { index, distance }
              : closest;
          },
          { index: pageNumber, distance: Number.POSITIVE_INFINITY }
        ).index;

      setPageNumber((current) => (current === nextPage ? current : nextPage));
    };

    const handleScroll = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateVisiblePage();
      });
    };

    updateVisiblePage();
    scrollArea.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      scrollArea.removeEventListener("scroll", handleScroll);
    };
  }, [pageIndices, pageNumber]);

  useEffect(() => {
    if (!pdfDocument || Math.abs(renderedZoomLevel - zoomLevel) < 0.001) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRenderedZoomLevel(zoomLevel);
    }, ZOOM_RERENDER_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pdfDocument, renderedZoomLevel, zoomLevel]);

  useEffect(() => {
    if (!isCompactLayout || isDocumentLoading || isPageRendering) {
      return;
    }

    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    scrollArea.scrollTo({ top: 0, behavior: "auto" });
    setPageNumber(1);
  }, [isCompactLayout, isDocumentLoading, isPageRendering, pdfUrl]);

  useEffect(() => {
    if (
      !isCompactLayout ||
      isDocumentLoading ||
      isPageRendering ||
      mobileStabilizationPass > 0
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setMobileStabilizationPass(1);
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    isCompactLayout,
    isDocumentLoading,
    isPageRendering,
    mobileStabilizationPass,
  ]);

  const pageMetrics = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(pageBaseMetrics).map(([pageIndex, metric]) => [
          Number(pageIndex),
          {
            width: metric.width * zoomLevel,
            height: metric.height * zoomLevel,
          },
        ])
      ) as PageMetricMap,
    [pageBaseMetrics, zoomLevel]
  );
  const renderedPageMetrics = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(pageBaseMetrics).map(([pageIndex, metric]) => [
          Number(pageIndex),
          (() => {
            const committedRenderedZoom =
              pageRenderedZoomLevels[Number(pageIndex)] ?? renderedZoomLevel;

            return {
              width: metric.width * committedRenderedZoom,
              height: metric.height * committedRenderedZoom,
            };
          })(),
        ])
      ) as PageMetricMap,
    [pageBaseMetrics, pageRenderedZoomLevels, renderedZoomLevel]
  );
  const zoomStepIndex = useMemo(() => findClosestZoomStepIndex(zoomLevel), [zoomLevel]);
  const pageInputValue = draftPageInput ?? String(pageNumber);
  const zoomInputValue = draftZoomInput ?? String(Math.round(zoomLevel * 100));
  const searchMatches = useMemo(
    () => getSearchMatchesForQuery(pageTextIndex, searchQuery),
    [pageTextIndex, searchQuery]
  );
  const searchStatus = searchQuery.trim().length
    ? isSearchIndexing
      ? "Indexing PDF text..."
      : searchMatches.length
        ? `Match ${activeMatchIndex + 1} of ${searchMatches.length}`
        : "No matches found"
    : isSearchIndexing
      ? "Indexing PDF text..."
      : "Search the current PDF by text";
  const showBlockingLoader =
    isDocumentLoading ||
    (!hasInitialPagePaint && (isPageRendering || Object.keys(pageBaseMetrics).length === 0));

  async function toggleFullscreen() {
    if (!viewerRef.current) {
      return;
    }

    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await viewerRef.current.requestFullscreen();
  }

  const captureZoomAnchor = useCallback(
    (
      anchorClientX?: number,
      anchorClientY?: number,
      horizontalMode: ZoomInteractionMode = "center",
      verticalMode: ZoomVerticalMode = "focus"
    ): ZoomAnchor | null => {
      const scrollArea = scrollAreaRef.current;

      if (!scrollArea) {
        return null;
      }

      const rect = scrollArea.getBoundingClientRect();
      const anchorX = anchorClientX ?? rect.left + rect.width / 2;
      const anchorY = anchorClientY ?? rect.top + rect.height / 2;
      const contentWidth = Math.max(scrollArea.scrollWidth, 1);
      const contentHeight = Math.max(scrollArea.scrollHeight, 1);
      const pageEntries = Object.entries(pageCardRefs.current).filter(
        (entry): entry is [string, HTMLDivElement] => Boolean(entry[1])
      );
      const containingPageEntry = pageEntries.find(([, node]) => {
        const pageRect = node.getBoundingClientRect();

        return (
          anchorX >= pageRect.left &&
          anchorX <= pageRect.right &&
          anchorY >= pageRect.top &&
          anchorY <= pageRect.bottom
        );
      });
      const visiblePageEntry = pageEntries.reduce<
        { entry: [string, HTMLDivElement]; visibleArea: number } | undefined
      >((largest, entry) => {
        const [, node] = entry;
        const pageRect = node.getBoundingClientRect();
        const visibleWidth = Math.max(
          0,
          Math.min(pageRect.right, rect.right) - Math.max(pageRect.left, rect.left)
        );
        const visibleHeight = Math.max(
          0,
          Math.min(pageRect.bottom, rect.bottom) - Math.max(pageRect.top, rect.top)
        );
        const visibleArea = visibleWidth * visibleHeight;

        if (visibleArea <= 0 || (largest && largest.visibleArea >= visibleArea)) {
          return largest;
        }

        return { entry, visibleArea };
      }, undefined);
      const closestPageEntry = pageEntries.reduce<
        { entry: [string, HTMLDivElement]; distance: number } | undefined
      >((closest, entry) => {
        const [, node] = entry;
        const pageRect = node.getBoundingClientRect();
        const distanceY =
          anchorY < pageRect.top
            ? pageRect.top - anchorY
            : anchorY > pageRect.bottom
              ? anchorY - pageRect.bottom
              : 0;
        const distanceX =
          anchorX < pageRect.left
            ? pageRect.left - anchorX
            : anchorX > pageRect.right
              ? anchorX - pageRect.right
              : 0;
        const distance = distanceY * distanceY + distanceX * distanceX * 0.04;

        if (!closest || distance < closest.distance) {
          return { entry, distance };
        }

        return closest;
      }, undefined);
      const pageEntry =
        containingPageEntry ?? visiblePageEntry?.entry ?? closestPageEntry?.entry;
      const pageRect = pageEntry?.[1].getBoundingClientRect();
      const effectiveAnchorX = pageRect
        ? Math.min(Math.max(anchorX, pageRect.left), pageRect.right)
        : anchorX;
      const effectiveAnchorY =
        pageRect && !containingPageEntry && visiblePageEntry?.entry === pageEntry
          ? (() => {
              const visibleTop = Math.max(pageRect.top, rect.top);
              const visibleBottom = Math.min(pageRect.bottom, rect.bottom);

              return visibleBottom > visibleTop
                ? (visibleTop + visibleBottom) / 2
                : Math.min(Math.max(anchorY, pageRect.top), pageRect.bottom);
            })()
          : pageRect
            ? Math.min(Math.max(anchorY, pageRect.top), pageRect.bottom)
            : anchorY;
      const viewportX = effectiveAnchorX - rect.left;
      const viewportY = effectiveAnchorY - rect.top;
      const pageXRatio =
        pageEntry && pageRect
          ? Math.min(
              1,
              Math.max(0, (effectiveAnchorX - pageRect.left) / Math.max(pageRect.width, 1))
            )
          : undefined;
      const pageYRatio =
        pageEntry && pageRect
          ? Math.min(
              1,
              Math.max(0, (effectiveAnchorY - pageRect.top) / Math.max(pageRect.height, 1))
            )
          : undefined;

      return {
        viewportX,
        viewportY,
        xRatio: (scrollArea.scrollLeft + viewportX) / contentWidth,
        yRatio: (scrollArea.scrollTop + viewportY) / contentHeight,
        horizontalMode,
        verticalMode,
        pageIndex: pageEntry ? Number(pageEntry[0]) : undefined,
        pageXRatio,
        pageYRatio,
      };
    },
    []
  );

  const stageZoomAnchor = useCallback((anchor: ZoomAnchor | null) => {
    if (!anchor) {
      return false;
    }

    pendingZoomAnchorRef.current = anchor;
    return true;
  }, []);

  const restoreZoomAnchor = useCallback((anchor: ZoomAnchor) => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    const contentWidth = Math.max(scrollArea.scrollWidth, 1);
    const contentHeight = Math.max(scrollArea.scrollHeight, 1);
    const viewportWidth = scrollArea.clientWidth;
    const maxScrollLeft = Math.max(0, scrollArea.scrollWidth - viewportWidth);
    const maxScrollTop = Math.max(
      0,
      scrollArea.scrollHeight - scrollArea.clientHeight
    );
    const pageCard =
      anchor.pageIndex !== undefined
        ? pageCardRefs.current[anchor.pageIndex] ?? null
        : null;
    const hasPageAnchor =
      pageCard &&
      anchor.pageXRatio !== undefined &&
      anchor.pageYRatio !== undefined;
    const hasHorizontalPageFocus =
      anchor.horizontalMode === "focus" && hasPageAnchor;
    const pageXRatio = anchor.pageXRatio ?? 0;
    const pageYRatio = anchor.pageYRatio ?? 0;
    const scrollAreaRect = scrollArea.getBoundingClientRect();
    const pageCardRect = pageCard?.getBoundingClientRect();
    const pageContentLeft =
      hasPageAnchor && pageCardRect
        ? scrollArea.scrollLeft + (pageCardRect.left - scrollAreaRect.left)
        : 0;
    const pageContentTop =
      hasPageAnchor && pageCardRect
        ? scrollArea.scrollTop + (pageCardRect.top - scrollAreaRect.top)
        : 0;
    const nextScrollLeft = hasHorizontalOverflow(contentWidth, viewportWidth)
      ? hasHorizontalPageFocus
        ? pageContentLeft + pageCard.clientWidth * pageXRatio - anchor.viewportX
        : anchor.horizontalMode === "focus"
          ? anchor.xRatio * contentWidth - anchor.viewportX
          : (contentWidth - viewportWidth) / 2
      : 0;
    const nextScrollTop =
      anchor.verticalMode === "freeze"
        ? scrollArea.scrollTop
        : hasPageAnchor
          ? pageContentTop + pageCard.clientHeight * pageYRatio - anchor.viewportY
          : anchor.yRatio * contentHeight - anchor.viewportY;

    scrollArea.scrollLeft = Math.min(maxScrollLeft, Math.max(0, nextScrollLeft));
    scrollArea.scrollTop = Math.min(maxScrollTop, Math.max(0, nextScrollTop));
  }, []);

  const applyZoomLevel = useCallback(
    (
      nextZoomLevel: number,
      anchorClientX?: number,
      anchorClientY?: number,
      horizontalMode: ZoomInteractionMode = "center",
      anchorOverride?: ZoomAnchor
    ) => {
      const clampedZoomLevel = clampZoomLevel(nextZoomLevel);

      if (Math.abs(clampedZoomLevel - zoomLevelRef.current) < 0.001) {
        return;
      }

      if (
        !stageZoomAnchor(
          anchorOverride ??
            captureZoomAnchor(anchorClientX, anchorClientY, horizontalMode)
        )
      ) {
        return;
      }

      setZoomPreset("custom");
      setZoomLevel(clampedZoomLevel);
    },
    [captureZoomAnchor, stageZoomAnchor]
  );

  const applyZoomPreset = useCallback(
    (nextPreset: ZoomPreset) => {
      if (nextPreset === zoomPreset) {
        return;
      }

      stageZoomAnchor(captureZoomAnchor(undefined, undefined, "center"));
      setZoomPreset(nextPreset);
    },
    [captureZoomAnchor, stageZoomAnchor, zoomPreset]
  );

  useLayoutEffect(() => {
    const anchor = pendingZoomAnchorRef.current;

    if (!anchor) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      restoreZoomAnchor(anchor);
      pendingZoomAnchorRef.current = null;
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [pageMetrics, renderedZoomLevel, restoreZoomAnchor, zoomLevel]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    function handleWheel(event: WheelEvent) {
      if (!(event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();

      const nextZoomLevel =
        zoomLevelRef.current * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY);

      applyZoomLevel(nextZoomLevel, event.clientX, event.clientY, "center");
    }

    scrollArea.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      scrollArea.removeEventListener("wheel", handleWheel);
    };
  }, [applyZoomLevel]);

  useEffect(() => {
    const scrollArea = scrollAreaRef.current;

    if (!scrollArea) {
      return;
    }

    const activeScrollArea = scrollArea;
    let frameId = 0;
    let queuedZoom: { level: number; x: number; y: number; anchor: ZoomAnchor } | null = null;

    function getTouchGeometry(touches: TouchList) {
      const firstTouch = touches[0];
      const secondTouch = touches[1];

      if (!firstTouch || !secondTouch) {
        return null;
      }

      return {
        centerX: (firstTouch.clientX + secondTouch.clientX) / 2,
        centerY: (firstTouch.clientY + secondTouch.clientY) / 2,
        distance: Math.hypot(
          secondTouch.clientX - firstTouch.clientX,
          secondTouch.clientY - firstTouch.clientY
        ),
      };
    }

    function flushQueuedZoom() {
      frameId = 0;

      if (!queuedZoom) {
        return;
      }

      const { level, x, y, anchor } = queuedZoom;
      queuedZoom = null;
      applyZoomLevel(level, x, y, "focus", anchor);
    }

    function queuePinchZoom(level: number, x: number, y: number, anchor: ZoomAnchor) {
      queuedZoom = { level, x, y, anchor };

      if (!frameId) {
        frameId = window.requestAnimationFrame(flushQueuedZoom);
      }
    }

    function createLockedPinchAnchor(
      baseAnchor: ZoomAnchor,
      centerX: number,
      centerY: number
    ): ZoomAnchor {
      const rect = activeScrollArea.getBoundingClientRect();
      const viewportX = centerX - rect.left;
      const viewportY = centerY - rect.top;

      return {
        ...baseAnchor,
        viewportX,
        viewportY,
        horizontalMode: "focus",
        verticalMode: "focus",
      };
    }

    function handleTouchStart(event: TouchEvent) {
      if (event.touches.length !== 2) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry || geometry.distance < 12) {
        return;
      }

      const anchor = captureZoomAnchor(
        geometry.centerX,
        geometry.centerY,
        "focus",
        "focus"
      );

      if (!anchor) {
        return;
      }

      pinchGestureRef.current = {
        startDistance: geometry.distance,
        startZoomLevel: zoomLevelRef.current,
        lastZoomLevel: zoomLevelRef.current,
        anchor,
      };
      isPinchZoomingRef.current = true;
      setIsPinchZooming(true);
      event.preventDefault();
    }

    function handleTouchMove(event: TouchEvent) {
      const pinchGesture = pinchGestureRef.current;

      if (!pinchGesture || event.touches.length !== 2) {
        return;
      }

      const geometry = getTouchGeometry(event.touches);

      if (!geometry || geometry.distance < 12) {
        return;
      }

      const nextZoomLevel = clampZoomLevel(
        pinchGesture.startZoomLevel *
          (geometry.distance / pinchGesture.startDistance)
      );

      event.preventDefault();

      if (Math.abs(nextZoomLevel - pinchGesture.lastZoomLevel) < 0.02) {
        return;
      }

      pinchGesture.lastZoomLevel = nextZoomLevel;
      const liveAnchor = createLockedPinchAnchor(
        pinchGesture.anchor,
        geometry.centerX,
        geometry.centerY
      );
      stageZoomAnchor(liveAnchor);
      queuePinchZoom(nextZoomLevel, geometry.centerX, geometry.centerY, liveAnchor);
    }

    function handleTouchEnd() {
      const pinchGesture = pinchGestureRef.current;
      pinchGestureRef.current = null;
      isPinchZoomingRef.current = false;
      setIsPinchZooming(false);

      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }

      if (queuedZoom) {
        const { level, x, y, anchor } = queuedZoom;
        queuedZoom = null;
        applyZoomLevel(level, x, y, "focus", anchor);
      }

      if (pinchGesture?.anchor) {
        if (pinchGesture.anchor.pageIndex) {
          setPageNumber(pinchGesture.anchor.pageIndex);
        }

        window.requestAnimationFrame(() => restoreZoomAnchor(pinchGesture.anchor));
      }
    }

    scrollArea.addEventListener("touchstart", handleTouchStart, { passive: false });
    scrollArea.addEventListener("touchmove", handleTouchMove, { passive: false });
    scrollArea.addEventListener("touchend", handleTouchEnd);
    scrollArea.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      isPinchZoomingRef.current = false;

      scrollArea.removeEventListener("touchstart", handleTouchStart);
      scrollArea.removeEventListener("touchmove", handleTouchMove);
      scrollArea.removeEventListener("touchend", handleTouchEnd);
      scrollArea.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [applyZoomLevel, captureZoomAnchor, restoreZoomAnchor, stageZoomAnchor]);

  useEffect(() => {
    const viewer = viewerRef.current;
    const scrollArea = scrollAreaRef.current;

    if (!viewer || !scrollArea) {
      return;
    }

    function activateViewer() {
      isViewerInteractionActiveRef.current = true;
      scrollAreaRef.current?.focus({ preventScroll: true });
    }

    function handlePointerLeave() {
      const activeElement = document.activeElement;
      const nextViewer = viewerRef.current;

      if (!nextViewer || !nextViewer.contains(activeElement)) {
        isViewerInteractionActiveRef.current = false;
      }
    }

    function handleFocusIn() {
      isViewerInteractionActiveRef.current = true;
    }

    function handleFocusOut() {
      window.requestAnimationFrame(() => {
        const activeElement = document.activeElement;
        const nextViewer = viewerRef.current;
        isViewerInteractionActiveRef.current = Boolean(
          activeElement && nextViewer?.contains(activeElement)
        );
      });
    }

    viewer.addEventListener("mouseenter", activateViewer);
    viewer.addEventListener("pointerdown", activateViewer);
    viewer.addEventListener("touchstart", activateViewer, { passive: true });
    viewer.addEventListener("focusin", handleFocusIn);
    viewer.addEventListener("focusout", handleFocusOut);
    viewer.addEventListener("mouseleave", handlePointerLeave);

    return () => {
      viewer.removeEventListener("mouseenter", activateViewer);
      viewer.removeEventListener("pointerdown", activateViewer);
      viewer.removeEventListener("touchstart", activateViewer);
      viewer.removeEventListener("focusin", handleFocusIn);
      viewer.removeEventListener("focusout", handleFocusOut);
      viewer.removeEventListener("mouseleave", handlePointerLeave);
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || !isViewerInteractionActiveRef.current) {
        return;
      }

      const { key } = event;
      const shouldZoomIn = key === "=" || key === "+" || key === "NumpadAdd";
      const shouldZoomOut = key === "-" || key === "_" || key === "NumpadSubtract";
      const shouldResetZoom = key === "0";

      if (!shouldZoomIn && !shouldZoomOut && !shouldResetZoom) {
        return;
      }

      event.preventDefault();

      if (shouldResetZoom) {
        applyZoomLevel(1);
        return;
      }

      if (shouldZoomIn) {
        applyZoomLevel(
          ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, zoomStepIndex + 1)] ?? ZOOM_MAX
        );
        return;
      }

      applyZoomLevel(
        ZOOM_LEVELS[Math.max(0, zoomStepIndex - 1)] ?? ZOOM_MIN
      );
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [applyZoomLevel, zoomStepIndex]);

  function scrollToPage(nextPage: number, behavior: ScrollBehavior = "smooth") {
    setPageNumber(nextPage);
    pageSectionRefs.current[nextPage]?.scrollIntoView({
      behavior,
      block: "start",
    });
  }

  function commitPageInput() {
    const parsedPage = Number.parseInt(pageInputValue, 10);

    if (!Number.isInteger(parsedPage)) {
      setDraftPageInput(null);
      return;
    }

    scrollToPage(Math.min(numPages, Math.max(1, parsedPage)));
    setDraftPageInput(null);
  }

  function commitZoomInput() {
    const parsedZoom = Number.parseInt(zoomInputValue, 10);

    if (!Number.isInteger(parsedZoom)) {
      setDraftZoomInput(null);
      return;
    }

    applyZoomLevel(clampZoomLevel(parsedZoom / 100));
    setDraftZoomInput(null);
  }

  function moveToMatch(direction: 1 | -1) {
    if (!searchMatches.length) {
      return;
    }

    setActiveMatchIndex((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + searchMatches.length) % searchMatches.length;
      const matchedPage = searchMatches[nextIndex] ?? 1;
      scrollToPage(matchedPage);
      return nextIndex;
    });
  }

  function handleSearchToggle() {
    setIsSearchOpen((current) => !current);
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  if (errorMessage && !pdfDocument) {
    return (
      <PdfErrorState
        title="Notes preview unavailable"
        message={errorMessage}
        actionHref={originalPdfUrl}
        actionLabel="Open original PDF"
      />
    );
  }

  return (
    <div
      ref={viewerRef}
      className={cn(
        "flex h-[min(72rem,calc(100svh-6rem))] min-h-[32rem] flex-col overflow-hidden rounded-[2rem] border border-[#e2e7f2] bg-white shadow-[0_30px_80px_rgba(92,104,170,0.08)] dark:border-white/10 dark:bg-[#0d1322] dark:shadow-none sm:min-h-[40rem] lg:h-full lg:min-h-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:shadow-none lg:dark:bg-transparent",
        isFullscreen && "flex h-screen w-screen flex-col rounded-none border-0 shadow-none"
      )}
    >
      <div className="flex flex-col gap-2 border-b border-[#e5eaf5] bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#0f1524] sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:gap-2 lg:px-4 lg:py-2">
        <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
          <Button
            size={isCompactLayout ? "icon-xs" : "icon-sm"}
            variant="outline"
            aria-label={
              isThumbnailRailOpen ? "Collapse page previews" : "Expand page previews"
            }
            aria-pressed={isThumbnailRailOpen}
            onClick={() => setIsThumbnailRailOpen((current) => !current)}
          >
            {isThumbnailRailOpen ? <PanelLeftCloseIcon /> : <PanelLeftOpenIcon />}
          </Button>
          <Button
            size={isCompactLayout ? "icon-xs" : "icon-sm"}
            variant="outline"
            aria-label="Search in notes"
            aria-pressed={isSearchOpen}
            onClick={handleSearchToggle}
          >
            <SearchIcon />
          </Button>
          <div className="ml-auto flex items-center gap-0.5 rounded-[1.1rem] border border-[#dfe4f3] bg-[#fbfcff] p-0.75 dark:border-white/10 dark:bg-white/5 sm:ml-0">
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={pageNumber === 1}
              onClick={() => scrollToPage(1)}
              aria-label="First page"
            >
              <ChevronsLeftIcon />
            </Button>
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={pageNumber === 1}
              onClick={() => scrollToPage(Math.max(1, pageNumber - 1))}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </Button>
            <div className="min-w-[4.5rem] rounded-[0.8rem] bg-white px-2 py-1.25 text-center text-xs font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(224,229,243,0.8)] dark:bg-[#11192d] dark:text-slate-100 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:min-w-[5.6rem] sm:px-2.5 sm:py-1.5 sm:text-[0.82rem]">
              <label className="flex items-baseline justify-center gap-1 font-mono-numbers tabular-nums">
                <span className="sr-only">Page number</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={pageInputValue}
                  onChange={(event) =>
                    setDraftPageInput(event.target.value.replace(/\D/g, ""))
                  }
                  onBlur={commitPageInput}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  style={{
                    width: `${Math.max(1, pageInputValue.length) * 0.62}em`,
                  }}
                  className="appearance-none bg-transparent p-0 text-right font-mono-numbers font-semibold tabular-nums leading-none outline-none"
                />
                <span className="text-slate-400 dark:text-slate-500">/</span>
                <span className="font-mono-numbers font-semibold tabular-nums leading-none">{numPages}</span>
              </label>
            </div>
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={pageNumber === numPages}
              onClick={() => scrollToPage(Math.min(numPages, pageNumber + 1))}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </Button>
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={pageNumber === numPages}
              onClick={() => scrollToPage(numPages)}
              aria-label="Last page"
            >
              <ChevronsRightIcon />
            </Button>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-1.5 sm:w-auto">
          <SelectMenu
            label="Page fit mode"
            value={zoomPreset}
            options={ZOOM_PRESET_OPTIONS}
            onChange={(value) => applyZoomPreset(value as ZoomPreset)}
            compact={!isCompactLayout}
            portalContainer={() => (isFullscreen ? viewerRef.current : null)}
            className={cn(
              isCompactLayout ? "min-w-[8.5rem]" : "min-w-[9.25rem]"
            )}
          />
          <div className="flex items-center gap-0.5 rounded-[1.1rem] border border-[#dfe4f3] bg-[#fbfcff] p-0.75 dark:border-white/10 dark:bg-white/5">
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={zoomLevel <= ZOOM_MIN + 0.001}
              onClick={() =>
                applyZoomLevel(
                  ZOOM_LEVELS[Math.max(0, zoomStepIndex - 1)] ?? ZOOM_MIN
                )
              }
              aria-label="Zoom out"
            >
              <MinusIcon />
            </Button>
            <div className="min-w-[4.25rem] rounded-[0.8rem] bg-white px-2.5 py-1.25 text-center text-xs font-semibold text-slate-700 shadow-[inset_0_0_0_1px_rgba(224,229,243,0.8)] dark:bg-[#11192d] dark:text-slate-100 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)] sm:min-w-[5rem] sm:px-3 sm:py-1.5 sm:text-[0.82rem]">
              <label className="flex items-center justify-center gap-0.5 font-mono-numbers">
                <span className="sr-only">Zoom percent</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={zoomInputValue}
                  onChange={(event) =>
                    setDraftZoomInput(event.target.value.replace(/\D/g, ""))
                  }
                  onBlur={commitZoomInput}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.currentTarget.blur();
                    }
                  }}
                  className="w-8 bg-transparent text-center outline-none sm:w-9"
                />
                <span>%</span>
              </label>
            </div>
            <Button
              size={isCompactLayout ? "icon-xs" : "icon-sm"}
              variant="ghost"
              disabled={zoomLevel >= ZOOM_MAX - 0.001}
              onClick={() =>
                applyZoomLevel(
                  ZOOM_LEVELS[
                    Math.min(ZOOM_LEVELS.length - 1, zoomStepIndex + 1)
                  ] ?? ZOOM_MAX
                )
              }
              aria-label="Zoom in"
            >
              <PlusIcon />
            </Button>
          </div>
          <Button
            size={isCompactLayout ? "icon-xs" : "icon-sm"}
            variant="outline"
            aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            onClick={() => void toggleFullscreen()}
          >
            {isFullscreen ? <Minimize2Icon /> : <ExpandIcon />}
          </Button>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="flex flex-col gap-3 border-b border-[#e5eaf5] bg-[#fbfcff] px-4 py-3 dark:border-white/10 dark:bg-[#101827] md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-[#dfe4f3] bg-white px-3 dark:border-white/10 dark:bg-[#0d1322]">
            <SearchIcon className="size-4 shrink-0 text-slate-400 dark:text-slate-500" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(event) => {
                const nextQuery = event.target.value;
                const nextMatches = getSearchMatchesForQuery(pageTextIndex, nextQuery);

                setSearchQuery(nextQuery);
                setActiveMatchIndex(0);

                if (nextMatches[0]) {
                  scrollToPage(nextMatches[0], "auto");
                }
              }}
              placeholder="Search inside this PDF..."
              className="h-11 min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">{searchStatus}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!searchMatches.length}
              onClick={() => moveToMatch(-1)}
            >
              Previous match
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!searchMatches.length}
              onClick={() => moveToMatch(1)}
            >
              Next match
            </Button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "grid min-h-0 flex-1 bg-[#f8f9fe] dark:bg-[#0a1020]",
          "h-full"
        )}
        style={{
          gridTemplateColumns: isCompactLayout
            ? "minmax(0,1fr)"
            : isThumbnailRailOpen
              ? "8.75rem minmax(0,1fr)"
            : "0 minmax(0,1fr)",
        }}
      >
        <aside
          className={cn(
            "flex h-full min-h-0 flex-col border-r border-[#e5eaf5] bg-[#fbfcff] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] dark:border-white/10 dark:bg-[#0f1524]",
            isThumbnailRailOpen
              ? "overflow-hidden p-3 opacity-100"
              : "overflow-hidden p-0 opacity-0"
          )}
        >
          {!isCompactLayout && isThumbnailRailOpen ? (
            <>
              <div className="mb-3 shrink-0 flex items-center justify-between px-1">
                <div className="text-sm font-semibold text-slate-700 dark:text-slate-100">Pages</div>
                <div className="font-mono-numbers text-xs text-slate-400 dark:text-slate-500">
                  {numPages}
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                <div className="flex flex-col gap-3">
                {pageIndices.map((pageIndex) => (
                  <button
                    key={pageIndex}
                    type="button"
                    onClick={() => scrollToPage(pageIndex)}
                    className={cn(
                      "group rounded-2xl border bg-white p-2 text-left transition-all dark:bg-[#0d1322]",
                      pageIndex === pageNumber
                        ? "border-[#4f7cff] shadow-[0_0_0_2px_rgba(79,124,255,0.18)]"
                        : "border-[#e3e7f2] hover:border-[#cfd8ee] dark:border-white/10 dark:hover:border-white/20"
                    )}
                  >
                    <div className="overflow-hidden rounded-xl bg-[#f6f8fd] dark:bg-white/5">
                      {thumbnails[pageIndex] ? (
                        <Image
                          src={thumbnails[pageIndex]}
                          alt={`Page ${pageIndex}`}
                          width={112}
                          height={156}
                          className="h-auto w-full"
                          unoptimized
                        />
                      ) : (
                          <div className="aspect-[0.72] w-full animate-pulse bg-[#eef2fb] dark:bg-white/8" />
                        )}
                    </div>
                    <div className="pt-2 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                      {pageIndex}
                    </div>
                  </button>
                ))}
                </div>
              </div>
            </>
          ) : null}
        </aside>

        <div
          ref={scrollAreaRef}
          tabIndex={0}
          className={cn(
            "min-h-0 h-full min-w-0 overflow-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-[#4f7cff]/45 focus-visible:ring-inset dark:focus-visible:ring-sky-400/35",
            isFullscreen
              ? isCompactLayout
                ? "min-h-0 items-start p-2"
                : "min-h-0 items-start p-8"
              : isCompactLayout
                ? "items-start p-3"
                : "items-start p-6"
          )}
          style={{
            overflowAnchor: "none",
            scrollbarGutter: "stable both-edges",
            touchAction: "pan-x pan-y",
          }}
        >
          <div className="relative min-h-full w-max min-w-full">
            {showBlockingLoader && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="w-full max-w-[52rem]">
                  <PdfLoading
                    progress={isDocumentLoading ? loadingProgress : 100}
                    label={isDocumentLoading ? "Loading notes preview" : "Preparing pages"}
                  />
                </div>
              </div>
            )}
            <div
              className={cn(
                "flex min-w-full justify-center transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                showBlockingLoader ? "pointer-events-none opacity-0" : "opacity-100"
              )}
            >
              <div
                ref={pageStackShellRef}
                className="mx-auto flex w-fit min-w-fit flex-col items-center gap-4 sm:gap-6"
              >
                  {pageIndices.map((pageIndex) => {
                    const committedRenderedZoom =
                      pageRenderedZoomLevels[pageIndex] ?? renderedZoomLevel;
                    const pageRenderScaleRatio =
                      committedRenderedZoom > 0
                        ? Math.max(0.25, zoomLevel / committedRenderedZoom)
                        : 1;

                    return (
                    <div
                      key={pageIndex}
                      ref={(node) => {
                        pageSectionRefs.current[pageIndex] = node;
                      }}
                      className="flex justify-center"
                    >
                      <div className="space-y-2">
                        <div
                          ref={(node) => {
                            pageCardRefs.current[pageIndex] = node;
                          }}
                          className="relative rounded-sm border-[0.5px] border-slate-200/60 bg-white shadow-[0_10px_28px_rgba(30,41,59,0.06)] dark:border-white/10 dark:bg-white sm:shadow-[0_14px_36px_rgba(30,41,59,0.065)]"
                          style={
                            pageMetrics[pageIndex]
                              ? {
                                  width: pageMetrics[pageIndex].width + 2,
                                  height: pageMetrics[pageIndex].height + 2,
                                }
                              : undefined
                          }
                        >
                          <div
                            className={cn(
                              "absolute inset-px origin-top-left will-change-transform",
                              isPinchZooming || renderSwapPages[pageIndex]
                                ? "transition-none"
                                : "transition-transform duration-[150ms] ease-out motion-reduce:transition-none"
                            )}
                            style={{
                              transform: `scale(${pageRenderScaleRatio})`,
                              width: renderedPageMetrics[pageIndex]?.width,
                              height: renderedPageMetrics[pageIndex]?.height,
                            }}
                          >
                            <canvas
                              ref={(node) => {
                                pageCanvasRefs.current[pageIndex] = node;
                              }}
                              aria-label={`${title} page ${pageIndex}`}
                              className={cn(
                                "block rounded-[calc(var(--radius-sm)-1px)] bg-white",
                                isFullscreen && "max-w-none"
                              )}
                              style={{
                                width: renderedPageMetrics[pageIndex]?.width,
                                height: renderedPageMetrics[pageIndex]?.height,
                              }}
                            />
                            {pageLinks[pageIndex]?.length ? (
                              <div className="pointer-events-none absolute inset-0">
                                {pageLinks[pageIndex].map((link, linkIndex) => (
                                  <a
                                    key={`${pageIndex}-${linkIndex}-${link.href}`}
                                    href={link.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={link.label}
                                    title={link.label}
                                    className="absolute rounded-[0.35rem] pointer-events-auto transition-colors hover:bg-sky-500/10 focus-visible:bg-sky-500/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60"
                                    style={{
                                      left: link.left * committedRenderedZoom,
                                      top: link.top * committedRenderedZoom,
                                      width: link.width * committedRenderedZoom,
                                      height: link.height * committedRenderedZoom,
                                    }}
                                  />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-center text-xs font-medium text-slate-400 dark:text-slate-500">
                          Page {pageIndex}
                        </div>
                      </div>
                    </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
