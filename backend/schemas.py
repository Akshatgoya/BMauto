from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=6)
    phone: str
    city: str
    role: str = "both"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    token: str
    user_id: int
    email: str
    full_name: str
    role: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    avatar_url: Optional[str] = None


class UserPublic(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    city: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SellerPublic(BaseModel):
    id: int
    full_name: str
    city: str
    role: str
    avatar_url: Optional[str] = None
    created_at: datetime
    phone: Optional[str] = None

    class Config:
        from_attributes = True


class ListingCreate(BaseModel):
    vehicle_type: str
    title: str
    brand: str
    model: str
    year: int
    present_price: float
    asking_price: float
    kms_driven: int
    fuel_type: str
    transmission: str
    owner_count: int
    seller_type: str
    color: str
    city: str
    description: str
    photos: List[str] = Field(default_factory=list, max_length=6)


class ListingUpdate(BaseModel):
    title: Optional[str] = None
    asking_price: Optional[float] = None
    kms_driven: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    owner_count: Optional[int] = None
    color: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    photos: Optional[List[str]] = None
    status: Optional[str] = None


class ListingOut(BaseModel):
    id: int
    seller_id: int
    vehicle_type: str
    title: str
    brand: str
    model: str
    year: int
    present_price: float
    asking_price: float
    ai_predicted_price: float
    kms_driven: int
    fuel_type: str
    transmission: str
    owner_count: int
    seller_type: str
    color: str
    city: str
    description: str
    photos: List[str]
    status: str
    views: int
    created_at: datetime
    seller: Optional[SellerPublic] = None
    is_saved: bool = False

    class Config:
        from_attributes = True


class ListingListResponse(BaseModel):
    items: List[ListingOut]
    total: int
    page: int
    limit: int
    pages: int


class CreateOrderRequest(BaseModel):
    listing_id: int
    amount: Optional[float] = None


class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    razorpay_key: str


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    listing_id: int


class VerifyPaymentResponse(BaseModel):
    status: str
    payment_id: str
    amount: float
    listing_title: str


# --- Rentals ---

class RentalCreate(BaseModel):
    vehicle_type: str
    title: str
    brand: str
    model_name: str
    year: int
    fuel_type: str
    transmission: str
    kms_driven: int
    price_per_day: float
    price_per_week: Optional[float] = None
    price_per_month: Optional[float] = None
    location: str
    description: str
    images: List[str] = Field(default_factory=list, max_length=6)


class RentalUpdate(BaseModel):
    title: Optional[str] = None
    price_per_day: Optional[float] = None
    price_per_week: Optional[float] = None
    price_per_month: Optional[float] = None
    location: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    is_available: Optional[bool] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    kms_driven: Optional[int] = None


class RentalOut(BaseModel):
    id: int
    owner_id: int
    vehicle_type: str
    title: str
    brand: str
    model_name: str
    year: int
    fuel_type: str
    transmission: str
    kms_driven: int
    price_per_day: float
    price_per_week: Optional[float] = None
    price_per_month: Optional[float] = None
    location: str
    description: str
    images: List[str]
    is_available: bool
    created_at: datetime
    updated_at: datetime
    owner: Optional[SellerPublic] = None

    class Config:
        from_attributes = True


class RentalListResponse(BaseModel):
    items: List[RentalOut]
    total: int
    page: int
    limit: int
    pages: int


class RentalBookRequest(BaseModel):
    start_date: datetime
    end_date: datetime


class RentalBookingOut(BaseModel):
    id: int
    listing_id: int
    renter_id: int
    start_date: datetime
    end_date: datetime
    total_days: int
    total_price: float
    status: str
    created_at: datetime
    listing_title: Optional[str] = None
    renter_name: Optional[str] = None
    listing_location: Optional[str] = None

    class Config:
        from_attributes = True


class BookingStatusUpdate(BaseModel):
    status: str


class DateRangeOut(BaseModel):
    start_date: datetime
    end_date: datetime
    status: str


class AvailabilityOut(BaseModel):
    booked_ranges: List[DateRangeOut]


# --- Spare parts ---

class PartCreate(BaseModel):
    vehicle_type: str
    category: str
    title: str
    brand: str
    part_number: Optional[str] = None
    condition: str
    compatibility: List[str] = Field(default_factory=list)
    price: float
    negotiable: bool = False
    quantity_available: int = Field(ge=1)
    location: str
    description: str
    images: List[str] = Field(default_factory=list, max_length=8)


class PartUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    compatibility: Optional[List[str]] = None
    price: Optional[float] = None
    negotiable: Optional[bool] = None
    quantity_available: Optional[int] = None
    location: Optional[str] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PartOut(BaseModel):
    id: int
    seller_id: int
    vehicle_type: str
    category: str
    title: str
    brand: str
    part_number: Optional[str] = None
    condition: str
    compatibility: List[str]
    price: float
    negotiable: bool
    quantity_available: int
    location: str
    description: str
    images: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    seller: Optional[SellerPublic] = None
    seller_listing_count: Optional[int] = None

    class Config:
        from_attributes = True


class PartListResponse(BaseModel):
    items: List[PartOut]
    total: int
    page: int
    limit: int
    pages: int


class PartOrderCreate(BaseModel):
    quantity: int = Field(ge=1)
    shipping_address: str = Field(min_length=10)


class PartOrderOut(BaseModel):
    id: int
    part_id: int
    buyer_id: int
    seller_id: int
    quantity: int
    total_price: float
    status: str
    shipping_address: str
    created_at: datetime
    part_title: Optional[str] = None
    buyer_name: Optional[str] = None
    seller_name: Optional[str] = None

    class Config:
        from_attributes = True


class PartOrderStatusUpdate(BaseModel):
    status: str


class CategoryCount(BaseModel):
    category: str
    count: int


class PaymentOut(BaseModel):
    id: int
    buyer_id: int
    seller_id: int
    listing_id: int
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: float
    status: str
    payment_method: Optional[str] = None
    created_at: datetime
    listing_title: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    buyer_phone: Optional[str] = None

    class Config:
        from_attributes = True
