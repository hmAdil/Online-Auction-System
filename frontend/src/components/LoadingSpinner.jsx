import "./LoadingSpinner.css"

export function LoadingSpinner({ size = "medium", text = "Loading..." }) {
  return (
    <div className={`loading-spinner ${size}`}>
      <div className="spinner" />
      {text && <span className="loading-text">{text}</span>}
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <LoadingSpinner size="large" text="Loading..." />
    </div>
  )
}
