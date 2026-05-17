import json
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user, get_optional_user
from backend.database import RentalBooking, RentalListing, User, get_db
from backend.schemas import (
    AvailabilityOut,
    BookingStatusUpdate,
    DateRangeOut,
    RentalBookRequest,
    RentalBookingOut,
    RentalCreate,
    RentalListResponse,
    RentalOut,
    RentalUpdate,
    SellerPublic,
)

router = APIRouter(prefix="/rentals", tags=["rentals"])

ACTIVE_BOOKING_STATUSES = ("pending", "confirmed", "active")


def _parse_images(raw: str) -> List[str]:
    return json.loads(raw or "[]")


def _rental_to_out(listing: RentalListing, hide_phone: bool = True) -> RentalOut:
    owner_data = None
    if listing.owner:
        owner_data = SellerPublic(
            id=listing.owner.id,
            full_name=listing.owner.full_name,
            city=listing.owner.city,
            role=listing.owner.role,
            avatar_url=listing.owner.avatar_url,
            created_at=listing.owner.created_at,
            phone=None if hide_phone else listing.owner.phone,
        )
    return RentalOut(
        id=listing.id,
        owner_id=listing.owner_id,
        vehicle_type=listing.vehicle_type,
        title=listing.title,
        brand=listing.brand,
        model_name=listing.model_name,
        year=listing.year,
        fuel_type=listing.fuel_type,
        transmission=listing.transmission,
        kms_driven=listing.kms_driven,
        price_per_day=listing.price_per_day,
        price_per_week=listing.price_per_week,
        price_per_month=listing.price_per_month,
        location=listing.location,
        description=listing.description,
        images=_parse_images(listing.images),
        is_available=listing.is_available,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        owner=owner_data,
    )


def _booking_to_out(booking: RentalBooking) -> RentalBookingOut:
    title = booking.listing.title if booking.listing else None
    loc = booking.listing.location if booking.listing else None
    renter_name = booking.renter.full_name if booking.renter else None
    return RentalBookingOut(
        id=booking.id,
        listing_id=booking.listing_id,
        renter_id=booking.renter_id,
        start_date=booking.start_date,
        end_date=booking.end_date,
        total_days=booking.total_days,
        total_price=booking.total_price,
        status=booking.status,
        created_at=booking.created_at,
        listing_title=title,
        renter_name=renter_name,
        listing_location=loc,
    )


def _calc_price(listing: RentalListing, total_days: int) -> float:
    if total_days >= 30 and listing.price_per_month:
        months = total_days // 30
        rem = total_days % 30
        return months * listing.price_per_month + rem * listing.price_per_day
    if total_days >= 7 and listing.price_per_week:
        weeks = total_days // 7
        rem = total_days % 7
        return weeks * listing.price_per_week + rem * listing.price_per_day
    return total_days * listing.price_per_day


def _dates_overlap(s1: datetime, e1: datetime, s2: datetime, e2: datetime) -> bool:
    return s1 < e2 and s2 < e1


