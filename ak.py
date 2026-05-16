import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Lasso
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn import metrics
import warnings


# Suppress FutureWarning from scikit-learn metrics display
warnings.filterwarnings("ignore", category=FutureWarning)

# --- 1. CONFIGURATION AND STYLING ---

st.set_page_config(
    page_title="AutoValuAI — Vehicle Price Predictor",
    layout="wide",
    page_icon="🚗"
)

# Custom CSS for a professional, dark/clean theme
st.markdown("""
    <style>
    /* Main container background and text */
    .stApp {
        background-color: #1E1E1E; /* Dark background */
        color: #F0F2F6; /* Light text */
    }
    h1 {
        text-align: center;
        color: #00CCBB !important; /* Teal accent color */
        font-weight: 800;
        letter-spacing: 1px;
        padding-top: 10px;
    }
    h2, h3 {
        color: #00CCBB;
    }
    /* Sidebar styling */
    .stSidebar {
        background-color: #2F2F2F; 
        padding: 10px;
        border-radius: 10px;
    }
    .stSidebar .stSelectbox, .stSidebar .stSlider {
        background-color: #3C3C3C;
        border-radius: 5px;
        padding: 5px;
    }

    /* Prediction Card styling */
    .prediction-card {
        background-color: #282828;
        padding: 30px;
        border-radius: 15px;
        box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4);
        text-align: center;
        margin-top: 20px;
    }
    .prediction-card h2 {
        color: #00CCBB;
        font-size: 24px;
        margin-bottom: 5px;
    }
    .price-value {
        color: #FFD700; /* Gold for emphasis */
        font-size: 4em;
        font-weight: 900;
        margin: 0;
    }

    /* Button Styling */
    .stButton>button {
        background-color: #00CCBB;
        color: #1E1E1E;
        font-weight: bold;
        border-radius: 8px;
        padding: 10px 20px;
        border: none;
        margin-top: 15px;
        width: 100%;
        transition: background-color 0.2s;
    }
    .stButton>button:hover {
        background-color: #00A38D;
    }
    
    /* Metric Card Styling */
    [data-testid="stMetric"] {
        background-color: #282828;
        padding: 15px;
        border-radius: 10px;
        border-left: 3px solid #00CCBB;
        box-shadow: 2px 2px 10px rgba(0,0,0,0.2);
    }
    </style>
    """, unsafe_allow_html=True)


# --- 1.5 VEHICLE TYPE SELECTION ---

st.markdown("<h1>🚗 Vehicle Price Predictor</h1>", unsafe_allow_html=True)
st.markdown("Predict selling prices for cars and bikes using machine learning models.")

vehicle_type = st.selectbox("Select Vehicle Type", ["Car", "Bike"], index=0)

# --- 2. DATA LOADING AND MODEL TRAINING (CACHED) ---

def load_and_train_pipeline_v3(dataset_type):
    # Load dataset based on type
    if dataset_type == "Car":
        filename = "car_data.csv"
        name_col = 'Car_Name'
    elif dataset_type == "Bike":
        filename = "bike_data (1).csv"
        name_col = 'Bike_Name'
    else:
        st.error("Invalid dataset type.")
        return None
    
    try:
        df = pd.read_csv(filename)
    except FileNotFoundError:
        st.error(f"Error: '{filename}' not found. Please place the file in the application directory.")
        st.stop()
        return None
        
    vehicle_dataset = df.copy()

    # Preprocessing (using the explicit mappings from the user's code)
    vehicle_dataset.replace({'Fuel_Type':{'Petrol':0,'Diesel':1,'CNG':2,'Electric':3}}, inplace=True)
    vehicle_dataset.replace({'Seller_Type':{'Dealer':0,'Individual':1}}, inplace=True)
    vehicle_dataset.replace({'Transmission':{'Manual':0,'Automatic':1}}, inplace=True)

    x = vehicle_dataset.drop([name_col,'Selling_Price'], axis=1)
    y = vehicle_dataset['Selling_Price']

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=2)

    # Scale features for neural network
    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    # Train models
    lin_regr = LinearRegression()
    lin_regr.fit(x_train, y_train)
    lasso = Lasso()
    lasso.fit(x_train, y_train)
    rf = RandomForestRegressor(random_state=2)
    rf.fit(x_train, y_train)
    nn = MLPRegressor(random_state=2, max_iter=1000, hidden_layer_sizes=(64, 32), learning_rate_init=0.01)
    nn.fit(x_train_scaled, y_train)
    
    # Calculate R2 scores for display
    r2_lin_test = metrics.r2_score(y_test, lin_regr.predict(x_test))
    r2_lasso_test = metrics.r2_score(y_test, lasso.predict(x_test))
    r2_rf_test = metrics.r2_score(y_test, rf.predict(x_test))
    r2_nn_test = metrics.r2_score(y_test, nn.predict(x_test_scaled))

    # Select the best model based on R2 score
    models = {'Linear Regression': (lin_regr, r2_lin_test), 'Lasso': (lasso, r2_lasso_test), 'Random Forest': (rf, r2_rf_test), 'Neural Network': (nn, r2_nn_test)}
    best_model_name = max(models, key=lambda k: models[k][1])
    best_model, best_r2 = models[best_model_name]

    # Store necessary artifacts
    artifacts = {
        'lin_regr': lin_regr,
        'lasso': lasso,
        'rf': rf,
        'nn': nn,
        'scaler': scaler,
        'best_model': best_model,
        'best_model_name': best_model_name,
        'x_columns': x.columns,
        'df_raw': df,
        'r2_lin_test': r2_lin_test,
        'r2_lasso_test': r2_lasso_test,
        'r2_rf_test': r2_rf_test,
        'r2_nn_test': r2_nn_test
    }
    return artifacts

