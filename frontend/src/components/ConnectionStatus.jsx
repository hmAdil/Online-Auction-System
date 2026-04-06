import { useState } from "react"
import "./ConnectionStatus.css"

function ConnectionStatus({ connected }) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div
      className={`connection-status ${connected ? "connected" : "disconnected"}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="status-dot" />
      {showTooltip && (
        <div className="status-tooltip">
          {connected ? "Connected to server" : "Disconnected from server"}
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
