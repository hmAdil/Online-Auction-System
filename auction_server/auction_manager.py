import db

class Auction:
    def __init__(self, data):
        self.auction_id = data["auction_id"]
        self.item = data["item"]
        self.current_bid = data["current_bid"]
        self.highest_bidder = data.get("highest_bidder")
        self.bid_history = data.get("bid_history", [])
        self.time_left = data["time_left"]
        self.active = data["active"]


class AuctionManager:

    def get_all_auctions(self):

        auctions = db.get_all_auctions()

        return [Auction(a) for a in auctions]


    def get_auction(self, auction_id):

        data = db.get_auction(auction_id)

        if not data:
            return None

        return Auction(data)


    def place_bid(self, auction_id, user, amount):

        return db.place_bid(auction_id, user, amount)