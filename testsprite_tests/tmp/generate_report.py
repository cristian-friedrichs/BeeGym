import json
import os

report_path = r'c:\Projetos\BeeGym\testsprite_tests\tmp\test_results.json'
output_path = r'c:\Projetos\BeeGym\testsprite_tests\testsprite-mcp-test-report.md'

with open(report_path, 'r', encoding='utf-8') as f:
    results = json.load(f)

# Group by Requirement (based on category in test plan if available, otherwise heuristics)
requirements = {
    "User Authentication": [],
    "Student Management": [],
    "Payment Processing (PIX EFI)": [],
    "Workout Prescription": [],
    "Other": []
}

for test in results:
    title = test.get('title', '')
    status = test.get('testStatus', '')
    error = test.get('testError', '')
    
    # Simple mapping based on TC prefix or keywords
    if any(k in title for k in ['Log in', 'Auth', 'Register', 'Onboarding', 'Session']):
        requirements["User Authentication"].append(test)
    elif any(k in title for k in ['Student', 'Alunos']):
        requirements["Student Management"].append(test)
    elif any(k in title for k in ['Payment', 'Invoice', 'PIX', 'Pagamentos']):
        requirements["Payment Processing (PIX EFI)"].append(test)
    elif any(k in title for k in ['Workout', 'Treinos']):
        requirements["Workout Prescription"].append(test)
    else:
        requirements["Other"].append(test)

passed = sum(1 for t in results if t['testStatus'] == 'PASSED')
failed = sum(1 for t in results if t['testStatus'] == 'FAILED')
blocked = sum(1 for t in results if t['testStatus'] == 'BLOCKED')
total = len(results)

report = f"""## 1️⃣ Document Metadata
- **Project Name:** BeeGym
- **Execution Date:** 2026-04-28
- **Test Type:** Frontend E2E
- **Environment:** Local (Development - Port 9002)

## 2️⃣ Requirement Validation Summary

"""

for req, tests in requirements.items():
    if not tests: continue
    report += f"### {req}\n"
    for t in tests:
        status_icon = "✅" if t['testStatus'] == 'PASSED' else "❌" if t['testStatus'] == 'FAILED' else "⚠️"
        report += f"- {status_icon} **{t['title']}**: {t['testStatus']}\n"
        if t['testError']:
            report += f"  - *Error:* {t['testError'][:200]}...\n"
    report += "\n"

report += f"""## 3️⃣ Coverage & Matching Metrics
- **Total Tests:** {total}
- **Passed:** {passed} ({passed/total*100:.1f}%)
- **Failed:** {failed} ({failed/total*100:.1f}%)
- **Blocked:** {blocked} ({blocked/total*100:.1f}%)

## 4️⃣ Key Gaps / Risks
- **Blocked Tests:** TC015 (PIX validation) was blocked due to timeout loading the Payments page. This suggests either a performance issue on the /app/pagamentos route or a flake in the test environment.
- **Environment:** Running in Development mode (port 9002) might lead to slower responses compared to Production builds, potentially causing timeouts in UI-heavy pages like Payments.
"""

with open(output_path, 'w', encoding='utf-8') as f:
    f.write(report)

print("Report generated successfully.")
