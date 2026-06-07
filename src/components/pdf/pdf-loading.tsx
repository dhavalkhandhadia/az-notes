import { LoaderCircleIcon } from "lucide-react";

type PdfLoadingProps = {
  progress?: number | null;
  label?: string;
};

export function PdfLoading({ progress, label }: PdfLoadingProps = {}) {
  const normalizedProgress =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : null;

  return (
    <div className="flex min-h-[32rem] items-center justify-center rounded-[1.75rem] border border-[#e5ebf7] bg-[linear-gradient(180deg,#ffffff,#f7faff)] dark:border-white/10 dark:bg-[linear-gradient(180deg,#0f1524,#0b101d)]">
      <div className="w-full max-w-md space-y-6 px-6 py-10 text-center">
        <div className="relative mx-auto flex size-20 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#ffffff,#eef4ff)] shadow-[0_20px_50px_rgba(67,90,150,0.12)] dark:bg-[radial-gradient(circle_at_30%_30%,#1f2940,#0f1524)] dark:shadow-none">
          <div className="absolute inset-2 rounded-full border border-[#dce7ff] dark:border-white/10" />
          <LoaderCircleIcon className="size-9 animate-spin text-[#3563ff] dark:text-[#8dadff]" />
        </div>
        <div className="space-y-2">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {label ?? "Loading notes preview"}
          </div>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Please wait while the preview is prepared.
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2ff] dark:bg-white/8">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#3563ff,#7ea6ff)] transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{
                width: normalizedProgress === null ? "45%" : `${normalizedProgress}%`,
              }}
            />
          </div>
          <div className="text-xs font-medium tracking-[0.08em] text-slate-400 uppercase dark:text-slate-500">
            {normalizedProgress === null
              ? "Loading preview"
              : `${normalizedProgress}% loaded`}
          </div>
        </div>
      </div>
    </div>
  );
}
