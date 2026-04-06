import { useEffect, useState } from "react"
import { FileText, RefreshCw } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import type { DocumentListItem } from "../api/types"
import { documentApi } from "../api"
import { formatDate, htmlToText } from "../utils/document"
import { EmptyState } from "../ui/EmptyState"

export default function AllDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const result = await documentApi.listDocuments()
      setDocuments(result)
    } catch {
      toast.error("Failed to fetch documents")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDocuments()
  }, [])

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-6 rounded-xl border border-slate-300 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">All user documents</h1>
              <p className="mt-2 text-sm text-slate-600">Quick view of all documents created by the current user.</p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/workspace"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Open workspace
              </Link>
              <button
                type="button"
                onClick={fetchDocuments}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {documents.length === 0 ? (
          <EmptyState title="No documents found" description="Create one from workspace and it will show up here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((document) => (
              <article key={document.id} className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{document.title}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700">v{document.current_version}</span>
                </div>
                <p className="text-xs text-slate-500">{document.id}</p>
                <p className="mt-3 line-clamp-3 text-sm text-slate-700">{htmlToText(document.content)}</p>
                <p className="mt-3 text-xs text-slate-500">Updated {formatDate(document.updated_at)}</p>
                <button
                  type="button"
                  onClick={() => navigate(`/workspace?documentId=${document.id}`)}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  <FileText className="h-4 w-4" />
                  Open in editor
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
