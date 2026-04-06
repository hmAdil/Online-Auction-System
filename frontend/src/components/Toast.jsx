import { useEffect, useState } from "react"
import "./Toast.css"

function Toast({ toast, onDone }) {
  const [progress, setProgress] = useState(100)
  const duration = 3500

  useEffect(() => {
    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = 100 - (elapsed / duration * 100)
      setProgress(Math.max(0, remaining))
      if (remaining <= 0) clearInterval(interval)
    }, 50)

    const t = setTimeout(() => onDone(toast.id), duration)
    return () => {
      clearTimeout(t)
      clearInterval(interval)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id])

  const getIcon = () => {
    switch (toast.type) {
      case "success": return "✓"
      case "error": return "✕"
      case "warning": return "⚠"
      default: return "ℹ"
    }
  }

  return (
    <div
      className={`toast ${toast.type}`}
      onClick={() => onDone(toast.id)}
      role="alert"
      tabIndex={0}
    >
      <span className="toast-icon">{getIcon()}</span>
      <span className="toast-text">{toast.text}</span>
      <div className="toast-progress" style={{ width: `${progress}%` }} />
    </div>
  )
}

export default Toast
