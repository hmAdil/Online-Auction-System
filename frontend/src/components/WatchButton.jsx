import { useState } from "react"
import "./WatchButton.css"

export default function WatchButton({ auctionId, initialWatched = false }) {
  const [watched, setWatched] = useState(initialWatched)
  const [count, setCount] = useState(0)

  const toggleWatch = (e) => {
    e.stopPropagation()
    const newWatched = !watched
    setWatched(newWatched)

    // Store in localStorage for persistence
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]")
    if (newWatched) {
      if (!watchlist.includes(auctionId)) {
        watchlist.push(auctionId)
      }
    } else {
      const index = watchlist.indexOf(auctionId)
      if (index > -1) {
        watchlist.splice(index, 1)
      }
    }
    localStorage.setItem("watchlist", JSON.stringify(watchlist))
  }

  return (
    <button
      className={`watch-button ${watched ? "watching" : ""}`}
      onClick={toggleWatch}
      title={watched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <span className="watch-icon">{watched ? "❤" : "♡"}</span>
      {count > 0 && <span className="watch-count">{count}</span>}
    </button>
  )
}
