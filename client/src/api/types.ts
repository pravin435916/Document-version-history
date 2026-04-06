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

export type LoginPayload = {
  username: string
  password: string
}

export type RegisterPayload = {
  username: string
  password: string
}

export type TokenResponse = {
  access_token: string
  token_type: string
}

export type UserResponse = {
  id: string
  username: string
  created_at: string
}

export type ApiErrorShape = {
  detail?: string
}
