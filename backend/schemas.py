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
