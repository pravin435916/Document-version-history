import { Loader2, RotateCcw } from "lucide-react"

import type { HistoryResponse } from "../../api/types"
import { formatDate, htmlToText } from "../../utils/document"
import { Badge } from "../../ui/Badge"
import { EmptyState } from "../../ui/EmptyState"

type VersionHistoryProps = {
  history: HistoryResponse[]
  currentVersion?: number
  rollbackLoading: { versionNumber: number | null; isLoading: boolean }
  onRollback: (versionNumber: number) => void
}

export function VersionHistory({
  history,
  currentVersion,
  rollbackLoading,
  onRollback,
}: VersionHistoryProps) {
  if (history.length === 0) {
    return (
      <EmptyState
        title="No versions yet"
        description="Open a document and its versions will appear here."
      />
    )
  }

  return (
    <div className="space-y-3">
      {history
        .slice()
        .reverse()
        .map((version) => {
          const isCurrentVersion = currentVersion === version.version
          const isThisRollbackLoading =
            rollbackLoading.isLoading && rollbackLoading.versionNumber === version.version

          return (
            <div
              key={`${version.version}-${version.created_at}`}
              className="rounded-xl border border-slate-300 bg-white p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Version {version.version}</Badge>
                    {isCurrentVersion ? <Badge subtle>Current</Badge> : null}
                  </div>
                  <div className="text-sm text-slate-600">Edited by {version.edited_by}</div>
                  <div className="text-sm text-slate-500">{formatDate(version.created_at)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onRollback(version.version)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  disabled={rollbackLoading.isLoading}
                >
                  {isThisRollbackLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                  {isThisRollbackLoading ? "Rolling back" : "Roll back"}
                </button>
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                {htmlToText(version.content)}
              </p>
            </div>
          )
        })}
    </div>
  )
}
