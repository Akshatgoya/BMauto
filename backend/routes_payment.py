import hashlib
import hmac
import os
from typing import List, Optional

import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from backend.auth import get_current_user
from backend.database import Listing, Payment, User, get_db
from backend.schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    PaymentOut,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)

router = APIRouter(prefix="/payment", tags=["payment"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")


def _get_razorpay_client() -> razorpay.Client:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env",
        )
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def _lakhs_to_paise(amount_lakhs: float) -> int:
    return int(round(amount_lakhs * 10_000_000))


def _payment_to_out(payment: Payment, listing_title: Optional[str] = None) -> PaymentOut:
    buyer = payment.buyer
    return PaymentOut(
        id=payment.id,
        buyer_id=payment.buyer_id,
        seller_id=payment.seller_id,
        listing_id=payment.listing_id,
        razorpay_order_id=payment.razorpay_order_id,
        razorpay_payment_id=payment.razorpay_payment_id,
        amount=payment.amount,
        status=payment.status,
        payment_method=payment.payment_method,
        created_at=payment.created_at,
        listing_title=listing_title or (payment.listing.title if payment.listing else None),
        buyer_name=buyer.full_name if buyer else None,
        buyer_email=buyer.email if buyer else None,
        buyer_phone=buyer.phone if buyer else None,
    )


@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    body: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == body.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status == "sold":
        raise HTTPException(status_code=400, detail="This vehicle has already been sold")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot purchase your own listing")

    amount_lakhs = body.amount if body.amount is not None else listing.asking_price
    amount_paise = _lakhs_to_paise(amount_lakhs)
    if amount_paise < 100:
        raise HTTPException(status_code=400, detail="Amount too low for payment")

    client = _get_razorpay_client()
    try:
        order = client.order.create(
            {
                "amount": amount_paise,
                "currency": "INR",
                "receipt": f"listing_{listing.id}_{current_user.id}",
                "notes": {
                    "listing_id": str(listing.id),
                    "buyer_id": str(current_user.id),
                    "buyer_email": current_user.email,
                },
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {exc}") from exc

    payment = Payment(
        buyer_id=current_user.id,
        seller_id=listing.seller_id,
        listing_id=listing.id,
        razorpay_order_id=order["id"],
        amount=amount_lakhs,
        status="pending",
    )
    db.add(payment)
    db.commit()

    return CreateOrderResponse(
        order_id=order["id"],
        amount=amount_paise,
        currency="INR",
        razorpay_key=RAZORPAY_KEY_ID,
    )


@router.post("/verify", response_model=VerifyPaymentResponse)
def verify_payment(
    body: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Razorpay is not configured")

    listing = db.query(Listing).filter(Listing.id == body.listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot purchase your own listing")

    msg = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
    generated_sig = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        msg.encode(),
        hashlib.sha256,
    ).hexdigest()

    if generated_sig != body.razorpay_signature:
        payment = (
            db.query(Payment)
            .filter(
                Payment.razorpay_order_id == body.razorpay_order_id,
                Payment.buyer_id == current_user.id,
            )
            .first()
        )
        if payment:
            payment.status = "failed"
            db.commit()
        raise HTTPException(status_code=400, detail="Payment verification failed")

    payment = (
        db.query(Payment)
        .filter(
            Payment.razorpay_order_id == body.razorpay_order_id,
            Payment.buyer_id == current_user.id,
            Payment.listing_id == body.listing_id,
        )
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found")

    if payment.status == "success":
        return VerifyPaymentResponse(
            status="success",
            payment_id=payment.razorpay_payment_id or body.razorpay_payment_id,
            amount=payment.amount,
            listing_title=listing.title,
        )

    payment_method = "razorpay"
    try:
        client = _get_razorpay_client()
        rp_payment = client.payment.fetch(body.razorpay_payment_id)
        payment_method = rp_payment.get("method") or payment_method
    except Exception:
        pass

    payment.razorpay_payment_id = body.razorpay_payment_id
    payment.status = "success"
    payment.payment_method = payment_method
    listing.status = "sold"
    db.commit()

    return VerifyPaymentResponse(
        status="success",
        payment_id=body.razorpay_payment_id,
        amount=payment.amount,
        listing_title=listing.title,
    )


@router.get("/history", response_model=List[PaymentOut])
def payment_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(Payment)
        .options(joinedload(Payment.listing), joinedload(Payment.buyer))
        .filter(Payment.buyer_id == current_user.id)
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [_payment_to_out(p) for p in payments]


@router.get("/received", response_model=List[PaymentOut])
def payments_received(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payments = (
        db.query(Payment)
        .options(joinedload(Payment.listing), joinedload(Payment.buyer))
        .filter(Payment.seller_id == current_user.id, Payment.status == "success")
        .order_by(Payment.created_at.desc())
        .all()
    )
    return [_payment_to_out(p) for p in payments]
