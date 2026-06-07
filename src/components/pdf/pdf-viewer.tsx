"use client";

import dynamic from "next/dynamic";

import { PdfLoading } from "@/components/pdf/pdf-loading";

type PdfViewerProps = {
  pdfUrl: string;
  originalPdfUrl?: string;
  title: string;
};

const PdfViewerDocument = dynamic(
  () =>
    import("@/components/pdf/pdf-viewer-document").then(
      (mod) => mod.PdfViewerDocument
    ),
  {
    ssr: false,
    loading: () => <PdfLoading />,
  }
);

export function PdfViewer(props: PdfViewerProps) {
  return <PdfViewerDocument {...props} />;
}