@router.get("", response_model=RentalListResponse)
def list_rentals(
    vehicle_type: Optional[str] = Query(None, alias="type"),
    location: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    fuel: Optional[str] = None,
    transmission: Optional[str] = None,
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db),
):
    q = (
        db.query(RentalListing)
        .options(joinedload(RentalListing.owner))
        .filter(RentalListing.is_available.is_(True))
    )
    if vehicle_type in ("car", "bike"):
        q = q.filter(RentalListing.vehicle_type == vehicle_type)
    if location:
        q = q.filter(RentalListing.location.ilike(f"%{location}%"))
    if min_price is not None:
        q = q.filter(RentalListing.price_per_day >= min_price)
    if max_price is not None:
        q = q.filter(RentalListing.price_per_day <= max_price)
    if fuel:
        q = q.filter(RentalListing.fuel_type == fuel)
    if transmission:
        q = q.filter(RentalListing.transmission == transmission)

    if sort == "price_low":
        q = q.order_by(asc(RentalListing.price_per_day))
    elif sort == "price_high":
        q = q.order_by(desc(RentalListing.price_per_day))
    else:
        q = q.order_by(desc(RentalListing.created_at))

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()
    pages = max(1, (total + limit - 1) // limit)
    return RentalListResponse(
        items=[_rental_to_out(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/my-rentals", response_model=List[RentalOut])
def my_rentals(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(RentalListing)
        .options(joinedload(RentalListing.owner))
        .filter(RentalListing.owner_id == current_user.id)
        .order_by(desc(RentalListing.created_at))
        .all()
    )
    return [_rental_to_out(i, hide_phone=False) for i in items]


@router.get("/my-bookings", response_model=List[RentalBookingOut])
def my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(RentalBooking)
        .options(joinedload(RentalBooking.listing), joinedload(RentalBooking.renter))
        .filter(RentalBooking.renter_id == current_user.id)
        .order_by(desc(RentalBooking.created_at))
        .all()
    )
    return [_booking_to_out(b) for b in items]


@router.put("/bookings/{booking_id}/status", response_model=RentalBookingOut)
def update_booking_status(
    booking_id: int,
    body: BookingStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = (
        db.query(RentalBooking)
        .options(joinedload(RentalBooking.listing), joinedload(RentalBooking.renter))
        .filter(RentalBooking.id == booking_id)
        .first()
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    new_status = body.status.lower()
    allowed_owner = {"confirmed", "cancelled", "active", "completed"}
    allowed_renter = {"cancelled"}

    is_owner = booking.listing and booking.listing.owner_id == current_user.id
    is_renter = booking.renter_id == current_user.id

    if is_owner and new_status not in allowed_owner:
        raise HTTPException(status_code=400, detail="Invalid status for owner")
    if is_renter and not is_owner and new_status not in allowed_renter:
        raise HTTPException(status_code=403, detail="Renter can only cancel")
    if not is_owner and not is_renter:
        raise HTTPException(status_code=403, detail="Not allowed")

    if is_renter and not is_owner and booking.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Cannot cancel this booking")

    booking.status = new_status
    db.commit()
    db.refresh(booking)
    return _booking_to_out(booking)


@router.get("/{listing_id}", response_model=RentalOut)
def get_rental(
    listing_id: int,
    reveal_phone: bool = Query(False),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(RentalListing)
        .options(joinedload(RentalListing.owner))
        .filter(RentalListing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")
    show_phone = reveal_phone and current_user is not None
    is_owner = current_user and listing.owner_id == current_user.id
    return _rental_to_out(listing, hide_phone=not (show_phone or is_owner))


@router.get("/{listing_id}/availability", response_model=AvailabilityOut)
def rental_availability(listing_id: int, db: Session = Depends(get_db)):
    listing = db.query(RentalListing).filter(RentalListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")

    bookings = (
        db.query(RentalBooking)
        .filter(
            RentalBooking.listing_id == listing_id,
            RentalBooking.status.in_(ACTIVE_BOOKING_STATUSES),
        )
        .all()
    )
    return AvailabilityOut(
        booked_ranges=[
            DateRangeOut(start_date=b.start_date, end_date=b.end_date, status=b.status)
            for b in bookings
        ]
    )


@router.get("/{listing_id}/bookings", response_model=List[RentalBookingOut])
def listing_bookings(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(RentalListing).filter(RentalListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    bookings = (
        db.query(RentalBooking)
        .options(joinedload(RentalBooking.listing), joinedload(RentalBooking.renter))
        .filter(RentalBooking.listing_id == listing_id)
        .order_by(desc(RentalBooking.created_at))
        .all()
    )
    return [_booking_to_out(b) for b in bookings]


@router.post("", response_model=RentalOut)
def create_rental(
    body: RentalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.vehicle_type not in ("car", "bike"):
        raise HTTPException(status_code=400, detail="vehicle_type must be car or bike")
    if len(body.images) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 images allowed")

    listing = RentalListing(
        owner_id=current_user.id,
        vehicle_type=body.vehicle_type,
        title=body.title,
        brand=body.brand,
        model_name=body.model_name,
        year=body.year,
        fuel_type=body.fuel_type,
        transmission=body.transmission,
        kms_driven=body.kms_driven,
        price_per_day=body.price_per_day,
        price_per_week=body.price_per_week,
        price_per_month=body.price_per_month,
        location=body.location,
        description=body.description,
        images=json.dumps(body.images[:6]),
        is_available=True,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    listing.owner = current_user
    return _rental_to_out(listing, hide_phone=False)


@router.put("/{listing_id}", response_model=RentalOut)
def update_rental(
    listing_id: int,
    body: RentalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(RentalListing).filter(RentalListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    data = body.model_dump(exclude_unset=True)
    if "images" in data and data["images"] is not None:
        if len(data["images"]) > 6:
            raise HTTPException(status_code=400, detail="Maximum 6 images")
        data["images"] = json.dumps(data["images"][:6])
    data["updated_at"] = datetime.utcnow()
    for k, v in data.items():
        setattr(listing, k, v)

    db.commit()
    db.refresh(listing)
    listing.owner = current_user
    return _rental_to_out(listing, hide_phone=False)


@router.delete("/{listing_id}")
def delete_rental(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(RentalListing).filter(RentalListing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")
    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(listing)
    db.commit()
    return {"ok": True}


@router.post("/{listing_id}/book", response_model=RentalBookingOut)
def book_rental(
    listing_id: int,
    body: RentalBookRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(RentalListing)
        .options(joinedload(RentalListing.owner))
        .filter(RentalListing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Rental not found")
    if not listing.is_available:
        raise HTTPException(status_code=400, detail="Listing is not available")
    if listing.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot book your own listing")

    start = body.start_date.replace(tzinfo=None) if body.start_date.tzinfo else body.start_date
    end = body.end_date.replace(tzinfo=None) if body.end_date.tzinfo else body.end_date
    if end <= start:
        raise HTTPException(status_code=400, detail="end_date must be after start_date")
    if start.date() < datetime.utcnow().date():
        raise HTTPException(status_code=400, detail="start_date cannot be in the past")

    total_days = max(1, (end.date() - start.date()).days)
    if total_days == 0:
        total_days = 1

    existing = (
        db.query(RentalBooking)
        .filter(
            RentalBooking.listing_id == listing_id,
            RentalBooking.status.in_(ACTIVE_BOOKING_STATUSES),
        )
        .all()
    )
    for b in existing:
        if _dates_overlap(start, end, b.start_date, b.end_date):
            raise HTTPException(status_code=409, detail="Selected dates overlap with an existing booking")

    total_price = _calc_price(listing, total_days)
    booking = RentalBooking(
        listing_id=listing_id,
        renter_id=current_user.id,
        start_date=start,
        end_date=end,
        total_days=total_days,
        total_price=total_price,
        status="pending",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    booking.listing = listing
    booking.renter = current_user
    return _booking_to_out(booking)
