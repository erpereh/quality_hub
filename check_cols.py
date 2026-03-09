import pandas as pd

print("=== XRP columns (skiprows=4) ===")
df_xrp = pd.read_excel("fh_xrp.xlsx", skiprows=4)
for i, c in enumerate(df_xrp.columns):
    print(f"  [{i}] '{c}'")

print()
print("=== META4 columns (skiprows=3) ===")
df_meta4 = pd.read_excel("fh_meta4.xlsx", skiprows=3)
for i, c in enumerate(df_meta4.columns):
    print(f"  [{i}] '{c}'")

# Show sample values for columns containing "convenio" (case-insensitive)
import re
print()
for name, df in [("XRP", df_xrp), ("META4", df_meta4)]:
    for c in df.columns:
        if re.search(r"convenio", str(c), re.IGNORECASE):
            print(f"{name} column '{c}' sample values: {df[c].dropna().head(5).tolist()}")
