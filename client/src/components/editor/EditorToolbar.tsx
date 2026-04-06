import {
  Bold,
  Eraser,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Strikethrough,
  Underline,
} from "lucide-react"
import type { Editor } from "@tiptap/react"

type EditorToolbarProps = {
  editor: Editor | null
}

const toolbarButtonClass = (active?: boolean) =>
  `inline-flex items-center justify-center rounded-lg border px-2.5 py-2 text-sm transition ${
    active
      ? "border-slate-400 bg-slate-200 text-slate-900"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
  }`

export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className={toolbarButtonClass(editor?.isActive("bold"))}>
        <Bold className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className={toolbarButtonClass(editor?.isActive("italic"))}>
        <Italic className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor?.chain().focus().toggleUnderline().run()} className={toolbarButtonClass(editor?.isActive("underline"))}>
        <Underline className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => editor?.chain().focus().toggleStrike().run()} className={toolbarButtonClass(editor?.isActive("strike"))}>
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        className={toolbarButtonClass(editor?.isActive("heading", { level: 1 }))}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        className={toolbarButtonClass(editor?.isActive("heading", { level: 2 }))}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={toolbarButtonClass(editor?.isActive("bulletList"))}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={toolbarButtonClass(editor?.isActive("orderedList"))}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
        className={toolbarButtonClass()}
      >
        <Eraser className="h-4 w-4" />
      </button>
    </div>
  )
}
