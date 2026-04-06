import axios from 'axios'

import type {
  CreateDocumentPayload,
  DocumentListItem,
  DocumentResponse,
  HistoryResponse,
  LoginPayload,
  RegisterPayload,
  TokenResponse,
  UpdateDocumentPayload,
  UserResponse,
} from './types'
import { clearAccessToken, getAccessToken } from '../auth/token'

const apiBaseUrl = 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

const getAuthHeaders = () => {
  const token = getAccessToken()
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const response = await api.post<UserResponse>('/auth/register', payload)
    return response.data
  },

  async login(payload: LoginPayload) {
    const response = await api.post<TokenResponse>('/auth/login', payload)
    return response.data
  },
}

export const documentApi = {
  async createDocument(payload: CreateDocumentPayload) {
    const response = await api.post<DocumentResponse>('/documents/', payload, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  async updateDocument(documentId: string, payload: UpdateDocumentPayload) {
    const response = await api.put<DocumentResponse>(`/documents/${documentId}`, payload, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  async getDocument(documentId: string) {
    const response = await api.get<DocumentResponse>(`/documents/${documentId}`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  async getDocumentHistory(documentId: string) {
    const response = await api.get<HistoryResponse[]>(`/documents/${documentId}/history`, {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  async rollbackDocument(documentId: string, versionNumber: number) {
    const response = await api.post<DocumentResponse>(`/documents/${documentId}/rollback`, null, {
      headers: getAuthHeaders(),
      params: {
        version_number: versionNumber,
      },
    })
    return response.data
  },

  async listDocuments() {
    const response = await api.get<DocumentListItem[]>('/documents/', {
      headers: getAuthHeaders(),
    })
    return response.data
  },
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const requestUrl = String(error?.config?.url || '')
    const isAuthEndpoint = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/register')
    const isAlreadyOnAuthPage =
      window.location.pathname === '/login' || window.location.pathname === '/register'

    if (status === 401 && !isAuthEndpoint) {
      clearAccessToken()
      if (!isAlreadyOnAuthPage) {
        window.location.assign('/login')
      }
    }

    return Promise.reject(error)
  },
)