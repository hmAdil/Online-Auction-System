import { useEffect, useState, useCallback } from "react"
import LoginPage from "./pages/LoginPage"
import AuctionPage from "./pages/AuctionPage"
import HomePage from "./pages/HomePage"
import ProfilePage from "./pages/ProfilePage"
import Navbar from "./components/Navbar"
import Toast from "./components/Toast"
import "./App.css"

function App() {
  const [socket, setSocket]           = useState(null)
  const [socketReady, setSocketReady] = useState(false)
  const [user, setUser]               = useState(null)
  const [message, setMessage]         = useState(null)
  const [page, setPage]               = useState("home")
  const [selectedAuction, setSelectedAuction] = useState(null)
  const [toast, setToast]             = useState(null)

  const showToast = useCallback((text, type = "info") => {
    setToast({ text, type, id: Date.now() })
  }, [])

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.hostname}:8000`)

    ws.onopen = () => {
      console.log("✅ Connected to bridge")
      setSocketReady(true)
    }

    ws.onclose = () => {
      setSocketReady(false)
      showToast("Connection lost — refresh to reconnect", "error")
    }

    ws.onerror = () => {
      showToast("WebSocket error", "error")
    }

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)

      if (msg.type === "LOGIN_SUCCESS") {
        setUser(msg.username)
        showToast(`Welcome back, ${msg.username}!`, "success")
      }
      if (msg.type === "LOGIN_FAILED")   showToast("Invalid credentials", "error")
      if (msg.type === "REGISTER_SUCCESS") showToast("Account created! Now log in.", "success")
      if (msg.type === "REGISTER_FAILED")  showToast("Username already taken", "error")
      if (msg.type === "BID_FAILED")       showToast(msg.reason, "error")
      if (msg.type === "NEW_BID" && msg.user === user) showToast(`Bid of ₹${msg.amount.toLocaleString()} placed!`, "success")

      setMessage(msg)
    }

    setSocket(ws)
    return () => ws.close()
  }, [])

  const sendMessage = useCallback((data) => {
    if (!socketReady || !socket) return
    socket.send(JSON.stringify(data))
  }, [socket, socketReady])

  const logout = () => {
    setUser(null)
    setPage("home")
    setSelectedAuction(null)
  }

  const openAuction = (id) => {
    setSelectedAuction(id)
    setPage("auction")
  }

  const goHome    = () => setPage("home")
  const goProfile = () => setPage("profile")

  if (!user) {
    return (
      <>
        <LoginPage sendMessage={sendMessage} />
        {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
      </>
    )
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={logout} onHome={goHome} onProfile={goProfile} page={page} />

      <main className="main-content">
        {page === "home" && (
          <HomePage
            sendMessage={sendMessage}
            message={message}
            openAuction={openAuction}
          />
        )}
        {page === "auction" && selectedAuction !== null && (
          <AuctionPage
            sendMessage={sendMessage}
            user={user}
            message={message}
            auctionId={selectedAuction}
            onBack={goHome}
          />
        )}
        {page === "profile" && (
          <ProfilePage
            sendMessage={sendMessage}
            message={message}
            user={user}
            openAuction={openAuction}
          />
        )}
      </main>

      {toast && <Toast toast={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export default App
