"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Custom Tooltip: double-click → appears at cursor position ───
//
// Usage (same API as before):
//   <Tooltip>
//     <TooltipTrigger asChild><Card>...</Card></TooltipTrigger>
//     <TooltipContent>Подсказка</TooltipContent>
//   </Tooltip>
//
// Behavior:
//   - Hover does nothing
//   - Double-click on trigger → tooltip pops up at cursor
//   - Auto-closes after 4s, on click outside, or Escape
//   - Never blocks anything

type TooltipState = { open: boolean; x: number; y: number }

const TooltipContext = React.createContext<{
  open: boolean
  show: (x: number, y: number) => void
  close: () => void
}>({ open: false, show: () => {}, close: () => {} })

function Tooltip({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<TooltipState>({ open: false, x: 0, y: 0 })
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }))
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  const show = React.useCallback((x: number, y: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setState({ open: true, x, y })
    timeoutRef.current = setTimeout(close, 4000)
  }, [close])

  const ctx = React.useMemo(() => ({ open: state.open, show, close }), [state.open, show, close])

  // Separate content from trigger
  let contentChildren: React.ReactNode[] = []
  let otherChildren: React.ReactNode[] = []

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child) && child.type === TooltipContent) {
      contentChildren.push(child)
    } else {
      otherChildren.push(child)
    }
  })

  const tipRef = React.useRef<HTMLDivElement>(null)

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

  const tipStyle: React.CSSProperties = state.open
    ? { position: 'fixed', left: state.x, top: state.y - 12, transform: 'translate(-50%, -100%)' }
    : {}

  return (
    <TooltipContext.Provider value={ctx}>
      {otherChildren}
      {state.open && (
        <div
          ref={tipRef}
          style={tipStyle}
          className={cn(
            "pointer-events-auto z-50 w-fit max-w-[300px] rounded-lg px-3 py-2 text-xs text-balance shadow-lg select-none",
            "bg-black/70 dark:bg-white/15 backdrop-blur-md text-foreground border border-white/10 dark:border-white/5",
            "animate-in fade-in-0 zoom-in-95 duration-150"
          )}
        >
          {contentChildren.map((child, i) => {
            if (React.isValidElement(child)) {
              return (child as React.ReactElement).props.children
            }
            return null
          })}
        </div>
      )}
    </TooltipContext.Provider>
  )
}

// TooltipTrigger — passes onDoubleClick into child element
function TooltipTrigger({
  children,
  asChild,
  ...rest
}: React.PropsWithChildren<{ asChild?: boolean; [key: string]: unknown }>) {
  const { show } = React.useContext(TooltipContext)

  const handleDoubleClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      show(e.clientX, e.clientY)
    },
    [show]
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      onDoubleClick: handleDoubleClick,
    })
  }

  return (
    <span onDoubleClick={handleDoubleClick} className="contents" {...rest}>
      {children}
    </span>
  )
}

// TooltipContent — just wraps content, Tooltip renders it
function TooltipContent({
  children,
  ...props
}: React.PropsWithChildren<{ className?: string; side?: string; sideOffset?: number; align?: string; [key: string]: unknown }>) {
  // Doesn't render itself — Tooltip extracts children
  return null
}

// Provider — no-op, kept for backward compat
function TooltipProvider({ children }: React.PropsWithChildren) {
  return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
