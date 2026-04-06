import { useEffect, useState } from "react"
import MetricsDashboard from "./MetricsDashboard"
import "./AdminPage.css"

function AdminPage({ sendMessage, message, user }) {
  const [requests, setRequests] = useState([])
  const [auctions, setAuctions] = useState([])
  const [tab, setTab] = useState("metrics") // "metrics" | "requests" | "auctions"
  const [reqLimit, setReqLimit] = useState(20)
  const [aucLimit, setAucLimit] = useState(20)

  function fetchRequests() {
    sendMessage({ type: "GET_REQUESTS", username: user })
  }

  function fetchAuctions() {
    sendMessage({ type: "GET_ALL_AUCTIONS" })
  }

  useEffect(() => {
    if (tab === "requests") fetchRequests()
    if (tab === "auctions") fetchAuctions()
  }, [tab])

  useEffect(() => {
    if (!message) return

    if (message.type === "REQUESTS_LIST") {
      setRequests(message.requests)
    }
    if (message.type === "AUCTIONS_LIST") {
      setAuctions(message.auctions)
    }
    if (message.type === "REQUEST_APPROVED") {
      setRequests(prev => prev.filter(r => r.request_id !== message.request_id))
      fetchAuctions()
    }
    if (message.type === "REQUEST_REJECTED") {
      setRequests(prev => prev.filter(r => r.request_id !== message.request_id))
    }
    if (message.type === "NEW_REQUEST_PENDING") {
      fetchRequests()
    }
    if (message.type === "AUCTION_DELETED") {
      setAuctions(prev => prev.filter(a => a.auction_id !== message.auction_id))
    }
  }, [message])

  function approve(request_id) {
    sendMessage({ type: "APPROVE_REQUEST", username: user, request_id })
  }

  function reject(request_id) {
    sendMessage({ type: "REJECT_REQUEST", username: user, request_id })
  }

  function deleteAuction(auction_id, item) {
    if (!confirm(`Delete "${item}"? This cannot be undone.`)) return
    sendMessage({ type: "DELETE_AUCTION", username: user, auction_id })
  }

  function approveAll() {
    if (requests.length === 0) return;
    if (!confirm(`Are you sure you want to approve all ${requests.length} pending requests?`)) return;
    const ids = requests.map(r => r.request_id);
    sendMessage({ type: "BULK_APPROVE", username: user, request_ids: ids });
  }

  function rejectAll() {
    if (requests.length === 0) return;
    if (!confirm(`Are you sure you want to REJECT all ${requests.length} pending requests?`)) return;
    const ids = requests.map(r => r.request_id);
    sendMessage({ type: "BULK_REJECT", username: user, request_ids: ids });
  }

  function deleteAll() {
    if (auctions.length === 0) return;
    if (!confirm(`Are you sure you want to DELETE ALL ${auctions.length} auctions?`)) return;
    const ids = auctions.map(a => a.auction_id);
    sendMessage({ type: "BULK_DELETE", username: user, auction_ids: ids });
  }

  function formatDuration(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h ${m > 0 ? m + "m" : ""}`
    return `${m}m`
  }

  function formatTime(s) {
    if (s <= 0) return "Ended"
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${sec}s`
    return `${sec}s`
  }

  return (
    <div>
      <h1 className="page-title">Admin Panel</h1>

      <div className="admin-tabs glass-panel">
        <button
          className={`admin-tab ${tab === "metrics" ? "active" : ""}`}
          onClick={() => setTab("metrics")}
        >
          <span className="tab-icon">📊</span> Metrics
        </button>
        <button
          className={`admin-tab ${tab === "requests" ? "active" : ""}`}
          onClick={() => setTab("requests")}
        >
          <span className="tab-icon">📬</span> Requests
          {requests.length > 0 && (
            <span className="admin-tab-badge pulse">{requests.length}</span>
          )}
        </button>
        <button
          className={`admin-tab ${tab === "auctions" ? "active" : ""}`}
          onClick={() => setTab("auctions")}
        >
          <span className="tab-icon">🔨</span> Inventory
          <span className="admin-tab-badge secondary">
            {auctions.length}
          </span>
        </button>
      </div>

      {/* ── METRICS TAB ── */}
      {tab === "metrics" && (
        <MetricsDashboard sendMessage={sendMessage} message={message} />
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === "requests" && (
        <>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px"}}>
            <p className="page-subtitle" style={{margin: 0}}>
              {requests.length} pending request{requests.length !== 1 ? "s" : ""}
            </p>
            {requests.length > 0 && (
              <div style={{display: "flex", gap: "10px"}}>
                <button 
                  className="btn-reject" 
                  onClick={rejectAll}
                  style={{padding: "6px 14px", fontSize: "14px"}}
                >
                  Reject All
                </button>
                <button 
                  className="btn-approve" 
                  onClick={approveAll}
                  style={{padding: "6px 14px", fontSize: "14px"}}
                >
                  Approve All
                </button>
              </div>
            )}
          </div>

          {requests.length === 0 ? (
            <div className="empty-profile glass-card">
              <p>All clear</p>
              <p className="text-dim">No pending auction requests right now.</p>
            </div>
          ) : (
            <>
              <div className="admin-request-list">
                {requests.slice(0, reqLimit).map(req => (
                  <div className="admin-request-card glass-card" key={req.request_id}>
                    <div className="admin-request-header">
                      <div>
                        <div className="admin-request-item">{req.item}</div>
                        <div className="admin-request-meta">
                          By <span>{req.username}</span> · {new Date(req.submitted_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="admin-request-bid gold">
                        ₹{req.starting_bid.toLocaleString()}
                        <div style={{fontSize:"10px", color:"var(--text-dim)", textAlign:"right", textTransform:"uppercase"}}>base bid</div>
                      </div>
                    </div>

                    {req.description && (
                      <p className="admin-request-desc">{req.description}</p>
                    )}

                    <div className="admin-request-footer">
                      <div className="admin-req-tags">
                        <span className="req-tag">🕒 {formatDuration(req.duration)}</span>
                        {req.category && <span className="req-tag">📁 {req.category}</span>}
                      </div>
                      <div className="admin-request-actions">
                        <button className="btn-reject-small" onClick={() => reject(req.request_id)}>
                          Reject
                        </button>
                        <button className="btn-approve-small" onClick={() => approve(req.request_id)}>
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {requests.length > reqLimit && (
                <div style={{textAlign:"center", marginTop:"2rem"}}>
                  <button className="btn-secondary" onClick={() => setReqLimit(prev => prev + 20)}>
                    Show More Requests
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── AUCTIONS TAB ── */}
      {tab === "auctions" && (
        <>
          <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px"}}>
            <p className="page-subtitle" style={{margin: 0}}>
              {auctions.length} total auction{auctions.length !== 1 ? "s" : ""}
            </p>
            {auctions.length > 0 && (
              <button 
                className="btn-delete" 
                onClick={deleteAll}
                style={{padding: "6px 14px", fontSize: "14px"}}
              >
                Delete All
              </button>
            )}
          </div>

          {auctions.length === 0 ? (
            <div className="empty-profile glass-card">
              <p>No auctions</p>
              <p className="text-dim">Approve a request to create one.</p>
            </div>
          ) : (
            <>
              <div className="admin-auction-list">
                {auctions.slice(0, aucLimit).map(a => (
                  <div className="admin-auction-row glass-card" key={a.auction_id}>
                    <div className="admin-auction-info">
                      <div className="admin-auction-name">{a.item}</div>
                      <div className="admin-auction-meta">
                        <span className={`status-dot ${a.active ? "live" : "ended"}`} />
                        {a.active ? "Live" : "Ended"} &nbsp;·&nbsp;
                        {a.active ? formatTime(a.time_left) + " left" : "closed"} &nbsp;·&nbsp;
                        {a.bid_history?.length || 0} bids
                        {a.highest_bidder && <> &nbsp;·&nbsp; Leading: <span className="gold">{a.highest_bidder}</span></>}
                      </div>
                    </div>
                    <div style={{display:"flex", alignItems:"center", gap:"2rem"}}>
                      <div style={{textAlign:"right"}}>
                        <div className="gold" style={{fontFamily:"var(--font-display)", fontSize:"20px", fontWeight:"700"}}>
                          ₹{a.current_bid.toLocaleString()}
                        </div>
                        <div style={{fontSize:"10px", color:"var(--text-dim)", textTransform:"uppercase", letterSpacing:"0.05em"}}>current</div>
                      </div>
                      <button className="btn-delete-icon" onClick={() => deleteAuction(a.auction_id, a.item)}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {auctions.length > aucLimit && (
                <div style={{textAlign:"center", marginTop:"2rem"}}>
                  <button className="btn-secondary" onClick={() => setAucLimit(prev => prev + 20)}>
                    Show More Inventory
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

export default AdminPage
