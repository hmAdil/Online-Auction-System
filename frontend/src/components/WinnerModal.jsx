import { useEffect, useState } from "react"
import "./WinnerModal.css"

export default function WinnerModal({ show, item, amount, onClose }) {
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setVisible(true)
    } else {
      const t = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!visible) return null

  return (
    <div className={`winner-modal ${show ? 'show' : ''}`} onClick={onClose}>
      <div className="winner-overlay" />
      <div className="winner-content" onClick={e => e.stopPropagation()}>
        <div className="winner-icon">🏆</div>
        <h2 className="winner-title">Congratulations!</h2>
        <p className="winner-subtitle">You won the auction</p>
        <div className="winner-item">{item}</div>
        <div className="winner-amount">₹{amount?.toLocaleString()}</div>
        <div className="winner-actions">
          <button className="btn-winner-primary" onClick={onClose}>
            Awesome!
          </button>
          <button className="btn-winner-secondary" onClick={onClose}>
            View Profile
          </button>
        </div>
        <ConfettiCanvas />
      </div>
    </div>
  )
}

function ConfettiCanvas() {
  useEffect(() => {
    const canvas = document.getElementById('confetti-canvas')
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles = []
    const colors = ['#c9a84c', '#5cba8a', '#5c9be0', '#e05c5c', '#f0ece4']

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 3 + 2,
        angle: Math.random() * Math.PI * 2,
        spin: Math.random() * 0.2 - 0.1
      })
    }

    let animationId

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach(p => {
        p.y += p.speed
        p.angle += p.spin
        p.x += Math.sin(p.angle) * 2

        if (p.y > canvas.height) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas id="confetti-canvas" className="confetti-canvas" />
  )
}
