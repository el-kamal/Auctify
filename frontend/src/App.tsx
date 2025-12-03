import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { LoginPage } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { ImportMapping } from '@/pages/ImportMapping'
import { ImportResults } from '@/pages/ImportResults'
import { Invoices } from '@/pages/Invoices'
import { Settlements } from '@/pages/Settlements'
import SalesManagement from '@/pages/admin/SalesManagement'
import UserManagement from "./pages/admin/UserManagement"
import VendorManagement from "./pages/admin/VendorManagement"
import BuyerManagement from "./pages/admin/BuyerManagement"
import { SettingsPage } from '@/pages/Settings'
import { AuthProvider, useAuth, UserRole } from '@/context/AuthContext'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  )
}

function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: UserRole[], children?: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />

            {/* Sale Specific Routes */}
            <Route path="/sales/:saleId/import-mapping" element={<Layout><ImportMapping /></Layout>} />
            <Route path="/sales/:saleId/import-results" element={<Layout><ImportResults /></Layout>} />
            <Route path="/sales/:saleId/invoices" element={<Layout><Invoices /></Layout>} />
            <Route path="/sales/:saleId/settlements" element={<Layout><Settlements /></Layout>} />

            {/* Admin Routes */}
            <Route path="/sales" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><SalesManagement /></Layout></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><UserManagement /></Layout></ProtectedRoute>} />
            <Route path="/vendors" element={<ProtectedRoute allowedRoles={['ADMIN', 'CLERK']}><Layout><VendorManagement /></Layout></ProtectedRoute>} />
            <Route path="/buyers" element={<ProtectedRoute allowedRoles={['ADMIN', 'CLERK']}><Layout><BuyerManagement /></Layout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout><SettingsPage /></Layout></ProtectedRoute>} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
