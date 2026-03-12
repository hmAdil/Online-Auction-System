import { useState } from "react"

function BidPanel({ sendMessage })
{
  const [amount, setAmount] = useState("")

  function placeBid()
  {
    console.log("Bid button clicked")

    const message =
    {
      type: "BID",
      auction_id: 1,
      user: localStorage.getItem("auction_user"),
      amount: Number(amount)
    }

    console.log("Sending message:", message)

    sendMessage(message)
  }

  return (
    <div style={{ marginTop: "20px" }}>

      <h3>Place Bid</h3>

      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Enter bid amount"
      />

      <button onClick={placeBid}>
        Place Bid
      </button>

    </div>
  )
}

export default BidPanel