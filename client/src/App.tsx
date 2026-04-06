import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import DocumentWorkspace from "./pages/DocumentWorkspace"
import AllDocumentsPage from "./pages/AllDocumentsPage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import { ProtectedRoute } from "./components/auth/ProtectedRoute"
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute"

const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#f9fafb',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/workspace" replace />} />

        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/workspace" element={<DocumentWorkspace />} />
          <Route path="/documents" element={<AllDocumentsPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App