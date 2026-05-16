from pydantic import BaseModel

class PredictionRequest(BaseModel):
    year: int
    present_price: float
    kms_driven: int
    fuel_type: int
    seller_type: int
    transmission: int
    owner: int

class PredictionResponse(BaseModel):
    best_model: str
    best_prediction: float
    linear_pred: float
    lasso_pred: float
    rf_pred: float
    nn_pred: float
    r2_linear: float
    r2_lasso: float
    r2_rf: float
    r2_nn: float
