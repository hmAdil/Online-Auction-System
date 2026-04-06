import { useEffect, useState } from "react"
import "./MetricsDashboard.css"

function MetricsDashboard({ sendMessage, message }) {
  const [metrics, setMetrics] = useState({
    throughput: 0,
    avg_latency: 0,
    active_connections: 0,
    total_users: 0,
    total_auctions: 0,
    total_bids: 0
  })
  const [history, setHistory] = useState([])

  useEffect(() => {
    // Request metrics every 2 seconds
    const interval = setInterval(() => {
      sendMessage({ type: "GET_METRICS", username: "hmAdil" })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!message || message.type !== "METRICS_DATA") return

    const newMetrics = {
      throughput: message.throughput || 0,
      avg_latency: message.avg_latency || 0,
      active_connections: message.active_connections || 0,
      total_users: 0,
      total_auctions: 0,
      total_bids: 0
    }

    setMetrics(newMetrics)
    setHistory(prev => {
      const updated = [...prev, {
        ...newMetrics,
        timestamp: Date.now()
      }]
      return updated.slice(-30) // Keep last 30 data points
    })
  }, [message])

  return (
    <div>
      <h1 className="page-title">Server Metrics</h1>
      <p className="page-subtitle">Real-time performance monitoring</p>

      <div className="metrics-grid">
        <MetricCard
          title="Throughput"
          value={metrics.throughput.toFixed(1)}
          unit="msg/s"
          icon="📊"
          color="var(--gold)"
        />
        <MetricCard
          title="Avg Latency"
          value={metrics.avg_latency.toFixed(2)}
          unit="ms"
          icon="⏱"
          color={metrics.avg_latency < 50 ? "var(--green)" : metrics.avg_latency < 100 ? "#e0a84c" : "var(--red)"}
        />
        <MetricCard
          title="Active Connections"
          value={metrics.active_connections}
          unit="clients"
          icon="🔌"
          color="var(--blue)"
        />
        <MetricCard
          title="Messages/Sec"
          value={(metrics.throughput * 2).toFixed(1)}
          unit="est."
          icon="💬"
          color="var(--green)"
        />
      </div>

      {/* Throughput graph */}
      <div className="metrics-chart">
        <h3 className="chart-title">Throughput Over Time</h3>
        <div className="chart-container">
          <ThroughputChart data={history} />
        </div>
      </div>

      {/* Latency graph */}
      <div className="metrics-chart">
        <h3 className="chart-title">Latency Over Time</h3>
        <div className="chart-container">
          <LatencyChart data={history} />
        </div>
      </div>

      {/* Connection stats */}
      <div className="metrics-section">
        <h3 className="section-title">Connection Statistics</h3>
        <div className="stats-list">
          <StatRow label="Current connections" value={metrics.active_connections} />
          <StatRow label="Peak connections" value={Math.max(...history.map(h => h.active_connections), 0)} />
          <StatRow label="Avg throughput" value={(history.reduce((s, h) => s + h.throughput, 0) / history.length || 0).toFixed(1)} unit="msg/s" />
          <StatRow label="Avg latency" value={(history.reduce((s, h) => s + h.avg_latency, 0) / history.length || 0).toFixed(2)} unit="ms" />
        </div>
      </div>
    </div>
  )
}

function MetricCard({ title, value, unit, icon, color }) {
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ color }}>{icon}</div>
      <div className="metric-value" style={{ color }}>{value}</div>
      <div className="metric-unit">{unit}</div>
      <div className="metric-title">{title}</div>
    </div>
  )
}

function ThroughputChart({ data }) {
  if (data.length < 2) {
    return <div className="chart-empty">Waiting for data...</div>
  }

  const maxThroughput = Math.max(...data.map(d => d.throughput), 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (d.throughput / maxThroughput) * 100
    return `${x},${y}`
  }).join(" ")

  return (
    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="throughputGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#throughputGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke="var(--gold)"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function LatencyChart({ data }) {
  if (data.length < 2) {
    return <div className="chart-empty">Waiting for data...</div>
  }

  const maxLatency = Math.max(...data.map(d => d.avg_latency), 100)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (d.avg_latency / maxLatency) * 100
    return `${x},${y}`
  }).join(" ")

  const getColor = (latency) => {
    if (latency < 50) return "var(--green)"
    if (latency < 100) return "#e0a84c"
    return "var(--red)"
  }

  return (
    <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        <linearGradient id="latencyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--green)" stopOpacity="0.6" />
          <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,100 ${points} 100,100`}
        fill="url(#latencyGradient)"
      />
      <polyline
        points={points}
        fill="none"
        stroke={getColor(data[data.length - 1]?.avg_latency)}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function StatRow({ label, value, unit }) {
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="stat-unit">{unit}</span>}
      </span>
    </div>
  )
}

export default MetricsDashboard
