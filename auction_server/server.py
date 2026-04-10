import socket
import threading
import json
import time
import ssl
import os
from datetime import datetime
from collections import defaultdict
import db

HOST = "127.0.0.1"
PORT = 5000
ADMIN = "hmAdil"

# Rate limiting
RATE_LIMIT_MESSAGES_PER_SECOND = 10
RATE_LIMIT_BIDS_PER_MINUTE = 20

clients = []
clients_lock = threading.Lock()
client_rates = defaultdict(list)  # Track message timestamps per client
client_bids = defaultdict(list)   # Track bid timestamps per client
auction_cache = {"payload": b"", "timestamp": 0}  # Binary snapshot of all auctions


def send_to_all(data):
    msg = (json.dumps(data) + "\n").encode()
    with clients_lock:
        dead = []
        for c in clients:
            try:
                c.send(msg)
            except Exception:
                dead.append(c)
        for c in dead:
            clients.remove(c)


def send_to(client, data):
    try:
        client.send((json.dumps(data) + "\n").encode())
    except Exception:
        pass


def check_rate_limit(username, limit=RATE_LIMIT_MESSAGES_PER_SECOND, window=1):
    """Check if user exceeded rate limit (messages per second)"""
    now = time.time()
    client_rates[username] = [t for t in client_rates[username] if now - t < window]
    if len(client_rates[username]) >= limit:
        return False
    client_rates[username].append(now)
    return True


def check_bid_limit(username, limit=RATE_LIMIT_BIDS_PER_MINUTE, window=60):
    """Check if user exceeded bid limit (bids per minute)"""
    now = time.time()
    client_bids[username] = [t for t in client_bids[username] if now - t < window]
    if len(client_bids[username]) >= limit:
        return False
    client_bids[username].append(now)
    return True


def record_metric(metric_type, value, metadata=None):
    """Record metric asynchronously"""
    try:
        db.record_metric(metric_type, value, metadata)
    except Exception as e:
        print(f"Metric recording error: {e}")


