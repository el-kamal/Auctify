import pandas as pd
import json
import os

file_path = "pointage.csv"
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    # Try reading with different encodings
    try:
        df = pd.read_csv(file_path, encoding='utf-8')
    except:
        try:
            df = pd.read_csv(file_path, encoding='latin-1', sep=';')
        except:
             df = pd.read_csv(file_path, encoding='cp1252', sep=';')

    if len(df.columns) <= 1:
         # Fallback to semicolon if comma failed even with correct encoding
         try:
            df = pd.read_csv(file_path, encoding='latin-1', sep=';')
         except:
            pass

    info = {
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "sample": df.head(3).to_dict(orient="records")
    }
    print(json.dumps(info, indent=2, default=str))
except Exception as e:
    print(f"Error: {e}")
