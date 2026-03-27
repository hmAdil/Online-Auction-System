import { useEffect } from "react"

function Toast({ toast, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [toast.id])

  return (
    <div className={`toast ${toast.type}`}>
      {toast.type === "success" && "✓ "}
      {toast.type === "error"   && "✕ "}
      {toast.text}
    </div>
  )
}

export default Toast
