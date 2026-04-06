from pymongo import MongoClient, ReturnDocument
from datetime import datetime
import hashlib
import os

client = MongoClient("mongodb://localhost:27017/")
db = client["auction_db"]
auctions = db["auctions"]
users = db["users"]
requests = db["auction_requests"]
metrics = db["metrics"]

print("✅ Connected to DB:", db.name)

# Ensure metrics collection is indexed for high-performance dashboard streaming
metrics.create_index("timestamp")

# ---------- PASSWORD HASHING ----------

def hash_password(password):
    """Hash password with salt using SHA-256"""
    salt = os.urandom(16).hex()
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${password_hash.hex()}"

def verify_password(password, stored_hash):
    """Verify password against stored hash (supports legacy plaintext)"""
    try:
        # Check if it's a hashed password (contains '$')
        if '$' in stored_hash:
            salt, hash_value = stored_hash.split('$')
            password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
            return password_hash.hex() == hash_value
        else:
            # Legacy plaintext password - for backward compatibility
            # In production, you would force password reset instead
            return password == stored_hash
    except:
        return False

# ---------- USERS ----------

def create_user(username, password):
    if users.find_one({"username": username}):
        return False
    users.insert_one({
        "username": username,
        "password": hash_password(password),  # Hashed password
        "joined_at": datetime.utcnow().isoformat(),
        "role": "user"
    })
    return True


def get_user(username):
    user = users.find_one({"username": username}, {"_id": 0, "password": 0})
    return user


def get_user_raw(username):
    """Get user with password hash for verification"""
    return users.find_one({"username": username}, {"_id": 0})


def verify_user_login(username, password):
    """Verify username and password"""
    user = get_user_raw(username)
    if not user:
        return False
    return verify_password(password, user["password"])


def get_user_bids(username):
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


def create_auction(item, starting_bid=1000, duration=7200, description="", owner=None, category="other"):
    print("Creating auction in DB...")
    last = auctions.find_one(sort=[("auction_id", -1)])
    new_id = 1 if not last else last["auction_id"] + 1
    auctions.insert_one({
        "auction_id": new_id,
        "item": item,
        "description": description,
        "category": category,
        "starting_bid": starting_bid,
        "current_bid": starting_bid,
        "highest_bidder": None,
        "bid_history": [],
        "time_left": duration,
        "active": True,
        "owner": owner,
        "created_at": datetime.utcnow().isoformat()
    })
    print("Auction inserted:", new_id)
    return new_id


def place_bid(auction_id, user, amount):
    auction = auctions.find_one({"auction_id": auction_id})
    if not auction:
        return {"success": False, "reason": "Auction not found"}
    if not auction["active"]:
        return {"success": False, "reason": "Auction has ended"}
    if not isinstance(amount, int):
        return {"success": False, "reason": "Bid must be a whole number"}

    min_next = auction["current_bid"] + 1000
    if amount < min_next:
        return {"success": False, "reason": f"Minimum bid is Rs.{min_next}"}

    bid_entry = {
        "user": user,
        "amount": amount,
        "timestamp": datetime.utcnow().isoformat()
    }

    updated = auctions.find_one_and_update(
        {
            "auction_id": auction_id,
            "active": True,
            "current_bid": auction["current_bid"]
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
        return {"success": False, "reason": "Bid was outpaced, try again"}

    return {"success": True}


def update_timer():
    auctions.update_many(
        {"active": True, "time_left": {"$gt": 0}},
        {"$inc": {"time_left": -1}}
    )
    auctions.update_many(
        {"active": True, "time_left": {"$lte": 0}},
        {"$set": {"active": False}}
    )


# ---------- AUCTION REQUESTS ----------

def submit_request(username, item, description, starting_bid, duration, category="other"):
    # Throttling: prevent flooding
    if requests.count_documents({"username": username, "status": "pending"}) >= 50:
        return None

    last = requests.find_one(sort=[("request_id", -1)])
    new_id = 1 if not last else last["request_id"] + 1
    requests.insert_one({
        "request_id": new_id,
        "username": username,
        "item": item,
        "description": description,
        "category": category,
        "starting_bid": starting_bid,
        "duration": duration,
        "status": "pending",
        "submitted_at": datetime.utcnow().isoformat()
    })
    return new_id


def get_all_requests():
    return list(requests.find({}, {"_id": 0}))


def get_pending_requests():
    return list(requests.find({"status": "pending"}, {"_id": 0}))


def approve_request(request_id):
    req = requests.find_one({"request_id": request_id})
    if not req or req["status"] != "pending":
        return {"success": False, "reason": "Request not found or already handled"}

    auction_id = create_auction(
        item=req["item"],
        starting_bid=req["starting_bid"],
        duration=req["duration"],
        description=req["description"],
        owner=req["username"],
        category=req.get("category", "other")
    )

    requests.update_one(
        {"request_id": request_id},
        {"$set": {"status": "approved", "auction_id": auction_id}}
    )

    return {"success": True, "auction_id": auction_id}


def reject_request(request_id):
    result = requests.update_one(
        {"request_id": request_id, "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    if result.modified_count == 0:
        return {"success": False, "reason": "Request not found or already handled"}
    return {"success": True}


def delete_auction(auction_id):
    result = auctions.delete_one({"auction_id": auction_id})
    if result.deleted_count == 0:
        return {"success": False, "reason": "Auction not found"}
    return {"success": True}


def bulk_approve_requests(request_ids):
    count = 0
    for req_id in request_ids:
        if approve_request(req_id)["success"]:
            count += 1
    return {"success": True, "count": count}

def bulk_reject_requests(request_ids):
    result = requests.update_many(
        {"request_id": {"$in": request_ids}, "status": "pending"},
        {"$set": {"status": "rejected"}}
    )
    return {"success": True, "count": result.modified_count}

def bulk_delete_auctions(auction_ids):
    result = auctions.delete_many({"auction_id": {"$in": auction_ids}})
    return {"success": True, "count": result.deleted_count}

# ---------- METRICS COLLECTION ----------

import time
_mem_metrics = {
    "latencies": [],
    "msg_count": 0,
    "last_reset": time.time(),
    "last_throughput": 0
}

def record_metric(metric_type, value, metadata=None):
    """Record a metric point in RAM to avoid DB locking"""
    if metric_type == "latency":
        _mem_metrics["latencies"].append(value)
        if len(_mem_metrics["latencies"]) > 500:
            _mem_metrics["latencies"] = _mem_metrics["latencies"][-500:]
    elif metric_type == "message":
        _mem_metrics["msg_count"] += 1
    elif metric_type == "connections":
        _mem_metrics["connections"] = value

def get_metrics_summary(minutes=5):
    """Mock for legacy frontend if needed"""
    return []

def get_throughput():
    """Get messages per second via RAM buffer"""
    now = time.time()
    elapsed = now - _mem_metrics["last_reset"]
    if elapsed >= 2.0:  # Calculate sliding window throughput
        _mem_metrics["last_throughput"] = _mem_metrics["msg_count"] / elapsed
        _mem_metrics["msg_count"] = 0
        _mem_metrics["last_reset"] = now
    return _mem_metrics["last_throughput"]

def get_latency_avg():
    """Get average latency instantly from RAM array"""
    lats = _mem_metrics["latencies"]
    if not lats: return 0
    return sum(lats) / len(lats)

def get_active_connections_count():
    """Get current active connections"""
    return _mem_metrics.get("connections", 0)
