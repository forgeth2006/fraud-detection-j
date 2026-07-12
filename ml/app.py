from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os

app = Flask(__name__)
CORS(app)

# ── Load model and artifacts ──────────────────────
print("Loading ML model...")

try:
    model = joblib.load('model/fraud_model.pkl')
    scaler = joblib.load('model/scaler.pkl')
    feature_names = joblib.load('model/feature_names.pkl')

    with open('model/metrics.json', 'r') as f:
        metrics = json.load(f)

    print("Model loaded successfully!")
    print(f"Model accuracy: {metrics['accuracy'] * 100:.2f}%")
    print(f"Model recall: {metrics['recall'] * 100:.2f}%")

except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    metrics = {}

# ── Health check endpoint ─────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'model_loaded': model is not None,
        'model_metrics': metrics,
    })

# ── Prediction endpoint ───────────────────────────
@app.route('/predict', methods=['POST'])
def predict():
    try:
        if model is None:
            return jsonify({
                'success': False,
                'message': 'Model not loaded',
            }), 500

        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided',
            }), 400

        # Extract features from request
        # Expected: amount, and V1-V28 features
        amount = float(data.get('amount', 0))
        time_val = float(data.get('time', 0))

        # Get V1-V28 features (default to 0 if not provided)
        v_features = []
        for i in range(1, 29):
            v_features.append(float(data.get(f'V{i}', 0)))

        # Scale amount and time (same as training)
        amount_scaled = (amount - 88.35) / 250.12
        time_scaled = (time_val - 94813) / 47488

        # Build feature vector in correct order
        features = v_features + [amount_scaled, time_scaled]

        # Convert to numpy array
        features_array = np.array(features).reshape(1, -1)

        # Get prediction
        prediction = model.predict(features_array)[0]
        probability = model.predict_proba(features_array)[0][1]

        # Convert probability to risk score (0-100)
        risk_score = round(float(probability) * 100, 2)

        # Determine risk level
        if risk_score >= 70:
            risk_level = 'high'
        elif risk_score >= 30:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        return jsonify({
            'success': True,
            'prediction': int(prediction),
            'fraud_probability': round(float(probability), 4),
            'ml_risk_score': risk_score,
            'risk_level': risk_level,
            'is_fraud': bool(prediction == 1),
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
        }), 500

# ── Batch prediction endpoint ─────────────────────
@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    try:
        data = request.get_json()
        transactions = data.get('transactions', [])

        if not transactions:
            return jsonify({
                'success': False,
                'message': 'No transactions provided',
            }), 400

        results = []
        for txn in transactions:
            amount = float(txn.get('amount', 0))
            time_val = float(txn.get('time', 0))

            v_features = []
            for i in range(1, 29):
                v_features.append(float(txn.get(f'V{i}', 0)))

            amount_scaled = (amount - 88.35) / 250.12
            time_scaled = (time_val - 94813) / 47488

            features = v_features + [amount_scaled, time_scaled]
            features_array = np.array(features).reshape(1, -1)

            prediction = model.predict(features_array)[0]
            probability = model.predict_proba(features_array)[0][1]
            risk_score = round(float(probability) * 100, 2)

            results.append({
                'transaction_id': txn.get('transactionId', ''),
                'fraud_probability': round(float(probability), 4),
                'ml_risk_score': risk_score,
                'is_fraud': bool(prediction == 1),
            })

        return jsonify({
            'success': True,
            'count': len(results),
            'results': results,
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e),
        }), 500

# ── Model info endpoint ───────────────────────────
@app.route('/model/info', methods=['GET'])
def model_info():
    return jsonify({
        'success': True,
        'model_type': 'Random Forest Classifier',
        'training_approach': 'SMOTE balanced dataset',
        'metrics': metrics,
        'features': feature_names,
        'note': 'Prioritized recall over precision — missing fraud costs customers real money',
    })

if __name__ == '__main__':
    print("\n🚀 Starting Flask ML API...")
    print("Endpoints:")
    print("  GET  /health      — health check")
    print("  POST /predict     — single prediction")
    print("  POST /predict/batch — batch predictions")
    print("  GET  /model/info  — model information")
    app.run(host='0.0.0.0', port=5001, debug=True)