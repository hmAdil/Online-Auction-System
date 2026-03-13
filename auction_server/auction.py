import threading


class Auction:

    def __init__(self, auction_id, item, starting_bid):

        self.auction_id = auction_id
        self.item = item

        self.current_bid = starting_bid
        self.highest_bidder = None

        self.bid_history = []

        self.lock = threading.Lock()

        self.time_left = 60
        self.active = True

        self.min_increment = 1000


    def place_bid(self, user, amount):

        with self.lock:

            if not self.active:
                return False

            if not isinstance(amount, int):
                return False

            if amount < self.current_bid + self.min_increment:
                return False

            self.current_bid = amount
            self.highest_bidder = user

            self.bid_history.append(
                {
                    "user": user,
                    "amount": amount
                }
            )

            self.time_left = 60

            return True