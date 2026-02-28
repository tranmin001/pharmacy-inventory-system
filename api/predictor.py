import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import random

class InventoryPredictor:
    def __init__(self):
        self.model = LinearRegression()
    
    def generate_usage_history(self, medication_id, current_quantity, days=30):
        """
        Simulate usage history based on medication patterns.
        In production, this would come from actual transaction logs.
        """
        history = []
        base_daily_usage = random.uniform(1, 5)
        
        for i in range(days, 0, -1):
            date = datetime.now() - timedelta(days=i)
            daily_variation = random.uniform(0.5, 1.5)
            usage = base_daily_usage * daily_variation
            
            if date.weekday() >= 5:
                usage *= 0.7
            
            history.append({
                'date': date,
                'day_of_week': date.weekday(),
                'usage': round(usage, 2)
            })
        
        return history, base_daily_usage
    
    def predict_stockout(self, medication_id, current_quantity, medication_name):
        """
        Predict when medication will run out and when to reorder.
        """
        history, avg_daily_usage = self.generate_usage_history(medication_id, current_quantity)
        
        if avg_daily_usage <= 0:
            return None
        
        df = pd.DataFrame(history)
        X = df[['day_of_week']].values
        y = df['usage'].values
        
        self.model.fit(X, y)
        
        future_days = []
        for i in range(1, 91):
            future_date = datetime.now() + timedelta(days=i)
            future_days.append({
                'date': future_date,
                'day_of_week': future_date.weekday()
            })
        
        future_df = pd.DataFrame(future_days)
        predicted_usage = self.model.predict(future_df[['day_of_week']].values)
        
        cumulative_usage = 0
        stockout_date = None
        reorder_date = None
        days_until_stockout = None
        
        for i, usage in enumerate(predicted_usage):
            cumulative_usage += max(0, usage)
            
            if reorder_date is None and cumulative_usage >= (current_quantity - 10):
                reorder_date = future_days[i]['date']
            
            if stockout_date is None and cumulative_usage >= current_quantity:
                stockout_date = future_days[i]['date']
                days_until_stockout = i + 1
                break
        
        if stockout_date is None:
            days_until_stockout = 90
            stockout_date = datetime.now() + timedelta(days=90)
        
        if reorder_date is None:
            reorder_date = stockout_date - timedelta(days=7)
        
        risk_level = "LOW"
        if days_until_stockout <= 7:
            risk_level = "CRITICAL"
        elif days_until_stockout <= 14:
            risk_level = "HIGH"
        elif days_until_stockout <= 30:
            risk_level = "MEDIUM"
        
        return {
            'medication_id': medication_id,
            'medication_name': medication_name,
            'current_quantity': current_quantity,
            'avg_daily_usage': round(avg_daily_usage, 2),
            'predicted_stockout_date': stockout_date.strftime('%Y-%m-%d'),
            'days_until_stockout': days_until_stockout,
            'recommended_reorder_date': reorder_date.strftime('%Y-%m-%d'),
            'risk_level': risk_level,
            'recommended_order_quantity': max(30, int(avg_daily_usage * 30))
        }
    
    def get_all_predictions(self, medications):
        """
        Get predictions for all medications.
        """
        predictions = []
        for med in medications:
            prediction = self.predict_stockout(
                med['id'],
                med['quantity'],
                med['name']
            )
            if prediction:
                predictions.append(prediction)
        
        predictions.sort(key=lambda x: x['days_until_stockout'])
        
        return predictions