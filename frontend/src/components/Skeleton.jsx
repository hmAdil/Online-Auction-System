import "./Skeleton.css"

export function SkeletonAuctionCard() {
  return (
    <div className="auction-card skeleton">
      <div className="skeleton-status" />
      <div className="skeleton-item" />
      <div className="skeleton-highest" />
      <div className="skeleton-bid-row">
        <div className="skeleton-bid" />
        <div className="skeleton-timer" />
      </div>
      <div className="skeleton-button" />
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="profile-header skeleton">
      <div className="skeleton-avatar" />
      <div className="skeleton-info">
        <div className="skeleton-name" />
        <div className="skeleton-since" />
      </div>
    </div>
  )
}

export function SkeletonAdminRequest() {
  return (
    <div className="admin-request-card skeleton">
      <div className="skeleton-request-header" />
      <div className="skeleton-request-desc" />
      <div className="skeleton-request-footer" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAuctionCard key={i} />
      ))}
    </>
  )
}
