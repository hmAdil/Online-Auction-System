import { useEffect, useState, useMemo } from "react"
import { SkeletonList } from "../components/Skeleton"
import SearchBar from "../components/SearchBar"
import WatchButton from "../components/WatchButton"
import "./HomePage.css"

function formatTime(s) {
  if (s <= 0) return "—"
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m > 0) return `${m}m ${sec}s`
  return `${sec}s`
}

const CATEGORIES = [
  { id: "all", label: "All", icon: "◫" },
  { id: "electronics", label: "Electronics", icon: "⚡" },
  { id: "collectibles", label: "Collectibles", icon: "★" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "fashion", label: "Fashion", icon: "♦" },
  { id: "sports", label: "Sports", icon: "⚽" },
  { id: "other", label: "Other", icon: "○" },
]

const TIME_FILTERS = [
  { id: "all", label: "Any Time" },
  { id: "urgent", label: "< 5 min" },
  { id: "short", label: "< 30 min" },
  { id: "medium", label: "< 2 hours" },
  { id: "long", label: "> 2 hours" },
]

function HomePage({ sendMessage, message, openAuction }) {
  const [auctions, setAuctions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const [sortBy, setSortBy] = useState("ending") // ending, price, bids
  const [displayLimit, setDisplayLimit] = useState(24) // Pagination limit


  useEffect(() => {
    sendMessage({ type: "GET_ALL_AUCTIONS" })
    const id = setInterval(() => {
      sendMessage({ type: "GET_ALL_AUCTIONS" })
    }, 1000)
    return () => {
      clearInterval(id)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!message) return

    if (message.type === "AUCTIONS_LIST") {
      setAuctions(message.auctions)
      setLoading(false)
    }

    if (message.type === "TIMER_UPDATE") {
      setAuctions(prev =>
        prev.map(a =>
          a.auction_id === message.auction_id
            ? { ...a, time_left: message.time_left, active: message.active }
            : a
        )
      )
    }

    if (message.type === "BULK_TIMER_UPDATE") {
      setAuctions(prev => {
        const updateMap = new Map(message.updates.map(u => [u.auction_id, u]))
        return prev.map(a => {
          const up = updateMap.get(a.auction_id)
          return up ? { ...a, time_left: up.time_left, active: up.active } : a
        })
      })
    }

    if (message.type === "AUCTION_DELETED") {
      setAuctions(prev => prev.filter(a => a.auction_id !== message.auction_id))
    }

    if (message.type === "NEW_BID") {
      setAuctions(prev =>
        prev.map(a =>
          a.auction_id === message.auction_id
            ? { ...a, current_bid: message.amount, highest_bidder: message.user }
            : a
        )
      )
    }
  }, [message])

  const filteredAuctions = useMemo(() => {
    let result = [...auctions]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(a =>
        a.item.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(a => a.category === selectedCategory)
    }

    // Time filter
    if (timeFilter !== "all") {
      result = result.filter(a => {
        if (!a.active) return false
        switch (timeFilter) {
          case "urgent": return a.time_left <= 300
          case "short": return a.time_left <= 1800
          case "medium": return a.time_left <= 7200
          case "long": return a.time_left > 7200
          default: return true
        }
      })
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "ending": return a.time_left - b.time_left
        case "price": return b.current_bid - a.current_bid
        case "bids": return (b.bid_history?.length || 0) - (a.bid_history?.length || 0)
        default: return 0
      }
    })

    return result
  }, [auctions, searchQuery, selectedCategory, timeFilter, sortBy])

  const getUrgencyClass = (timeLeft, active) => {
    if (!active) return "ended"
    if (timeLeft <= 60) return "critical"
    if (timeLeft <= 300) return "urgent"
    if (timeLeft <= 1800) return "warning"
    return "normal"
  }

  if (loading) {
    return (
      <div>
        <h1 className="page-title">Live Auctions</h1>
        <p className="page-subtitle">Loading auctions...</p>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          timeFilter={timeFilter}
          setTimeFilter={setTimeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <div className="auction-grid">
          <SkeletonList count={6} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="page-subtitle">
        {filteredAuctions.filter(a => a.active).length} active &nbsp;·&nbsp; {filteredAuctions.length} total
      </p>


      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {filteredAuctions.length === 0 ? (
        <div className="no-auctions">
          <div className="empty-state-icon">📦</div>
          <p>No auctions match your filters</p>
          <button
            className="btn-clear-filters"
            onClick={() => {
              setSearchQuery("")
              setSelectedCategory("all")
              setTimeFilter("all")
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="auction-grid">
          {filteredAuctions.slice(0, displayLimit).map((auction) => {
            const urgency = getUrgencyClass(auction.time_left, auction.active)
            const initialWatched = JSON.parse(localStorage.getItem("watchlist") || "[]").includes(auction.auction_id)

            return (
              <div
                className={`auction-card glass-card ${urgency}`}
                key={auction.auction_id}
                onClick={() => openAuction(auction.auction_id)}
              >
                <div className="card-status-row">
                  <div className={`status-pill ${urgency}`}>
                    <span className={`status-dot ${auction.active ? "live" : "ended"}`} />
                    {auction.active ? "Live" : "Closed"}
                  </div>
                  <WatchButton auctionId={auction.auction_id} initialWatched={initialWatched} />
                </div>

                <div className="card-body">
                  {auction.category && (
                    <span className="card-category">
                      {CATEGORIES.find(c => c.id === auction.category)?.icon} {auction.category}
                    </span>
                  )}
                  <h3 className="card-item-title">{auction.item}</h3>
                  {auction.description && (
                    <p className="card-item-desc">{auction.description}</p>
                  )}
                </div>

                <div className="card-stats-grid">
                  <div className="stat-box">
                    <span className="stat-label">Current Bid</span>
                    <span className="stat-value gold">₹{auction.current_bid.toLocaleString()}</span>
                  </div>
                  <div className="stat-box align-right">
                    <span className="stat-label">Time Remaining</span>
                    <span className={`stat-value ${urgency === 'critical' ? 'pulse-text' : ''}`}>
                      {auction.active ? formatTime(auction.time_left) : "Ended"}
                    </span>
                  </div>
                </div>

                <div className="card-footer">
                   <div className="bid-count">
                      <span className="icon">◈</span> {auction.bid_history?.length || 0} Bids
                   </div>
                   <div className="view-link">View Details →</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredAuctions.length > displayLimit && (
        <div className="list-pagination">
          <button 
            className="btn-show-more" 
            onClick={() => setDisplayLimit(prev => prev + 24)}
          >
            Show More Auctions
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage
