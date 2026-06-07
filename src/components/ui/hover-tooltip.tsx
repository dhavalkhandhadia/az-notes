"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type HoverTooltipProps = {
  children: React.ReactNode;
  content: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

export function HoverTooltip({
  children,
  content,
  className,
  contentClassName,
}: HoverTooltipProps) {
  const shouldReduceMotion = useReducedMotion();
  const triggerRef = React.useRef<HTMLSpanElement | null>(null);
  const [rendered, setRendered] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const closeTimeoutRef = React.useRef<number | null>(null);
  const openTimeoutRef = React.useRef<number | null>(null);

  const updatePosition = React.useCallback(() => {
    const trigger = triggerRef.current;

    if (!trigger) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    setPosition({
      top: rect.top - 14,
      left: rect.left + rect.width / 2,
    });
  }, []);

  React.useEffect(() => {
    if (!rendered) {
      return;
    }

    updatePosition();

    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [rendered, updatePosition]);

  React.useEffect(() => {
    return () => {
      if (openTimeoutRef.current) {
        window.clearTimeout(openTimeoutRef.current);
      }
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const showTooltip = React.useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
    }
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
    }

    setRendered(true);
    updatePosition();

    openTimeoutRef.current = window.setTimeout(() => {
      setOpen(true);
    }, 70);
  }, [updatePosition]);

  const hideTooltip = React.useCallback(() => {
    if (openTimeoutRef.current) {
      window.clearTimeout(openTimeoutRef.current);
    }

    setOpen(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setRendered(false);
    }, 130);
  }, []);

  return (
    <>
      <span
        ref={triggerRef}
        className={cn("inline-flex max-w-full", className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </span>
      {rendered
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.span
                  key="tooltip"
                  role="tooltip"
                  className={cn(
                    "pointer-events-none fixed z-[200] w-64 max-w-[calc(100vw-2rem)] rounded-[0.95rem] border border-[#dbe3f0] bg-white/96 px-3 py-2 text-xs leading-5 text-slate-700 shadow-[0_18px_48px_rgba(15,23,42,0.14)] before:absolute before:left-1/2 before:top-full before:size-3 before:-translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:rounded-[0.28rem] before:border-b before:border-r before:border-[#dbe3f0] before:bg-white dark:border-white/10 dark:bg-[#0f1524]/96 dark:text-slate-200 dark:shadow-[0_18px_48px_rgba(0,0,0,0.3)] dark:before:border-white/10 dark:before:bg-[#0f1524]",
                    contentClassName
                  )}
                  style={{
                    top: position.top,
                    left: position.left,
                  }}
                  initial={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 0.97,
                    x: "-50%",
                    y: shouldReduceMotion ? "-100%" : "calc(-100% + 8px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: "-50%",
                    y: "-100%",
                  }}
                  exit={{
                    opacity: 0,
                    scale: shouldReduceMotion ? 1 : 0.97,
                    x: "-50%",
                    y: shouldReduceMotion ? "-100%" : "calc(-100% + 8px)",
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 620, damping: 38, mass: 0.5 }
                  }
                  transformTemplate={({ x, y, scale }) =>
                    `translateX(${x}) translateY(${y}) scale(${scale})`
                  }
                >
                  {content}
                </motion.span>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
