"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "lucide-react"

const smoothUiEase = [0.23, 1, 0.32, 1] as const
const commandModalEase = [0.16, 1, 0.3, 1] as const

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  motionPopup = false,
  motionPreset = "center",
  ...props
}: DialogPrimitive.Backdrop.Props & {
  motionPopup?: boolean
  motionPreset?: "center" | "side-left" | "side-right"
}) {
  const shouldReduceMotion = useReducedMotion()
  const isSidePreset = motionPreset === "side-left" || motionPreset === "side-right"

  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        motionPopup
          ? cn(
              "fixed inset-0 isolate z-50 transform-gpu bg-[rgba(238,244,255,0.54)] opacity-0 will-change-[opacity] dark:bg-[rgba(2,6,14,0.72)]",
              isSidePreset
                ? "supports-backdrop-filter:backdrop-blur-[2px]"
                : "supports-backdrop-filter:backdrop-blur-xl"
            )
          : "fixed inset-0 isolate z-50 bg-[rgba(238,244,255,0.54)] duration-200 supports-backdrop-filter:backdrop-blur-xl data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-[rgba(2,6,14,0.72)]",
        className
      )}
      render={
        motionPopup
          ? (renderProps, state) => {
              const {
                onAnimationStart,
                onAnimationEnd,
                onDrag,
                onDragStart,
                onDragEnd,
                hidden,
                ...motionSafeProps
              } = renderProps
              void onAnimationStart
              void onAnimationEnd
              void onDrag
              void onDragStart
              void onDragEnd
              void hidden

              return (
                <motion.div
                  {...motionSafeProps}
                  aria-hidden={!state.open}
                  initial={false}
                  animate={{
                    opacity: state.open ? 1 : 0,
                    pointerEvents: state.open ? "auto" : "none",
                  }}
                  transition={{
                    duration: shouldReduceMotion
                      ? 0
                      : state.open
                        ? isSidePreset
                          ? 0.16
                          : 0.18
                        : isSidePreset
                          ? 0.12
                          : 0.14,
                    ease: smoothUiEase,
                  }}
                />
              )
            }
          : undefined
      }
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  motionPopup = false,
  motionPreset = "center",
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
  motionPopup?: boolean
  motionPreset?: "center" | "side-left" | "side-right"
}) {
  const shouldReduceMotion = useReducedMotion()
  const openMotion =
    motionPreset === "center"
      ? {
          opacity: 1,
          scale: 1,
          x: "-50%",
          y: "-50%",
          filter: "blur(0px)",
          pointerEvents: "auto" as const,
        }
      : {
          opacity: 1,
          scale: 1,
          x: "0%",
          y: "0%",
          filter: "blur(0px)",
          pointerEvents: "auto" as const,
        }
  const closedMotion =
    motionPreset === "side-left"
      ? {
          opacity: 1,
          scale: 1,
          x: shouldReduceMotion ? "0%" : "-104%",
          y: "0%",
          filter: "blur(0px)",
          pointerEvents: "none" as const,
        }
      : motionPreset === "side-right"
        ? {
            opacity: 1,
            scale: 1,
            x: shouldReduceMotion ? "0%" : "104%",
            y: "0%",
            filter: "blur(0px)",
            pointerEvents: "none" as const,
          }
        : {
            opacity: 0,
            scale: shouldReduceMotion ? 1 : 0.975,
            x: "-50%",
            y: shouldReduceMotion ? "-50%" : "-48%",
            filter: shouldReduceMotion ? "blur(0px)" : "blur(8px)",
            pointerEvents: "none" as const,
          }

  return (
    <DialogPortal keepMounted={motionPopup}>
      <DialogOverlay motionPopup={motionPopup} motionPreset={motionPreset} />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          motionPopup
            ? "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] transform-gpu gap-4 rounded-[2rem] bg-popover/98 p-4 text-sm text-popover-foreground ring-1 ring-[#dfe7fb] shadow-[0_40px_140px_rgba(67,90,150,0.16)] outline-none will-change-[transform,opacity,filter] sm:max-w-sm dark:ring-white/10 dark:shadow-[0_30px_120px_rgba(0,0,0,0.48)]"
            : "fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-[2rem] bg-popover/98 p-4 text-sm text-popover-foreground ring-1 ring-[#dfe7fb] shadow-[0_40px_140px_rgba(67,90,150,0.16)] duration-200 outline-none sm:max-w-sm data-open:animate-in data-open:fade-in-0 data-open:zoom-in-[0.985] data-open:slide-in-from-top-3 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-[0.985] data-closed:slide-out-to-top-2 motion-reduce:data-open:animate-none motion-reduce:data-closed:animate-none dark:ring-white/10 dark:shadow-[0_30px_120px_rgba(0,0,0,0.48)]",
          className
        )}
        render={
          motionPopup
            ? (renderProps, state) => {
                const {
                  onAnimationStart,
                  onAnimationEnd,
                  onDrag,
                  onDragStart,
                  onDragEnd,
                  hidden,
                  ...motionSafeProps
                } = renderProps
                void onAnimationStart
                void onAnimationEnd
                void onDrag
                void onDragStart
                void onDragEnd
                void hidden

                return (
                <motion.div
                  {...motionSafeProps}
                  aria-hidden={!state.open}
                  initial={false}
                  animate={state.open ? openMotion : closedMotion}
                  style={{
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transformStyle: "preserve-3d",
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : motionPreset === "center"
                        ? {
                            duration: state.open ? 0.29 : 0.2,
                            ease: commandModalEase,
                          }
                        : {
                            duration: state.open ? 0.3 : 0.24,
                            ease: smoothUiEase,
                          }
                  }
                />
                )
              }
            : undefined
        }
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-2 right-2"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          Close
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-base leading-none font-medium",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
