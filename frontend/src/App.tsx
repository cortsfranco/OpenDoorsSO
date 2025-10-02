import { AuthProvider } from '@/contexts/AuthContext'
import MainLayout from '@/components/MainLayout'
import { Toaster } from 'sonner'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <MainLayout />
        <Toaster position="bottom-right" />
      </div>
    </AuthProvider>
  )
}

export default App
