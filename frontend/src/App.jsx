import { useEffect, useState, useCallback, useRef } from "react"
import LoginPage from "./pages/LoginPage"
import AuctionPage from "./pages/AuctionPage"
import HomePage from "./pages/HomePage"
import ProfilePage from "./pages/ProfilePage"
import RequestPage from "./pages/RequestPage"
import AdminPage from "./pages/AdminPage"
import WatchlistPage from "./pages/WatchlistPage"
import Navbar from "./components/Navbar"
import Toast from "./components/Toast"
import ConnectionStatus from "./components/ConnectionStatus"
import SkipLink from "./components/SkipLink"
import "./App.css"

function App() {
  const [socket, setSocket]           = useState(null)
  const [socketReady, setSocketReady] = useState(false)
  const [user, setUser]               = useState(null)
  const [isAdmin, setIsAdmin]         = useState(false)
  const [message, setMessage]         = useState(null)
  const [page, setPage]               = useState("home")
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [toasts, setToasts]           = useState([])
  const hasConnectionError = useRef(false)
  const reconnectAttempted = useRef(false)

  const showToast = useCallback((text, type = "info") => {
    const id = Date.now() + Math.random()
    setToasts(prev => {
      // Prevent duplicate toasts with the same text and type
      if (prev.some(t => t.type === type && t.text === text)) {
        return prev
      }
      return [...prev, { id, text, type }]
    })
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000`)

    ws.onopen = () => {
      console.log("Connected to bridge")
      setSocketReady(true)
      hasConnectionError.current = false
      reconnectAttempted.current = false
    }

    ws.onerror = () => {
      // onerror fires before onclose — show the toast here only
      if (!hasConnectionError.current && !reconnectAttempted.current) {
        hasConnectionError.current = true
        reconnectAttempted.current = true
        showToast("Connection error", "error")
      }
    }

    ws.onclose = () => {
      setSocketReady(false)
      // Only show "connection lost" if we had a clean connection before (not an initial failure)
      if (!hasConnectionError.current && reconnectAttempted.current === false) {
        hasConnectionError.current = true
        showToast("Connection lost — refresh to reconnect", "error")
      }
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "LOGIN_SUCCESS") {
        setUser(msg.username)
        setIsAdmin(msg.is_admin === true)
        hasConnectionError.current = false
        showToast(`Welcome back, ${msg.username}!`, "success")
      }
      if (msg.type === "LOGIN_FAILED")     showToast("Invalid credentials", "error")
      if (msg.type === "REGISTER_SUCCESS") showToast("Account created! Now log in.", "success")
      if (msg.type === "REGISTER_FAILED")  showToast("Username already taken", "error")
      if (msg.type === "BID_FAILED")       showToast(msg.reason, "error")
      if (msg.type === "REQUEST_SUBMITTED") showToast("Auction request submitted!", "success")
      if (msg.type === "NEW_REQUEST_PENDING" && isAdmin) showToast("New auction request pending review", "info")
      if (msg.type === "AUCTIONS_UPDATED") showToast("A new auction just went live!", "success")
      if (msg.type === "NEW_BID" && msg.user === user) showToast(`Bid of Rs.${msg.amount.toLocaleString()} placed!`, "success")

      setMessage(msg)
    }

    setSocket(ws)
    return () => {
      // Null out all handlers before closing so the discarded socket
      // cannot fire onerror/onclose toasts after the effect re-runs (StrictMode)
      ws.onopen    = null
      ws.onerror   = null
      ws.onclose   = null
      ws.onmessage = null
      ws.close()
    }
  }, [])

  const sendMessage = useCallback((data) => {
    if (!socketReady || !socket) return
    socket.send(JSON.stringify(data))
  }, [socket, socketReady])

  const logout = () => {
    setUser(null)
    setIsAdmin(false)
    setPage("home")
    setSelectedAuction(null)
  }

  const openAuction = (id) => {
    setSelectedAuction(id)
    setPage("auction")
  }

  if (!user) {
    return (
      <>
        <LoginPage sendMessage={sendMessage} />
        <div className="toast-container">
          {toasts.map(toast => (
            <Toast key={toast.id} toast={toast} onDone={removeToast} />
          ))}
        </div>
      </>
    )
  }

  return (
    <div className="app">
      <SkipLink />
      <Navbar
        user={user}
        isAdmin={isAdmin}
        onLogout={logout}
        onHome={() => setPage("home")}
        onProfile={() => setPage("profile")}
        onRequest={() => setPage("request")}
        onAdmin={() => setPage("admin")}
        onWatchlist={() => setPage("watchlist")}
        page={page}
      />

      <main className="main-content" id="main-content" tabIndex={-1}>
        {page === "home" && (
          <HomePage sendMessage={sendMessage} message={message} openAuction={openAuction} />
        )}
        {page === "auction" && selectedAuction !== null && (
          <AuctionPage
            sendMessage={sendMessage}
            user={user}
            message={message}
            auctionId={selectedAuction}
            onBack={() => setPage("home")}
          />
        )}
        {page === "profile" && (
          <ProfilePage sendMessage={sendMessage} message={message} user={user} openAuction={openAuction} />
        )}
        {page === "request" && (
          <RequestPage sendMessage={sendMessage} user={user} />
        )}
        {page === "watchlist" && (
          <WatchlistPage sendMessage={sendMessage} message={message} openAuction={openAuction} />
        )}
        {page === "admin" && isAdmin && (
          <AdminPage sendMessage={sendMessage} message={message} user={user} />
        )}
      </main>

      <ConnectionStatus connected={socketReady} />

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast key={toast.id} toast={toast} onDone={removeToast} />
        ))}
      </div>
    </div>
  )
}

export default App
