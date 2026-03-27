import { useEffect, useState } from "react"

function ProfilePage({ sendMessage, message, user, openAuction }) {
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    sendMessage({ type: "GET_PROFILE", username: user })
  }, [user])

  useEffect(() => {
    if (!message) return
    if (message.type === "PROFILE_DATA" && message.username === user) {
      setProfileData(message)
    }
  }, [message])

  const initial = user ? user[0].toUpperCase() : "?"

  return (
    <div>
      <div className="profile-header">
        <div className="profile-avatar">{initial}</div>
        <div>
          <div className="profile-name">{user}</div>
          <div className="profile-since">Member profile</div>
        </div>
      </div>

      <h2 className="page-subtitle" style={{ marginBottom: "20px" }}>
        Auction Activity
      </h2>

      {!profileData ? (
        <div className="no-auctions">Loading…</div>
      ) : profileData.auctions.length === 0 ? (
        <div className="empty-profile">
          <p>No bids yet</p>
          <p>Head to the auctions page to place your first bid.</p>
        </div>
      ) : (
        <div className="profile-auction-list">
          {profileData.auctions.map((a) => {
            const myTopBid = Math.max(...a.bids.map(b => b.amount))
            const isWinning = a.highest_bidder === user
            return (
              <div
                className="profile-auction-card"
                key={a.auction_id}
                onClick={() => openAuction(a.auction_id)}
              >
                <div>
                  <div className="profile-card-item">{a.item}</div>
                  <div className="profile-card-meta">
                    {a.bids.length} bid{a.bids.length !== 1 ? "s" : ""} placed &nbsp;·&nbsp;
                    {a.active
                      ? isWinning
                        ? <span className="winner-tag"> Currently winning</span>
                        : " Live — you're outbid"
                      : isWinning
                        ? <span className="winner-tag"> Won</span>
                        : " Ended — outbid"
                    }
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.08em", textAlign: "right", marginBottom: "4px" }}>
                    YOUR TOP BID
                  </div>
                  <div className="profile-card-amount">
                    ₹{myTopBid.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ProfilePage
