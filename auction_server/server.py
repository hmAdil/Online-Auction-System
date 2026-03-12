import socket
import threading
import json

from auction_manager import AuctionManager


HOST = "0.0.0.0"
PORT = 5000


manager = AuctionManager()
manager.create_auction("Gaming Laptop", 12000)

clients = []


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

                print("Received message:", message)


                if message["type"] == "GET_AUCTION":

                    auction = manager.get_auction(message["auction_id"])

                    if auction:

                        response = {
                            "type": "AUCTION_STATE",
                            "auction_id": auction.auction_id,
                            "current_bid": auction.current_bid,
                            "highest_bidder": auction.highest_bidder,
                            "bid_history": auction.bid_history
                        }

                        client.send((json.dumps(response) + "\n").encode())


                elif message["type"] == "CREATE_AUCTION":

                    auction = manager.create_auction(
                        message["item"],
                        message["starting_bid"]
                    )

                    response = {
                        "type": "AUCTION_CREATED",
                        "auction_id": auction.auction_id
                    }

                    client.send((json.dumps(response) + "\n").encode())


                elif message["type"] == "BID":

                    auction = manager.get_auction(message["auction_id"])

                    if auction and auction.place_bid(
                        message["user"],
                        message["amount"]
                    ):

                        print("New bid:", message["amount"])

                        broadcast({
                            "type": "NEW_BID",
                            "auction_id": auction.auction_id,
                            "user": message["user"],
                            "amount": message["amount"]
                        })


        except Exception as e:

            print("Client error:", e)
            break


    if client in clients:
        clients.remove(client)

    client.close()

    print("Client disconnected")



while True:

    client, addr = server.accept()

    print("Client connected:", addr)

    clients.append(client)

    thread = threading.Thread(
        target = handle_client,
        args = (client,)
    )

    thread.start()