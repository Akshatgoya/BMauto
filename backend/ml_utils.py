FUEL_MAP = {"Petrol": 0, "Diesel": 1, "CNG": 2, "Electric": 3}
SELLER_MAP = {"Dealer": 0, "Individual": 1}
TRANS_MAP = {"Manual": 0, "Automatic": 1}


def encode_listing_for_ml(
    year: int,
    present_price: float,
    kms_driven: int,
    fuel_type: str,
    seller_type: str,
    transmission: str,
    owner_count: int,
):
    return {
        "year": year,
        "present_price": present_price,
        "kms_driven": kms_driven,
        "fuel_type": FUEL_MAP.get(fuel_type, 0),
        "seller_type": SELLER_MAP.get(seller_type, 1),
        "transmission": TRANS_MAP.get(transmission, 0),
        "owner": owner_count,
    }
