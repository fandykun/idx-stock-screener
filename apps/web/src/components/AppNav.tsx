import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function AppNav() {
  const auth = useAuth()

  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <NavLink to="/">Screener</NavLink>
      <NavLink to="/watchlist">Watchlist</NavLink>
      <NavLink to="/alerts">Alerts</NavLink>
      <NavLink to="/settings">Settings</NavLink>
      {auth.isAuthenticated ? <button type="button" onClick={auth.logout}>Logout</button> : <NavLink to="/login">Login</NavLink>}
    </nav>
  )
}
