import { Navigate, Route, Routes } from "react-router-dom"
import { Toaster } from "react-hot-toast"

import DocumentWorkspace from "./pages/DocumentWorkspace"
import AllDocumentsPage from "./pages/AllDocumentsPage"

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
        <Route path="/workspace" element={<DocumentWorkspace />} />
        <Route path="/documents" element={<AllDocumentsPage />} />
      </Routes>
    </>
  )
}

export default App