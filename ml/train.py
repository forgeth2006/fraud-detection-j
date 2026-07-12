import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_score,
    recall_score,
    f1_score,
    accuracy_score
)
import joblib
import json
import os
import time

print("=" * 50)
print("FRAUD DETECTION - MODEL TRAINING")
print("=" * 50)

# ── Step 1: Load preprocessed data ───────────────
print("\n[1/5] Loading preprocessed data...")
X_train = joblib.load('model/X_train.pkl')
y_train = joblib.load('model/y_train.pkl')
X_test = joblib.load('model/X_test.pkl')
y_test = joblib.load('model/y_test.pkl')
feature_names = joblib.load('model/feature_names.pkl')

print(f"    Training samples: {X_train.shape[0]}")
print(f"    Test samples: {X_test.shape[0]}")
print(f"    Features: {X_train.shape[1]}")

# ── Step 2: Train Random Forest ───────────────────
print("\n[2/5] Training Random Forest model...")
print("    This may take 2-3 minutes...")

start_time = time.time()

model = RandomForestClassifier(
    n_estimators=100,      # 100 decision trees
    max_depth=10,          # prevent overfitting
    min_samples_split=10,
    min_samples_leaf=4,
    random_state=42,
    n_jobs=-1,             # use all CPU cores
    class_weight='balanced'
)

model.fit(X_train, y_train)

training_time = time.time() - start_time
print(f"    Training completed in {training_time:.2f} seconds!")

# ── Step 3: Make predictions ──────────────────────
print("\n[3/5] Making predictions on test set...")
y_pred = model.predict(X_test)
y_pred_proba = model.predict_proba(X_test)[:, 1]

# ── Step 4: Evaluate model ────────────────────────
print("\n[4/5] Evaluating model performance...")

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
roc_auc = roc_auc_score(y_test, y_pred_proba)

print("\n    ┌─────────────────────────────────┐")
print("    │       MODEL PERFORMANCE          │")
print("    ├─────────────────────────────────┤")
print(f"    │ Accuracy:  {accuracy:.4f} ({accuracy*100:.2f}%)       │")
print(f"    │ Precision: {precision:.4f} ({precision*100:.2f}%)       │")
print(f"    │ Recall:    {recall:.4f} ({recall*100:.2f}%)       │")
print(f"    │ F1 Score:  {f1:.4f} ({f1*100:.2f}%)       │")
print(f"    │ ROC AUC:   {roc_auc:.4f} ({roc_auc*100:.2f}%)       │")
print("    └─────────────────────────────────┘")

print("\n    Classification Report:")
print(classification_report(y_test, y_pred,
      target_names=['Normal', 'Fraud']))

print("\n    Confusion Matrix:")
cm = confusion_matrix(y_test, y_pred)
print(f"    True Negatives (correct normal):  {cm[0][0]}")
print(f"    False Positives (wrong fraud):    {cm[0][1]}")
print(f"    False Negatives (missed fraud):   {cm[1][0]}")
print(f"    True Positives (caught fraud):    {cm[1][1]}")
print(f"\n    Fraud caught: {cm[1][1]}/{cm[1][0]+cm[1][1]} ({cm[1][1]/(cm[1][0]+cm[1][1])*100:.1f}%)")

# ── Step 5: Save model and metrics ────────────────
print("\n[5/5] Saving model and metrics...")

# Save trained model
joblib.dump(model, 'model/fraud_model.pkl')
print("    Saved: model/fraud_model.pkl")

# Save metrics as JSON for Flask API
metrics = {
    'accuracy': round(float(accuracy), 4),
    'precision': round(float(precision), 4),
    'recall': round(float(recall), 4),
    'f1_score': round(float(f1), 4),
    'roc_auc': round(float(roc_auc), 4),
    'training_samples': int(X_train.shape[0]),
    'test_samples': int(X_test.shape[0]),
    'features': int(X_train.shape[1]),
    'training_time_seconds': round(training_time, 2),
    'fraud_caught_percentage': round(
        float(cm[1][1] / (cm[1][0] + cm[1][1]) * 100), 2
    ),
}

with open('model/metrics.json', 'w') as f:
    json.dump(metrics, f, indent=2)
print("    Saved: model/metrics.json")

# Save feature importance
feature_importance = pd.DataFrame({
    'feature': feature_names,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

feature_importance.to_csv('model/feature_importance.csv', index=False)
print("    Saved: model/feature_importance.csv")

print("\n" + "=" * 50)
print("TRAINING COMPLETE!")
print("=" * 50)
print(f"\n🎯 Model catches {metrics['fraud_caught_percentage']}% of fraud cases!")
print(f"📊 ROC AUC Score: {metrics['roc_auc']} (1.0 = perfect)")
print("\nModel is ready for deployment!")