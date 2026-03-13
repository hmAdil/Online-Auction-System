import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function Login({ onLogin })
{
  const [username, setUsername] = useState("")
  const navigate = useNavigate()

  useEffect(() =>
  {
    sessionStorage.removeItem("auction_user")
  }, [])

  function handleLogin()
  {
    if (!username.trim())
    {
      alert("Enter username")
      return
    }

    onLogin(username)

    navigate("/")
  }

  return (
    <div style={{ padding: "20px" }}>

      <h2>Login</h2>

      <input
        placeholder="Enter username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <button onClick={handleLogin}>
        Enter Auction
      </button>

    </div>
  )
}

export default Login