import { Link } from "react-router-dom"

function Navbar()
{
  const user = localStorage.getItem("auction_user")

  function logout()
  {
    localStorage.removeItem("auction_user")
    window.location.href = "/login"
  }

  return (
    <div style={{ borderBottom: "1px solid gray", padding: "10px" }}>

      <h1>Online Auction Engine</h1>

      <Link to="/">Home</Link> | <Link to="/profile">Profile</Link>

      <span style={{ marginLeft: "20px" }}>
        Logged in as: <b>{user}</b>
      </span>

      <button
        style={{ marginLeft: "20px" }}
        onClick={logout}
      >
        Logout
      </button>

    </div>
  )
}

export default Navbar