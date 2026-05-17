import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import asc, desc, func
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user, get_optional_user
from backend.database import PartOrder, SparePart, User, get_db
from backend.schemas import (
    CategoryCount,
    PartCreate,
    PartListResponse,
    PartOrderCreate,
    PartOrderOut,
    PartOrderStatusUpdate,
    PartOut,
    PartUpdate,
    SellerPublic,
)

router = APIRouter(prefix="/parts", tags=["parts"])

PART_CATEGORIES = [
    "Engine",
    "Brakes",
    "Electrical",
    "Body",
    "Suspension",
    "Tyres",
    "Accessories",
    "Other",
]


def _parse_json_list(raw: str) -> List[str]:
    return json.loads(raw or "[]")


def _part_to_out(part: SparePart, hide_phone: bool = True, listing_count: Optional[int] = None) -> PartOut:
    seller_data = None
    if part.seller:
        seller_data = SellerPublic(
            id=part.seller.id,
            full_name=part.seller.full_name,
            city=part.seller.city,
            role=part.seller.role,
            avatar_url=part.seller.avatar_url,
            created_at=part.seller.created_at,
            phone=None if hide_phone else part.seller.phone,
        )
    return PartOut(
        id=part.id,
        seller_id=part.seller_id,
        vehicle_type=part.vehicle_type,
        category=part.category,
        title=part.title,
        brand=part.brand,
        part_number=part.part_number,
        condition=part.condition,
        compatibility=_parse_json_list(part.compatibility),
        price=part.price,
        negotiable=part.negotiable,
        quantity_available=part.quantity_available,
        location=part.location,
        description=part.description,
        images=_parse_json_list(part.images),
        is_active=part.is_active,
        created_at=part.created_at,
        updated_at=part.updated_at,
        seller=seller_data,
        seller_listing_count=listing_count,
    )


def _order_to_out(order: PartOrder) -> PartOrderOut:
    return PartOrderOut(
        id=order.id,
        part_id=order.part_id,
        buyer_id=order.buyer_id,
        seller_id=order.seller_id,
        quantity=order.quantity,
        total_price=order.total_price,
        status=order.status,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        part_title=order.part.title if order.part else None,
        buyer_name=order.buyer.full_name if order.buyer else None,
        seller_name=order.seller.full_name if order.seller else None,
    )


@router.get("/categories", response_model=List[CategoryCount])
def part_categories(db: Session = Depends(get_db)):
    rows = (
        db.query(SparePart.category, func.count(SparePart.id))
        .filter(SparePart.is_active.is_(True))
        .group_by(SparePart.category)
        .all()
    )
    counts = {cat: cnt for cat, cnt in rows}
    return [CategoryCount(category=c, count=counts.get(c, 0)) for c in PART_CATEGORIES]


