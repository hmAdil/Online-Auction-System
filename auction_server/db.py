from pymongo import MongoClient, ReturnDocument
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["auction_db"]
auctions = db["auctions"]
users = db["users"]

print("✅ Connected to DB:", db.name)


# ---------- USERS ----------

def create_user(username, password):
    if users.find_one({"username": username}):
        return False
    users.insert_one({
        "username": username,
        "password": password,
        "joined_at": datetime.utcnow().isoformat()
    })
    return True


def get_user(username):
    return users.find_one({"username": username}, {"_id": 0})


def get_user_bids(username):
    """Return all auctions where the user has placed a bid."""
    result = []
    for a in auctions.find({}, {"_id": 0}):
        user_bids = [b for b in a.get("bid_history", []) if b["user"] == username]
        if user_bids:
            result.append({
                "auction_id": a["auction_id"],
                "item": a["item"],
                "bids": user_bids,
                "current_bid": a["current_bid"],
                "highest_bidder": a.get("highest_bidder"),
                "active": a["active"]
            })
    return result


# ---------- AUCTIONS ----------

def get_all_auctions():
    return list(auctions.find({}, {"_id": 0}))


def get_auction(auction_id):
    return auctions.find_one({"auction_id": auction_id}, {"_id": 0})


def create_auction(item, starting_bid=1000, duration=60):
    print("🔥 Creating auction in DB...")
    last = auctions.find_one(sort=[("auction_id", -1)])
    new_id = 1 if not last else last["auction_id"] + 1
    auctions.insert_one({
        "auction_id": new_id,
        "item": item,
        "starting_bid": starting_bid,
        "current_bid": starting_bid,
        "highest_bidder": None,
        "bid_history": [],
        "time_left": duration,
        "active": True,
        "created_at": datetime.utcnow().isoformat()
    })
    print("✅ Auction inserted:", new_id)
    return new_id


def place_bid(auction_id, user, amount):
    """Atomically place a bid if it meets the minimum increment requirement."""
    auction = auctions.find_one({"auction_id": auction_id})
    if not auction:
        return {"success": False, "reason": "Auction not found"}
    if not auction["active"]:
        return {"success": False, "reason": "Auction has ended"}
    if not isinstance(amount, int):
        return {"success": False, "reason": "Bid must be a whole number"}

    min_next = auction["current_bid"] + 1000
    if amount < min_next:
        return {"success": False, "reason": f"Minimum bid is ₹{min_next}"}

    bid_entry = {
        "user": user,
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    }

    updated = auctions.find_one_and_update(
        {
            "auction_id": auction_id,
            "active": True,
            "current_bid": auction["current_bid"]   # optimistic lock
        },
        {
            "$set": {
                "current_bid": amount,
                "highest_bidder": user,
                "time_left": 60
            },
            "$push": {"bid_history": bid_entry}
        },
        return_document=ReturnDocument.AFTER,
        projection={"_id": 0}
    )

    if not updated:
        return {"success": False, "reason": "Bid was outpaced — try again"}

    return {"success": True}


def update_timer():
    """Decrement time_left for all active auctions; mark finished ones inactive."""
    # Decrement active auctions with time_left > 0
    auctions.update_many(
        {"active": True, "time_left": {"$gt": 0}},
        {"$inc": {"time_left": -1}}
    )
    # End auctions that hit zero
    auctions.update_many(
        {"active": True, "time_left": {"$lte": 0}},
        {"$set": {"active": False}}
    )
