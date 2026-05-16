import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression, Lasso
from sklearn.ensemble import RandomForestRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler
from sklearn import metrics
import warnings
import os

warnings.filterwarnings("ignore")

class VehicleModelPipeline:
    def __init__(self, dataset_path, vehicle_type):
        self.dataset_path = dataset_path
        self.vehicle_type = vehicle_type
        self.models = {}
        self.scaler = None
        self.best_model_name = ""
        self.metrics = {}
        self.df_raw = None

    def load_and_train(self):
        if not os.path.exists(self.dataset_path):
            raise FileNotFoundError(f"Dataset not found: {self.dataset_path}")
            
        df = pd.read_csv(self.dataset_path)
        self.df_raw = df.copy()
        
        # Preprocessing mappings (matching the frontend encoding)
        df.replace({'Fuel_Type': {'Petrol': 0, 'Diesel': 1, 'CNG': 2, 'Electric': 3}}, inplace=True)
        df.replace({'Seller_Type': {'Dealer': 0, 'Individual': 1}}, inplace=True)
        df.replace({'Transmission': {'Manual': 0, 'Automatic': 1}}, inplace=True)
        
        name_col = 'Car_Name' if self.vehicle_type == 'car' else 'Bike_Name'
        x = df.drop([name_col, 'Selling_Price'], axis=1)
        y = df['Selling_Price']
        
        self.feature_columns = x.columns
        
        x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=2)
        
        self.scaler = StandardScaler()
        x_train_scaled = self.scaler.fit_transform(x_train)
        x_test_scaled = self.scaler.transform(x_test)
        
        lin_regr = LinearRegression()
        lin_regr.fit(x_train, y_train)
        
        lasso = Lasso()
        lasso.fit(x_train, y_train)
        
        rf = RandomForestRegressor(random_state=2)
        rf.fit(x_train, y_train)
        
        nn = MLPRegressor(random_state=2, max_iter=1000, hidden_layer_sizes=(64, 32), learning_rate_init=0.01)
        nn.fit(x_train_scaled, y_train)
        
        r2_lin = metrics.r2_score(y_test, lin_regr.predict(x_test))
        r2_lasso = metrics.r2_score(y_test, lasso.predict(x_test))
        r2_rf = metrics.r2_score(y_test, rf.predict(x_test))
        r2_nn = metrics.r2_score(y_test, nn.predict(x_test_scaled))
        
        self.metrics = {
            'linear': r2_lin,
            'lasso': r2_lasso,
            'rf': r2_rf,
            'nn': r2_nn
        }
        
        self.models = {
            'linear': lin_regr,
            'lasso': lasso,
            'rf': rf,
            'nn': nn
        }
        
        best_model_key = max(self.metrics, key=self.metrics.get)
        model_names = {
            'linear': 'Linear Regression',
            'lasso': 'Lasso Regression',
            'rf': 'Random Forest',
            'nn': 'Neural Network'
        }
        self.best_model_name = model_names[best_model_key]
        self.best_model_key = best_model_key
        
    def predict(self, input_data):
        mapped_input = {
            'Year': input_data['year'],
            'Present_Price': input_data['present_price'],
            'Kms_Driven': input_data['kms_driven'],
            'Fuel_Type': input_data['fuel_type'],
            'Seller_Type': input_data['seller_type'],
            'Transmission': input_data['transmission'],
            'Owner': input_data['owner']
        }
        input_df = pd.DataFrame([mapped_input], columns=self.feature_columns)
        
        lin_pred = self.models['linear'].predict(input_df)[0]
        lasso_pred = self.models['lasso'].predict(input_df)[0]
        rf_pred = self.models['rf'].predict(input_df)[0]
        
        input_scaled = self.scaler.transform(input_df)
        nn_pred = self.models['nn'].predict(input_scaled)[0]
        
        preds = {
            'linear': lin_pred,
            'lasso': lasso_pred,
            'rf': rf_pred,
            'nn': nn_pred
        }
        
        best_pred = preds[self.best_model_key]
        
        # Ensure non-negative predictions
        return {
            'best_model': self.best_model_name,
            'best_prediction': max(best_pred, 0.1),
            'linear_pred': max(lin_pred, 0.1),
            'lasso_pred': max(lasso_pred, 0.1),
            'rf_pred': max(rf_pred, 0.1),
            'nn_pred': max(nn_pred, 0.1),
            'r2_linear': self.metrics['linear'],
            'r2_lasso': self.metrics['lasso'],
            'r2_rf': self.metrics['rf'],
            'r2_nn': self.metrics['nn']
        }
