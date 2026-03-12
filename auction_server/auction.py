import threading

class Auction:
  def __init__(self, auction_id, item, starting_bid):
    self.auction_id = auction_id
    self.item = item
    self.current_bid = starting_bid
    self.highest_bidder = None
    self.bid_history = []
    self.lock = threading.Lock()


  def place_bid(self, user, amount):
    with self.lock:
      if amount > self.current_bid:
        self.current_bid = amount
        self.highest_bidder = user

        self.bid_history.append(
        {
          "user": user,
          "amount": amount
        })
        return True
      return False