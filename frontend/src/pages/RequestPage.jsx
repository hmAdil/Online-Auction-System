import { useState } from "react"

const DURATION_OPTIONS = [
  { label: "30 minutes",  value: 1800 },
  { label: "1 hour",      value: 3600 },
  { label: "2 hours",     value: 7200 },
  { label: "6 hours",     value: 21600 },
  { label: "12 hours",    value: 43200 },
  { label: "24 hours",    value: 86400 },
]

const CATEGORY_OPTIONS = [
  { value: "electronics",  label: "⚡ Electronics" },
  { value: "collectibles", label: "★ Collectibles" },
  { value: "art",          label: "🎨 Art" },
  { value: "fashion",      label: "♦ Fashion" },
  { value: "sports",       label: "⚽ Sports" },
  { value: "other",        label: "○ Other" },
]

function RequestPage({ sendMessage, user }) {
  const [item, setItem]               = useState("")
  const [description, setDescription] = useState("")
  const [startingBid, setStartingBid] = useState("")
  const [duration, setDuration]       = useState(7200)
  const [category, setCategory]       = useState("other")
  const [submitted, setSubmitted]     = useState(false)

  function submit() {
    if (!item.trim()) {
      alert("Please enter an item name")
      return
    }
    const bid = parseInt(startingBid, 10)
    if (isNaN(bid) || bid < 1) {
      alert("Please enter a valid starting bid")
      return
    }

    sendMessage({
      type: "REQUEST_AUCTION",
      username: user,
      item: item.trim(),
      description: description.trim(),
      starting_bid: bid,
      duration: duration,
      category: category
    })

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="request-page-container">
        <h1 className="page-title">Market Access Pending</h1>
        <div className="request-success glass-panel">
          <div className="request-success-icon-luxe">✓</div>
          <p className="success-text-luxe">Your listing for <strong>{item}</strong> is being processed by the clearing house.</p>
          <p className="success-sub-luxe">Once authenticated, your auction will go live on the global market.</p>
          <button className="btn-primary-luxe" style={{marginTop: "2rem"}}
            onClick={() => setSubmitted(false)}>
            Submit New Listing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="request-page-container">
      <h1 className="page-title">Liquidate Assets</h1>
      <p className="page-subtitle">Submit your item to the premium global auction market</p>

      <div className="request-form-luxe glass-panel">
        <div className="form-group-luxe">
          <label className="luxe-label">Item Designation</label>
          <input
            className="luxe-input"
            type="text"
            placeholder="e.g. Rare Artifact, High-End Hardware..."
            value={item}
            onChange={e => setItem(e.target.value)}
          />
        </div>

        <div className="form-group-luxe">
          <label className="luxe-label">Detailed Specification</label>
          <textarea
            className="luxe-input luxe-textarea"
            placeholder="Provide condition, specifications, and provenance..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        <div className="form-row-luxe">
          <div className="form-group-luxe" style={{flex: 1}}>
            <label className="luxe-label">Starting Price (₹)</label>
            <input
              className="luxe-input"
              type="number"
              min="1"
              placeholder="Minimum valuation"
              value={startingBid}
              onChange={e => setStartingBid(e.target.value)}
            />
          </div>

          <div className="form-group-luxe" style={{flex: 1}}>
            <label className="luxe-label">Asset Sector</label>
            <select
              className="luxe-input luxe-select-field"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group-luxe">
          <label className="luxe-label">Auction Duration</label>
          <select
            className="luxe-input luxe-select-field"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
          >
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <button className="btn-primary-luxe" style={{marginTop: "1.5rem", width: "100%"}} onClick={submit}>
          Initiate Public Offering
        </button>
      </div>
    </div>
  )
}

export default RequestPage
