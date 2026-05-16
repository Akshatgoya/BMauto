# AutoValuAI

Precision Valuation. Engineered by AI.

A full-stack, AI-powered vehicle price prediction marketplace inspired by luxury automotive themes.

## 🚀 Setup Instructions

### 1. Backend (FastAPI + Scikit-Learn)
1. Open a terminal in the **project root** (where `main.py` lives).
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI server:
   ```bash
   python main.py
   ```
4. The backend will load and train the models on startup, and serve the API at `http://localhost:8000`.

> **Note:** `backend/main.py` is a legacy duplicate. Use the root `main.py` for the React app and chatbot.

### 2. Frontend (React + Vite + Tailwind CSS)
1. Open a separate terminal and navigate to the `frontend` directory.
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the beautiful luxury UI at `http://localhost:5173`.

### 3. Marketplace (OLX-style Buy & Sell)

**Seed sample data (first time only):**
```bash
python backend/seed_data.py
```

**Demo account:** `priya@autovaluai.demo` / `demo1234`

**New pages:**
- `/marketplace` — Browse cars & bikes
- `/auth` — Sign in / Register
- `/sell` — Post a listing (login required)
- `/dashboard` — Profile, my listings, saved vehicles
- `/listing/:id` — Listing details

Database: SQLite at `backend/autovaluai.db`

### 4. AI Chatbot
- Open the Chatbot in the bottom right corner of the website.
- Enter your Gemini API key in the settings (Key icon) to chat with the AutoValuAI Assistant.
- Your key is stored securely in your browser's local storage.
- The assistant can run **live ML price predictions** when you describe a vehicle (year, original price in lakhs, km driven, fuel, seller, transmission, owners, car or bike). Ensure the root API is running (`python main.py`).
