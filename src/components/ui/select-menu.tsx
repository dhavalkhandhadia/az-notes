"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SelectOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  compact?: boolean;
  portalContainer?: () => HTMLElement | null;
};

export function SelectMenu({
  label,
  value,
  options,
  onChange,
  className,
  compact = false,
  portalContainer,
}: SelectMenuProps) {
  const shouldReduceMotion = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const [rendered, setRendered] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const listboxId = React.useId();
  const closeTimeoutRef = React.useRef<number | null>(null);
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const [menuRect, setMenuRect] = React.useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const selectedOption =
    options.find((option) => option.value === value) ?? options[0];

  const updateMenuRect = React.useCallback(() => {
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const gutter = 12;
    const menuWidth = Math.min(Math.max(rect.width, 176), viewportWidth - gutter * 2);
    const spaceBelow = viewportHeight - rect.bottom - gutter;
    const availableSpace = Math.max(120, spaceBelow);
    const maxHeight = Math.min(360, Math.max(160, availableSpace - 10));
    const preferredLeft = rect.left;
    const clampedLeft = Math.min(
      Math.max(gutter, preferredLeft),
      viewportWidth - menuWidth - gutter
    );

    setMenuRect({
      top: Math.min(rect.bottom + 10, viewportHeight - maxHeight - gutter),
      left: clampedLeft,
      width: menuWidth,
      maxHeight,
    });
  }, []);

  const hideMenu = React.useCallback(() => {
    setOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setRendered(false);
    }, 140);
  }, []);

  React.useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        hideMenu();
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        hideMenu();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [hideMenu]);

  React.useEffect(() => {
    if (!rendered) {
      return undefined;
    }

    updateMenuRect();

    const handleLayout = () => updateMenuRect();

    window.addEventListener("resize", handleLayout);
    window.addEventListener("scroll", handleLayout, true);

    return () => {
      window.removeEventListener("resize", handleLayout);
      window.removeEventListener("scroll", handleLayout, true);
    };
  }, [rendered, updateMenuRect]);

  React.useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const showMenu = React.useCallback(() => {
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setRendered(true);
    setPortalTarget(portalContainer?.() ?? document.body);
    requestAnimationFrame(() => {
      updateMenuRect();
      setOpen(true);
    });
  }, [portalContainer, updateMenuRect]);

  return (
    <div ref={rootRef} className={cn("relative min-w-[11rem]", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-expanded={open}
        onClick={() => {
          if (open) {
            hideMenu();
            return;
          }

          showMenu();
        }}
        className={cn(
          "flex w-full items-center justify-between border border-[#dfe4f3] bg-white/92 text-left font-medium text-slate-700 shadow-[0_8px_22px_rgba(99,102,241,0.04)] outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[#cfd9f2] hover:bg-white focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/15 dark:border-white/10 dark:bg-[#0f1524] dark:text-slate-200 dark:hover:bg-white/8",
          compact
            ? "h-9 gap-2 rounded-[1rem] px-3 text-sm"
            : "h-12 gap-3 rounded-2xl px-4 text-base"
        )}
      >
        <span className="truncate">{selectedOption?.label ?? value}</span>
        <ChevronDownIcon
          className="size-4 shrink-0 text-slate-400 transition-transform duration-200 dark:text-slate-500"
          style={{
            color: open ? "rgb(71 85 105)" : undefined,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {rendered && menuRect && portalTarget
        ? createPortal(
            <motion.div
              id={listboxId}
              role="listbox"
              aria-label={label}
              className={cn(
                "fixed z-[120] overflow-hidden rounded-[1.35rem] border border-[#dfe4f3] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.99))] p-1.5 shadow-[0_30px_90px_rgba(15,23,42,0.16)] ring-1 ring-white/70 dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(16,23,39,0.99),rgba(11,17,29,0.99))] dark:ring-white/5"
              )}
              style={{
                top: menuRect.top,
                left: menuRect.left,
                width: menuRect.width,
                transformOrigin: "top center",
              }}
              initial={false}
              animate={{
                opacity: open ? 1 : 0,
                scale: open || shouldReduceMotion ? 1 : 0.97,
                y: open || shouldReduceMotion ? 0 : 6,
              }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 460, damping: 34, mass: 0.62 }
              }
            >
              <div
                className="scroll-fade-y overflow-y-auto pr-0.5"
                style={{ maxHeight: menuRect.maxHeight }}
              >
                {options.map((option) => {
                  const isSelected = option.value === value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.value);
                        hideMenu();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        isSelected
                          ? "bg-secondary text-secondary-foreground"
                          : "text-slate-600 hover:bg-muted hover:text-foreground dark:text-slate-300 dark:hover:bg-white/8 dark:hover:text-white"
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      <CheckIcon
                        className={cn(
                          "size-4 shrink-0 transition-opacity",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>,
            portalTarget
          )
        : null}
    </div>
  );
}
