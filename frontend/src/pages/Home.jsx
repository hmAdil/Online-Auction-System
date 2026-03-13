import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { connectSocket, sendMessage } from "../services/websocket"

function Home({ onLogout })
{
  const navigate = useNavigate()

  const [currentBid, setCurrentBid] = useState(0)

  function openAuction()
  {
    navigate("/auction")
  }

  useEffect(() =>
  {
    connectSocket(

      (data) =>
      {
        if (data.type === "AUCTION_STATE")
        {
          setCurrentBid(data.current_bid)
        }

        if (data.type === "NEW_BID")
        {
          setCurrentBid(data.amount)
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

      <h2>Active Auctions</h2>

      <button onClick={onLogout}>
        Logout
      </button>

      <div style={{ border: "1px solid gray", padding: "10px", marginTop: "20px" }}>

        <h3>Gaming Laptop</h3>

        <p>Current Bid: ₹{currentBid}</p>

        <button onClick={openAuction}>
          View Auction
        </button>

      </div>

    </div>
  )
}

export default Home