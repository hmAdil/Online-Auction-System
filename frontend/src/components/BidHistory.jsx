function BidHistory({ bids }) {
  const reversed = [...(bids || [])].reverse()

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
      <div className="bid-history-title">
        Bid History &nbsp;·&nbsp; {reversed.length} bid{reversed.length !== 1 ? "s" : ""}
      </div>

      <div className="bid-list">
        {reversed.map((bid, index) => (
          <div className="bid-row" key={index}>
            <span className="bid-row-user">
              {index === 0 && "👑 "}
              {bid.user}
            </span>
            <span className="bid-row-amount">
              ₹{bid.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BidHistory
