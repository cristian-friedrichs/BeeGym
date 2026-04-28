import json
import os

file_path = r'c:\Projetos\BeeGym\testsprite_tests\tmp\test_results.json'
if os.path.exists(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        for test in data:
            if test.get('testStatus') == 'FAILED':
                print(f"ID: {test.get('id')}")
                print(f"Name: {test.get('testName')}")
                print(f"Error: {test.get('testError')}")
                print("-" * 40)
else:
    print("File not found")
