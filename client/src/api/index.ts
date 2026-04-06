import axios from 'axios'

import type {
  CreateDocumentPayload,
  DocumentListItem,
  DocumentResponse,
  HistoryResponse,
  UpdateDocumentPayload,
} from './types'

const apiBaseUrl = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

const getUserHeaders = () => ({
  'user-id': "123",
})

export const documentApi = {
  async createDocument(payload: CreateDocumentPayload) {
    const response = await api.post<DocumentResponse>('/documents/', payload, {
      headers: getUserHeaders(),
    })
    return response.data
  },

  async updateDocument(documentId: string, payload: UpdateDocumentPayload) {
    const response = await api.put<DocumentResponse>(`/documents/${documentId}`, payload, {
      headers: getUserHeaders(),
    })
    return response.data
  },

  async getDocument(documentId: string) {
    const response = await api.get<DocumentResponse>(`/documents/${documentId}`, {
      headers: getUserHeaders(),
    })
    return response.data
  },

  async getDocumentHistory(documentId: string) {
    const response = await api.get<HistoryResponse[]>(`/documents/${documentId}/history`, {
      headers: getUserHeaders(),
    })
    return response.data
  },

  async rollbackDocument(documentId: string, versionNumber: number) {
    const response = await api.post<DocumentResponse>(`/documents/${documentId}/rollback`, null, {
      headers: getUserHeaders(),
      params: {
        version_number: versionNumber,
      },
    })
    return response.data
  },

  async listDocuments() {
    const response = await api.get<DocumentListItem[]>('/documents/', {
      headers: getUserHeaders(),
    })
    return response.data
  },
}