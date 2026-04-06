import { useState, useEffect } from "react"
import "./LoginPage.css"

function LoginPage({ sendMessage }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [mode, setMode] = useState("login")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    setPasswordStrength(Math.min(strength, 5))
  }, [password])

  const validateForm = () => {
    const newErrors = {}

    if (!username.trim()) {
      newErrors.username = "Username is required"
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (mode === "register" && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function submit() {
    if (!validateForm()) return

    setIsLoading(true)
    sendMessage({
      type: mode === "login" ? "LOGIN" : "REGISTER",
      username: username.trim(),
      password
    })

    if (rememberMe && mode === "login") {
      localStorage.setItem("rememberedUsername", username.trim())
    }

    // Reset loading state after a delay (will be overridden by response)
    setTimeout(() => setIsLoading(false), 2000)
  }

  function handleKey(e) {
    if (e.key === "Enter") submit()
  }

  // Load remembered username
  useEffect(() => {
    const remembered = localStorage.getItem("rememberedUsername")
    if (remembered) {
      setUsername(remembered)
      setRememberMe(true)
    }
  }, [])

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return { text: "Weak", color: "var(--red)" }
    if (passwordStrength <= 3) return { text: "Fair", color: "#e0a84c" }
    if (passwordStrength <= 4) return { text: "Good", color: "#5cbae0" }
    return { text: "Strong", color: "var(--green)" }
  }

  return (
    <div className="login-wrap">
      <div className="login-bg" />

      <div className="login-card-luxe glass-panel">
        <div className="login-branding">
          <div className="login-logo-luxe">Animus</div>
          <div className="login-tagline-luxe">Elite Auction Clearing House</div>
        </div>

        <div className="login-divider-luxe">
          <span>{mode === "login" ? "SECURE ACCESS" : "IDENTITY ESTABLISHMENT"}</span>
        </div>

        <div className="form-group-luxe">
          <label className="luxe-label">Identity</label>
          <input
            className={`luxe-input ${errors.username ? "error" : ""}`}
            type="text"
            placeholder="Username"
            value={username}
            autoFocus
            onChange={(e) => {
              setUsername(e.target.value)
              if (errors.username) setErrors({ ...errors, username: null })
            }}
            onKeyDown={handleKey}
            disabled={isLoading}
          />
          {errors.username && (
            <span className="form-error-luxe">{errors.username}</span>
          )}
        </div>

        <div className="form-group-luxe">
          <label className="luxe-label">Security Key</label>
          <div className="password-input-wrap-luxe">
            <input
              className={`luxe-input ${errors.password ? "error" : ""}`}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: null })
              }}
              onKeyDown={handleKey}
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-luxe"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "HIDE" : "SHOW"}
            </button>
          </div>
          {errors.password && (
            <span className="form-error-luxe">{errors.password}</span>
          )}
        </div>

        <div className="login-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
            />
            <span>Remember Identity</span>
          </label>
        </div>

        <div className="login-actions-luxe">
          <button
            className="btn-primary-luxe"
            onClick={submit}
            disabled={isLoading}
          >
            {isLoading ? "AUTHENTICATING..." : (mode === "login" ? "ACCESS PORTAL" : "CREATE ACCOUNT")}
          </button>
          <button
            className="btn-secondary-luxe"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login")
              setErrors({})
              setPassword("")
            }}
            disabled={isLoading}
          >
            {mode === "login" ? "ENROLL NEW USER" : "BACK TO SIGN IN"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
