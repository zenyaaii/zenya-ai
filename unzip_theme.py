
import zipfile
import os

zip_path = "zenya-theme-latest.zip"
extract_path = "zenya-theme-test"

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)

print(f"Extracted to {extract_path}")
