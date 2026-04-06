import DocumentWorkspace from './pages/DocumentWorkspace'
import { Toaster } from 'react-hot-toast'

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
      <DocumentWorkspace />
    </>
  )
}

export default App