def handle_client(client, addr):
    buffer = ""
    client_username = None
    message_count = 0
    start_time = time.time()

    with clients_lock:
        clients.append(client)
        record_metric("connections", len(clients), {"event": "connect"})

    try:
        while True:
            try:
                chunk = client.recv(4096).decode()
                if not chunk:
                    break
                buffer += chunk
                msg_start_time = time.time()

                while "\n" in buffer:
                    raw, buffer = buffer.split("\n", 1)
                    raw = raw.strip()
                    if not raw:
                        continue
                    try:
                        message = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    # Record latency and throughput
                    latency = (time.time() - msg_start_time) * 1000
                    record_metric("latency", latency, {"message_type": message.get("type")})
                    record_metric("message", 1)
                    message_count += 1

                    mtype = message.get("type")

                    # ---------- LOGIN ----------
                    if mtype == "LOGIN":
                        if not check_rate_limit(message.get("username", "anon")):
                            send_to(client, {"type": "ERROR", "reason": "Rate limit exceeded. Please slow down."})
                            continue

                        user = db.get_user_raw(message["username"])
                        if user and db.verify_user_login(message["username"], message["password"]):
                            client_username = message["username"]
                            send_to(client, {
                                "type": "LOGIN_SUCCESS",
                                "username": message["username"],
                                "is_admin": message["username"] == ADMIN
                            })
                            record_metric("login", 1, {"username": client_username, "success": True})
                        else:
                            send_to(client, {"type": "LOGIN_FAILED"})
                            record_metric("login", 1, {"username": message.get("username"), "success": False})

                    # ---------- REGISTER ----------
                    elif mtype == "REGISTER":
                        if not check_rate_limit(message.get("username", "anon")):
                            send_to(client, {"type": "ERROR", "reason": "Rate limit exceeded."})
                            continue

                        success = db.create_user(message["username"], message["password"])
                        send_to(client, {
                            "type": "REGISTER_SUCCESS" if success else "REGISTER_FAILED"
                        })
                        record_metric("register", 1, {"success": success})

                    # ---------- GET ALL AUCTIONS ----------
                    elif mtype == "GET_ALL_AUCTIONS":
                        if client_username and not check_rate_limit(client_username, 20, 1):
                            continue
                            
                        # High-speed caching layer (500ms TTL)
                        now = time.time()
                        if now - auction_cache["timestamp"] > 0.5:
                            # Refresh cache from DB
                            data = {"type": "AUCTIONS_LIST", "auctions": db.get_all_auctions()}
                            auction_cache["payload"] = (json.dumps(data) + "\n").encode()
                            auction_cache["timestamp"] = now
                            
                        try:
                            client.send(auction_cache["payload"])
                        except:
                            pass

                    # ---------- GET ONE AUCTION ----------
                    elif mtype == "GET_AUCTION":
                        auction = db.get_auction(message["auction_id"])
                        if auction:
                            send_to(client, {"type": "AUCTION_STATE", **auction})

                    # ---------- PLACE BID ----------
                    elif mtype == "BID":
                        if client_username:
                            if not check_rate_limit(client_username):
                                send_to(client, {"type": "BID_FAILED", "auction_id": message["auction_id"],
                                               "reason": "Too many requests. Please slow down."})
                                continue
                            if not check_bid_limit(client_username):
                                send_to(client, {"type": "BID_FAILED", "auction_id": message["auction_id"],
                                               "reason": "Bid rate limit exceeded (max 20 bids/minute)."})
                                continue

                        result = db.place_bid(
                            message["auction_id"],
                            message["user"],
                            message["amount"]
                        )
                        if result["success"]:
                            send_to_all({
                                "type": "NEW_BID",
                                "auction_id": message["auction_id"],
                                "user": message["user"],
                                "amount": message["amount"]
                            })
                            record_metric("bid", message["amount"], {
                                "auction_id": message["auction_id"],
                                "user": message["user"]
                            })
                        else:
                            send_to(client, {
                                "type": "BID_FAILED",
                                "auction_id": message["auction_id"],
                                "reason": result["reason"]
                            })

                    # ---------- GET USER PROFILE ----------
                    elif mtype == "GET_PROFILE":
                        bids = db.get_user_bids(message["username"])
                        send_to(client, {
                            "type": "PROFILE_DATA",
                            "username": message["username"],
                            "auctions": bids
                        })

                    # ---------- REQUEST AUCTION (any user) ----------
                    elif mtype == "REQUEST_AUCTION":
                        if client_username and not check_rate_limit(client_username):
                            continue
                        req_id = db.submit_request(
                            username=message["username"],
                            item=message["item"],
                            description=message.get("description", ""),
                            starting_bid=message["starting_bid"],
                            duration=message["duration"],
                            category=message.get("category", "other")
                        )
                        send_to(client, {
                            "type": "REQUEST_SUBMITTED",
                            "request_id": req_id
                        })
                        send_to_all({"type": "NEW_REQUEST_PENDING"})

                    # ---------- GET REQUESTS (admin only) ----------
                    elif mtype == "GET_REQUESTS":
                        if message.get("username") != ADMIN:
                            send_to(client, {"type": "UNAUTHORIZED"})
                            continue
                        send_to(client, {
                            "type": "REQUESTS_LIST",
                            "requests": db.get_pending_requests()
                        })

                    # ---------- APPROVE REQUEST (admin only) ----------
                    elif mtype == "APPROVE_REQUEST":
                        if message.get("username") != ADMIN:
                            send_to(client, {"type": "UNAUTHORIZED"})
                            continue
                        result = db.approve_request(message["request_id"])
                        if result["success"]:
                            send_to(client, {
                                "type": "REQUEST_APPROVED",
                                "request_id": message["request_id"],
                                "auction_id": result["auction_id"]
                            })
                            send_to_all({"type": "AUCTIONS_UPDATED"})
                        else:
                            send_to(client, {
                                "type": "REQUEST_ACTION_FAILED",
                                "reason": result["reason"]
                            })

                    # ---------- REJECT REQUEST (admin only) ----------
                    elif mtype == "REJECT_REQUEST":
                        if message.get("username") != ADMIN:
                            send_to(client, {"type": "UNAUTHORIZED"})
                            continue
                        result = db.reject_request(message["request_id"])
                        send_to(client, {
                            "type": "REQUEST_REJECTED",
                            "request_id": message["request_id"]
                        })

                    # ---------- DELETE AUCTION (admin only) ----------
                    elif mtype == "DELETE_AUCTION":
                        if message.get("username") != ADMIN:
                            send_to(client, {"type": "UNAUTHORIZED"})
                            continue
                        result = db.delete_auction(message["auction_id"])
                        if result["success"]:
                            send_to_all({
                                "type": "AUCTION_DELETED",
                                "auction_id": message["auction_id"]
                            })
                        else:
                            send_to(client, {
                                "type": "DELETE_FAILED",
                                "reason": result["reason"]
                            })

                    # ---------- BULK ACTIONS (admin only) ----------
                    elif mtype == "BULK_APPROVE":
                        if message.get("username") != ADMIN:
                            continue
                        res = db.bulk_approve_requests(message["request_ids"])
                        send_to_all({"type": "AUCTIONS_UPDATED"})
                        send_to(client, {"type": "REQUESTS_LIST", "requests": db.get_pending_requests()})

                    elif mtype == "BULK_REJECT":
                        if message.get("username") != ADMIN:
                            continue
                        res = db.bulk_reject_requests(message["request_ids"])
                        send_to(client, {"type": "REQUESTS_LIST", "requests": db.get_pending_requests()})

                    elif mtype == "BULK_DELETE":
                        if message.get("username") != ADMIN:
                            continue
                        res = db.bulk_delete_auctions(message["auction_ids"])
                        send_to_all({"type": "AUCTIONS_UPDATED"})
                        send_to(client, {"type": "AUCTIONS_LIST", "auctions": db.get_all_auctions()})

                    # ---------- METRICS ENDPOINT (admin only) ----------
                    elif mtype == "GET_METRICS":
                        if message.get("username") != ADMIN:
                            send_to(client, {"type": "UNAUTHORIZED"})
                            continue
                        send_to(client, {
                            "type": "METRICS_DATA",
                            "throughput": db.get_throughput(),
                            "avg_latency": db.get_latency_avg(),
                            "active_connections": db.get_active_connections_count(),
                            "summary": db.get_metrics_summary()
                        })

            except Exception as e:
                print(f"Error handling client {addr}: {e}")
                break
    finally:
        with clients_lock:
            if client in clients:
                clients.remove(client)
            record_metric("connections", len(clients), {"event": "disconnect"})
        client.close()

        # Record session stats
        session_duration = time.time() - start_time
        if client_username:
            record_metric("session", session_duration, {
                "username": client_username,
                "messages": message_count
            })


