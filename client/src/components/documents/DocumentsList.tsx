import { Loader2 } from "lucide-react"

import type { DocumentListItem } from "../../api/types"
import { htmlToText } from "../../utils/document"
import { Badge } from "../../ui/Badge"
import { EmptyState } from "../../ui/EmptyState"

type DocumentsListProps = {
  documents: DocumentListItem[]
  activeDocumentId: string | null
  isLoading: boolean
  onSelect: (document: DocumentListItem) => void
}

export function DocumentsList({ documents, activeDocumentId, isLoading, onSelect }: DocumentsListProps) {
  if (documents.length === 0) {
    return <EmptyState title="No documents yet" description="Create one from the editor." />
  }

  return (
    <div className="space-y-3">
      {documents.map((document) => {
        const isActive = activeDocumentId === document.id

        return (
          <button
            key={document.id}
            type="button"
            onClick={() => onSelect(document)}
            className={`w-full rounded-lg border px-3 py-3 text-left transition ${
              isActive
                ? "border-slate-500 bg-slate-100"
                : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{document.title}</h3>
                <p className="mt-1 text-xs text-slate-500">{document.id}</p>
              </div>
              <Badge subtle>v{document.current_version}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{htmlToText(document.content)}</p>
            {isLoading && isActive ? (
              <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading
              </div>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
