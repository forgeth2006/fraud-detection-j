import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import joblib
import os

print("=" * 50)
print("FRAUD DETECTION - DATA PREPROCESSING")
print("=" * 50)

# ── Step 1: Load dataset ──────────────────────────
print("\n[1/6] Loading dataset...")
df = pd.read_csv('data/creditcard.csv')
print(f"    Shape: {df.shape}")
print(f"    Fraud cases: {df['Class'].sum()}")
print(f"    Normal cases: {(df['Class'] == 0).sum()}")

# ── Step 2: Check for missing values ─────────────
print("\n[2/6] Checking for missing values...")
missing = df.isnull().sum().sum()
print(f"    Missing values: {missing}")
if missing == 0:
    print("    No missing values found! Dataset is clean.")

# ── Step 3: Feature Engineering ──────────────────
print("\n[3/6] Feature engineering...")

# Scale Amount column (V1-V28 are already scaled)
scaler = StandardScaler()
df['Amount_Scaled'] = scaler.fit_transform(df[['Amount']])

# Scale Time column
df['Time_Scaled'] = scaler.fit_transform(df[['Time']])

# Drop original Amount and Time
df = df.drop(['Amount', 'Time'], axis=1)

print(f"    Features after engineering: {df.shape[1] - 1}")
print("    Amount and Time scaled successfully!")

# ── Step 4: Split features and target ────────────
print("\n[4/6] Splitting features and target...")
X = df.drop('Class', axis=1)
y = df['Class']

print(f"    Features (X): {X.shape}")
print(f"    Target (y): {y.shape}")
print(f"    Class distribution: {dict(y.value_counts())}")

# ── Step 5: Train/Test Split ─────────────────────
print("\n[5/6] Splitting into train and test sets...")
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y  # maintain class ratio in both sets
)

print(f"    Training set: {X_train.shape}")
print(f"    Test set: {X_test.shape}")
print(f"    Training fraud cases: {y_train.sum()}")
print(f"    Test fraud cases: {y_test.sum()}")

# ── Step 6: Handle Class Imbalance with SMOTE ────
print("\n[6/6] Applying SMOTE to handle class imbalance...")
print("    Before SMOTE:")
print(f"    Normal: {(y_train == 0).sum()}")
print(f"    Fraud:  {(y_train == 1).sum()}")

smote = SMOTE(random_state=42)
X_train_balanced, y_train_balanced = smote.fit_resample(X_train, y_train)

print("\n    After SMOTE:")
print(f"    Normal: {(y_train_balanced == 0).sum()}")
print(f"    Fraud:  {(y_train_balanced == 1).sum()}")
print("    Classes are now balanced!")

# ── Save processed data ───────────────────────────
print("\nSaving processed data...")
os.makedirs('model', exist_ok=True)

joblib.dump(X_train_balanced, 'model/X_train.pkl')
joblib.dump(y_train_balanced, 'model/y_train.pkl')
joblib.dump(X_test, 'model/X_test.pkl')
joblib.dump(y_test, 'model/y_test.pkl')
joblib.dump(scaler, 'model/scaler.pkl')
joblib.dump(list(X.columns), 'model/feature_names.pkl')

print("Saved:")
print("    model/X_train.pkl")
print("    model/y_train.pkl")
print("    model/X_test.pkl")
print("    model/y_test.pkl")
print("    model/scaler.pkl")
print("    model/feature_names.pkl")

print("\n" + "=" * 50)
print("PREPROCESSING COMPLETE!")
print("=" * 50)
print(f"\nTraining samples: {X_train_balanced.shape[0]}")
print(f"Test samples: {X_test.shape[0]}")
print(f"Features: {X_train_balanced.shape[1]}")
print("\nReady for model training!")