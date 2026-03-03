import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
import hashlib


class InventoryPredictor:
    def __init__(self):
        self.model = LinearRegression()

    def _med_seed(self, medication_id):
        """Deterministic seed from medication ID so predictions are stable across calls."""
        h = hashlib.sha256(f"pharmtrack-{medication_id}".encode()).hexdigest()
        return int(h[:8], 16)

    def _estimate_base_usage(self, current_quantity, price):
        """
        Derive a realistic base daily usage from medication properties.

        Reasoning:
        - Low-quantity items likely had higher recent usage (they're running out).
        - Cheaper items tend to be dispensed in higher volume.
        - Clamp to a reasonable pharmacy range of 0.5-8 units/day.
        """
        qty_factor = max(0.3, 1.0 - (current_quantity / 200))
        price_factor = max(0.4, 1.0 - (price / 500))
        base = 2.5 * qty_factor * price_factor
        return max(0.5, min(8.0, base))

    def generate_usage_history(self, medication_id, current_quantity, price, days=30):
        """
        Simulate 30-day usage history with deterministic randomness seeded
        by medication_id so the same medication always produces the same history.
        """
        rng = np.random.RandomState(self._med_seed(medication_id))
        base_usage = self._estimate_base_usage(current_quantity, price)

        history = []
        for i in range(days, 0, -1):
            date = datetime.now() - timedelta(days=i)
            weekday = date.weekday()

            daily_variation = rng.uniform(0.7, 1.3)
            usage = base_usage * daily_variation

            # Weekend reduction (pharmacies dispense less on weekends)
            if weekday >= 5:
                usage *= 0.6

            # Small upward trend to simulate increasing demand
            trend = 1.0 + (days - i) * 0.003
            usage *= trend

            history.append({
                'date': date,
                'day_index': days - i,
                'day_of_week': weekday,
                'is_weekend': 1 if weekday >= 5 else 0,
                'usage': round(max(0, usage), 2)
            })

        return history

    def predict_stockout(self, medication_id, current_quantity, medication_name, price=10.0, expiration_date=None):
        """
        Predict when a medication will run out and when to reorder.

        Uses multi-feature linear regression on simulated history:
          features = [day_index (trend), day_of_week, is_weekend]
        """
        history = self.generate_usage_history(medication_id, current_quantity, price)
        df = pd.DataFrame(history)

        # Compute actual average daily usage from the generated history
        avg_daily_usage = round(df['usage'].mean(), 2)

        if avg_daily_usage <= 0:
            return None

        # Train model on trend + weekday pattern + weekend flag
        features = ['day_index', 'day_of_week', 'is_weekend']
        X = df[features].values
        y = df['usage'].values
        self.model.fit(X, y)

        # Project forward up to 120 days
        projection_days = 120
        future_rows = []
        for i in range(1, projection_days + 1):
            future_date = datetime.now() + timedelta(days=i)
            future_rows.append({
                'date': future_date,
                'day_index': len(history) + i - 1,
                'day_of_week': future_date.weekday(),
                'is_weekend': 1 if future_date.weekday() >= 5 else 0
            })

        future_df = pd.DataFrame(future_rows)
        predicted_usage = self.model.predict(future_df[features].values)
        # Clamp negative predictions to zero
        predicted_usage = np.maximum(predicted_usage, 0)

        # Walk forward through predicted usage to find stockout and reorder dates
        cumulative_usage = 0.0
        stockout_date = None
        reorder_date = None
        days_until_stockout = None
        reorder_buffer = max(10, int(avg_daily_usage * 7))  # 7-day safety stock

        for i, usage in enumerate(predicted_usage):
            cumulative_usage += usage

            if reorder_date is None and cumulative_usage >= (current_quantity - reorder_buffer):
                reorder_date = future_rows[i]['date']

            if stockout_date is None and cumulative_usage >= current_quantity:
                stockout_date = future_rows[i]['date']
                days_until_stockout = i + 1
                break

        if stockout_date is None:
            days_until_stockout = projection_days
            stockout_date = datetime.now() + timedelta(days=projection_days)

        if reorder_date is None:
            reorder_date = stockout_date - timedelta(days=7)

        # Ensure reorder is always before stockout
        if reorder_date >= stockout_date:
            reorder_date = stockout_date - timedelta(days=max(1, days_until_stockout // 4))

        # Check if medication expires before stockout
        expires_before_stockout = False
        if expiration_date:
            try:
                exp = datetime.strptime(expiration_date, '%Y-%m-%d')
                if exp < stockout_date:
                    expires_before_stockout = True
            except ValueError:
                pass

        # Risk assessment
        if days_until_stockout <= 7:
            risk_level = "CRITICAL"
        elif days_until_stockout <= 14:
            risk_level = "HIGH"
        elif days_until_stockout <= 30:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"

        # Override to CRITICAL if expired or expiring before stockout
        if expires_before_stockout and risk_level not in ("CRITICAL",):
            if expiration_date:
                exp = datetime.strptime(expiration_date, '%Y-%m-%d')
                days_to_expire = (exp - datetime.now()).days
                if days_to_expire <= 7:
                    risk_level = "CRITICAL"
                elif days_to_expire <= 30:
                    risk_level = max(risk_level, "HIGH", key=["LOW", "MEDIUM", "HIGH", "CRITICAL"].index)

        # Recommended order covers 30 days of projected usage
        future_30_usage = float(np.sum(predicted_usage[:30]))
        recommended_order = max(30, int(round(future_30_usage)))

        return {
            'medication_id': medication_id,
            'medication_name': medication_name,
            'current_quantity': current_quantity,
            'avg_daily_usage': avg_daily_usage,
            'predicted_stockout_date': stockout_date.strftime('%Y-%m-%d'),
            'days_until_stockout': days_until_stockout,
            'recommended_reorder_date': reorder_date.strftime('%Y-%m-%d'),
            'risk_level': risk_level,
            'recommended_order_quantity': recommended_order,
            'expires_before_stockout': expires_before_stockout
        }

    def get_all_predictions(self, medications):
        """
        Get predictions for all medications, sorted by urgency.
        """
        predictions = []
        for med in medications:
            prediction = self.predict_stockout(
                med['id'],
                med['quantity'],
                med['name'],
                price=float(med.get('price', 10.0)),
                expiration_date=med.get('expiration_date')
            )
            if prediction:
                predictions.append(prediction)

        predictions.sort(key=lambda x: x['days_until_stockout'])
        return predictions
