import { useState, useEffect } from "react"
import "./PageTransition.css"

export default function PageTransition({ children, show }) {
  const [display, setDisplay] = useState(show)
  const [visible, setVisible] = useState(show)

  useEffect(() => {
    if (show) {
      setDisplay(true)
      requestAnimationFrame(() => {
        setVisible(true)
      })
    } else {
      setVisible(false)
      const timer = setTimeout(() => setDisplay(false), 300)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!display) return null

  return (
    <div className={`page-transition ${visible ? 'enter' : 'exit'}`}>
      {children}
    </div>
  )
}