# Run the pipeline
artifacts = load_and_train_pipeline_v3(vehicle_type)
if artifacts is None:
    st.stop()

# Unpack artifacts
lin_regr = artifacts['lin_regr']
lasso = artifacts['lasso']
rf = artifacts['rf']
nn = artifacts['nn']
scaler = artifacts['scaler']
best_model = artifacts['best_model']
best_model_name = artifacts['best_model_name']
X_COLS = artifacts['x_columns']
DF_RAW = artifacts['df_raw']
R2_LIN = artifacts['r2_lin_test']
R2_LASSO = artifacts['r2_lasso_test']
R2_RF = artifacts['r2_rf_test']
R2_NN = artifacts['r2_nn_test']


# --- 3. INPUTS (Sidebar) ---

st.sidebar.markdown(f"<h2>Input {vehicle_type} Data</h2>", unsafe_allow_html=True)

# Define mappings for easier prediction later
FUEL_MAP = {"Petrol":0, "Diesel":1, "CNG":2, "Electric":3}
SELLER_MAP = {"Dealer":0, "Individual":1}
TRANS_MAP = {"Manual":0, "Automatic":1}

with st.sidebar:
    # Use columns to align labels better
    col_a, col_b = st.columns(2)
    
    # Numerical Inputs
    with col_a:
        year = st.number_input("Year", 
                               min_value=int(DF_RAW['Year'].min()), 
                               max_value=int(DF_RAW['Year'].max()), 
                               value=int(DF_RAW['Year'].median()), 
                               step=1,
                               help="Manufacturing Year")
        
        present_price = st.number_input("Original Price (Lakhs)", 
                                        min_value=float(DF_RAW['Present_Price'].min()), 
                                        max_value=float(DF_RAW['Present_Price'].max()), 
                                        value=float(DF_RAW['Present_Price'].median()),
                                        step=0.1,
                                        format="%.2f",
                                        help="Ex-showroom Price when new")

    with col_b:
        km_driven = st.number_input("Kms Driven", 
                                    min_value=int(DF_RAW['Kms_Driven'].min()), 
                                    max_value=int(DF_RAW['Kms_Driven'].max()), 
                                    value=int(DF_RAW['Kms_Driven'].median()),
                                    step=1000,
                                    help="Total Kilometers Driven")
        
        owner = st.number_input("Previous Owners", 
                                min_value=0, max_value=4, value=0, step=1,
                                help="Number of previous owners (0 for first owner)")

    st.markdown("---")
    
    # Categorical Inputs
    fuel_options = sorted(DF_RAW['Fuel_Type'].unique())
    fuel_type = st.selectbox("Fuel Type", fuel_options)
    seller_type = st.selectbox("Seller Type", list(SELLER_MAP.keys()))
    transmission = st.selectbox("Transmission", list(TRANS_MAP.keys()))
    
    predict_button = st.button("GET PRICE ESTIMATE 💸", key="predict_btn")


# --- 4. PREDICTION LOGIC (Main Area) ---

