function BidHistory({ history })
{
  return (
    <div style={{ marginTop: "20px" }}>

      <h3>Bid History</h3>

      <ul>

        {history.length === 0 && <li>No bids yet</li>}

        {history.map((bid, index) => (
          <li key={index}>
            {bid.user} — ₹{bid.amount}
          </li>
        ))}

      </ul>

    </div>
  )
}

export default BidHistory