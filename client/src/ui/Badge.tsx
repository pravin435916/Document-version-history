import type { ReactNode } from "react"

type BadgeProps = {
  children: ReactNode
  subtle?: boolean
}

export function Badge({ children, subtle = false }: BadgeProps) {
  return (
    <span
      className={
        subtle
          ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
          : "rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800"
      }
    >
      {children}
    </span>
  )
}
