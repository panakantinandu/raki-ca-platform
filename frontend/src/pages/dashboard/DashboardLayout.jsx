import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileCheck2, FolderOpen, CreditCard, Settings as SettingsIcon, LogOut, Menu, X, ShieldCheck, LifeBuoy, Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import NotificationBell from '../../components/dashboard/NotificationBell.jsx'

const NAV_ITEMS = [
  { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/app/clients', label: 'Clients', icon: Users },
  { to: '/app/filings', label: 'Filings', icon: FileCheck2 },
  { to: '/app/documents', label: 'Documents', icon: FolderOpen },
  { to: '/app/billing', label: 'Billing', icon: CreditCard },
  { to: '/app/notifications', label: 'Notifications', icon: Bell },
  { to: '/app/support', label: 'Support', icon: LifeBuoy },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon }
]

// UX convenience only, not a security boundary - the backend independently checks the
// authenticated user's id against ADMIN_USER_ID on every /api/admin/** request.
const IS_ADMIN_UI_VISIBLE = (user) =>
  Boolean(import.meta.env.VITE_ADMIN_USER_ID) && user?.id === import.meta.env.VITE_ADMIN_USER_ID

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const navItems = IS_ADMIN_UI_VISIBLE(user)
    ? [...NAV_ITEMS, { to: '/app/admin', label: 'Admin', icon: ShieldCheck }]
    : NAV_ITEMS

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 py-6">
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="7" fill="#C9A227" fillOpacity="0.15" />
          <path d="M9 16.5l4.5 4.5L23 11" stroke="#C9A227" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="font-display text-lg font-medium text-parchment">Raki</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 font-sans text-sm transition-colors ${
                isActive
                  ? 'bg-brass/10 text-brass'
                  : 'text-parchment-muted hover:bg-ink-raised hover:text-parchment'
              }`
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-border p-4">
        <div className="mb-3 px-2">
          <p className="truncate font-sans text-sm font-medium text-parchment">{user?.fullName}</p>
          <p className="truncate font-mono text-xs text-parchment-faint">{user?.firmName || user?.email}</p>
        </div>
        <button
          onClick={() => setConfirmingLogout(true)}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-sans text-sm text-parchment-muted transition-colors hover:bg-ink-raised hover:text-ledger-red"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out of Raki?"
        confirmLabel="Log out"
        onConfirm={logout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  )
}

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 border-r border-ink-border bg-ink-surface lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-ink-border bg-ink-surface">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-border px-6 py-4 lg:hidden">
          <span className="font-display text-lg text-parchment">Raki</span>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={() => setMobileOpen(true)} className="text-parchment" aria-label="Open menu">
              <Menu size={22} />
            </button>
          </div>
        </header>

        <header className="hidden items-center justify-end border-b border-ink-border px-6 py-3 lg:flex">
          <NotificationBell />
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
