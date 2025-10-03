import { AuthProvider } from '@/contexts/AuthContext'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import MainLayout from '@/components/MainLayout'
import { Toaster } from 'sonner'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/login" element={<MainLayout />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="bottom-right" />
      </div>
    </AuthProvider>
  )
}

export default App