@router.get("", response_model=PartListResponse)
def list_parts(
    vehicle_type: Optional[str] = Query(None, alias="type"),
    category: Optional[str] = None,
    condition: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    negotiable_only: bool = Query(False),
    q: Optional[str] = Query(None, alias="search"),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    limit: int = Query(16, ge=1, le=50),
    exclude_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = (
        db.query(SparePart)
        .options(joinedload(SparePart.seller))
        .filter(SparePart.is_active.is_(True))
    )
    if vehicle_type in ("car", "bike"):
        query = query.filter(
            (SparePart.vehicle_type == vehicle_type) | (SparePart.vehicle_type == "both")
        )
    if category:
        query = query.filter(SparePart.category == category)
    if condition:
        query = query.filter(SparePart.condition == condition)
    if min_price is not None:
        query = query.filter(SparePart.price >= min_price)
    if max_price is not None:
        query = query.filter(SparePart.price <= max_price)
    if negotiable_only:
        query = query.filter(SparePart.negotiable.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (SparePart.title.ilike(like))
            | (SparePart.brand.ilike(like))
            | (SparePart.compatibility.ilike(like))
        )
    if exclude_id:
        query = query.filter(SparePart.id != exclude_id)

    if sort == "price_low":
        query = query.order_by(asc(SparePart.price))
    elif sort == "price_high":
        query = query.order_by(desc(SparePart.price))
    else:
        query = query.order_by(desc(SparePart.created_at))

    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()
    pages = max(1, (total + limit - 1) // limit)
    return PartListResponse(
        items=[_part_to_out(i) for i in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/my-parts", response_model=List[PartOut])
def my_parts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = (
        db.query(SparePart)
        .options(joinedload(SparePart.seller))
        .filter(SparePart.seller_id == current_user.id)
        .order_by(desc(SparePart.created_at))
        .all()
    )
    return [_part_to_out(i, hide_phone=False) for i in items]


@router.get("/my-orders/buying", response_model=List[PartOrderOut])
def my_orders_buying(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(PartOrder)
        .options(joinedload(PartOrder.part), joinedload(PartOrder.buyer), joinedload(PartOrder.seller))
        .filter(PartOrder.buyer_id == current_user.id)
        .order_by(desc(PartOrder.created_at))
        .all()
    )
    return [_order_to_out(o) for o in orders]


@router.get("/my-orders/selling", response_model=List[PartOrderOut])
def my_orders_selling(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = (
        db.query(PartOrder)
        .options(joinedload(PartOrder.part), joinedload(PartOrder.buyer), joinedload(PartOrder.seller))
        .filter(PartOrder.seller_id == current_user.id)
        .order_by(desc(PartOrder.created_at))
        .all()
    )
    return [_order_to_out(o) for o in orders]


@router.put("/orders/{order_id}/status", response_model=PartOrderOut)
def update_order_status(
    order_id: int,
    body: PartOrderStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(PartOrder)
        .options(joinedload(PartOrder.part), joinedload(PartOrder.buyer), joinedload(PartOrder.seller))
        .filter(PartOrder.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    new_status = body.status.lower()
    is_seller = order.seller_id == current_user.id
    is_buyer = order.buyer_id == current_user.id

    seller_allowed = {"confirmed", "shipped", "delivered", "cancelled"}
    buyer_allowed = {"cancelled"}

    if is_seller and new_status not in seller_allowed:
        raise HTTPException(status_code=400, detail="Invalid status for seller")
    if is_buyer and not is_seller and new_status not in buyer_allowed:
        raise HTTPException(status_code=403, detail="Buyer can only cancel")
    if not is_seller and not is_buyer:
        raise HTTPException(status_code=403, detail="Not allowed")

    if is_buyer and not is_seller and order.status not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Cannot cancel this order")

    if new_status == "cancelled" and is_buyer:
        order.part.quantity_available += order.quantity

    order.status = new_status
    db.commit()
    db.refresh(order)
    return _order_to_out(order)


@router.get("/{part_id}", response_model=PartOut)
def get_part(
    part_id: int,
    reveal_phone: bool = Query(False),
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db),
):
    part = (
        db.query(SparePart)
        .options(joinedload(SparePart.seller))
        .filter(SparePart.id == part_id, SparePart.is_active.is_(True))
        .first()
    )
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")

    listing_count = (
        db.query(func.count(SparePart.id))
        .filter(SparePart.seller_id == part.seller_id, SparePart.is_active.is_(True))
        .scalar()
    )
    show_phone = reveal_phone and current_user is not None
    is_seller = current_user and part.seller_id == current_user.id
    return _part_to_out(part, hide_phone=not (show_phone or is_seller), listing_count=listing_count)


@router.post("", response_model=PartOut)
def create_part(
    body: PartCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.vehicle_type not in ("car", "bike", "both"):
        raise HTTPException(status_code=400, detail="Invalid vehicle_type")
    if body.category not in PART_CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category")
    if body.condition not in ("New", "Used", "Refurbished"):
        raise HTTPException(status_code=400, detail="Invalid condition")
    if len(body.images) > 8:
        raise HTTPException(status_code=400, detail="Maximum 8 images allowed")

    part = SparePart(
        seller_id=current_user.id,
        vehicle_type=body.vehicle_type,
        category=body.category,
        title=body.title,
        brand=body.brand,
        part_number=body.part_number,
        condition=body.condition,
        compatibility=json.dumps(body.compatibility),
        price=body.price,
        negotiable=body.negotiable,
        quantity_available=body.quantity_available,
        location=body.location,
        description=body.description,
        images=json.dumps(body.images[:8]),
        is_active=True,
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    part.seller = current_user
    return _part_to_out(part, hide_phone=False)


@router.put("/{part_id}", response_model=PartOut)
def update_part(
    part_id: int,
    body: PartUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    if part.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    data = body.model_dump(exclude_unset=True)
    if "compatibility" in data and data["compatibility"] is not None:
        data["compatibility"] = json.dumps(data["compatibility"])
    if "images" in data and data["images"] is not None:
        if len(data["images"]) > 8:
            raise HTTPException(status_code=400, detail="Maximum 8 images")
        data["images"] = json.dumps(data["images"][:8])
    data["updated_at"] = datetime.utcnow()
    for k, v in data.items():
        setattr(part, k, v)

    db.commit()
    db.refresh(part)
    part.seller = current_user
    return _part_to_out(part, hide_phone=False)


@router.delete("/{part_id}")
def delete_part(
    part_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    part = db.query(SparePart).filter(SparePart.id == part_id).first()
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    if part.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")
    part.is_active = False
    part.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/{part_id}/order", response_model=PartOrderOut)
def place_order(
    part_id: int,
    body: PartOrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    part = (
        db.query(SparePart)
        .options(joinedload(SparePart.seller))
        .filter(SparePart.id == part_id, SparePart.is_active.is_(True))
        .first()
    )
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    if part.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot order your own part")
    if body.quantity > part.quantity_available:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    total_price = part.price * body.quantity
    order = PartOrder(
        part_id=part_id,
        buyer_id=current_user.id,
        seller_id=part.seller_id,
        quantity=body.quantity,
        total_price=total_price,
        status="pending",
        shipping_address=body.shipping_address,
    )
    part.quantity_available -= body.quantity
    db.add(order)
    db.commit()
    db.refresh(order)
    order.part = part
    order.buyer = current_user
    order.seller = part.seller
    return _order_to_out(order)
