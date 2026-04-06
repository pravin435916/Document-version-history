import type { ReactNode } from "react"

type PanelProps = {
  title: string
  icon: ReactNode
  children: ReactNode
}

export function Panel({ title, icon, children }: PanelProps) {
  return (
    <section className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
          {icon}
        </span>
        {title}
      </div>
      {children}
    </section>
  )
}
