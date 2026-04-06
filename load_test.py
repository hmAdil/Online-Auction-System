"""
Load Testing Script for Online Auction System
Simulates multiple concurrent users to test server performance

Usage:
    python load_test.py --users 100 --spawn-rate 10 --run-time 2m

Or use locust UI:
    locust -f load_test.py --host=localhost:5000
"""

import socket
import json
import threading
import time
import random
import argparse
from collections import defaultdict
from datetime import datetime

# Configuration
HOST = "127.0.0.1"
PORT = 5000

# Statistics
stats = {
    "connections": 0,
    "messages_sent": 0,
    "messages_received": 0,
    "bids_placed": 0,
    "logins_success": 0,
    "logins_failed": 0,
    "errors": 0,
    "latencies": [],
    "start_time": None,
}
stats_lock = threading.Lock()


class AuctionClient:
    """Simulates a single auction client"""

    def __init__(self, username, password="TestPass123"):
        self.username = username
        self.password = password
        self.socket = None
        self.buffer = ""
        self.running = False
        self.latencies = []
        self.active_auctions = []
        self.role = random.choices(
            ["bidder", "creator", "lurker", "chaotic"],
            weights=[40, 15, 25, 20]
        )[0]

    def connect(self):
        """Connect to server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((HOST, PORT))
            self.running = True
            with stats_lock:
                stats["connections"] += 1
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def send(self, message):
        """Send a message"""
        if self.socket and self.running:
            try:
                start = time.time()
                self.socket.send((json.dumps(message) + "\n").encode())
                with stats_lock:
                    stats["messages_sent"] += 1
                return time.time() - start
            except Exception:
                return None
        return None

    def recv(self, timeout=0.1):
        """Receive messages"""
        if not self.socket:
            return []

        self.socket.settimeout(timeout)
        messages = []
        try:
            chunk = self.socket.recv(4096).decode()
            if chunk:
                self.buffer += chunk
                while "\n" in self.buffer:
                    raw, self.buffer = self.buffer.split("\n", 1)
                    if raw.strip():
                        try:
                            msg = json.loads(raw)
                            messages.append(msg)
                            with stats_lock:
                                stats["messages_received"] += 1
                                
                            # Cache auctions automatically when received
                            if msg.get("type") == "AUCTIONS_LIST":
                                self.active_auctions = [a for a in msg.get("auctions", []) if a.get("active")]
                                
                        except json.JSONDecodeError:
                            pass
        except socket.timeout:
            pass
        except Exception:
            self.running = False
        return messages

    def login(self):
        """Login"""
        latency = self.send({"type": "LOGIN", "username": self.username, "password": self.password})
        if latency:
            self.latencies.append(latency)
        time.sleep(0.05)
        msgs = self.recv()
        for msg in msgs:
            if msg.get("type") == "LOGIN_SUCCESS":
                with stats_lock:
                    stats["logins_success"] += 1
                return True
            elif msg.get("type") == "LOGIN_FAILED":
                with stats_lock:
                    stats["logins_failed"] += 1
        return False

    def register(self):
        """Register new user"""
        self.send({"type": "REGISTER", "username": self.username, "password": self.password})
        time.sleep(0.05)
        self.recv()

    def get_auctions(self):
        """Get all auctions"""
        latency = self.send({"type": "GET_ALL_AUCTIONS"})
        if latency:
            self.latencies.append(latency)
        time.sleep(0.05)
        return self.recv()

    def get_auction(self, auction_id):
        """Get specific auction"""
        self.send({"type": "GET_AUCTION", "auction_id": auction_id})
        time.sleep(0.05)
        return self.recv()

    def place_bid(self, auction_id, amount):
        """Place a bid"""
        latency = self.send({
            "type": "BID",
            "auction_id": auction_id,
            "user": self.username,
            "amount": amount
        })
        if latency:
            self.latencies.append(latency)
        time.sleep(0.05)
        msgs = self.recv()
        for msg in msgs:
            if msg.get("type") == "NEW_BID":
                with stats_lock:
                    stats["bids_placed"] += 1
                return True
        return False

    def get_profile(self):
        """Get user profile"""
        self.send({"type": "GET_PROFILE", "username": self.username})
        time.sleep(0.05)
        return self.recv()

    def request_auction(self, item, starting_bid, duration):
        """Request to create an auction"""
        latency = self.send({
            "type": "REQUEST_AUCTION",
            "username": self.username,
            "item": item,
            "starting_bid": starting_bid,
            "duration": duration,
            "category": "test"
        })
        if latency:
            self.latencies.append(latency)
        time.sleep(0.05)
        return self.recv()

    def close(self):
        """Close connection"""
        self.running = False
        if self.socket:
            try:
                self.socket.close()
            except:
                pass


def simulate_user(client, duration=60):
    """Simulate user behavior"""
    start = time.time()

    if not client.connect():
        return

    # Try login (or register if fails)
    if not client.login():
        client.register()
        time.sleep(0.1)
        client.login()

    while client.running and (time.time() - start) < duration:
        if client.role == "bidder":
            actions = ["view_auctions", "view_auction", "place_bid", "wait"]
            weights = [10, 15, 60, 15]
        elif client.role == "creator":
            actions = ["request_auction", "view_auctions", "view_profile", "wait"]
            weights = [5, 20, 10, 65]
        elif client.role == "lurker":
            actions = ["view_auctions", "view_auction", "view_profile", "reconnect", "wait"]
            weights = [20, 30, 10, 10, 30]
        else: # chaotic
            actions = ["view_auctions", "view_auction", "view_profile", "place_bid", "request_auction", "reconnect", "wait"]
            weights = [10, 15, 5, 40, 5, 5, 20]

        action = random.choices(actions, weights=weights, k=1)[0]

        if action == "view_auctions":
            client.get_auctions()

        elif action == "view_auction":
            if client.active_auctions:
                auction_id = random.choice(client.active_auctions)["auction_id"]
                client.get_auction(auction_id)
            else:
                client.get_auctions()

        elif action == "view_profile":
            client.get_profile()

        elif action == "place_bid":
            if client.active_auctions:
                auction = random.choice(client.active_auctions)
                # Must be at least +1000 to pass db.py minimum bid validation
                min_bid = auction.get("current_bid", 1000) + random.randint(1000, 5000)
                client.place_bid(auction["auction_id"], min_bid)
                time.sleep(random.uniform(2.5, 4.0))
            else:
                client.get_auctions()
                    
        elif action == "request_auction":
            items = ["Phone", "Laptop", "Watch", "Sneakers", "Headphones", "Camera", "Monitor"]
            client.request_auction(
                f"{random.choice(items)} Test-{random.randint(100, 999)}", 
                random.randint(100, 5000), 
                random.randint(60, 600)
            )
            
        elif action == "reconnect":
            client.close()
            time.sleep(random.uniform(0.5, 1.5))
            if client.connect():
                if not client.login():
                    client.register()
                    client.login()

        # Receive any broadcast messages
        client.recv(timeout=0.1)

        # Random wait between actions (much shorter for aggressive stress testing)
        time.sleep(random.uniform(0.1, 0.8))

    client.close()


def run_load_test(num_users=100, duration=60, spawn_rate=10):
    """Run load test with specified number of users"""
    print(f"\n{'='*60}")
    print("ONLINE AUCTION SYSTEM - LOAD TEST")
    print(f"{'='*60}")
    print(f"Users: {num_users}")
    print(f"Duration: {duration}s")
    print(f"Spawn rate: {spawn_rate} users/s")
    print(f"{'='*60}\n")

    stats["start_time"] = time.time()
    threads = []
    clients = []

    # Spawn users
    for i in range(num_users):
        if i % spawn_rate == 0 and i > 0:
            time.sleep(1.0)

        username = f"test_user_{i}_{random.randint(1000, 9999)}"
        client = AuctionClient(username)
        clients.append(client)

        t = threading.Thread(target=simulate_user, args=(client, duration), daemon=True)
        threads.append(t)
        t.start()

        if i % 10 == 0:
            print(f"Spawned {i}/{num_users} users...")

    # Wait for all threads
    print(f"All {num_users} users spawned. Running test...")
    for t in threads:
        t.join()

    # Calculate results
    end_time = time.time()
    total_time = end_time - stats["start_time"]

    print(f"\n{'='*60}")
    print("RESULTS")
    print(f"{'='*60}")
    print(f"Total time:          {total_time:.2f}s")
    print(f"Connections:         {stats['connections']}")
    print(f"Messages sent:       {stats['messages_sent']}")
    print(f"Messages received:   {stats['messages_received']}")
    print(f"Bids placed:         {stats['bids_placed']}")
    print(f"Logins success:      {stats['logins_success']}")
    print(f"Logins failed:       {stats['logins_failed']}")
    print(f"Errors:              {stats['errors']}")

    # Calculate throughput
    if total_time > 0:
        throughput = stats["messages_sent"] / total_time
        print(f"Throughput:          {throughput:.2f} msg/s")

    # Calculate latency stats
    all_latencies = []
    for client in clients:
        all_latencies.extend(client.latencies)

    if all_latencies:
        avg_latency = sum(all_latencies) / len(all_latencies)
        min_latency = min(all_latencies)
        max_latency = max(all_latencies)
        p95_latency = sorted(all_latencies)[int(len(all_latencies) * 0.95)] if len(all_latencies) > 20 else max_latency

        print(f"\nLatency (ms):")
        print(f"  Average:           {avg_latency*1000:.2f}ms")
        print(f"  Min:               {min_latency*1000:.2f}ms")
        print(f"  Max:               {max_latency*1000:.2f}ms")
        print(f"  95th percentile:   {p95_latency*1000:.2f}ms")

    print(f"{'='*60}\n")

    return stats


def main():
    parser = argparse.ArgumentParser(description="Load test for auction server")
    parser.add_argument("--users", type=int, default=150, help="Number of concurrent users")
    parser.add_argument("--duration", type=int, default=60, help="Test duration in seconds")
    parser.add_argument("--spawn-rate", type=int, default=10, help="Users spawned per second")
    args = parser.parse_args()

    # Test server connection first
    print("Testing server connection...")
    test_client = AuctionClient("connection_test")
    if not test_client.connect():
        print("ERROR: Cannot connect to server!")
        print(f"Make sure the server is running on {HOST}:{PORT}")
        return
    test_client.close()
    print("Server connection OK!\n")

    run_load_test(
        num_users=args.users,
        duration=args.duration,
        spawn_rate=args.spawn_rate
    )


if __name__ == "__main__":
    main()
