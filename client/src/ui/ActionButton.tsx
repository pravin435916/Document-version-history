import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"

type ActionButtonProps = {
  label: string
  onClick: () => void
  icon: ReactNode
  variant?: "primary" | "secondary"
  loading?: boolean
  loadingLabel?: string
}

export function ActionButton({
  label,
  onClick,
  icon,
  variant = "primary",
  loading = false,
  loadingLabel = "Loading",
}: ActionButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400/40"

  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {loading ? loadingLabel : label}
    </button>
  )
}
