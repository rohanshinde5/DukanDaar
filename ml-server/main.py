from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random

app = FastAPI(title="DukanDaar ML Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RiskRequest(BaseModel):
    customer_id: str
    delay_velocity: float # days
    current_debt: float

class RiskResponse(BaseModel):
    customer_id: str
    risk_category: str # Low, Medium, High
    risk_score: float

class ForecastRequest(BaseModel):
    monthly_repayment_speed: float
    upcoming_wholesaler_dues: float

class ForecastResponse(BaseModel):
    predicted_cash_deficit: float
    safety_margin: float
    alert: bool

class InventoryVelocityRequest(BaseModel):
    item_id: str
    sales_speed: float # items per day
    current_volume: int

class InventoryVelocityResponse(BaseModel):
    item_id: str
    restock_quota: int
    days_until_empty: int

@app.post("/predict-risk", response_model=RiskResponse)
def predict_risk(req: RiskRequest):
    # Mock Scikit-Learn logic
    score = (req.delay_velocity * 10) + (req.current_debt * 0.05)
    
    if score > 500:
        category = "High"
    elif score > 200:
        category = "Medium"
    else:
        category = "Low"
        
    return RiskResponse(
        customer_id=req.customer_id,
        risk_category=category,
        risk_score=score
    )

@app.post("/cash-forecast", response_model=ForecastResponse)
def cash_forecast(req: ForecastRequest):
    margin = req.monthly_repayment_speed - req.upcoming_wholesaler_dues
    
    if margin < 0:
        return ForecastResponse(
            predicted_cash_deficit=abs(margin),
            safety_margin=0.0,
            alert=True
        )
    else:
        return ForecastResponse(
            predicted_cash_deficit=0.0,
            safety_margin=margin,
            alert=False
        )

@app.post("/inventory-velocity", response_model=InventoryVelocityResponse)
def inventory_velocity(req: InventoryVelocityRequest):
    if req.sales_speed <= 0:
        days = 999
        restock = 0
    else:
        days = int(req.current_volume / req.sales_speed)
        restock = int(req.sales_speed * 30) # 30 day restock quota
        
    return InventoryVelocityResponse(
        item_id=req.item_id,
        restock_quota=restock,
        days_until_empty=days
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
