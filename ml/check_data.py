import pandas as pd

# Load dataset
df = pd.read_csv('data/creditcard.csv')

print("Dataset Shape:", df.shape)
print("\nFirst 5 rows:")
print(df.head())
print("\nClass distribution:")
print(df['Class'].value_counts())
print("\nFraud percentage:", round(df['Class'].mean() * 100, 4), "%")
print("\nColumns:", df.columns.tolist())