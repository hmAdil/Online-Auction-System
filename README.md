# Animus - Real-Time Online Auction System

A modern, real-time online auction platform with TCP socket backend, React frontend, and comprehensive security features.

## Quick Start

**Windows:**
```bash
start_secure_network.bat
```

**Manual (3 terminals):**
```bash
# Terminal 1 - TCP Auction Server
python auction_server/server.py

# Terminal 2 - WebSocket Bridge
python web_bridge/bridge.py

# Terminal 3 - React Frontend
cd frontend && npm run dev
```

Access: `http://localhost:5173` | Admin: `hmAdil`

## Features

### Core Functionality
- **Real-time bidding** with instant WebSocket updates
- **Live auction timer** with urgency indicators
- **Multi-user support** with concurrent connections
- **Admin panel** for auction management
- **Auction requests** - users can request new auctions

### Security Features
- **Password hashing** using PBKDF2-SHA256 with salt
- **Rate limiting** - 10 messages/second, 20 bids/minute per user
- **Input validation** on all endpoints

### User Experience
- **Search & filters** - by category, price range, time left
- **Watchlist** - save and track favorite auctions
- **Outbid notifications** - instant alerts when outbid
- **Bid history visualization** - timeline chart of all bids
- **User profiles** with stats and badges
- **Loading skeletons** for smooth UX
- **Mobile responsive** design with hamburger menu

### Admin Features
- **Metrics dashboard** - real-time throughput, latency, connections
- **Request management** - approve/reject auction requests
- **Auction management** - view and delete auctions
- **Live statistics** - active users, bids, revenue

## Tech Stack

**Backend**
- Python with raw TCP sockets
- Threaded server architecture
- MongoDB for data persistence
- PBKDF2 password hashing

**Frontend**
- React 18 with Vite
- WebSocket for real-time communication
- Custom CSS with design tokens
- Responsive grid layouts

## Installation

### Prerequisites
- Python 3.8+
- Node.js 18+
- MongoDB running on localhost:27017

### Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Start MongoDB (if not running)
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Load Testing

```bash
# Run load test with default settings (50 users, 60s)
python load_test.py

# Custom configuration
python load_test.py --users 100 --duration 120 --spawn-rate 20
```

## API Reference

### WebSocket Message Types

**Client → Server:**
| Type | Fields | Description |
|------|--------|-------------|
| `LOGIN` | username, password | Authenticate user |
| `REGISTER` | username, password | Create new account |
| `GET_ALL_AUCTIONS` | - | Fetch all auctions |
| `GET_AUCTION` | auction_id | Get specific auction |
| `BID` | auction_id, user, amount | Place a bid |
| `GET_PROFILE` | username | Get user profile |
| `REQUEST_AUCTION` | username, item, description, starting_bid, duration | Request new auction |
| `GET_REQUESTS` | username | Get pending requests (admin) |
| `APPROVE_REQUEST` | username, request_id | Approve request (admin) |
| `REJECT_REQUEST` | username, request_id | Reject request (admin) |
| `DELETE_AUCTION` | username, auction_id | Delete auction (admin) |
| `GET_METRICS` | username | Get server metrics (admin) |

**Server → Client:**
| Type | Description |
|------|-------------|
| `LOGIN_SUCCESS` | Authentication successful |
| `LOGIN_FAILED` | Authentication failed |
| `REGISTER_SUCCESS` | Account created |
| `REGISTER_FAILED` | Username taken |
| `AUCTIONS_LIST` | List of all auctions |
| `AUCTION_STATE` | Single auction state |
| `NEW_BID` | Broadcast new bid |
| `BID_FAILED` | Bid rejected |
| `PROFILE_DATA` | User profile data |
| `TIMER_UPDATE` | Auction timer update |
| `METRICS_DATA` | Server metrics |

## Project Structure

```
Online-Auction-System/
├── auction_server/
│   ├── server.py          # Main TCP server
│   ├── db.py              # Database operations
│   └── certs/             # SSL certificates (auto-generated)
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   └── App.jsx        # Main app component
│   └── package.json
├── load_test.py           # Load testing script
└── requirements.txt       # Python dependencies
```

## Configuration

### Environment Variables
Create `.env` file in `auction_server/`:

```
MONGODB_URI=mongodb://localhost:27017
ADMIN_USERNAME=hmAdil
SERVER_HOST=127.0.0.1
SERVER_PORT=5000
```

### Rate Limits (in server.py)
```python
RATE_LIMIT_MESSAGES_PER_SECOND = 10
RATE_LIMIT_BIDS_PER_MINUTE = 20
```

## Performance Metrics

The system tracks:
- **Throughput**: Messages processed per second
- **Latency**: Average request-response time (ms)
- **Active Connections**: Current connected clients
- **Session Duration**: Average user session length

Access metrics via Admin Panel → Metrics tab or `GET_METRICS` WebSocket message.

## Security Considerations

1. **Passwords**: Hashed with PBKDF2-SHA256, 100,000 iterations
2. **SSL/TLS**: Optional encryption with self-signed certs
3. **Rate Limiting**: Prevents DoS and bid spam
4. **Input Validation**: All messages validated before processing
5. **Admin Authorization**: Admin actions require username verification

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See LICENSE file for details.

## Credits

Built for Computer Networks course project.
