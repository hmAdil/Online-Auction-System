# Running the Project

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd online-auction-engine
```

---

## 2. Install Dependencies

### Install Python dependency (for WebSocket bridge)

```bash
pip install websockets
```

### Install frontend dependencies

```bash
cd frontend
npm install
```

---

## 3. Start the TCP Auction Server

Open a terminal and run:

```bash
cd auction_server
python server.py
```

Expected output:

```
Auction server running on port 5000
```

---

## 4. Start the WebSocket Bridge

Open a **second terminal** and run:

```bash
cd web_bridge
python bridge.py
```

Expected output:

```
WebSocket bridge running on port 8000
```

---

## 5. Start the React Frontend

Open a **third terminal** and run:

```bash
cd frontend
npm run dev
```

Expected output:

```
Local: http://localhost:5173
```

---

## 6. Open the Application

Open the following URL in your browser:

```
http://localhost:5173
```

You will be prompted to enter a username before accessing the auction platform.

---

## 7. Testing Multi-Client Bidding

To test the real-time auction system:

1. Open multiple browser tabs.
2. Login using different usernames.
3. Place bids from different tabs.
4. Observe real-time updates across all clients.

---

## System Architecture

```
React Frontend
      │
      ▼
WebSocket Bridge (Python)
      │
      ▼
TCP Auction Server (Python)
      │
      ▼
Auction Manager
```

---

## Technologies Used

- **React** – Frontend UI  
- **Python** – Backend server  
- **WebSockets** – Real-time communication  
- **TCP Sockets** – Core networking layer
