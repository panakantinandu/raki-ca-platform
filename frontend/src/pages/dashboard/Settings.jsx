import { useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'

export default function Settings() {
  const { user, logout } = useAuth()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  return (
    <div>
      <div className="mb-8">
        <span className="label-eyebrow">Settings</span>
        <h1 className="mt-2 font-display text-3xl font-medium text-parchment">Account</h1>
      </div>

      <div className="card mb-6 p-6">
        <h2 className="font-display text-lg font-medium text-parchment">Profile</h2>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Full name</label>
            <input defaultValue={user?.fullName} className="input-field" disabled />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Email</label>
            <input defaultValue={user?.email} className="input-field" disabled />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Firm name</label>
            <input defaultValue={user?.firmName || ''} className="input-field" disabled />
          </div>
          <div>
            <label className="mb-1.5 block font-sans text-sm text-parchment-muted">Role</label>
            <input defaultValue={user?.role} className="input-field" disabled />
          </div>
        </div>
        <p className="mt-4 font-mono text-xs text-parchment-faint">
          Profile editing connects to PUT /api/users/me - wire this up once you extend UserController.
        </p>
      </div>

      <div className="card border-ledger-red/20 p-6">
        <h2 className="font-display text-lg font-medium text-parchment">Sign out everywhere</h2>
        <p className="mt-2 font-sans text-sm text-parchment-muted">
          This revokes every refresh token issued to your account, signing you out on all devices.
        </p>
        <button
          onClick={() => setConfirmingLogout(true)}
          className="btn-ghost mt-4 border-ledger-red/30 text-ledger-red hover:border-ledger-red/50 hover:bg-ledger-red/5"
        >
          Log out everywhere
        </button>
      </div>

      <ConfirmDialog
        open={confirmingLogout}
        title="Log out on all devices?"
        body="This revokes every session, including the one you're using right now. You'll need to log in again everywhere."
        confirmLabel="Log out everywhere"
        danger
        onConfirm={logout}
        onCancel={() => setConfirmingLogout(false)}
      />
    </div>
  )
}
