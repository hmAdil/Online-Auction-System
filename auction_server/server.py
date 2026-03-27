import socket
import threading
import json
import time
import db

HOST = "127.0.0.1"
PORT = 5000

clients = []
clients_lock = threading.Lock()


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


def handle_client(client):
    buffer = ""
    while True:
        try:
            chunk = client.recv(4096).decode()
            if not chunk:
                break
            buffer += chunk
            while "\n" in buffer:
                raw, buffer = buffer.split("\n", 1)
                raw = raw.strip()
                if not raw:
                    continue
                try:
                    message = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                mtype = message.get("type")

                # ---------- LOGIN ----------
                if mtype == "LOGIN":
                    user = db.get_user(message["username"])
                    if user and user["password"] == message["password"]:
                        send_to(client, {
                            "type": "LOGIN_SUCCESS",
                            "username": message["username"]
                        })
                    else:
                        send_to(client, {"type": "LOGIN_FAILED"})

                # ---------- REGISTER ----------
                elif mtype == "REGISTER":
                    success = db.create_user(message["username"], message["password"])
                    send_to(client, {
                        "type": "REGISTER_SUCCESS" if success else "REGISTER_FAILED"
                    })

                # ---------- GET ALL AUCTIONS ----------
                elif mtype == "GET_ALL_AUCTIONS":
                    send_to(client, {
                        "type": "AUCTIONS_LIST",
                        "auctions": db.get_all_auctions()
                    })

                # ---------- GET ONE AUCTION ----------
                elif mtype == "GET_AUCTION":
                    auction = db.get_auction(message["auction_id"])
                    if auction:
                        send_to(client, {"type": "AUCTION_STATE", **auction})

                # ---------- PLACE BID ----------
                elif mtype == "BID":
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

                # ---------- CREATE AUCTION (admin) ----------
                elif mtype == "CREATE_AUCTION":
                    new_id = db.create_auction(
                        message["item"],
                        message.get("starting_bid", 1000),
                        message.get("duration", 60)
                    )
                    send_to(client, {"type": "AUCTION_CREATED", "auction_id": new_id})
                    send_to_all({"type": "AUCTIONS_UPDATED"})

        except Exception:
            break

    with clients_lock:
        if client in clients:
            clients.remove(client)
    client.close()


def auction_timer():
    while True:
        time.sleep(1)
        db.update_timer()
        all_auctions = db.get_all_auctions()
        for a in all_auctions:
            send_to_all({
                "type": "TIMER_UPDATE",
                "auction_id": a["auction_id"],
                "time_left": a["time_left"],
                "active": a["active"]
            })


def start_server():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, PORT))
    server.listen()
    print(f"TCP Server running on {HOST}:{PORT}")

    # Seed some auctions if DB is empty
    if not db.get_all_auctions():
        db.create_auction("Gaming Laptop", 12000, 7200)
        db.create_auction("Mechanical Keyboard", 3000, 7200)
        db.create_auction("Vintage Watch", 25000, 7200)

    threading.Thread(target=auction_timer, daemon=True).start()

    while True:
        client, addr = server.accept()
        print(f"Client connected: {addr}")
        with clients_lock:
            clients.append(client)
        threading.Thread(target=handle_client, args=(client,), daemon=True).start()


if __name__ == "__main__":
    start_server()