if predict_button:
    
    # Construct input array based on the preprocessing pipeline
    try:
        input_data = np.array([[
            year, 
            present_price, 
            km_driven, 
            FUEL_MAP[fuel_type], 
            SELLER_MAP[seller_type], 
            TRANS_MAP[transmission], 
            owner
        ]])
        
        input_df = pd.DataFrame(input_data, columns=X_COLS)

        lin_pred = lin_regr.predict(input_df)[0]
        lasso_pred = lasso.predict(input_df)[0]
        rf_pred = rf.predict(input_df)[0]
        input_scaled = scaler.transform(input_df)
        nn_pred = nn.predict(input_scaled)[0]
        
        # Use the best model for final prediction
        if best_model_name == 'Neural Network':
            final_prediction = nn_pred
        else:
            final_prediction = best_model.predict(input_df)[0]

        # Ensure prediction is non-negative
        if final_prediction < 0:
            final_prediction = 0.1
        
        # Display Prediction
        st.markdown(f"""
            <div class="prediction-card">
                <h2>{best_model_name} Estimated Selling Price</h2>
                <p class="price-value">₹ {final_prediction:,.2f}</p>
                <p style='color:#A0A0A0;'>Lakhs INR</p>
                <p style='margin-top:15px; font-style:italic;'>Linear Regression estimate: ₹ {lin_pred:,.2f} Lakhs</p>
                <p style='font-style:italic;'>Lasso estimate: ₹ {lasso_pred:,.2f} Lakhs</p>
                <p style='font-style:italic;'>Random Forest estimate: ₹ {rf_pred:,.2f} Lakhs</p>
                <p style='font-style:italic;'>Neural Network estimate: ₹ {nn_pred:,.2f} Lakhs</p>
            </div>
            """, unsafe_allow_html=True)
            
    except Exception as e:
        st.error(f"An error occurred during prediction: {e}")


# --- 5. VISUALIZATIONS & PERFORMANCE (TABS) ---

st.markdown("---")
st.header(f"{vehicle_type} Analysis & Performance")

tab1, tab2 = st.tabs([f"📊 {vehicle_type} Data Distribution (EDA)", "⚙️ Model Performance Metrics"])

with tab1:
    st.subheader(f"Key {vehicle_type} Feature Distributions")
    
    # Use raw data for correct labels in Plotly
    df_raw = DF_RAW.copy() 
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        fig1 = px.histogram(df_raw, x="Fuel_Type", title="Fuel Type vs. Count", color="Fuel_Type", 
                            color_discrete_map={"Petrol": "#A333FF", "Diesel": "#00CCBB", "CNG": "#FF6347"})
        fig1.update_layout(showlegend=False, plot_bgcolor='#282828', paper_bgcolor='#282828', font_color='#F0F2F6')
        st.plotly_chart(fig1, use_container_width=True)
    
    with col2:
        fig2 = px.scatter(df_raw, x="Present_Price", y="Selling_Price", color="Transmission",
                           title=f"{vehicle_type} Selling Price vs. Original Price",
                           color_discrete_map={"Manual": "#FFD700", "Automatic": "#00CCBB"})
        fig2.update_layout(plot_bgcolor='#282828', paper_bgcolor='#282828', font_color='#F0F2F6')
        st.plotly_chart(fig2, use_container_width=True)
    
    with col3:
        fig3 = px.box(df_raw, x="Seller_Type", y="Selling_Price", title=f"{vehicle_type} Seller Type vs. Selling Price",
                      color="Seller_Type",
                      color_discrete_map={"Dealer": "#A333FF", "Individual": "#FF6347"})
        fig3.update_layout(showlegend=False, plot_bgcolor='#282828', paper_bgcolor='#282828', font_color='#F0F2F6')
        st.plotly_chart(fig3, use_container_width=True)

with tab2:
    st.subheader(f"{vehicle_type} Model Accuracy Comparison")
    
    perf_col1, perf_col2, perf_col3, perf_col4 = st.columns(4)

    # Linear Regression Metrics
    with perf_col1:
        st.markdown("### Linear Regression (R²)")
        st.metric(label="Test Set Accuracy", value=f"{R2_LIN:.4f}", delta=None, help="Accuracy on unseen data (test set).")
        
    # Lasso Regression Metrics
    with perf_col2:
        st.markdown("### Lasso Regression (R²)")
        st.metric(label="Test Set Accuracy", value=f"{R2_LASSO:.4f}", delta=None, help="Accuracy on unseen data (test set).")

    # Random Forest Metrics
    with perf_col3:
        st.markdown("### Random Forest (R²)")
        st.metric(label="Test Set Accuracy", value=f"{R2_RF:.4f}", delta=None, help="Accuracy on unseen data (test set).")

    # Neural Network Metrics
    with perf_col4:
        st.markdown("### Neural Network (R²)")
        st.metric(label="Test Set Accuracy", value=f"{R2_NN:.4f}", delta=None, help="Accuracy on unseen data (test set).")

    st.markdown(f"**Best Model Selected:** {best_model_name} (Highest R² on test set)")

st.markdown("""
    <p style='text-align: center; margin-top: 30px; color:#A0A0A0; font-size:14px;'>
    Built with Python, Scikit-learn, and Streamlit.
    </p>
    """, unsafe_allow_html=True)
