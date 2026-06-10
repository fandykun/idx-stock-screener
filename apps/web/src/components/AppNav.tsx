import { NavLink } from 'react-router-dom'

export function AppNav() {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <NavLink to="/">Screener</NavLink>
      <NavLink to="/watchlist">Watchlist</NavLink>
      <NavLink to="/alerts">Alerts</NavLink>
      <NavLink to="/settings">Settings</NavLink>
    </nav>
  )
}
