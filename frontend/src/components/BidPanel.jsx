import { useState } from "react"

function BidPanel({ sendMessage, disabled })
{
  const [amount, setAmount] = useState("")

  function placeBid()
  {
    const value = Number(amount)

    if (!Number.isInteger(value))
    {
      alert("Bids must be whole numbers")
      return
    }

    if (value <= 0)
    {
      alert("Invalid bid amount")
      return
    }

    sendMessage({
      type: "BID",
      auction_id: 1,
      user: sessionStorage.getItem("auction_user"),
      amount: value
    })

    setAmount("")
  }

  return (
    <div style={{ marginTop: "20px" }}>

      <h3>Place Bid</h3>

      <input
        type="number"
        step="1"
        placeholder="Enter bid amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={disabled}
      />

      <button
        onClick={placeBid}
        disabled={disabled}
      >
        Place Bid
      </button>

      {disabled && (
        <p style={{ color: "red" }}>
          Auction has ended
        </p>
      )}

    </div>
  )
}

export default BidPanel