def auction_timer():
    while True:
        time.sleep(1)
        db.update_timer()
        all_auctions = db.get_all_auctions()
        
        # Prepare bulk update array to solve N x M socket spam issue
        updates = []
        for a in all_auctions:
            updates.append({
                "auction_id": a["auction_id"],
                "time_left": a["time_left"],
                "active": a["active"]
            })
            
        if updates:
            # Pre-serialize once per second to reduce CPU cycles
            msg = (json.dumps({"type": "BULK_TIMER_UPDATE", "updates": updates}) + "\n").encode()
            with clients_lock:
                dead = []
                for c in clients:
                    try:
                        c.send(msg)
                    except:
                        dead.append(c)
                for c in dead:
                    clients.remove(c)


def create_self_signed_cert():
    """Create self-signed certificate for SSL/TLS"""
    cert_dir = os.path.join(os.path.dirname(__file__), "certs")
    cert_file = os.path.join(cert_dir, "server.crt")
    key_file = os.path.join(cert_dir, "server.key")

    if os.path.exists(cert_file) and os.path.exists(key_file):
        return cert_file, key_file

    os.makedirs(cert_dir, exist_ok=True)

    try:
        from cryptography import x509
        from cryptography.x509.oid import NameOID
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        import datetime as dt

        # Generate private key
        private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
        )

        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COUNTRY_NAME, "IN"),
            x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, "Maharashtra"),
            x509.NameAttribute(NameOID.LOCALITY_NAME, "Mumbai"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "Animus Auctions"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ])

        cert = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            private_key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            dt.datetime.utcnow()
        ).not_valid_after(
            dt.datetime.utcnow() + dt.timedelta(days=365)
        ).add_extension(
            x509.SubjectAlternativeName([x509.DNSName("localhost")]),
            critical=False,
        ).sign(private_key, hashes.SHA256())

        # Write files
        with open(key_file, "wb") as f:
            f.write(private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption()
            ))

        with open(cert_file, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.PEM))

        print(f"✅ Created self-signed certificate: {cert_file}")
        return cert_file, key_file

    except ImportError:
        print("⚠️  cryptography library not found. Install with: pip install cryptography")
        print("   Running without SSL/TLS (insecure)")
        return None, None


def start_server(use_ssl=False):
    if use_ssl:
        cert_file, key_file = create_self_signed_cert()
        if cert_file and key_file:
            server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

            context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
            context.load_cert_chain(cert_file, key_file)

            server = context.wrap_socket(server, server_side=True)
            server.bind((HOST, PORT))
            server.listen()
            print(f"🔒 SSL/TLS Server running on {HOST}:{PORT}")
        else:
            use_ssl = False

    if not use_ssl:
        server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server.bind((HOST, PORT))
        server.listen()
        print(f"✅ TCP Server running on {HOST}:{PORT}")

    print(f"Admin username: {ADMIN}")

    if not db.get_all_auctions():
        db.create_auction("Gaming Laptop", 12000, 7200, "High performance gaming laptop", category="electronics")
        db.create_auction("Mechanical Keyboard", 3000, 7200, "Tactile switches, RGB backlit", category="electronics")
        db.create_auction("Vintage Watch", 25000, 7200, "Rare 1970s Swiss movement", category="collectibles")

    threading.Thread(target=auction_timer, daemon=True).start()

    while True:
        client, addr = server.accept()
        print(f"Client connected: {addr}")
        threading.Thread(target=handle_client, args=(client, addr), daemon=True).start()


if __name__ == "__main__":
    import sys
    use_ssl_flag = "--ssl" in sys.argv
    start_server(use_ssl=use_ssl_flag)
