import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user, get_optional_user
from backend.database import Listing, SavedListing, User, get_db
from backend.ml_utils import encode_listing_for_ml
from backend.schemas import ListingCreate, ListingListResponse, ListingOut, ListingUpdate, SellerPublic

router = APIRouter(prefix="/listings", tags=["listings"])

_predict_fn = None


def set_predict_fn(fn):
    global _predict_fn
    _predict_fn = fn


def _listing_to_out(listing: Listing, is_saved: bool = False, hide_phone: bool = True) -> ListingOut:
    photos = json.loads(listing.photos or "[]")
    seller_data = None
    if listing.seller:
        seller_data = SellerPublic(
            id=listing.seller.id,
            full_name=listing.seller.full_name,
            city=listing.seller.city,
            role=listing.seller.role,
            avatar_url=listing.seller.avatar_url,
            created_at=listing.seller.created_at,
            phone=None if hide_phone else listing.seller.phone,
        )
    return ListingOut(
        id=listing.id,
        seller_id=listing.seller_id,
        vehicle_type=listing.vehicle_type,
        title=listing.title,
        brand=listing.brand,
        model=listing.model,
        year=listing.year,
        present_price=listing.present_price,
        asking_price=listing.asking_price,
        ai_predicted_price=listing.ai_predicted_price,
        kms_driven=listing.kms_driven,
        fuel_type=listing.fuel_type,
        transmission=listing.transmission,
        owner_count=listing.owner_count,
        seller_type=listing.seller_type,
        color=listing.color,
        city=listing.city,
        description=listing.description,
        photos=photos,
        status=listing.status,
        views=listing.views,
        created_at=listing.created_at,
        seller=seller_data,
        is_saved=is_saved,
    )


def _run_ai_prediction(vehicle_type: str, listing_data: dict) -> float:
    if not _predict_fn:
        return listing_data.get("asking_price", 0)
    encoded = encode_listing_for_ml(
        listing_data["year"],
        listing_data["present_price"],
        listing_data["kms_driven"],
        listing_data["fuel_type"],
        listing_data["seller_type"],
        listing_data["transmission"],
        listing_data["owner_count"],
    )
    result = _predict_fn(vehicle_type, encoded)
    return float(result.get("best_prediction", listing_data.get("asking_price", 0)))


@router.post("/create", response_model=ListingOut)
def create_listing(
    body: ListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.vehicle_type not in ("car", "bike"):
        raise HTTPException(status_code=400, detail="vehicle_type must be car or bike")
    if len(body.photos) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 photos allowed")

    ai_price = _run_ai_prediction(body.vehicle_type, body.model_dump())

    listing = Listing(
        seller_id=current_user.id,
        vehicle_type=body.vehicle_type,
        title=body.title,
        brand=body.brand,
        model=body.model,
        year=body.year,
        present_price=body.present_price,
        asking_price=body.asking_price,
        ai_predicted_price=ai_price,
        kms_driven=body.kms_driven,
        fuel_type=body.fuel_type,
        transmission=body.transmission,
        owner_count=body.owner_count,
        seller_type=body.seller_type,
        color=body.color,
        city=body.city,
        description=body.description,
        photos=json.dumps(body.photos[:6]),
        status="active",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    listing.seller = current_user
    return _listing_to_out(listing)


@router.get("", response_model=ListingListResponse)
def list_listings(
    type: Optional[str] = Query(None, alias="type"),
    city: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    fuel: Optional[str] = None,
    brand: Optional[str] = None,
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    q = db.query(Listing).options(joinedload(Listing.seller)).filter(Listing.status == "active")

    if type in ("car", "bike"):
        q = q.filter(Listing.vehicle_type == type)
    if city:
        q = q.filter(Listing.city.ilike(f"%{city}%"))
    if min_price is not None:
        q = q.filter(Listing.asking_price >= min_price)
    if max_price is not None:
        q = q.filter(Listing.asking_price <= max_price)
    if fuel:
        q = q.filter(Listing.fuel_type == fuel)
    if brand:
        q = q.filter(Listing.brand.ilike(f"%{brand}%"))

    if sort == "price_low":
        q = q.order_by(asc(Listing.asking_price))
    elif sort == "price_high":
        q = q.order_by(desc(Listing.asking_price))
    elif sort == "popular":
        q = q.order_by(desc(Listing.views))
    else:
        q = q.order_by(desc(Listing.created_at))

    total = q.count()
    items = q.offset((page - 1) * limit).limit(limit).all()

    saved_ids = set()
    if current_user:
        saved_ids = {
            s.listing_id
            for s in db.query(SavedListing).filter(SavedListing.user_id == current_user.id).all()
        }

    pages = max(1, (total + limit - 1) // limit)
    return ListingListResponse(
        items=[_listing_to_out(i, i.id in saved_ids) for i in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/user/my-listings", response_model=List[ListingOut])
def my_listings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(Listing)
        .options(joinedload(Listing.seller))
        .filter(Listing.seller_id == current_user.id)
        .order_by(desc(Listing.created_at))
        .all()
    )
    return [_listing_to_out(i) for i in items]


@router.get("/user/saved", response_model=List[ListingOut])
def saved_listings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = (
        db.query(SavedListing)
        .filter(SavedListing.user_id == current_user.id)
        .order_by(desc(SavedListing.saved_at))
        .all()
    )
    listing_ids = [s.listing_id for s in saved]
    if not listing_ids:
        return []
    items = (
        db.query(Listing)
        .options(joinedload(Listing.seller))
        .filter(Listing.id.in_(listing_ids))
        .all()
    )
    order = {lid: idx for idx, lid in enumerate(listing_ids)}
    items.sort(key=lambda x: order.get(x.id, 999))
    return [_listing_to_out(i, True) for i in items]


@router.get("/{listing_id}", response_model=ListingOut)
def get_listing(
    listing_id: int,
    reveal_phone: bool = Query(False),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    listing = (
        db.query(Listing)
        .options(joinedload(Listing.seller))
        .filter(Listing.id == listing_id)
        .first()
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    listing.views += 1
    db.commit()
    db.refresh(listing)

    is_saved = False
    if current_user:
        is_saved = (
            db.query(SavedListing)
            .filter(
                SavedListing.user_id == current_user.id,
                SavedListing.listing_id == listing_id,
            )
            .first()
            is not None
        )

    show_phone = reveal_phone and current_user is not None
    return _listing_to_out(listing, is_saved, hide_phone=not show_phone)


@router.put("/{listing_id}", response_model=ListingOut)
def update_listing(
    listing_id: int,
    body: ListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    data = body.model_dump(exclude_unset=True)
    if "photos" in data and data["photos"] is not None:
        if len(data["photos"]) > 6:
            raise HTTPException(status_code=400, detail="Maximum 6 photos")
        data["photos"] = json.dumps(data["photos"][:6])

    for k, v in data.items():
        setattr(listing, k, v)

    db.commit()
    db.refresh(listing)
    listing.seller = current_user
    return _listing_to_out(listing)


@router.delete("/{listing_id}")
def delete_listing(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    db.delete(listing)
    db.commit()
    return {"ok": True}


@router.post("/{listing_id}/save")
def toggle_save(
    listing_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    existing = (
        db.query(SavedListing)
        .filter(
            SavedListing.user_id == current_user.id,
            SavedListing.listing_id == listing_id,
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()
        return {"saved": False}
    db.add(SavedListing(user_id=current_user.id, listing_id=listing_id))
    db.commit()
    return {"saved": True}
