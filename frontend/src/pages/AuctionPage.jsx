import { useEffect, useState } from "react"
import { connectSocket, sendMessage } from "../services/websocket"
import BidPanel from "../components/BidPanel"
import BidHistory from "../components/BidHistory"

function AuctionPage()
{
  const [currentBid, setCurrentBid] = useState(0)
  const [history, setHistory] = useState([])

  useEffect(() =>
  {
    connectSocket(

      (data) =>
      {
        console.log("Received:", data)

        if (data.type === "AUCTION_STATE")
        {
          setCurrentBid(data.current_bid)
          setHistory(data.bid_history)
        }

        if (data.type === "NEW_BID")
        {
          setCurrentBid(data.amount)

          setHistory(prev => [
            ...prev,
            { user: data.user, amount: data.amount }
          ])
        }
      },

      () =>
      {
        sendMessage({
          type: "GET_AUCTION",
          auction_id: 1
        })
      }

    )

  }, [])

  return (
    <div style={{ padding: "20px" }}>

      <h2>Gaming Laptop</h2>

      <p>Current Bid: ₹{currentBid}</p>

      <BidPanel sendMessage={sendMessage} />

      <BidHistory history={history} />

    </div>
  )
}

export default AuctionPage