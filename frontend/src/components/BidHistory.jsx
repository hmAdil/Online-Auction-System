import { useMemo } from "react"
import "./BidHistory.css"

function BidHistory({ bids, currentUser }) {
  const reversed = [...(bids || [])].reverse()

  const stats = useMemo(() => {
    if (!bids || bids.length === 0) return null
    const amounts = bids.map(b => b.amount)
    return {
      total: bids.length,
      highest: Math.max(...amounts),
      lowest: Math.min(...amounts),
      average: Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length),
      uniqueBidders: new Set(bids.map(b => b.user)).size
    }
  }, [bids])

  // Group bids by time for timeline visualization
  const timelineData = useMemo(() => {
    if (!bids || bids.length < 2) return null
    const times = bids.map((b, i) => ({
      amount: b.amount,
      user: b.user,
      index: i
    }))
    return times
  }, [bids])

  if (reversed.length === 0) {
    return (
      <div className="bid-history">
        <div className="bid-history-title">Bid History</div>
        <div className="bid-empty">No bids placed yet — be the first.</div>
      </div>
    )
  }

  return (
    <div className="bid-history">
      <div className="bid-history-header">
        <span className="bid-history-title">
          Bid History &nbsp;·&nbsp; {reversed.length} bid{reversed.length !== 1 ? "s" : ""}
        </span>
        {stats && (
          <div className="bid-stats">
            <span className="bid-stat">
              <strong>{stats.uniqueBidders}</strong> bidder{stats.uniqueBidders !== 1 ? "s" : ""}
            </span>
            <span className="bid-stat-divider">|</span>
            <span className="bid-stat">
              Avg: <strong>₹{stats.average?.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Timeline visualization */}
      {timelineData && timelineData.length >= 2 && (
        <div className="bid-timeline">
          <div className="timeline-labels">
            <span>First bid</span>
            <span>Latest</span>
          </div>
          <div className="timeline-chart">
            {timelineData.map((bid, i) => {
              const height = 20 + ((bid.amount - (stats?.lowest || 0)) / ((stats?.highest || 1) - (stats?.lowest || 1))) * 60
              const isHighest = bid.amount === stats?.highest
              const isUserBid = currentUser && bid.user === currentUser
              return (
                <div
                  key={i}
                  className={`timeline-bar ${isHighest ? 'highest' : ''} ${isUserBid ? 'user-bid' : ''}`}
                  style={{ height: `${height}%` }}
                  title={`₹${bid.amount.toLocaleString()} by ${bid.user}`}
                >
                  <span className="bar-amount">₹{(bid.amount / 1000).toFixed(0)}k</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bid list */}
      <div className="bid-list">
        {reversed.map((bid, index) => {
          const isLeading = index === reversed.length - 1
          const isUserBid = currentUser && bid.user === currentUser
          return (
            <div
              className={`bid-row ${isLeading ? 'leading' : ''} ${isUserBid ? 'user-bid' : ''}`}
              key={index}
            >
              <span className="bid-row-user">
                {isLeading && <span className="leading-icon">👑</span>}
                {bid.user}
                {isUserBid && <span className="you-badge">(you)</span>}
              </span>
              <span className={`bid-row-amount ${isLeading ? 'leading' : ''}`}>
                ₹{bid.amount.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BidHistory
