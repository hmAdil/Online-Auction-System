function Navbar({ user, onLogout, onHome, onProfile, page }) {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        Animus
      </div>

      <div className="navbar-links">
        <button className={`nav-btn ${page === "home" ? "active" : ""}`} onClick={onHome}>
          Auctions
        </button>
        <button className={`nav-btn ${page === "profile" ? "active" : ""}`} onClick={onProfile}>
          My Bids
        </button>
      </div>

      <div className="navbar-right">
        <span className="navbar-user">
          Signed in as <strong>{user}</strong>
        </span>
        <button className="btn-logout" onClick={onLogout}>
          Sign Out
        </button>
      </div>
    </nav>
  )
}

export default Navbar
