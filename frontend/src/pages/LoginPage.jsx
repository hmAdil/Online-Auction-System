import { useState } from "react"

function LoginPage({ sendMessage }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState("login") // "login" | "register"

  function submit() {
    if (!username.trim() || !password.trim()) {
      alert("Please fill in all fields")
      return
    }
    sendMessage({
      type: mode === "login" ? "LOGIN" : "REGISTER",
      username: username.trim(),
      password
    })
  }

  function handleKey(e) {
    if (e.key === "Enter") submit()
  }

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card">
        <div className="login-logo">Animus</div>
        <div className="login-tagline">Real-time auction engine</div>

        <div className="login-divider">
          <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
        </div>

        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            className="form-input"
            type="text"
            placeholder="your_username"
            value={username}
            autoFocus
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div className="login-actions">
          <button className="btn-primary" onClick={submit}>
            {mode === "login" ? "Sign In" : "Register"}
          </button>
          <button
            className="btn-secondary"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
