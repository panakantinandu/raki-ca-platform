import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const { completeOAuthCallback } = useAuth()

  useEffect(() => {
    // Tokens arrive in the URL fragment (#...), never a query string,
    // specifically so they never get logged by servers or proxies.
    const params = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      completeOAuthCallback(accessToken, refreshToken)
      navigate('/app', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [completeOAuthCallback, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-border border-t-brass" />
    </div>
  )
}
