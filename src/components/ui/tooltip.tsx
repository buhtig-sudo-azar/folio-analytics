"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Provider with very long delay to suppress hover (we use double-click instead)
function TooltipProvider({
  delayDuration = 99999,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

// Controlled Tooltip: opens on double-click, closes on click outside / Escape / timeout
function Tooltip({
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [open, setOpen] = React.useState(false)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleOpen = React.useCallback(() => {
    setOpen(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setOpen(false), 4000)
  }, [])

  const handleClose = React.useCallback(() => {
    setOpen(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  // Close on click outside
  React.useEffect(() => {
    if (!open) return
    const handleClick = () => handleClose()
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [open, handleClose])

  // Inject onDoubleClick into children (TooltipTrigger)
  const childrenWithDblClick = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === TooltipTrigger) {
      return React.cloneElement(child as React.ReactElement<Record<string, unknown>>, {
        onDoubleClick: (e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
          handleOpen()
        },
      })
    }
    return child
  })

  return (
    <TooltipProvider>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={open}
        onOpenChange={(v) => { if (!v) handleClose() }}
        {...props}
      >
        {childrenWithDblClick}
      </TooltipPrimitive.Root>
    </TooltipProvider>
  )
}

function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
  className,
  sideOffset = 4,
  side = "top",
  align = "center",
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        side={side}
        align={align}
        className={cn(
          "pointer-events-none bg-black/60 dark:bg-white/10 backdrop-blur-md text-foreground border border-white/10 dark:border-white/5 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-lg px-3 py-2 text-xs text-balance shadow-lg select-none",
          className
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
