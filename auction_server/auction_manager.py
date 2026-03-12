from auction import Auction

class AuctionManager:
  def __init__(self):
    self.auctions = {}
    self.next_id = 1


  def create_auction(self, item, starting_bid):
    auction = Auction(self.next_id, item, starting_bid)
    self.auctions[self.next_id] = auction
    self.next_id += 1
    return auction


  def get_auction(self, auction_id):
    return self.auctions.get(auction_id)