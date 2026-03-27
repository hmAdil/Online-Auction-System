import { useEffect, useState } from "react"
import BidPanel from "../components/BidPanel"
import BidHistory from "../components/BidHistory"

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
    }

    if (message.type === "TIMER_UPDATE") {
      setAuction(prev => ({
        ...prev,
        time_left: message.time_left,
        active: message.active !== undefined ? message.active : prev.active
      }))
    }

    if (message.type === "AUCTION_ENDED") {
      setAuction(prev => ({ ...prev, active: false, time_left: 0 }))
    }
  }, [message, auctionId])

  const urgent = auction.active && auction.time_left <= 10

  return (
    <div>
      <button className="btn-back" onClick={onBack}>
        ← Back to Auctions
      </button>

      <div className="auction-page">
        {/* Left: main info + history */}
        <div className="auction-main">
          <div className="card-status" style={{ marginBottom: "12px" }}>
            <span className={`status-dot ${auction.active ? "live" : "ended"}`} />
            <span style={{ color: auction.active ? "var(--green)" : "var(--text-dim)", fontSize: "11px", letterSpacing: "0.1em" }}>
              {auction.active ? "Live Auction" : "Auction Ended"}
            </span>
          </div>

          <h1 className="auction-item-name">{auction.item}</h1>

          <div className="auction-meta">
            <div className="meta-cell">
              <div className="meta-label">Current Bid</div>
              <div className="meta-value">₹{auction.current_bid.toLocaleString()}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-label">Time Remaining</div>
              <div className={`meta-value timer ${urgent ? "urgent" : ""}`}>
                {auction.active ? formatTime(auction.time_left) : "Ended"}
              </div>
            </div>
            <div className="meta-cell">
              <div className="meta-label">Leading Bidder</div>
              <div className="meta-value plain">
                {auction.highest_bidder || "—"}
              </div>
            </div>
          </div>

          <BidHistory bids={auction.bid_history} />
        </div>

        {/* Right: bid panel */}
        <BidPanel
          sendMessage={sendMessage}
          auctionId={auctionId}
          user={user}
          disabled={!auction.active}
          currentBid={auction.current_bid}
        />
      </div>
    </div>
  )
}

export default AuctionPage
