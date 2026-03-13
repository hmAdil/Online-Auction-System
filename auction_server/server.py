import socket
import threading
import json
import time

from auction_manager import AuctionManager


HOST = "0.0.0.0"
PORT = 5000


manager = AuctionManager()
manager.create_auction("Gaming Laptop", 12000)

clients = []

last_bid_time = {}


server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

server.bind((HOST, PORT))
server.listen()

print("Auction server running on port 5000")


def broadcast(message):

    for client in clients:

        try:

            client.send((json.dumps(message) + "\n").encode())

        except:

            pass



def validate_message(message):

    if "type" not in message:
        return False

    if message["type"] == "BID":

        required = ["auction_id", "user", "amount"]

        for field in required:

            if field not in message:
                return False

    elif message["type"] == "GET_AUCTION":

        if "auction_id" not in message:
            return False

    else:
        return False

    return True



def handle_client(client):

    buffer = ""

    while True:

        try:

            data = client.recv(1024)

            if not data:
                break

            buffer += data.decode()

            while "\n" in buffer:

                msg, buffer = buffer.split("\n", 1)

                if not msg.strip():
                    continue

                message = json.loads(msg)

                if not validate_message(message):
                    print("Invalid message rejected:", message)
                    continue

                print("Received message:", message)


                if message["type"] == "GET_AUCTION":

                    auction = manager.get_auction(message["auction_id"])

                    if auction:

                        response = {
                            "type": "AUCTION_STATE",
                            "auction_id": auction.auction_id,
                            "current_bid": auction.current_bid,
                            "highest_bidder": auction.highest_bidder,
                            "bid_history": auction.bid_history,
                            "time_left": auction.time_left,
                            "active": auction.active
                        }

                        client.send((json.dumps(response) + "\n").encode())


                elif message["type"] == "BID":

                    user = message["user"]

                    if len(user) > 20 or not user.isalnum():
                        print("Invalid username rejected:", user)
                        continue


                    now = time.time()

                    if user in last_bid_time:

                        if now - last_bid_time[user] < 1:
                            print("Spam bid blocked:", user)
                            continue

                    last_bid_time[user] = now


                    auction = manager.get_auction(message["auction_id"])

                    if auction and auction.place_bid(
                        user,
                        message["amount"]
                    ):

                        broadcast({
                            "type": "NEW_BID",
                            "auction_id": auction.auction_id,
                            "user": user,
                            "amount": message["amount"],
                            "time_left": auction.time_left
                        })


        except Exception as e:

            print("Client error:", e)

            break


    if client in clients:
        clients.remove(client)

    client.close()

    print("Client disconnected")



def auction_timer():

    while True:

        time.sleep(1)

        for auction in manager.auctions.values():

            if not auction.active:
                continue

            auction.time_left -= 1

            broadcast({
                "type": "TIMER_UPDATE",
                "auction_id": auction.auction_id,
                "time_left": auction.time_left
            })

            if auction.time_left <= 0:

                auction.active = False

                broadcast({
                    "type": "AUCTION_ENDED",
                    "auction_id": auction.auction_id,
                    "winner": auction.highest_bidder,
                    "amount": auction.current_bid
                })



timer_thread = threading.Thread(
    target = auction_timer
)

timer_thread.daemon = True
timer_thread.start()



while True:

    client, addr = server.accept()

    print("Client connected:", addr)

    clients.append(client)

    thread = threading.Thread(
        target = handle_client,
        args = (client,)
    )

    thread.start()