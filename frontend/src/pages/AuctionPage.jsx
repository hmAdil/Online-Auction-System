import { useEffect, useState } from "react"
import BidPanel from "../components/BidPanel"
import BidHistory from "../components/BidHistory"
import WatchButton from "../components/WatchButton"
import "./AuctionPage.css"

function formatTime(s) {
  if (s <= 0) return "0s"
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec.toString().padStart(2, "0")}s`
  return `${sec}s`
}

function AuctionPage({ sendMessage, user, message, auctionId, onBack }) {
  const [auction, setAuction] = useState({
    auction_id: auctionId,
    item: "Loading…",
    current_bid: 0,
    starting_bid: 0,
    highest_bidder: null,
    bid_history: [],
    time_left: 0,
    active: true
  })
  const [prevLeader, setPrevLeader] = useState(null)
  const [showOutbidToast, setShowOutbidToast] = useState(false)

  useEffect(() => {
    sendMessage({ type: "GET_AUCTION", auction_id: auctionId })

    const id = setInterval(() => {
      sendMessage({ type: "GET_AUCTION", auction_id: auctionId })
    }, 2000)

    return () => clearInterval(id)
  }, [auctionId])

  useEffect(() => {
    if (!message) return
    if (message.auction_id !== auctionId) return

    if (message.type === "AUCTION_STATE") {
      setAuction(message)
      if (message.highest_bidder !== prevLeader && message.highest_bidder !== user && prevLeader === user) {
        // User was outbid
        setShowOutbidToast(true)
        setTimeout(() => setShowOutbidToast(false), 4000)
      }
      setPrevLeader(message.highest_bidder)
    }

    if (message.type === "NEW_BID") {
      setAuction(prev => ({
        ...prev,
        current_bid: message.amount,
        highest_bidder: message.user,
        bid_history: [
          ...prev.bid_history,
          { user: message.user, amount: message.amount }
        ]
      }))

      if (message.user !== user && prevLeader === user) {
        setShowOutbidToast(true)
        setTimeout(() => setShowOutbidToast(false), 4000)
      }
      setPrevLeader(message.user)
    }

    if (message.type === "TIMER_UPDATE") {
      setAuction(prev => ({
        ...prev,
        time_left: message.time_left,
        active: message.active !== undefined ? message.active : prev.active
      }))
    }

    if (message.type === "BULK_TIMER_UPDATE") {
      const update = message.updates.find(u => u.auction_id === auctionId)
      if (update) {
        setAuction(prev => ({
          ...prev,
          time_left: update.time_left,
          active: update.active !== undefined ? update.active : prev.active
        }))
      }
    }

    if (message.type === "AUCTION_ENDED") {
      setAuction(prev => ({ ...prev, active: false, time_left: 0 }))
    }
  }, [message, auctionId, user])

  const urgent = auction.active && auction.time_left <= 10
  const isWinning = auction.highest_bidder === user
  const auctionEnded = !auction.active

  return (
    <div>
      <button className="btn-back-luxe" onClick={onBack}>
        <span className="arrow">←</span> Back to Market
      </button>

      <div className="auction-page-layout">
        {/* Left: main info + history */}
        <div className="auction-main-content glass-panel">
          <div className="auction-status-bar">
            <div className={`status-pill ${auction.active ? 'live' : 'ended'}`}>
              <span className={`status-dot ${auction.active ? "live" : "ended"}`} />
              {auction.active ? "Live Auction" : "Auction Ended"}
            </div>
            {isWinning && auction.active && (
              <div className="winning-badge pulse-glow">
                🏆 Top Bidder
              </div>
            )}
            {!auction.active && isWinning && (
              <div className="won-badge shine">
                🎉 Auction Won
              </div>
            )}
          </div>

          <div className="auction-header-row">
            <div>
              <h1 className="item-display-title">{auction.item}</h1>
              {auction.category && (
                <span className="card-category" style={{marginTop: "0.5rem"}}>
                   {auction.category}
                </span>
              )}
            </div>
            <WatchButton 
              auctionId={auctionId} 
              initialWatched={JSON.parse(localStorage.getItem("watchlist") || "[]").includes(auctionId)} 
            />
          </div>

          <div className="auction-stats-lux">
            <div className="stat-lux-box">
              <span className="stat-lux-label">Current Valuation</span>
              <span className="stat-lux-value gold">₹{auction.current_bid.toLocaleString()}</span>
            </div>
            <div className="stat-lux-box">
              <span className="stat-lux-label">Time Remaining</span>
              <span className={`stat-lux-value ${urgent ? "critical-text" : ""}`}>
                {auction.active ? formatTime(auction.time_left) : "Closed"}
              </span>
            </div>
            <div className="stat-lux-box">
              <span className="stat-lux-label">Leading Bidder</span>
              <span className="stat-lux-value plain">
                {auction.highest_bidder || "None"}
              </span>
            </div>
          </div>

          <div className="auction-history-section">
             <BidHistory bids={auction.bid_history} currentUser={user} />
          </div>
        </div>

        {/* Right: bid panel */}
        <div className="auction-sidebar">
          <BidPanel
            sendMessage={sendMessage}
            auctionId={auctionId}
            user={user}
            disabled={!auction.active}
            currentBid={auction.current_bid}
          />
        </div>
      </div>

      {/* Outbid notification */}
      {showOutbidToast && (
        <div className="outbid-toast glass-panel">
          <span className="outbid-icon">⚡</span>
          <div className="outbid-content">
            <strong>Outbid!</strong>
            <p>A higher bid was placed on {auction.item}</p>
          </div>
          <button
            className="btn-quick-bid-back"
            onClick={() => {
              const minBid = auction.current_bid + 1000
              sendMessage({
                type: "BID",
                auction_id: auctionId,
                user,
                amount: minBid
              })
              setShowOutbidToast(false)
            }}
          >
            Bid Back
          </button>
        </div>
      )}
    </div>
  )
}

export default AuctionPage
