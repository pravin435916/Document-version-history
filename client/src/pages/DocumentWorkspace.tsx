import { useEffect, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import UnderlineExtension from "@tiptap/extension-underline"
import { FilePlus2, History, Save } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import toast from "react-hot-toast"

import { documentApi } from "../api"
import type { DocumentListItem, DocumentResponse, HistoryResponse } from "../api/types"
import { getApiErrorMessage } from "../utils/document"
import { Panel } from "../ui/Panel"
import { Field } from "../ui/Field"
import { Badge } from "../ui/Badge"
import { ActionButton } from "../ui/ActionButton"
import { DocumentsList } from "../components/documents/DocumentsList"
import { VersionHistory } from "../components/documents/VersionHistory"
import { EditorToolbar } from "../components/editor/EditorToolbar"

type CurrentDocument = {
  id: string
  title: string
  currentVersion: number
  content: string
}

const starterContent = "<p>Write the first version here.</p>"

const toCurrentDocument = (document: DocumentResponse | DocumentListItem): CurrentDocument => ({
  id: document.id,
  title: document.title,
  currentVersion: document.current_version,
  content: document.content,
})

export default function DocumentWorkspace() {
  const [searchParams] = useSearchParams()
  const [title, setTitle] = useState("Project Notes")
  const [currentDocument, setCurrentDocument] = useState<CurrentDocument | null>(null)
  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [history, setHistory] = useState<HistoryResponse[]>([])
  const [editorHtml, setEditorHtml] = useState(starterContent)
  const [loadingAction, setLoadingAction] = useState<"create" | "load" | "update" | "rollback" | "list" | "">("")
  const [rollbackLoading, setRollbackLoading] = useState<{ versionNumber: number | null; isLoading: boolean }>({
    versionNumber: null,
    isLoading: false,
  })

  const editor = useEditor({
    extensions: [StarterKit, UnderlineExtension],
    content: starterContent,
    onUpdate: ({ editor: nextEditor }) => {
      setEditorHtml(nextEditor.getHTML())
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[420px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none",
      },
      handleDoubleClick: (_view, _pos, event) => {
        event.preventDefault()
        return true
      },
    },
  })

  const refreshDocuments = async () => {
    try {
      setLoadingAction("list")
      const list = await documentApi.listDocuments()
      setDocuments(list)
      return list
    } catch {
      toast.error("Failed to load documents")
      return []
    } finally {
      setLoadingAction("")
    }
  }

  const loadDocumentDetails = async (documentIdToLoad: string) => {
    const [document, documentHistory] = await Promise.all([
      documentApi.getDocument(documentIdToLoad),
      documentApi.getDocumentHistory(documentIdToLoad),
    ])

    const mappedDocument = toCurrentDocument(document)
    setCurrentDocument(mappedDocument)
    setTitle(mappedDocument.title)
    setHistory(documentHistory)

    const list = await documentApi.listDocuments()
    setDocuments(list)
    return mappedDocument
  }

  useEffect(() => {
    const bootstrap = async () => {
      const list = await refreshDocuments()
      const initialDocumentId = searchParams.get("documentId")

      if (initialDocumentId) {
        try {
          await loadDocumentDetails(initialDocumentId)
          return
        } catch {
          toast.error("Could not open selected document")
        }
      }

      if (list.length > 0 && !currentDocument) {
        setCurrentDocument(toCurrentDocument(list[0]))
      }
    }

    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!editor) {
      return
    }

    if (currentDocument) {
      const nextContent = currentDocument.content || starterContent
      editor.commands.setContent(nextContent)
      setEditorHtml(nextContent)
      setTitle(currentDocument.title)
      return
    }

    editor.commands.setContent(starterContent)
    setEditorHtml(starterContent)
  }, [currentDocument, editor])

  const handleCreate = async () => {
    try {
      setLoadingAction("create")
      const document = await documentApi.createDocument({
        title,
        content: editorHtml,
      })
      await loadDocumentDetails(document.id)
      toast.success("Document created")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Creation failed"))
    } finally {
      setLoadingAction("")
    }
  }

  const handleUpdate = async () => {
    if (!currentDocument) {
      toast.error("Select a document first")
      return
    }

    try {
      setLoadingAction("update")
      const document = await documentApi.updateDocument(currentDocument.id, {
        content: editorHtml,
      })
      await loadDocumentDetails(document.id)
      toast.success("Document saved")
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Update failed"))
    } finally {
      setLoadingAction("")
    }
  }

  const handleRollback = async (versionNumber: number) => {
    if (!currentDocument) {
      toast.error("Select a document first")
      return
    }

    try {
      setRollbackLoading({ versionNumber, isLoading: true })
      const document = await documentApi.rollbackDocument(currentDocument.id, versionNumber)
      await loadDocumentDetails(document.id)
      toast.success(`Rolled back to version ${versionNumber}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Rollback failed"))
    } finally {
      setRollbackLoading({ versionNumber: null, isLoading: false })
    }
  }

  const handleSelectDocument = async (selectedDocument: DocumentListItem) => {
    try {
      setLoadingAction("load")
      await loadDocumentDetails(selectedDocument.id)
      toast.success(`Loaded ${selectedDocument.title}`)
    } catch {
      toast.error("Load failed")
    } finally {
      setLoadingAction("")
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-xl border border-slate-300 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Document Version History</h1>
              <p className="mt-2 text-sm text-slate-600">Pick a document on the left. Edit and save. History appears below.</p>
            </div>
            <Link
              to="/documents"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View all documents
            </Link>
          </div>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section>
            <Panel title="Your documents" icon={<FilePlus2 className="h-4 w-4" />}>
              <DocumentsList
                documents={documents}
                activeDocumentId={currentDocument?.id ?? null}
                isLoading={loadingAction === "load"}
                onSelect={handleSelectDocument}
              />
            </Panel>
          </section>

          <section className="space-y-6">
            <Panel title={currentDocument ? "Editor" : "Create document"} icon={<Save className="h-4 w-4" />}>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Field label="Document title">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                    placeholder="Document title"
                  />
                </Field>
                <div className="mt-2 flex gap-2">
                  <ActionButton
                    loading={loadingAction === "create"}
                    loadingLabel="Creating"
                    icon={<FilePlus2 className="h-4 w-4" />}
                    label="Create"
                    onClick={handleCreate}
                  />
                  <ActionButton
                    loading={loadingAction === "update"}
                    loadingLabel="Saving"
                    icon={<Save className="h-4 w-4" />}
                    label="Save"
                    onClick={handleUpdate}
                    variant="secondary"
                  />
                </div>
              </div>

              <Field label="Rich text content">
                <div className="rounded-xl border border-slate-300 bg-white p-3">
                  <EditorToolbar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                {currentDocument ? <Badge>Version {currentDocument.currentVersion}</Badge> : <Badge subtle>Not loaded</Badge>}
                {currentDocument ? <Badge subtle>ID {currentDocument.id}</Badge> : null}
              </div>
            </Panel>

            <Panel title="All versions" icon={<History className="h-4 w-4" />}>
              <VersionHistory
                history={history}
                currentVersion={currentDocument?.currentVersion}
                rollbackLoading={rollbackLoading}
                onRollback={handleRollback}
              />
            </Panel>
          </section>
        </main>
      </div>
    </div>
  )
}
