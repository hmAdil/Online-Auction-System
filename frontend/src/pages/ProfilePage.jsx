import { useEffect, useState, useMemo } from "react"
import "./ProfilePage.css"

const BADGES = [
  { id: "early_adopter", name: "Early Adopter", icon: "🌟", desc: "Among the first users" },
  { id: "power_bidder", name: "Power Bidder", icon: "⚡", desc: "Placed 50+ bids" },
  { id: "winner", name: "Winner", icon: "🏆", desc: "Won 10+ auctions" },
  { id: "sniper", name: "Sniper", icon: "🎯", desc: "Won auction in last 10 seconds" },
  { id: "collector", name: "Collector", icon: "📦", desc: "Bid on 5+ categories" },
]

function ProfilePage({ sendMessage, message, user, openAuction }) {
  const [profileData, setProfileData] = useState(null)
  const [filter, setFilter] = useState("all") // all, active, won, lost
  const [sortBy, setSortBy] = useState("recent") // recent, price, bids

  useEffect(() => {
    sendMessage({ type: "GET_PROFILE", username: user })
  }, [user])

  useEffect(() => {
    if (!message) return
    if (message.type === "PROFILE_DATA" && message.username === user) {
      setProfileData(message)
    }
  }, [message])

  const stats = useMemo(() => {
    if (!profileData) return null
    const auctions = profileData.auctions || []
    const totalBids = auctions.reduce((sum, a) => sum + (a.bids?.length || 0), 0)
    const wonAuctions = auctions.filter(a => !a.active && a.highest_bidder === user).length
    const activeAuctions = auctions.filter(a => a.active).length
    const totalSpent = auctions
      .filter(a => !a.active && a.highest_bidder === user)
      .reduce((sum, a) => sum + (a.current_bid || 0), 0)

    return {
      totalBids,
      wonAuctions,
      activeAuctions,
      totalSpent,
      auctionsCount: auctions.length
    }
  }, [profileData, user])

  const earnedBadges = useMemo(() => {
    if (!stats) return []
    const badges = []
    if (stats.totalBids >= 50) badges.push(BADGES.find(b => b.id === "power_bidder"))
    if (stats.wonAuctions >= 10) badges.push(BADGES.find(b => b.id === "winner"))
    if (stats.auctionsCount >= 1) badges.push(BADGES.find(b => b.id === "early_adopter"))
    return badges
  }, [stats])

  const filteredAuctions = useMemo(() => {
    if (!profileData) return []
    let result = [...(profileData.auctions || [])]

    switch (filter) {
      case "active":
        result = result.filter(a => a.active)
        break
      case "won":
        result = result.filter(a => !a.active && a.highest_bidder === user)
        break
      case "lost":
        result = result.filter(a => !a.active && a.highest_bidder !== user)
        break
      default:
        break
    }

    switch (sortBy) {
      case "price":
        result.sort((a, b) => b.current_bid - a.current_bid)
        break
      case "bids":
        result.sort((a, b) => (b.bids?.length || 0) - (a.bids?.length || 0))
        break
      case "recent":
      default:
        // Keep as is (most recent first from bid history)
        break
    }

    return result
  }, [profileData, filter, sortBy, user])

  const initial = user ? user[0].toUpperCase() : "?"

  if (!profileData) {
    return (
      <div className="profile-loading">
        <div className="profile-header skeleton">
          <div className="skeleton-avatar" />
          <div className="skeleton-info">
            <div className="skeleton-name" />
            <div className="skeleton-since" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="activity-header glass-panel">
        <div className="profile-avatar-luxe">{initial}</div>
        <div className="profile-info-luxe">
          <h1 className="profile-name-luxe">{user}</h1>
          <div className="profile-badge-luxe">EXECUTIVE MEMBER</div>
        </div>
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="profile-stats-grid">
          <div className="profile-stat-card glass-card">
            <span className="stat-lux-label">Market Bids</span>
            <span className="stat-lux-value">{stats.totalBids}</span>
          </div>
          <div className="profile-stat-card glass-card">
            <span className="stat-lux-label">Successful Bids</span>
            <span className="stat-lux-value gold">{stats.wonAuctions}</span>
          </div>
          <div className="profile-stat-card glass-card">
            <span className="stat-lux-label">Live Enagements</span>
            <span className="stat-lux-value">{stats.activeAuctions}</span>
          </div>
          <div className="profile-stat-card glass-card">
            <span className="stat-lux-label">Portfolio Value</span>
            <span className="stat-lux-value gold">₹{(stats.totalSpent / 1000).toFixed(0)}k</span>
          </div>
        </div>
      )}

      {/* Badges */}
      {earnedBadges.length > 0 && (
        <div className="profile-badges-section">
          <h2 className="section-title-luxe">Credentials</h2>
          <div className="profile-badges-luxe">
            {earnedBadges.map(badge => (
              <div key={badge.id} className="luxe-badge-pill" title={badge.desc}>
                <span className="badge-icon">{badge.icon}</span>
                <span className="badge-name">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auction list with filters */}
      <div className="profile-auctions-section">
        <div className="profile-auctions-header">
          <h2 className="section-title-luxe">Trading History</h2>
          <div className="luxe-filters">
            <select
              className="luxe-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Display All</option>
              <option value="active">Active Engagements</option>
              <option value="won">Successful Acquisitions</option>
              <option value="lost">Ended/Outbid</option>
            </select>
            <select
              className="luxe-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Sort by: Recent</option>
              <option value="price">Sort by: Price</option>
              <option value="bids">Sort by: Engagement</option>
            </select>
          </div>
        </div>

        {filteredAuctions.length === 0 ? (
          <div className="empty-profile">
            <p>No auctions found</p>
            <p>
              {filter === "all"
                ? "Head to the auctions page to place your first bid."
                : `No ${filter} auctions.`}
            </p>
          </div>
        ) : (
          <div className="profile-auction-list">
            {filteredAuctions.map((a) => {
              const myTopBid = Math.max(...(a.bids || []).map(b => b.amount), 0)
              const isWinning = a.highest_bidder === user
              const status = a.active
                ? isWinning ? "winning" : "outbid"
                : isWinning ? "won" : "lost"

              return (
                <div
                  className={`profile-auction-card glass-card ${status}`}
                  key={a.auction_id}
                  onClick={() => openAuction(a.auction_id)}
                >
                  <div className="profile-card-main">
                    <h3 className="profile-card-item">{a.item}</h3>
                    <div className="profile-card-meta">
                      <span className={`status-tag-luxe ${status}`}>
                        {status.toUpperCase()}
                      </span>
                      &nbsp;·&nbsp;
                      {a.bids?.length || 0} Bid{(a.bids?.length || 0) !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="profile-card-stats-luxe">
                    <span className="stat-lux-label">PROPRIETARY BID</span>
                    <span className="stat-value-luxe gold">₹{myTopBid.toLocaleString()}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfilePage
