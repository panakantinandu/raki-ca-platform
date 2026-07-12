import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import OAuthCallback from './pages/OAuthCallback.jsx'
import PublicStatus from './pages/PublicStatus.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Contact from './pages/Contact.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import DashboardLoading from './components/dashboard/DashboardLoading.jsx'

// Everything under /app is only ever reached after login, so there's no reason for a first-time
// visitor to the public landing page to download it up front - lazy-loading these keeps the
// dashboard's code (and its dependencies, e.g. recharts) out of the initial bundle entirely.
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout.jsx'))
const Overview = lazy(() => import('./pages/dashboard/Overview.jsx'))
const Clients = lazy(() => import('./pages/dashboard/Clients.jsx'))
const ClientDetail = lazy(() => import('./pages/dashboard/ClientDetail.jsx'))
const Filings = lazy(() => import('./pages/dashboard/Filings.jsx'))
const Documents = lazy(() => import('./pages/dashboard/Documents.jsx'))
const Billing = lazy(() => import('./pages/dashboard/Billing.jsx'))
const Settings = lazy(() => import('./pages/dashboard/Settings.jsx'))
const Support = lazy(() => import('./pages/dashboard/Support.jsx'))
const Notifications = lazy(() => import('./pages/dashboard/Notifications.jsx'))
const Admin = lazy(() => import('./pages/dashboard/Admin.jsx'))

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route path="/status/:token" element={<PublicStatus />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/contact" element={<Contact />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <Suspense fallback={<DashboardLoading />}>
              <DashboardLayout />
            </Suspense>
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
        <Route path="support" element={<Support />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    </Routes>
  )
}
