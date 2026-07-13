from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import json
import os
import shap

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

    # Initialize SHAP explainer
    print("Initializing SHAP explainer...")
    explainer = shap.TreeExplainer(model)
    print("SHAP explainer ready!")

    print("Model loaded successfully!")
    print(f"Model accuracy: {metrics['accuracy'] * 100:.2f}%")
    print(f"Model recall: {metrics['recall'] * 100:.2f}%")

except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    explainer = None
    metrics = {}

def build_features(data):
    amount = float(data.get('amount', 0))
    time_val = float(data.get('time', 0))

    v_features = []
    for i in range(1, 29):
        v_features.append(float(data.get(f'V{i}', 0)))

    amount_scaled = (amount - 88.35) / 250.12
    time_scaled = (time_val - 94813) / 47488

    features = v_features + [amount_scaled, time_scaled]
    return np.array(features).reshape(1, -1)

# ── Health check ──────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'OK',
        'model_loaded': model is not None,
        'shap_available': explainer is not None,
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

        features_array = build_features(data)

        prediction = model.predict(features_array)[0]
        probability = model.predict_proba(features_array)[0][1]
        risk_score = round(float(probability) * 100, 2)

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

# ── SHAP Explanation endpoint ─────────────────────
@app.route('/explain', methods=['POST'])
def explain():
    try:
        if model is None or explainer is None:
            return jsonify({
                'success': False,
                'message': 'Model or explainer not loaded',
            }), 500

        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided',
            }), 400

        features_array = build_features(data)

        # Get prediction
        prediction = model.predict(features_array)[0]
        probability = model.predict_proba(features_array)[0][1]
        risk_score = round(float(probability) * 100, 2)

        if risk_score >= 70:
            risk_level = 'high'
        elif risk_score >= 30:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        # Get SHAP values safely
        try:
            shap_values = explainer.shap_values(features_array)

            # Handle all possible SHAP output formats
            if isinstance(shap_values, list) and len(shap_values) > 1:
                fraud_shap = shap_values[1].flatten().tolist()
            elif isinstance(shap_values, list):
                fraud_shap = shap_values[0].flatten().tolist()
            elif hasattr(shap_values, 'values'):
                fraud_shap = shap_values.values.flatten().tolist()
            else:
                fraud_shap = np.array(shap_values).flatten().tolist()

            # Build feature importance list
            feature_impacts = []
            for i, (name, shap_val) in enumerate(zip(feature_names, fraud_shap)):
                feature_impacts.append({
                    'feature': name,
                    'shap_value': round(float(shap_val), 4),
                    'impact': 'increases_fraud_risk' if shap_val > 0 else 'decreases_fraud_risk',
                    'importance': round(abs(float(shap_val)), 4),
                })

            # Sort by absolute importance
            feature_impacts.sort(key=lambda x: x['importance'], reverse=True)
            top_features = feature_impacts[:5]

            # Generate human readable explanation
            explanation_parts = []
            for feat in top_features[:3]:
                if feat['shap_value'] > 0.01:
                    explanation_parts.append(
                        f"{feat['feature']} increased fraud risk by {feat['importance']:.3f}"
                    )
                elif feat['shap_value'] < -0.01:
                    explanation_parts.append(
                        f"{feat['feature']} decreased fraud risk by {feat['importance']:.3f}"
                    )

            human_explanation = (
                f"ML Model Analysis: Risk Score {risk_score}/100. "
                + "Key factors: "
                + ", ".join(explanation_parts[:3])
                + "."
            )

            shap_result = {
                'top_features': top_features,
                'human_explanation': human_explanation,
                'all_features': feature_impacts,
            }

        except Exception as shap_error:
            print(f"SHAP error: {shap_error}")
            shap_result = {
                'top_features': [],
                'human_explanation': f'ML Risk Score: {risk_score}/100',
                'all_features': [],
            }

        return jsonify({
            'success': True,
            'prediction': int(prediction),
            'fraud_probability': round(float(probability), 4),
            'ml_risk_score': risk_score,
            'risk_level': risk_level,
            'is_fraud': bool(prediction == 1),
            'shap_explanation': shap_result,
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
        'explainability': 'SHAP (SHapley Additive exPlanations)',
        'metrics': metrics,
        'features': feature_names,
        'note': 'Prioritized recall over precision — missing fraud costs customers real money',
    })

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
            features_array = build_features(txn)
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

if __name__ == '__main__':
    print("\n🚀 Starting Flask ML API...")
    print("Endpoints:")
    print("  GET  /health         — health check")
    print("  POST /predict        — single prediction")
    print("  POST /explain        — prediction + SHAP explanation")
    print("  POST /predict/batch  — batch predictions")
    print("  GET  /model/info     — model information")
    app.run(host='0.0.0.0', port=5001, debug=True)