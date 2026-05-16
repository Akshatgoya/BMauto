from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import PredictionRequest, PredictionResponse
from ml_pipeline import VehicleModelPipeline
import os
import uvicorn

app = FastAPI(title="BMauto API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables to hold pipelines
car_pipeline = None
bike_pipeline = None

@app.on_event("startup")
def startup_event():
    global car_pipeline, bike_pipeline
    try:
        # Get base dir (where main.py is)
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        car_pipeline = VehicleModelPipeline(os.path.join(base_dir, 'car_data.csv'), 'car')
        car_pipeline.load_and_train()
        print("Car model pipeline loaded successfully.")
        
        bike_pipeline = VehicleModelPipeline(os.path.join(base_dir, 'bike_data.csv'), 'bike')
        bike_pipeline.load_and_train()
        print("Bike model pipeline loaded successfully.")
        
    except Exception as e:
        print(f"Error during startup: {e}")

@app.post("/predict/car", response_model=PredictionResponse)
def predict_car(request: PredictionRequest):
    if not car_pipeline:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    input_data = request.model_dump()
    return car_pipeline.predict(input_data)

@app.post("/predict/bike", response_model=PredictionResponse)
def predict_bike(request: PredictionRequest):
    if not bike_pipeline:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    input_data = request.model_dump()
    return bike_pipeline.predict(input_data)

@app.get("/analytics/car")
def get_car_analytics():
    if not car_pipeline or car_pipeline.df_raw is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = car_pipeline.df_raw
    return {
        "fuel_distribution": df['Fuel_Type'].value_counts().to_dict(),
        "seller_distribution": df['Seller_Type'].value_counts().to_dict(),
        "price_ranges": {
            "min": float(df['Selling_Price'].min()),
            "max": float(df['Selling_Price'].max()),
            "mean": float(df['Selling_Price'].mean())
        }
    }

@app.get("/analytics/bike")
def get_bike_analytics():
    if not bike_pipeline or bike_pipeline.df_raw is None:
        raise HTTPException(status_code=500, detail="Data not loaded")
    
    df = bike_pipeline.df_raw
    return {
        "fuel_distribution": df['Fuel_Type'].value_counts().to_dict(),
        "seller_distribution": df['Seller_Type'].value_counts().to_dict(),
        "price_ranges": {
            "min": float(df['Selling_Price'].min()),
            "max": float(df['Selling_Price'].max()),
            "mean": float(df['Selling_Price'].mean())
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "models_loaded": car_pipeline is not None and bike_pipeline is not None
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
