export type DocumentResponse = {
  id: string
  title: string
  current_version: number
  content: string
}

export type DocumentListItem = {
  id: string
  title: string
  current_version: number
  content: string
  updated_at: string
}

export type HistoryResponse = {
  version: number
  edited_by: string
  created_at: string
  content: string
}

export type CreateDocumentPayload = {
  title: string
  content: string
}

export type UpdateDocumentPayload = {
  content: string
}

export type ApiErrorShape = {
  detail?: string
}
