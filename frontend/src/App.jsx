import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Home from "./pages/Home"
import AuctionPage from "./pages/AuctionPage"
import Profile from "./pages/Profile"
import Login from "./pages/Login"

function App()
{
  const user = localStorage.getItem("auction_user")

  return (
    <BrowserRouter>

      <Routes>

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={user ? <Home /> : <Navigate to="/login" />}
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