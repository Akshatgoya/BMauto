"""Run from project root: python backend/seed_data.py"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.auth import hash_password
from backend.database import Listing, SessionLocal, User, init_db

SAMPLE_USERS = [
    ("Rahul Sharma", "rahul@autovaluai.demo", "Mumbai", "seller"),
    ("Priya Patel", "priya@autovaluai.demo", "Ahmedabad", "both"),
    ("Amit Kumar", "amit@autovaluai.demo", "Delhi", "seller"),
    ("Sneha Reddy", "sneha@autovaluai.demo", "Hyderabad", "buyer"),
    ("Vikram Singh", "vikram@autovaluai.demo", "Bangalore", "seller"),
]

SAMPLE_LISTINGS = [
    ("car", "2019 Honda City VX CVT", "Honda", "City", 2019, 12.5, 8.2, 42000, "Petrol", "Automatic", 1, "Individual", "White", "Mumbai"),
    ("car", "2018 Maruti Swift VDI", "Maruti", "Swift", 2018, 7.2, 5.1, 55000, "Diesel", "Manual", 1, "Dealer", "Red", "Delhi"),
    ("car", "2020 Hyundai Creta SX", "Hyundai", "Creta", 2020, 16.8, 12.4, 38000, "Diesel", "Automatic", 1, "Individual", "Grey", "Bangalore"),
    ("car", "2017 Toyota Innova Crysta", "Toyota", "Innova", 2017, 18.5, 13.8, 89000, "Diesel", "Manual", 2, "Dealer", "Silver", "Chennai"),
    ("car", "2021 Tata Nexon EV", "Tata", "Nexon", 2021, 14.5, 11.2, 22000, "Electric", "Automatic", 1, "Individual", "Blue", "Pune"),
    ("car", "2016 Ford EcoSport Titanium", "Ford", "EcoSport", 2016, 10.2, 5.8, 72000, "Diesel", "Manual", 2, "Individual", "Orange", "Kolkata"),
    ("car", "2022 Mahindra XUV700 AX5", "Mahindra", "XUV700", 2022, 19.5, 16.5, 18000, "Diesel", "Automatic", 1, "Dealer", "Black", "Jaipur"),
    ("car", "2015 Volkswagen Polo GT", "Volkswagen", "Polo", 2015, 8.5, 4.2, 95000, "Petrol", "Manual", 3, "Individual", "Yellow", "Surat"),
    ("car", "2019 BMW 320d Luxury", "BMW", "320d", 2019, 42.0, 28.5, 35000, "Diesel", "Automatic", 1, "Dealer", "Black", "Mumbai"),
    ("car", "2018 Mercedes C200", "Mercedes", "C200", 2018, 38.0, 24.0, 41000, "Petrol", "Automatic", 2, "Dealer", "White", "Delhi"),
    ("bike", "2020 Royal Enfield Classic 350", "Royal Enfield", "Classic 350", 2020, 1.9, 1.45, 12000, "Petrol", "Manual", 1, "Individual", "Black", "Bangalore"),
    ("bike", "2019 Honda CB Shine", "Honda", "CB Shine", 2019, 0.75, 0.52, 28000, "Petrol", "Manual", 1, "Dealer", "Red", "Hyderabad"),
    ("bike", "2021 Bajaj Pulsar NS200", "Bajaj", "Pulsar NS200", 2021, 1.35, 1.05, 15000, "Petrol", "Manual", 1, "Individual", "Blue", "Pune"),
    ("bike", "2018 Hero Splendor Plus", "Hero", "Splendor Plus", 2018, 0.55, 0.38, 42000, "Petrol", "Manual", 2, "Individual", "Black", "Jaipur"),
    ("bike", "2022 KTM Duke 390", "KTM", "Duke 390", 2022, 3.1, 2.65, 8000, "Petrol", "Manual", 1, "Dealer", "Orange", "Mumbai"),
    ("bike", "2017 Yamaha FZ-S V3", "Yamaha", "FZ-S", 2017, 0.95, 0.62, 48000, "Petrol", "Manual", 2, "Individual", "Grey", "Chennai"),
    ("bike", "2020 TVS Apache RTR 160", "TVS", "Apache RTR 160", 2020, 1.1, 0.85, 22000, "Petrol", "Manual", 1, "Individual", "White", "Kolkata"),
    ("bike", "2019 Kawasaki Ninja 300", "Kawasaki", "Ninja 300", 2019, 3.5, 2.4, 14000, "Petrol", "Manual", 1, "Dealer", "Green", "Delhi"),
    ("car", "2020 Audi A4 Premium Plus", "Audi", "A4", 2020, 45.0, 32.0, 28000, "Petrol", "Automatic", 1, "Dealer", "Grey", "Bangalore"),
    ("bike", "2016 Honda Activa 5G", "Honda", "Activa 5G", 2016, 0.65, 0.42, 38000, "Petrol", "Automatic", 2, "Individual", "Brown", "Ahmedabad"),
]


def seed():
    init_db()
    db = SessionLocal()
    try:
        if db.query(Listing).count() > 0:
            print("Database already has listings. Skipping seed.")
            return

        users = []
        for name, email, city, role in SAMPLE_USERS:
            u = User(
                full_name=name,
                email=email,
                password_hash=hash_password("demo1234"),
                phone="+919876543210",
                city=city,
                role=role,
            )
            db.add(u)
            users.append(u)
        db.commit()
        for u in users:
            db.refresh(u)

        for i, row in enumerate(SAMPLE_LISTINGS):
            (
                vtype,
                title,
                brand,
                model,
                year,
                present,
                asking,
                kms,
                fuel,
                trans,
                owners,
                stype,
                color,
                city,
            ) = row
            seller = users[i % len(users)]
            ai = round(asking * 0.95 + (present - asking) * 0.05, 2)
            listing = Listing(
                seller_id=seller.id,
                vehicle_type=vtype,
                title=title,
                brand=brand,
                model=model,
                year=year,
                present_price=present,
                asking_price=asking,
                ai_predicted_price=ai,
                kms_driven=kms,
                fuel_type=fuel,
                transmission=trans,
                owner_count=owners,
                seller_type=stype,
                color=color,
                city=city,
                description=(
                    f"Well maintained {brand} {model} in {city}. "
                    f"Single careful owner, full service history available. "
                    f"Ideal for daily commute with excellent fuel efficiency."
                ),
                photos=json.dumps([]),
                status="active",
                views=10 + i * 3,
            )
            db.add(listing)

        db.commit()
        print(f"Seeded {len(users)} users and {len(SAMPLE_LISTINGS)} listings.")
        print("Demo login: priya@autovaluai.demo / demo1234")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
