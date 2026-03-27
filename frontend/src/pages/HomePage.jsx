import { useEffect, useState } from "react"

function formatTime(s) {
  if (s <= 0) return "—"
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

function HomePage({ sendMessage, message, openAuction }) {
  const [auctions, setAuctions] = useState([])

  useEffect(() => {
    const id = setInterval(() => {
      sendMessage({ type: "GET_ALL_AUCTIONS" })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!message) return

    if (message.type === "AUCTIONS_LIST") {
      setAuctions(message.auctions)
    }

    if (message.type === "TIMER_UPDATE") {
      setAuctions(prev =>
        prev.map(a =>
          a.auction_id === message.auction_id
            ? { ...a, time_left: message.time_left, active: message.active }
            : a
        )
      )
    }

    if (message.type === "NEW_BID") {
      setAuctions(prev =>
        prev.map(a =>
          a.auction_id === message.auction_id
            ? { ...a, current_bid: message.amount, highest_bidder: message.user }
            : a
        )
      )
    }
  }, [message])

  return (
    <div>
      <h1 className="page-title">Live Auctions</h1>
      <p className="page-subtitle">
        {auctions.filter(a => a.active).length} active &nbsp;·&nbsp; {auctions.length} total
      </p>

      {auctions.length === 0 ? (
        <div className="no-auctions">No auctions available at this time.</div>
      ) : (
        <div className="auction-grid">
          {auctions.map((auction) => (
            <div className="auction-card" key={auction.auction_id}>
              <div className="card-status">
                <span className={`status-dot ${auction.active ? "live" : "ended"}`} />
                <span style={{ color: auction.active ? "var(--green)" : "var(--text-dim)", fontSize: "11px", letterSpacing: "0.1em" }}>
                  {auction.active ? "Live" : "Ended"}
                </span>
              </div>

              <div className="card-item">{auction.item}</div>

              {auction.highest_bidder && (
                <div className="card-highest">
                  Leading: <span>{auction.highest_bidder}</span>
                </div>
              )}

              <div className="card-bid-row">
                <div>
                  <div className="card-bid-label">Current Bid</div>
                  <div className="card-bid-amount">₹{auction.current_bid.toLocaleString()}</div>
                </div>
                <div>
                  <div className="card-bid-label" style={{ textAlign: "right" }}>Time Left</div>
                  <div className={`card-timer ${auction.time_left <= 10 && auction.active ? "urgent" : ""}`}>
                    {auction.active ? formatTime(auction.time_left) : "Closed"}
                  </div>
                </div>
              </div>

              <button
                className="card-view-btn"
                onClick={() => {
                  console.log("opening auction", auction.auction_id)
                  openAuction(auction.auction_id)
                }}
              >
                {auction.active ? "Place Bid →" : "View Results"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage
