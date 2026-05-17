# 🚗 BMauto — AI-Powered Vehicle Price Predictor & Marketplace

> **Precision Valuation. Engineered by AI.**  
> Buy, sell, and valuate cars & bikes with machine learning — built for the Indian market.

---

### 🌟 What is BMauto?

BMauto is a full-stack, AI-powered vehicle marketplace that brings together smart price prediction, OLX-style listings, rental features, and an AI chatbot assistant — all wrapped in a luxury-inspired interface.

Whether you're a seller trying to price your car fairly, or a buyer wanting to know if a deal is worth it, BMauto gives you data-driven confidence backed by multiple ML models trained on real Indian vehicle data.

---

### ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **🤖 ML Price Prediction** | 4 models (Linear Regression, Lasso, Random Forest, Neural Network) compete — the best one wins |
| **🛒 Marketplace** | OLX-style buy & sell listings for cars and bikes |
| **🔐 Auth System** | JWT-based register/login with secure password hashing |
| **💳 Payments** | Razorpay integration for seamless transactions |
| **🏍️ Rentals** | Browse and book vehicles on rent |
| **🔧 Spare Parts** | List and discover vehicle spare parts |
| **💬 AI Chatbot** | Gemini-powered assistant that can run live price predictions |
| **📊 Analytics Dashboard** | EDA charts, model performance comparisons, feature distributions |

---

### 🏗️ Tech Stack

* **Backend:** Python · FastAPI · Scikit-learn · SQLAlchemy · SQLite · Uvicorn
* **Frontend:** React · Vite · Tailwind CSS
* **ML Models:** Linear Regression · Lasso · Random Forest · MLP Neural Network · StandardScaler
* **AI:** Google Gemini 1.5 Flash (chatbot)
* **Payments:** Razorpay

---

### 📁 Project Structure

```
BMauto/
├── main.py                  # FastAPI app entry point + ML training
├── car_data.csv             # Car dataset (Indian market)
├── bike_data (1).csv        # Bike dataset (Indian market)
├── requirements.txt         # Python dependencies
├── .env                     # Environment variables (not committed)
├── .env.example             # Sample env config
│
├── backend/
│   ├── database.py          # DB init and session management
│   ├── models.py            # SQLAlchemy ORM models
│   ├── routes_auth.py       # Auth endpoints (register/login)
│   ├── routes_listings.py   # Marketplace listing CRUD
│   ├── routes_payment.py    # Razorpay payment routes
│   ├── routes_rentals.py    # Rental booking routes
│   ├── routes_parts.py      # Spare parts routes
│   └── seed_data.py         # Sample data seeder
│
├── frontend/
│   ├── src/
│   │   ├── pages/           # React pages (Home, Marketplace, Auth, etc.)
│   │   └── components/      # Reusable UI components (Chatbot, Navbar, etc.)
│   ├── package.json
│   └── vite.config.js
│
└── ak.py                    # Standalone Streamlit version (optional)
```

---

### 🚀 Getting Started

#### Prerequisites
* Python 3.9+
* Node.js 18+
* pip

#### 1. Clone the Repository
```bash
git clone https://github.com/Akshatgoya/BMauto.git
cd BMauto
```

#### 2. Configure Environment Variables
Copy the example env file and fill in your values:
```bash
cp .env.example .env
```
Open `.env` and add:
```env
SECRET_KEY=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

#### 3. Backend Setup (FastAPI + ML)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the backend server
python main.py
```
The server starts at `http://localhost:8000`

> **What happens on startup?**  
> The app automatically trains all 4 ML models on the car and bike datasets, selects the best-performing one by R² score, and serves it via the prediction API — no manual training step needed.

#### 4. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The app opens at `http://localhost:5173`

#### 5. Seed Sample Marketplace Data (First Time Only)
```bash
python backend/seed_data.py
```

Demo account to log in:
* **Email:** `priya@autovaluai.demo`
* **Password:** `demo1234`

