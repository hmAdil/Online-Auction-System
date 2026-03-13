import { useEffect, useState } from "react"
import { connectSocket, sendMessage } from "../services/websocket"
import BidPanel from "../components/BidPanel"
import BidHistory from "../components/BidHistory"

function AuctionPage()
{
  const [currentBid, setCurrentBid] = useState(0)
  const [history, setHistory] = useState([])
  const [timeLeft, setTimeLeft] = useState(60)
  const [highestBidder, setHighestBidder] = useState("")
  const [auctionActive, setAuctionActive] = useState(true)

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
          setTimeLeft(data.time_left)

          setHighestBidder(data.highest_bidder)
          setAuctionActive(data.active)
        }

        if (data.type === "NEW_BID")
        {
          setCurrentBid(data.amount)
          setTimeLeft(data.time_left)

          setHighestBidder(data.user)

          setHistory(prev =>
          {
            const lastBid = prev[prev.length - 1]

            if (
              lastBid &&
              lastBid.user === data.user &&
              lastBid.amount === data.amount
            )
            {
              return prev
            }

            return [
              ...prev,
              {
                user: data.user,
                amount: data.amount
              }
            ]
          })
        }

        if (data.type === "TIMER_UPDATE")
        {
          setTimeLeft(data.time_left)
        }

        if (data.type === "AUCTION_ENDED")
        {
          setAuctionActive(false)

          alert(
            "Auction ended!\nWinner: " +
            data.winner +
            " for ₹" +
            data.amount
          )
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

      <p>Highest Bidder: {highestBidder || "None"}</p>

      <p>Time Remaining: {timeLeft}s</p>

      <p>Minimum next bid: ₹{currentBid + 1000} (₹1000 increment)</p>

      <BidPanel
        sendMessage={sendMessage}
        disabled={!auctionActive}
      />

      <BidHistory history={history} />

    </div>
  )
}

export default AuctionPage