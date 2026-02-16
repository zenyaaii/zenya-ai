import json
import sys

try:
    with open('shopify-theme/templates/index.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print("JSON is valid.")
    # Check if 'sections' key exists and is not empty
    if 'sections' not in data:
        print("ERROR: 'sections' key missing in index.json")
    elif not data['sections']:
        print("WARNING: 'sections' is empty in index.json")
    else:
        print(f"Found {len(data['sections'])} sections.")
        for section_id, section_config in data['sections'].items():
            print(f" - {section_id}: {section_config.get('type')}")
    
    if 'order' not in data:
        print("ERROR: 'order' key missing in index.json")
    else:
        print(f"Order: {data['order']}")

except json.JSONDecodeError as e:
    print(f"JSON Syntax Error: {e}")
except Exception as e:
    print(f"Error: {e}")
