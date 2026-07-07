import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import OAuthCallback from './pages/OAuthCallback.jsx'
import DashboardLayout from './pages/dashboard/DashboardLayout.jsx'
import Overview from './pages/dashboard/Overview.jsx'
import Clients from './pages/dashboard/Clients.jsx'
import ClientDetail from './pages/dashboard/ClientDetail.jsx'
import Filings from './pages/dashboard/Filings.jsx'
import Documents from './pages/dashboard/Documents.jsx'
import Billing from './pages/dashboard/Billing.jsx'
import Settings from './pages/dashboard/Settings.jsx'
import Admin from './pages/dashboard/Admin.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="filings" element={<Filings />} />
        <Route path="documents" element={<Documents />} />
        <Route path="billing" element={<Billing />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
