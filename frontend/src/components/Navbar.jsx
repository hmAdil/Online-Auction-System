import { useState } from "react"
import "./Navbar.css"

function Navbar({ user, isAdmin, onLogout, onHome, onProfile, onRequest, onAdmin, onWatchlist, page }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = (callback) => {
    callback()
    setMobileMenuOpen(false)
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileMenuOpen}
        >
          <span className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
          <span className={`hamburger-line ${mobileMenuOpen ? "open" : ""}`} />
        </button>

        <div className="navbar-logo" onClick={onHome}>
          Animus<span>.</span>
        </div>
      </div>

      <div className={`navbar-links ${mobileMenuOpen ? "open" : ""}`}>
        <button className={`nav-btn ${page === "home" ? "active" : ""}`} onClick={() => handleNavClick(onHome)}>
          Market
        </button>
        <button className={`nav-btn ${page === "watchlist" ? "active" : ""}`} onClick={() => handleNavClick(onWatchlist)}>
          Watchlist
        </button>
        <button className={`nav-btn ${page === "profile" ? "active" : ""}`} onClick={() => handleNavClick(onProfile)}>
          Activity
        </button>
        <button className={`nav-btn ${page === "request" ? "active" : ""}`} onClick={() => handleNavClick(onRequest)}>
          Sell
        </button>
        {isAdmin && (
          <button className={`nav-btn admin-btn ${page === "admin" ? "active" : ""}`} onClick={() => handleNavClick(onAdmin)}>
            Admin
          </button>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-user">
          {isAdmin && <span className="admin-tag">PRIME</span>}
          <strong>{user}</strong>
        </div>
        <button className="btn-logout" onClick={onLogout}>
          Sign Out
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
    </nav>
  )
}

export default Navbar
