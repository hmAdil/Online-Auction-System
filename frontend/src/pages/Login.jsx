import { useState } from "react"
import { useNavigate } from "react-router-dom"

function Login()
{
  const [username, setUsername] = useState("")
  const navigate = useNavigate()

  function handleLogin()
  {
    if (!username.trim())
    {
      alert("Enter username")
      return
    }

    localStorage.setItem("auction_user", username)

    window.location.href = "/"
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