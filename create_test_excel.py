import pandas as pd

data = {
    "Lot": [1, 2, 3],
    "Vendeur": ["Seller A", "Seller B", "Seller A"],
    "Désignation": ["Item 1", "Item 2", "Item 3"]
}

df = pd.DataFrame(data)
df.to_excel("test_mapping.xlsx", index=False)
print("Created test_mapping.xlsx")
