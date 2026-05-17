import os
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    UniqueConstraint,
)
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "autovaluai.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=False)
    city = Column(String(80), nullable=False)
    role = Column(String(20), nullable=False, default="both")
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    listings = relationship("Listing", back_populates="seller", cascade="all, delete-orphan")
    saved = relationship("SavedListing", back_populates="user", cascade="all, delete-orphan")
    purchases = relationship(
        "Payment",
        back_populates="buyer",
        foreign_keys="Payment.buyer_id",
        cascade="all, delete-orphan",
    )
    sales = relationship(
        "Payment",
        back_populates="seller",
        foreign_keys="Payment.seller_id",
        cascade="all, delete-orphan",
    )
    rental_listings = relationship(
        "RentalListing",
        back_populates="owner",
        cascade="all, delete-orphan",
    )
    rental_bookings = relationship(
        "RentalBooking",
        back_populates="renter",
        foreign_keys="RentalBooking.renter_id",
        cascade="all, delete-orphan",
    )
    spare_parts = relationship(
        "SparePart",
        back_populates="seller",
        cascade="all, delete-orphan",
    )
    part_orders_buying = relationship(
        "PartOrder",
        back_populates="buyer",
        foreign_keys="PartOrder.buyer_id",
        cascade="all, delete-orphan",
    )
    part_orders_selling = relationship(
        "PartOrder",
        back_populates="seller",
        foreign_keys="PartOrder.seller_id",
        cascade="all, delete-orphan",
    )


class Listing(Base):
    __tablename__ = "listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vehicle_type = Column(String(10), nullable=False)
    title = Column(String(200), nullable=False)
    brand = Column(String(80), nullable=False)
    model = Column(String(80), nullable=False)
    year = Column(Integer, nullable=False)
    present_price = Column(Float, nullable=False)
    asking_price = Column(Float, nullable=False)
    ai_predicted_price = Column(Float, nullable=False)
    kms_driven = Column(Integer, nullable=False)
    fuel_type = Column(String(20), nullable=False)
    transmission = Column(String(20), nullable=False)
    owner_count = Column(Integer, nullable=False)
    seller_type = Column(String(20), nullable=False)
    color = Column(String(40), nullable=False)
    city = Column(String(80), nullable=False)
    description = Column(Text, nullable=False)
    photos = Column(Text, default="[]")
    status = Column(String(20), default="active")
    views = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    seller = relationship("User", back_populates="listings")
    saved_by = relationship("SavedListing", back_populates="listing", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="listing", cascade="all, delete-orphan")


class SavedListing(Base):
    __tablename__ = "saved_listings"
    __table_args__ = (UniqueConstraint("user_id", "listing_id", name="uq_user_listing"),)

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, index=True)
    saved_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="saved")
    listing = relationship("Listing", back_populates="saved_by")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, autoincrement=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    listing_id = Column(Integer, ForeignKey("listings.id"), nullable=False, index=True)
    razorpay_order_id = Column(String(100), nullable=False, index=True)
    razorpay_payment_id = Column(String(100), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    payment_method = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("User", back_populates="purchases", foreign_keys=[buyer_id])
    seller = relationship("User", back_populates="sales", foreign_keys=[seller_id])
    listing = relationship("Listing", back_populates="payments")


class RentalListing(Base):
    __tablename__ = "rental_listings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vehicle_type = Column(String(10), nullable=False)
    title = Column(String(200), nullable=False)
    brand = Column(String(80), nullable=False)
    model_name = Column(String(80), nullable=False)
    year = Column(Integer, nullable=False)
    fuel_type = Column(String(20), nullable=False)
    transmission = Column(String(20), nullable=False)
    kms_driven = Column(Integer, nullable=False)
    price_per_day = Column(Float, nullable=False)
    price_per_week = Column(Float, nullable=True)
    price_per_month = Column(Float, nullable=True)
    location = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    images = Column(Text, default="[]")
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    owner = relationship("User", back_populates="rental_listings")
    bookings = relationship("RentalBooking", back_populates="listing", cascade="all, delete-orphan")


class RentalBooking(Base):
    __tablename__ = "rental_bookings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    listing_id = Column(Integer, ForeignKey("rental_listings.id"), nullable=False, index=True)
    renter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    total_days = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

    listing = relationship("RentalListing", back_populates="bookings")
    renter = relationship("User", back_populates="rental_bookings", foreign_keys=[renter_id])


class SparePart(Base):
    __tablename__ = "spare_parts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    vehicle_type = Column(String(10), nullable=False)
    category = Column(String(40), nullable=False)
    title = Column(String(200), nullable=False)
    brand = Column(String(80), nullable=False)
    part_number = Column(String(80), nullable=True)
    condition = Column(String(20), nullable=False)
    compatibility = Column(Text, default="[]")
    price = Column(Float, nullable=False)
    negotiable = Column(Boolean, default=False)
    quantity_available = Column(Integer, nullable=False, default=1)
    location = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    images = Column(Text, default="[]")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    seller = relationship("User", back_populates="spare_parts")
    orders = relationship("PartOrder", back_populates="part", cascade="all, delete-orphan")


class PartOrder(Base):
    __tablename__ = "part_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    part_id = Column(Integer, ForeignKey("spare_parts.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String(20), default="pending")
    shipping_address = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    part = relationship("SparePart", back_populates="orders")
    buyer = relationship("User", back_populates="part_orders_buying", foreign_keys=[buyer_id])
    seller = relationship("User", back_populates="part_orders_selling", foreign_keys=[seller_id])


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
