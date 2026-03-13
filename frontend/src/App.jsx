import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useState } from "react"

import Home from "./pages/Home"
import AuctionPage from "./pages/AuctionPage"
import Profile from "./pages/Profile"
import Login from "./pages/Login"

function App()
{
  const [user, setUser] = useState(sessionStorage.getItem("auction_user"))

  function handleLogin(username)
  {
    sessionStorage.setItem("auction_user", username)
    setUser(username)
  }

  function handleLogout()
  {
    sessionStorage.removeItem("auction_user")
    setUser(null)
  }

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/login"
          element={<Login onLogin={handleLogin} />}
        />

        <Route
          path="/"
          element={user ? <Home onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        <Route
          path="/auction"
          element={user ? <AuctionPage /> : <Navigate to="/login" />}
        />

        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App