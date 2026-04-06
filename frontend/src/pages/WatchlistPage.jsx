import { useEffect, useState } from "react"
import WatchButton from "../components/WatchButton"
import "./WatchlistPage.css"

function formatTime(s) {
  if (s <= 0) return "—"
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function WatchlistPage({ sendMessage, message, openAuction }) {
  const [auctions, setAuctions] = useState([])
  const [watchlist, setWatchlist] = useState([])

  useEffect(() => {
    // Load watchlist from localStorage
    const saved = JSON.parse(localStorage.getItem("watchlist") || "[]")
    setWatchlist(saved)

    // Fetch auctions
    sendMessage({ type: "GET_ALL_AUCTIONS" })
  }, [])

  useEffect(() => {
    if (!message || message.type !== "AUCTIONS_LIST") return

    const savedWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]")
    const watchedAuctions = message.auctions.filter(a => savedWatchlist.includes(a.auction_id))
    setAuctions(watchedAuctions)
  }, [message])

  const removeFromWatchlist = (auctionId) => {
    const updated = watchlist.filter(id => id !== auctionId)
    localStorage.setItem("watchlist", JSON.stringify(updated))
    setWatchlist(updated)
    setAuctions(prev => prev.filter(a => a.auction_id !== auctionId))
  }

  return (
    <div>
      <h1 className="page-title">Watchlist</h1>
      <p className="page-subtitle">
        {auctions.length} watched auction{auctions.length !== 1 ? "s" : ""}
      </p>

      {auctions.length === 0 ? (
        <div className="empty-watchlist glass-panel">
          <div className="empty-icon-luxe">♡</div>
          <h3 className="empty-title-luxe">Your Curated Watchlist is Empty</h3>
          <p className="empty-sub-luxe">Follow active markets to track high-value assets here.</p>
          <button
            className="btn-primary-luxe"
            style={{marginTop: "2rem"}}
            onClick={() => openAuction(null)}
          >
            Explore Markets
          </button>
        </div>
      ) : (
        <div className="watchlist-grid-luxe">
          {auctions.map((auction) => (
            <div
              className="watchlist-row glass-card"
              key={auction.auction_id}
              onClick={() => openAuction(auction.auction_id)}
            >
              <div className="watchlist-row-main">
                <div className={`status-tag-luxe ${auction.active ? 'winning' : 'lost'}`} style={{marginBottom: "0.5rem"}}>
                  {auction.active ? "LIVE MARKET" : "CLOSED"}
                </div>
                <h3 className="watchlist-item-name-luxe">{auction.item}</h3>
              </div>

              <div className="watchlist-row-stats">
                <div className="stat-unit">
                   <span className="stat-lux-label">Current Bid</span>
                   <span className="stat-value gold">₹{auction.current_bid.toLocaleString()}</span>
                </div>
                <div className="stat-unit">
                   <span className="stat-lux-label">Time Remaining</span>
                   <span className={`stat-value ${auction.time_left <= 300 && auction.active ? "critical-text" : ""}`}>
                      {auction.active ? formatTime(auction.time_left) : "Ended"}
                   </span>
                </div>
              </div>

              <div className="watchlist-actions">
                <button
                  className="btn-remove-watch-luxe"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeFromWatchlist(auction.auction_id)
                  }}
                >
                  REMOVE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default WatchlistPage
