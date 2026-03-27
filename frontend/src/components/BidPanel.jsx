import { useState } from "react"

function BidPanel({ sendMessage, auctionId, user, disabled, currentBid }) {
  const [amount, setAmount] = useState("")

  const minBid = (currentBid || 0) + 1000

  function placeBid() {
    const raw = String(amount).trim()

    if (!raw) {
      alert(`Enter a bid amount (minimum ₹${minBid.toLocaleString()})`)
      return
    }

    const value = Number(raw)

    if (!Number.isFinite(value) || Math.floor(value) !== value) {
      alert("Bids must be whole numbers")
      return
    }

    if (value < minBid) {
      alert(`Minimum bid is ₹${minBid.toLocaleString()}`)
      return
    }

    sendMessage({
      type: "BID",
      auction_id: auctionId,
      user,
      amount: Math.floor(value)
    })

    setAmount("")
  }

  function handleKey(e) {
    if (e.key === "Enter") placeBid()
  }

  return (
    <div className="bid-panel">
      <div className="bid-panel-title">Place a Bid</div>

      <div className="bid-input-wrap">
        <span className="bid-currency">₹</span>
        <input
          className="bid-input"
          type="number"
          step="1000"
          min={minBid}
          placeholder={minBid.toLocaleString()}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKey}
          disabled={disabled}
        />
      </div>

      <p className="bid-hint">
        Minimum next bid: <strong>₹{minBid.toLocaleString()}</strong>
      </p>

      <button className="btn-bid" onClick={placeBid} disabled={disabled}>
        {disabled ? "Auction Ended" : "Confirm Bid"}
      </button>

      {disabled && (
        <div className="auction-ended-badge">
          ■ &nbsp;This auction has closed
        </div>
      )}
    </div>
  )
}

export default BidPanel
