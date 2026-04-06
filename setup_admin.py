"""
Setup script to create/recreate the admin user.
Run this if you need to reset the admin account.
"""

from pymongo import MongoClient
import hashlib
import os
from datetime import datetime

client = MongoClient("mongodb://localhost:27017/")
db = client["auction_db"]
users = db["users"]

ADMIN_USERNAME = "hmAdil"

def hash_password(password):
    """Hash password with salt using SHA-256"""
    salt = os.urandom(16).hex()
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}${password_hash.hex()}"

print("=== Animus Admin User Setup ===\n")

# Get admin password
password = input(f"Set password for admin user '{ADMIN_USERNAME}': ")
if not password:
    print("Password cannot be empty!")
    exit(1)

confirm = input("Confirm password: ")
if password != confirm:
    print("Passwords do not match!")
    exit(1)

# Check if admin exists
existing = users.find_one({"username": ADMIN_USERNAME})

if existing:
    choice = input(f"\nUser '{ADMIN_USERNAME}' already exists. Overwrite? (yes/no): ")
    if choice.lower() != "yes":
        print("Cancelled.")
        exit(0)

    # Update existing user
    users.update_one(
        {"username": ADMIN_USERNAME},
        {"$set": {
            "password": hash_password(password),
            "role": "admin",
            "updated_at": datetime.utcnow().isoformat()
        }}
    )
    print(f"\n✅ Admin user '{ADMIN_USERNAME}' updated successfully!")
else:
    # Create new admin user
    users.insert_one({
        "username": ADMIN_USERNAME,
        "password": hash_password(password),
        "role": "admin",
        "joined_at": datetime.utcnow().isoformat()
    })
    print(f"\n✅ Admin user '{ADMIN_USERNAME}' created successfully!")

print(f"\nYou can now login with:")
print(f"  Username: {ADMIN_USERNAME}")
print(f"  Password: {'*' * len(password)}")
