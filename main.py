from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))
except ImportError:
    pass

from backend.database import init_db
from backend.routes_auth import router as auth_router
from backend.routes_listings import router as listings_router
from backend.routes_listings import set_predict_fn
from backend.routes_payment import router as payment_router
from backend.routes_rentals import router as rentals_router
from backend.routes_parts import router as parts_router
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression, Lasso
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn import metrics
import warnings

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CAR_CSV = os.path.join(BASE_DIR, "car_data.csv")
BIKE_CSV = os.path.join(BASE_DIR, "bike_data (1).csv")

app = FastAPI(title="BMauto API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

car_models = None
bike_models = None
car_scaler = None
bike_scaler = None
car_df_raw = None
bike_df_raw = None
car_metrics = None
bike_metrics = None
car_best_key = None
bike_best_key = None
MODEL_NAMES = {
    "lr": "Linear Regression",
    "lasso": "Lasso Regression",
    "rf": "Random Forest",
    "nn": "Neural Network",
}


def _train_vehicle(csv_path, name_col):
    df_raw = pd.read_csv(csv_path)
    df = df_raw.copy()
    df.replace({"Fuel_Type": {"Petrol": 0, "Diesel": 1, "CNG": 2, "Electric": 3}}, inplace=True)
    df.replace({"Seller_Type": {"Dealer": 0, "Individual": 1}}, inplace=True)
    df.replace({"Transmission": {"Manual": 0, "Automatic": 1}}, inplace=True)

    x = df.drop([name_col, "Selling_Price"], axis=1)
    y = df["Selling_Price"]
    x_tr, x_te, y_tr, y_te = train_test_split(x, y, test_size=0.2, random_state=2)

    scaler = StandardScaler()
    x_scaled = scaler.fit_transform(x_tr)
    x_te_scaled = scaler.transform(x_te)

    models = {
        "lr": LinearRegression().fit(x_tr, y_tr),
        "lasso": Lasso().fit(x_tr, y_tr),
        "rf": RandomForestRegressor(random_state=2).fit(x_tr, y_tr),
        "nn": MLPRegressor(
            random_state=2, max_iter=1000, hidden_layer_sizes=(64, 32)
        ).fit(x_scaled, y_tr),
    }

    r2 = {
        "lr": metrics.r2_score(y_te, models["lr"].predict(x_te)),
        "lasso": metrics.r2_score(y_te, models["lasso"].predict(x_te)),
        "rf": metrics.r2_score(y_te, models["rf"].predict(x_te)),
        "nn": metrics.r2_score(y_te, models["nn"].predict(x_te_scaled)),
    }
    best_key = max(r2, key=r2.get)

    return df_raw, models, scaler, r2, best_key


def _predict(models, scaler, metrics_dict, best_key, data: "VehicleInput"):
    df = pd.DataFrame(
        [
            {
                "Year": data.year,
                "Present_Price": data.present_price,
                "Kms_Driven": data.kms_driven,
                "Fuel_Type": data.fuel_type,
                "Seller_Type": data.seller_type,
                "Transmission": data.transmission,
                "Owner": data.owner,
            }
        ]
    )
    xs = scaler.transform(df)

    preds = {
        "lr": max(0.1, float(models["lr"].predict(df)[0])),
        "lasso": max(0.1, float(models["lasso"].predict(df)[0])),
        "rf": max(0.1, float(models["rf"].predict(df)[0])),
        "nn": max(0.1, float(models["nn"].predict(xs)[0])),
    }
    best_pred = preds[best_key]

    return {
        "best_model": MODEL_NAMES[best_key],
        "best_prediction": best_pred,
        "linear_pred": preds["lr"],
        "lasso_pred": preds["lasso"],
        "rf_pred": preds["rf"],
        "nn_pred": preds["nn"],
        "r2_linear": metrics_dict["lr"],
        "r2_lasso": metrics_dict["lasso"],
        "r2_rf": metrics_dict["rf"],
        "r2_nn": metrics_dict["nn"],
    }


@app.on_event("startup")
async def train():
    global car_models, bike_models, car_scaler, bike_scaler
    global car_df_raw, bike_df_raw, car_metrics, bike_metrics
    global car_best_key, bike_best_key

    init_db()

    car_df_raw, car_models, car_scaler, car_metrics, car_best_key = _train_vehicle(
        CAR_CSV, "Car_Name"
    )
    bike_df_raw, bike_models, bike_scaler, bike_metrics, bike_best_key = _train_vehicle(
        BIKE_CSV, "Bike_Name"
    )


app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(payment_router)
app.include_router(rentals_router)
app.include_router(parts_router)


class VehicleInput(BaseModel):
    year: int
    present_price: float
    kms_driven: int
    fuel_type: int
    seller_type: int
    transmission: int
    owner: int


@app.post("/predict/car")
def predict_car(data: VehicleInput):
    if not car_models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    return _predict(car_models, car_scaler, car_metrics, car_best_key, data)


@app.post("/predict/bike")
def predict_bike(data: VehicleInput):
    if not bike_models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    return _predict(bike_models, bike_scaler, bike_metrics, bike_best_key, data)


def _predict_for_marketplace(vehicle_type: str, encoded: dict):
    data = VehicleInput(**encoded)
    if vehicle_type == "bike":
        if not bike_models:
            return {"best_prediction": max(data.present_price * 0.75, 0.1)}
        return _predict(bike_models, bike_scaler, bike_metrics, bike_best_key, data)
    if not car_models:
        return {"best_prediction": max(data.present_price * 0.75, 0.1)}
    return _predict(car_models, car_scaler, car_metrics, car_best_key, data)


set_predict_fn(_predict_for_marketplace)


@app.get("/analytics/car")
def get_car_analytics():
    if car_df_raw is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    df = car_df_raw
    return {
        "fuel_distribution": df["Fuel_Type"].value_counts().to_dict(),
        "seller_distribution": df["Seller_Type"].value_counts().to_dict(),
        "price_ranges": {
            "min": float(df["Selling_Price"].min()),
            "max": float(df["Selling_Price"].max()),
            "mean": float(df["Selling_Price"].mean()),
        },
    }


@app.get("/analytics/bike")
def get_bike_analytics():
    if bike_df_raw is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    df = bike_df_raw
    return {
        "fuel_distribution": df["Fuel_Type"].value_counts().to_dict(),
        "seller_distribution": df["Seller_Type"].value_counts().to_dict(),
        "price_ranges": {
            "min": float(df["Selling_Price"].min()),
            "max": float(df["Selling_Price"].max()),
            "mean": float(df["Selling_Price"].mean()),
        },
    }


@app.get("/health")
def health():
    models_loaded = car_models is not None and bike_models is not None
    return {
        "status": "ok",
        "service": "autovaluai",
        "models_loaded": models_loaded,
    }


class ChatRequest(BaseModel):
    message: str
    history: list = []
    api_key: str = None


@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    api_key = request.api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="Gemini API key is required")

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        # Basic system prompt
        system_instruction = (
            "You are BMauto, an expert vehicle pricing assistant for the Indian used car and bike market. "
            "You explain depreciation, resale factors, and market trends. Use ₹ and Lakhs for prices."
        )

        # In a real tool-use scenario, we'd add tools here, but for now we'll do a simple chat
        # to allow the chatbot to "run" as requested.
        chat = model.start_chat(history=request.history)
        response = chat.sendMessage(f"{system_instruction}\n\nUser: {request.message}")

        return {"response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
