import { useEffect, useState, type ReactNode } from "react";
import {
  Bold,
  FilePlus2,
  Heading1,
  Heading2,
  History,
  Italic,
  Loader2,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  Save,
  Strikethrough,
  Underline,
  Eraser,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import toast from "react-hot-toast";
import type {
  DocumentListItem,
  DocumentResponse,
  HistoryResponse,
} from "../api/types";
import { documentApi } from "../api";
type CurrentDocument = {
  id: string;
  title: string;
  currentVersion: number;
  content: string;
};

const starterContent = "<p>Write the first version here.</p>";

const toCurrentDocument = (
  document: DocumentResponse | DocumentListItem,
): CurrentDocument => ({
  id: document.id,
  title: document.title,
  currentVersion: document.current_version,
  content: document.content,
});

const formatDate = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });

const htmlToText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function DocumentWorkspace() {
  const [title, setTitle] = useState("Project Notes");
  const [currentDocument, setCurrentDocument] =
    useState<CurrentDocument | null>(null);
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [history, setHistory] = useState<HistoryResponse[]>([]);
  const [editorHtml, setEditorHtml] = useState(starterContent);
  const [loadingAction, setLoadingAction] = useState<
    "create" | "load" | "update" | "rollback" | "list" | ""
  >("");

  const editor = useEditor({
    extensions: [StarterKit, UnderlineExtension],
    content: starterContent,
    onUpdate: ({ editor: nextEditor }) => {
      setEditorHtml(nextEditor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-[420px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none",
      },
    },
  });

  useEffect(() => {
    void refreshDocuments();
  }, []);

  useEffect(() => {
    if (!editor) {
      return;
    }

    if (currentDocument) {
      const nextContent = currentDocument.content || starterContent;
      editor.commands.setContent(nextContent);
      setEditorHtml(nextContent);
      setTitle(currentDocument.title);
      return;
    }

    editor.commands.setContent(starterContent);
    setEditorHtml(starterContent);
  }, [currentDocument, editor]);

  const refreshDocuments = async () => {
    try {
      setLoadingAction("list");
      const list = await documentApi.listDocuments();
      setDocuments(list);
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoadingAction("");
    }
  };

  const loadDocumentDetails = async (documentIdToLoad: string) => {
    const [document, documentHistory] = await Promise.all([
      documentApi.getDocument(documentIdToLoad),
      documentApi.getDocumentHistory(documentIdToLoad),
    ]);

    const mappedDocument = toCurrentDocument(document);
    setCurrentDocument(mappedDocument);
    setTitle(mappedDocument.title);
    setHistory(documentHistory);

    const list = await documentApi.listDocuments();
    setDocuments(list);
    return mappedDocument;
  };

  const handleCreate = async () => {
    try {
      setLoadingAction("create");

      const document = await documentApi.createDocument({
        title,
        content: editorHtml,
      });

      await loadDocumentDetails(document.id);

      toast.success("Document created");
    } catch (error) {
      const message = error?.response?.data?.detail || "Creation failed";

      toast.error(message);
    } finally {
      setLoadingAction("");
    }
  };

  const handleUpdate = async () => {
    if (!currentDocument) {
      toast.error("Select a document first");
      return;
    }

    try {
      setLoadingAction("update");

      const document = await documentApi.updateDocument(currentDocument.id, {
        content: editorHtml,
      });

      await loadDocumentDetails(document.id);

      toast.success("Document saved");
    } catch (error) {
      const message = error?.response?.data?.detail || "Update failed";

      toast.error(message);
    } finally {
      setLoadingAction("");
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!currentDocument) {
      toast.error("Select a document first");
      return;
    }

    try {
      setLoadingAction("rollback");

      const document = await documentApi.rollbackDocument(
        currentDocument.id,
        versionNumber,
      );

      await loadDocumentDetails(document.id);

      toast.success(`Rolled back to version ${versionNumber}`);
    } catch (error) {
      const message = error?.response?.data?.detail || "Rollback failed";
      toast.error(message);
    } finally {
      setLoadingAction("");
    }
  };

  const handleSelectDocument = async (selectedDocument: any) => {
    try {
      setLoadingAction("load");

      await loadDocumentDetails(selectedDocument.id);

      toast.success(`Loaded ${selectedDocument.title}`);
    } catch (error) {
      toast.error("Load failed");
    } finally {
      setLoadingAction("");
    }
  };

  const toolbarButtonClass = (active?: boolean) =>
    `inline-flex items-center justify-center rounded-lg border px-2.5 py-2 text-sm transition ${
      active
        ? "border-slate-400 bg-slate-200 text-slate-900"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    }`;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-xl border border-slate-300 bg-white p-5">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            Document editor
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Pick a document on the left. Edit and save in the center. History
            appears below.
          </p>
        </header>

        <main className="grid flex-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <section>
            <Panel
              title="Your documents"
              icon={<FilePlus2 className="h-4 w-4" />}
            >
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((document) => {
                    const isActive = currentDocument?.id === document.id;
                    return (
                      <button
                        key={document.id}
                        type="button"
                        onClick={() => handleSelectDocument(document)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                          isActive
                            ? "border-slate-500 bg-slate-100"
                            : "border-slate-300 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">
                              {document.title}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {document.id}
                            </p>
                          </div>
                          <Badge subtle>v{document.current_version}</Badge>
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                          {htmlToText(document.content)}
                        </p>
                        {loadingAction === "load" && isActive ? (
                          <div className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Loading
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No documents yet"
                  description="Create one from the editor."
                />
              )}
            </Panel>
          </section>

          <section className="space-y-6">
            <Panel
              title={currentDocument ? "Editor" : "Create document"}
              icon={<Save className="h-4 w-4" />}
            >
              <div className="flex flex-wrap justify-center items-center gap-3">
                <Field label="Document title">
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500"
                    placeholder="Document title"
                  />
                </Field>
                <div className="flex gap-2 mt-2">
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
                  <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                    <button
                      type="button"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={toolbarButtonClass(editor?.isActive("bold"))}
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      className={toolbarButtonClass(editor?.isActive("italic"))}
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleUnderline().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("underline"),
                      )}
                    >
                      <Underline className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleStrike().run()
                      }
                      className={toolbarButtonClass(editor?.isActive("strike"))}
                    >
                      <Strikethrough className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 1 })
                          .run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("heading", { level: 1 }),
                      )}
                    >
                      <Heading1 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 2 })
                          .run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("heading", { level: 2 }),
                      )}
                    >
                      <Heading2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("bulletList"),
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("orderedList"),
                      )}
                    >
                      <ListOrdered className="h-4 w-4" />
                    </button>
                    {/* <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleBlockquote().run()
                      }
                      className={toolbarButtonClass(
                        editor?.isActive("blockquote"),
                      )}
                    >
                      <Quote className="h-4 w-4" />
                    </button> */}
                    <button
                      type="button"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .clearNodes()
                          .unsetAllMarks()
                          .run()
                      }
                      className={toolbarButtonClass()}
                    >
                      <Eraser className="h-4 w-4" />
                    </button>
                  </div>
                  <EditorContent editor={editor} />
                </div>
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                {currentDocument ? (
                  <Badge>Version {currentDocument.currentVersion}</Badge>
                ) : (
                  <Badge subtle>Not loaded</Badge>
                )}
                {currentDocument ? (
                  <Badge subtle>ID {currentDocument.id}</Badge>
                ) : null}
              </div>
            </Panel>

            <Panel title="All versions" icon={<History className="h-4 w-4" />}>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history
                    .slice()
                    .reverse()
                    .map((version) => {
                      const isCurrentVersion =
                        currentDocument?.currentVersion === version.version;
                      return (
                        <div
                          key={`${version.version}-${version.created_at}`}
                          className="rounded-xl border border-slate-300 bg-white p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge>Version {version.version}</Badge>
                                {isCurrentVersion ? (
                                  <Badge subtle>Current</Badge>
                                ) : null}
                              </div>
                              <div className="text-sm text-slate-600">
                                Edited by {version.edited_by}
                              </div>
                              <div className="text-sm text-slate-500">
                                {formatDate(version.created_at)}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRollback(version.version)}
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              disabled={loadingAction === "rollback"}
                            >
                              {loadingAction === "rollback" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RotateCcw className="h-4 w-4" />
                              )}
                              {loadingAction === "rollback"
                                ? "Rolling back"
                                : "Roll back"}
                            </button>
                          </div>
                          <p className="mt-4 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
                            {htmlToText(version.content)}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <EmptyState
                  title="No versions yet"
                  description="Open a document and its versions will appear here."
                />
              )}
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
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
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block flex-1">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function Badge({
  children,
  subtle = false,
}: {
  children: ReactNode;
  subtle?: boolean;
}) {
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
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  icon,
  variant = "primary",
  loading = false,
  loadingLabel = "Loading",
}: {
  label: string;
  onClick: () => void;
  icon: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
  loadingLabel?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-slate-400/40";
  const styles =
    variant === "primary"
      ? "bg-slate-900 text-white hover:bg-slate-800"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${styles}`}
      disabled={loading}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {loading ? loadingLabel : label}
    </button>
  );
}
