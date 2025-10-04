<<<<<<< HEAD
import { AuthProvider } from '@/contexts/AuthContext'
import MainLayout from '@/components/MainLayout'
import { Toaster } from 'sonner'
=======
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { InvoicesPage } from './pages/InvoicesPage'
import { UsersPage } from './pages/UsersPage'
import { Partners } from './pages/Partners'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { Login } from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'
>>>>>>> refs/remotes/origin/master

function App() {
  return (
    <AuthProvider>
<<<<<<< HEAD
      <div className="min-h-screen bg-background">
        <MainLayout />
        <Toaster position="bottom-right" />
=======
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout title="Dashboard Financiero" subtitle="Sistema de Facturación Open Doors">
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices" 
            element={
              <ProtectedRoute>
                <InvoicesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/partners" 
            element={
              <ProtectedRoute>
                <Partners />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
>>>>>>> refs/remotes/origin/master
      </div>
    </AuthProvider>
  )
}

export default App