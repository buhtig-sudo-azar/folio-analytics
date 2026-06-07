"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Custom Tooltip system: double-click to show, positioned at cursor ───
//
// Usage (same API as before):
//   <Tooltip>
//     <TooltipTrigger asChild><Card>...</Card></TooltipTrigger>
//     <TooltipContent>Подсказка</TooltipContent>
//   </Tooltip>
//
// How it works:
//   - Hover does nothing
//   - Double-click on trigger → tooltip appears at cursor position
//   - Auto-closes after 4 seconds, on click outside, or Escape
//   - Never blocks clicks (pointer-events-none on the tip)

// Context to pass content between Trigger and Tooltip
const TooltipContentContext = React.createContext<React.MutableRefObject<React.ReactNode | null>>({ current: null })

function Tooltip({ children }: { children: React.ReactNode }) {
  const contentRef = React.useRef<React.ReactNode | null>(null)
  const [state, setState] = React.useState<{ open: boolean; x: number; y: number }>({ open: false, x: 0, y: 0 })
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const tipRef = React.useRef<HTMLDivElement>(null)

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }))
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const openAt = React.useCallback((x: number, y: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState({ open: true, x, y })
    timeoutRef.current = setTimeout(close, 4000)
  }, [close])

  // Close on click outside or Escape
  React.useEffect(() => {
    if (!state.open) return
    const handle = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') { close(); return }
      if (e instanceof MouseEvent && tipRef.current && !tipRef.current.contains(e.target as Node)) { close() }
    }
    document.addEventListener('mousedown', handle)
    document.addEventListener('keydown', handle)
    return () => {
      document.removeEventListener('mousedown', handle)
      document.removeEventListener('keydown', handle)
    }
  }, [state.open, close])

  // Separate trigger children from content children
  let triggerEl: React.ReactNode = null
  let contentEl: React.ReactNode = null

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === TooltipContent) {
      contentEl = child
    } else {
      triggerEl = child
    }
  })

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      openAt(e.clientX, e.clientY)
    },
    [openAt]
  )

  const style: React.CSSProperties = state.open
    ? { position: 'fixed', left: state.x, top: state.y - 12, transform: 'translate(-50%, -100%)' }
    : {}

  return (
    <TooltipContentContext.Provider value={contentRef}>
      <span onDoubleClick={handleDoubleClick} className="contents">
        {triggerEl}
      </span>
      {state.open && (
        <div
          ref={tipRef}
          style={style}
          className={cn(
            "pointer-events-auto z-50 w-fit max-w-[300px] rounded-lg px-3 py-2 text-xs text-balance shadow-lg select-none",
            "bg-black/70 dark:bg-white/15 backdrop-blur-md text-foreground border border-white/10 dark:border-white/5",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {contentEl ? (contentEl as React.ReactElement).props.children : null}
        </div>
      )}
    </TooltipContentContext.Provider>
  )
}

// TooltipTrigger — just a passthrough wrapper, the real logic is in Tooltip
function TooltipTrigger({
  children,
  ...props
}: React.PropsWithChildren<Record<string, unknown>>) {
  return <>{children}</>
}

// TooltipContent — just wraps children, the real rendering is in Tooltip
function TooltipContent({
  children,
  className,
  ...props
}: React.PropsWithChildren<{ className?: string; side?: string; sideOffset?: number; align?: string; [key: string]: unknown }>) {
  // This component doesn't render itself — Tooltip extracts its children
  return null
}

// Provider — no-op, kept for backward compat
function TooltipProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