---

### 🔮 How the ML Prediction Works

When you hit "GET PRICE ESTIMATE", here's what happens under the hood:
1. Your vehicle inputs (year, original price, km driven, fuel type, seller type, transmission, owners) are passed to all 4 models simultaneously.
2. Each model was trained on an 80/20 train-test split with `random_state=2` for reproducibility.
3. The model with the highest R² score on the test set is automatically selected as the primary predictor.
4. The Neural Network uses a `StandardScaler` for feature normalization; the other models use raw features.
5. All predictions are floored at `₹0.1 Lakhs` to avoid negative outputs.

#### Typical Model Performance (Car Dataset):

| Model | Approximate R² |
| :--- | :--- |
| **Random Forest** | ~0.96 |
| **Neural Network** | ~0.87 |
| **Linear Regression** | ~0.86 |
| **Lasso Regression** | ~0.86 |

> *Actual scores vary by run and dataset split.*

---

### 🛣️ App Pages & Routes

| Route | Page |
| :--- | :--- |
| `/` | Home — Hero, Features, CTA |
| `/marketplace` | Browse cars & bikes for sale |
| `/sell` | Post a new listing (login required) |
| `/listing/:id` | View listing details |
| `/auth` | Sign in / Register |
| `/dashboard` | Profile, my listings, saved vehicles |
| `/predict` | Standalone price predictor tool |
| `/rentals` | Browse rental vehicles |
| `/parts` | Spare parts marketplace |

---

### 🤖 AI Chatbot

The chatbot lives in the bottom-right corner of the app. It's powered by Google Gemini 1.5 Flash and knows the Indian used vehicle market deeply.

#### How to use it:
1. Click the chat icon.
2. Enter your Gemini API key via the key icon (stored locally in your browser — never sent to our servers).
3. Describe a vehicle (e.g., *"2019 Honda City, 45,000 km, petrol, dealer, automatic, first owner, original price 12 Lakhs"*) and it will call the live ML API to give you a price estimate.

---

### 📊 Analytics Endpoints

```http
GET  /analytics/car    → Fuel distribution, seller breakdown, price ranges
GET  /analytics/bike   → Same for bikes
GET  /health           → Server status and model load confirmation
```

---

### 🔌 API Reference

#### Predict Price
```http
POST /predict/car
POST /predict/bike
```

**Request Body:**
```json
{
  "year": 2019,
  "present_price": 8.5,
  "kms_driven": 45000,
  "fuel_type": 0,
  "seller_type": 0,
  "transmission": 0,
  "owner": 0
}
```

**Encoding Reference:**

| Field | Values |
| :--- | :--- |
| `fuel_type` | Petrol=0, Diesel=1, CNG=2, Electric=3 |
| `seller_type` | Dealer=0, Individual=1 |
| `transmission` | Manual=0, Automatic=1 |

**Response:**
```json
{
  "best_model": "Random Forest",
  "best_prediction": 5.43,
  "linear_pred": 4.91,
  "lasso_pred": 4.89,
  "rf_pred": 5.43,
  "nn_pred": 5.21,
  "r2_linear": 0.862,
  "r2_lasso": 0.861,
  "r2_rf": 0.963,
  "r2_nn": 0.874
}
```

---

### 🖥️ Standalone Streamlit App (Optional)

If you just want the predictor without the full marketplace stack:
```bash
pip install streamlit plotly scikit-learn pandas
streamlit run ak.py
```
Place `car_data.csv` and `bike_data (1).csv` in the same directory. The Streamlit app is a self-contained version of the predictor with interactive charts.

---

### 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

### 📄 License

This project is licensed under the MIT License.

---

### 🙏 Acknowledgements

* Dataset sourced from the Indian used vehicle market
* UI inspired by luxury automotive aesthetics
* Built with ❤️ using Python, React, and the power of open-source ML

<p align="center">
  <b>BMauto</b> — Precision Valuation. Engineered by AI.
</p>
