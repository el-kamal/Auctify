import pandas as pd
import json
import os

file_path = "Vente Palette.xlsx"
if not os.path.exists(file_path):
    print(f"File not found: {file_path}")
    exit(1)

try:
    df = pd.read_excel(file_path)
    info = {
        "columns": df.columns.tolist(),
        "dtypes": {k: str(v) for k, v in df.dtypes.items()},
        "sample": df.head(3).to_dict(orient="records")
    }
    print(json.dumps(info, indent=2, default=str))
except Exception as e:
    print(f"Error: {e}")
