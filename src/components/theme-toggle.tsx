"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function applyTheme(nextTheme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.toggle("dark", nextTheme === "dark");
  root.style.colorScheme = nextTheme;
  window.localStorage.setItem("az-notes-theme", nextTheme);
}

export function ThemeToggle() {
  const shouldReduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }

    const storedTheme = window.localStorage.getItem("az-notes-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    return storedTheme === "dark" || storedTheme === "light"
      ? storedTheme
      : prefersDark
        ? "dark"
        : "light";
  });

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("az-notes-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme =
      storedTheme === "dark" || storedTheme === "light"
        ? storedTheme
        : prefersDark
          ? "dark"
          : "light";
    applyTheme(nextTheme);
  }, []);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("theme-switching");
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    if (shouldReduceMotion) {
      document.documentElement.classList.add("theme-switching");
      setTheme(nextTheme);
      applyTheme(nextTheme);
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-switching");
      });
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const radius = Math.ceil(
      Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    ) + 96;
    const runThemeChange = () => {
      flushSync(() => {
        setTheme(nextTheme);
      });
      applyTheme(nextTheme);
    };

    document.documentElement.classList.add("theme-switching");

    if (!document.startViewTransition) {
      runThemeChange();
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("theme-switching");
      });
      return;
    }

    const transition = document.startViewTransition(runThemeChange);

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 1200,
            easing: "cubic-bezier(0.23, 1, 0.32, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      .catch(() => undefined);

    transition.finished.finally(() => {
      document.documentElement.classList.remove("theme-switching");
    });
  };

  return (
    <>
      <Button
        ref={buttonRef}
        type="button"
        size="icon-sm"
        variant="outline"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
        className="rounded-xl border-slate-200 bg-white text-slate-700 shadow-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={theme}
            initial={{ opacity: 0, rotate: theme === "dark" ? -45 : 45, scale: 0.82 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: theme === "dark" ? 45 : -45, scale: 0.82 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="flex"
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </>
  );
}
